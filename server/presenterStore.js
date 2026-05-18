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

  /** Drop DB handles and mark disconnected (does not close client — pass client to close separately if needed). */
  #clearDbHandles() {
    this.db = null
    this.notes = null
    this.timer = null
    this.connected = false
  }

  /**
   * Log, tear down connection handles, and close the client so a later connect() can retry.
   * Safe to call multiple times or when already disconnected.
   */
  #handleMongoFailure(operation, err) {
    const msg = err && typeof err === 'object' && 'message' in err ? err.message : String(err)
    console.error(`[presenter] MongoDB error (${operation}):`, msg)
    if (!this.connected && !this.client) return
    const client = this.client
    this.client = null
    this.#clearDbHandles()
    if (client) {
      client.close().catch(() => { /* ignore close errors */ })
    }
  }

  async connect() {
    if (this.connected) return
    if (this.client) {
      await this.client.close().catch(() => { /* ignore */ })
      this.client = null
      this.#clearDbHandles()
    }
    const client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 3000 })
    try {
      await client.connect()
      this.db = client.db(this.dbName)
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
      this.client = client
      this.connected = true
      console.log(`[presenter] connected to ${this.uri}/${this.dbName}`)
    } catch (err) {
      await client.close().catch(() => { /* ignore */ })
      this.#handleMongoFailure('connect', err)
      throw err
    }
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
    try {
      const docs = await this.notes.find({}).toArray()
      const out = {}
      for (const d of docs) {
        out[d.slideKey] = { speaker: d.speaker || '', notes: d.notes || '' }
      }
      return out
    } catch (err) {
      this.#handleMongoFailure('getAllNotes', err)
      throw err
    }
  }

  async getNote(slideKey) {
    if (!this.connected) return { speaker: '', notes: '' }
    try {
      const doc = await this.notes.findOne({ slideKey })
      return { speaker: doc?.speaker || '', notes: doc?.notes || '' }
    } catch (err) {
      this.#handleMongoFailure('getNote', err)
      throw err
    }
  }

  async setNote(slideKey, { speaker, notes }) {
    if (!this.connected) return
    const cleanSpeaker = SPEAKERS.includes(speaker) ? speaker : ''
    const cleanNotes = typeof notes === 'string' ? notes : ''
    const newSpeaker = cleanSpeaker || null
    const mayMutateTimer =
      slideKey === this.state.currentSlideKey && newSpeaker !== this.state.currentSpeaker
    const timerBackup = mayMutateTimer
      ? {
          currentSpeaker: this.state.currentSpeaker,
          speakerStartedAt: this.state.speakerStartedAt,
          speakerAccumulated: { ...this.state.speakerAccumulated },
        }
      : null
    try {
      await this.notes.updateOne(
        { slideKey },
        { $set: { slideKey, speaker: cleanSpeaker, notes: cleanNotes, updatedAt: new Date() } },
        { upsert: true }
      )

      // If the change applies to the currently shown slide, refresh active speaker.
      if (mayMutateTimer) {
        await this.checkpointSpeakerAndSwitch(newSpeaker)
        await this.persist()
        this.emit('state', this.publicState())
      }

      this.emit('note', { slideKey, speaker: cleanSpeaker, notes: cleanNotes })
    } catch (err) {
      if (timerBackup) {
        this.state.currentSpeaker = timerBackup.currentSpeaker
        this.state.speakerStartedAt = timerBackup.speakerStartedAt
        this.state.speakerAccumulated = timerBackup.speakerAccumulated
      }
      this.#handleMongoFailure('setNote', err)
      throw err
    }
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
    const snapshot = {
      currentSlideKey: this.state.currentSlideKey,
      currentSpeaker: this.state.currentSpeaker,
      speakerStartedAt: this.state.speakerStartedAt,
      speakerAccumulated: { ...this.state.speakerAccumulated },
    }
    try {
      const note = await this.notes.findOne({ slideKey })
      const newSpeaker = SPEAKERS.includes(note?.speaker) ? note.speaker : null
      this.state.currentSlideKey = slideKey
      if (newSpeaker !== this.state.currentSpeaker) {
        await this.checkpointSpeakerAndSwitch(newSpeaker)
      }
      await this.persist()
      this.emit('state', this.publicState())
    } catch (err) {
      this.state.currentSlideKey = snapshot.currentSlideKey
      this.state.currentSpeaker = snapshot.currentSpeaker
      this.state.speakerStartedAt = snapshot.speakerStartedAt
      this.state.speakerAccumulated = snapshot.speakerAccumulated
      this.#handleMongoFailure('setCurrentSlide', err)
      throw err
    }
  }

  async startTimer() {
    if (!this.connected) return
    if (this.state.running) return
    const backup = {
      running: this.state.running,
      mainStartedAt: this.state.mainStartedAt,
      speakerStartedAt: this.state.speakerStartedAt,
    }
    const now = Date.now()
    try {
      this.state.running = true
      this.state.mainStartedAt = now
      this.state.speakerStartedAt = now
      await this.persist()
      this.emit('state', this.publicState())
    } catch (err) {
      this.state.running = backup.running
      this.state.mainStartedAt = backup.mainStartedAt
      this.state.speakerStartedAt = backup.speakerStartedAt
      this.#handleMongoFailure('startTimer', err)
      throw err
    }
  }

  async pauseTimer() {
    if (!this.connected) return
    if (!this.state.running) return
    const now = Date.now()
    const prevRunning = true
    const prevMainStartedAt = this.state.mainStartedAt
    const prevSpeaker = this.state.currentSpeaker
    const prevSpeakerStartedAt = this.state.speakerStartedAt
    const prevMainAccumulated = this.state.mainAccumulated
    const prevSpeakerAccumulated = { ...this.state.speakerAccumulated }
    try {
      this.state.mainAccumulated += now - this.state.mainStartedAt
      if (this.state.currentSpeaker && SPEAKERS.includes(this.state.currentSpeaker)) {
        this.state.speakerAccumulated[this.state.currentSpeaker] =
          (this.state.speakerAccumulated[this.state.currentSpeaker] || 0) + (now - this.state.speakerStartedAt)
      }
      this.state.running = false
      await this.persist()
      this.emit('state', this.publicState())
    } catch (err) {
      this.state.running = prevRunning
      this.state.mainStartedAt = prevMainStartedAt
      this.state.currentSpeaker = prevSpeaker
      this.state.speakerStartedAt = prevSpeakerStartedAt
      this.state.mainAccumulated = prevMainAccumulated
      this.state.speakerAccumulated = prevSpeakerAccumulated
      this.#handleMongoFailure('pauseTimer', err)
      throw err
    }
  }

  async resetTimer() {
    if (!this.connected) return
    const backup = {
      running: this.state.running,
      mainStartedAt: this.state.mainStartedAt,
      mainAccumulated: this.state.mainAccumulated,
      speakerStartedAt: this.state.speakerStartedAt,
      speakerAccumulated: { ...this.state.speakerAccumulated },
    }
    try {
      this.state.running = false
      this.state.mainStartedAt = 0
      this.state.mainAccumulated = 0
      this.state.speakerStartedAt = 0
      this.state.speakerAccumulated = { Jess: 0, Thibo: 0, Nour: 0 }
      await this.persist()
      this.emit('state', this.publicState())
    } catch (err) {
      this.state.running = backup.running
      this.state.mainStartedAt = backup.mainStartedAt
      this.state.mainAccumulated = backup.mainAccumulated
      this.state.speakerStartedAt = backup.speakerStartedAt
      this.state.speakerAccumulated = backup.speakerAccumulated
      this.#handleMongoFailure('resetTimer', err)
      throw err
    }
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
