import { MongoClient } from 'mongodb'

const SPEAKERS = ['Jess', 'Thibo', 'Nour']

const DEFAULT_STATE = () => ({
  _id: 'main',
  running: false,
  // The Date.now() at which the running phase started (only meaningful while running)
  mainStartedAt: 0,
  // Total accumulated ms for the main timer up to (not counting) the current running phase
  mainAccumulated: 0,
  // Currently active speaker (null when none assigned for current slide)
  currentSpeaker: null,
  // Date.now() at which the current speaker phase started (while running and have a speaker)
  speakerStartedAt: 0,
  // Total ms accumulated per speaker
  speakerAccumulated: { Jess: 0, Thibo: 0, Nour: 0 },
  // Current slide key — "<slideIndex>.<subslideIndex>"
  currentSlideKey: '0.0',
})

/**
 * Backed-by-MongoDB store for presenter-related data:
 *  - speaker notes per (slide, subslide)
 *  - timer state (main + per-speaker)
 *
 * Designed to be a single source of truth, with all operations persisted.
 */
export class PresenterStore {
  constructor({ uri = 'mongodb://localhost:27017', dbName = 'koude-oorlog' } = {}) {
    this.uri = uri
    this.dbName = dbName
    this.client = null
    this.db = null
    this.notes = null
    this.timer = null
    this.state = DEFAULT_STATE()
    this.listeners = new Set()
    this.connected = false
  }

  async connect() {
    if (this.connected) return
    this.client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 3000 })
    await this.client.connect()
    this.db = this.client.db(this.dbName)
    this.notes = this.db.collection('slideNotes')
    this.timer = this.db.collection('presenterTimer')
    await this.notes.createIndex({ slideKey: 1 }, { unique: true })
    const stored = await this.timer.findOne({ _id: 'main' })
    if (stored) {
      this.state = { ...DEFAULT_STATE(), ...stored }
      // Make sure speakerAccumulated includes all speakers
      this.state.speakerAccumulated = {
        ...DEFAULT_STATE().speakerAccumulated,
        ...(stored.speakerAccumulated || {}),
      }
    } else {
      await this.timer.insertOne(this.state)
    }
    this.connected = true
    console.log(`[presenter] connected to ${this.uri}/${this.dbName}`)
  }

  onChange(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  emit(kind, payload) {
    for (const fn of this.listeners) {
      try { fn(kind, payload) } catch { /* noop */ }
    }
  }

  // -------- Notes --------

  async getAllNotes() {
    if (!this.connected) return {}
    const docs = await this.notes.find({}).toArray()
    const out = {}
    for (const d of docs) {
      out[d.slideKey] = { speaker: d.speaker || '', notes: d.notes || '' }
    }
    return out
  }

  async getNote(slideKey) {
    if (!this.connected) return { speaker: '', notes: '' }
    const doc = await this.notes.findOne({ slideKey })
    return { speaker: doc?.speaker || '', notes: doc?.notes || '' }
  }

  async setNote(slideKey, { speaker, notes }) {
    if (!this.connected) return
    const cleanSpeaker = SPEAKERS.includes(speaker) ? speaker : ''
    const cleanNotes = typeof notes === 'string' ? notes : ''
    await this.notes.updateOne(
      { slideKey },
      { $set: { slideKey, speaker: cleanSpeaker, notes: cleanNotes, updatedAt: new Date() } },
      { upsert: true }
    )

    // If the change applies to the currently shown slide, refresh active speaker.
    if (slideKey === this.state.currentSlideKey) {
      const newSpeaker = cleanSpeaker || null
      if (newSpeaker !== this.state.currentSpeaker) {
        await this.checkpointSpeakerAndSwitch(newSpeaker)
        await this.persist()
        this.emit('state', this.publicState())
      }
    }

    this.emit('note', { slideKey, speaker: cleanSpeaker, notes: cleanNotes })
  }

  // -------- Timer --------

  /**
   * If timer is running and we currently have an active speaker, fold the
   * elapsed time since speakerStartedAt into speakerAccumulated, then switch
   * to the new speaker (resetting speakerStartedAt for the next phase).
   */
  async checkpointSpeakerAndSwitch(newSpeaker) {
    const now = Date.now()
    if (this.state.running && this.state.currentSpeaker && SPEAKERS.includes(this.state.currentSpeaker)) {
      const delta = now - this.state.speakerStartedAt
      if (delta > 0) {
        this.state.speakerAccumulated[this.state.currentSpeaker] =
          (this.state.speakerAccumulated[this.state.currentSpeaker] || 0) + delta
      }
    }
    this.state.currentSpeaker = newSpeaker || null
    this.state.speakerStartedAt = now
  }

  async setCurrentSlide(slideKey) {
    if (!this.connected) return
    if (this.state.currentSlideKey === slideKey) return
    this.state.currentSlideKey = slideKey
    const note = await this.notes.findOne({ slideKey })
    const newSpeaker = SPEAKERS.includes(note?.speaker) ? note.speaker : null
    if (newSpeaker !== this.state.currentSpeaker) {
      await this.checkpointSpeakerAndSwitch(newSpeaker)
    }
    await this.persist()
    this.emit('state', this.publicState())
  }

  async startTimer() {
    if (!this.connected) return
    if (this.state.running) return
    const now = Date.now()
    this.state.running = true
    this.state.mainStartedAt = now
    this.state.speakerStartedAt = now
    await this.persist()
    this.emit('state', this.publicState())
  }

  async pauseTimer() {
    if (!this.connected) return
    if (!this.state.running) return
    const now = Date.now()
    this.state.mainAccumulated += now - this.state.mainStartedAt
    if (this.state.currentSpeaker && SPEAKERS.includes(this.state.currentSpeaker)) {
      this.state.speakerAccumulated[this.state.currentSpeaker] =
        (this.state.speakerAccumulated[this.state.currentSpeaker] || 0) + (now - this.state.speakerStartedAt)
    }
    this.state.running = false
    await this.persist()
    this.emit('state', this.publicState())
  }

  async resetTimer() {
    if (!this.connected) return
    this.state.running = false
    this.state.mainStartedAt = 0
    this.state.mainAccumulated = 0
    this.state.speakerStartedAt = 0
    this.state.speakerAccumulated = { Jess: 0, Thibo: 0, Nour: 0 }
    await this.persist()
    this.emit('state', this.publicState())
  }

  async persist() {
    if (!this.connected) return
    const { _id, ...rest } = this.state
    await this.timer.updateOne(
      { _id: 'main' },
      { $set: { ...rest, updatedAt: new Date() } },
      { upsert: true }
    )
  }

  /**
   * Returns the timer state plus a serverNow value so clients can compute the
   * live elapsed time independently of network latency:
   *
   *   live main    = mainAccumulated    + (running ? clientWallClock - clientOffset - mainStartedAt    : 0)
   *   live speaker = speakerAccumulated + (running && currentSpeaker == X ? same delta : 0)
   *
   * where clientOffset = clientNow - serverNow at receive time.
   */
  publicState() {
    return {
      running: this.state.running,
      mainStartedAt: this.state.mainStartedAt,
      mainAccumulated: this.state.mainAccumulated,
      currentSpeaker: this.state.currentSpeaker,
      speakerStartedAt: this.state.speakerStartedAt,
      speakerAccumulated: { ...this.state.speakerAccumulated },
      currentSlideKey: this.state.currentSlideKey,
      serverNow: Date.now(),
    }
  }
}

export const PRESENTER_SPEAKERS = SPEAKERS
