import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { usePresenterData, PRESENTER_SPEAKERS, speakerColor } from './PresenterDataContext';
import RichTextEditor from './RichTextEditor';

/**
 * Side panel that lets the user edit the speaker assignment + speaker notes
 * for the currently visible (slide, subslide). Saves are debounced and pushed
 * to MongoDB through the presenter socket. The panel updates as the user
 * navigates the underlying presentation, so editing while reviewing the deck
 * is the natural workflow.
 */
export default function PresenterEditPanel({
  slideKey,
  slideIndex,
  subslideIndex,
  subslideCount,
  totalSlides,
  onClose,
  onPrevSubslide,
  onNextSubslide,
  onPrevSlide,
  onNextSlide,
}) {
  const { notes, sendNote, available } = usePresenterData();
  const current = notes[slideKey] || { speaker: '', notes: '' };

  const [draftSpeaker, setDraftSpeaker] = useState(current.speaker);
  const [draftNotes, setDraftNotes] = useState(current.notes);
  const [savedAt, setSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef(null);
  const lastLoadedKeyRef = useRef(null);

  // When the visible slide changes, swap to its persisted note (also flush any
  // pending debounced save for the previous slide so we never drop a change).
  useEffect(() => {
    if (lastLoadedKeyRef.current === slideKey) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    lastLoadedKeyRef.current = slideKey;
    setDraftSpeaker(current.speaker || '');
    setDraftNotes(current.notes || '');
    setDirty(false);
    setSavedAt(null);
    // we intentionally don't depend on `current` to avoid resetting after every external update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey]);

  // If a *remote* update arrives for the slide we're editing (e.g. another
  // tab), pull it in only when our own draft is clean.
  useEffect(() => {
    if (lastLoadedKeyRef.current !== slideKey) return;
    if (dirty) return;
    setDraftSpeaker(current.speaker || '');
    setDraftNotes(current.notes || '');
  }, [current.speaker, current.notes, slideKey, dirty]);

  const scheduleSave = (next) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      sendNote(slideKey, next);
      setSavedAt(Date.now());
      setDirty(false);
    }, 400);
  };

  const handleSpeakerChange = (next) => {
    setDraftSpeaker(next);
    setDirty(true);
    scheduleSave({ speaker: next, notes: draftNotes });
  };

  const handleNotesChange = (html) => {
    setDraftNotes(html);
    setDirty(true);
    scheduleSave({ speaker: draftSpeaker, notes: html });
  };

  const flushSave = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    sendNote(slideKey, { speaker: draftSpeaker, notes: draftNotes });
    setSavedAt(Date.now());
    setDirty(false);
  };

  const status = useMemo(() => {
    if (!available) return { text: 'MongoDB onbereikbaar', tone: 'text-red-300' };
    if (dirty) return { text: 'Opslaan...', tone: 'text-amber-300' };
    if (savedAt) return { text: 'Opgeslagen', tone: 'text-emerald-300' };
    return { text: 'Klaar', tone: 'text-white/40' };
  }, [available, dirty, savedAt]);

  const sc = speakerColor(draftSpeaker);

  return (
    <div
      data-no-slide
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 h-full w-[460px] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 z-50 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">Bewerk modus</div>
          <h3 className="text-2xl font-black tracking-tighter text-white">Spreker notities</h3>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          title="Sluiten"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Slide nav summary */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevSlide}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={slideIndex <= 0}
            title="Vorige slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">Slide</span>
            <span className="text-3xl font-black tracking-tighter text-white">
              {slideIndex + 1}
              <span className="text-white/30 mx-1">/</span>
              <span className="text-white/50">{totalSlides}</span>
            </span>
          </div>
          <button
            onClick={onNextSlide}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={slideIndex >= totalSlides - 1}
            title="Volgende slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {subslideCount > 1 && (
          <div className="mt-4 flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 py-2">
            <button
              onClick={onPrevSubslide}
              className="w-7 h-7 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
              disabled={subslideIndex <= 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-white/70">
              <Layers className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.25em] font-black">Stap</span>
              <span className="text-base font-black text-white">
                {subslideIndex + 1}<span className="text-white/30">/{subslideCount}</span>
              </span>
            </div>
            <button
              onClick={onNextSubslide}
              className="w-7 h-7 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
              disabled={subslideIndex >= subslideCount - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Speaker selector */}
      <div className="px-6 pt-5 pb-3">
        <label className="text-white/40 uppercase tracking-[0.25em] text-[10px] font-black mb-2 block">Spreker</label>
        <div className="grid grid-cols-4 gap-2">
          <SpeakerPill active={!draftSpeaker} onClick={() => handleSpeakerChange('')}>
            <span className="text-white/60">—</span>
          </SpeakerPill>
          {PRESENTER_SPEAKERS.map((sp) => (
            <SpeakerPill
              key={sp}
              active={draftSpeaker === sp}
              colorClasses={speakerColor(sp)}
              onClick={() => handleSpeakerChange(sp)}
            >
              {sp}
            </SpeakerPill>
          ))}
        </div>
      </div>

      {/* Notes editor */}
      <div className="px-6 pt-3 pb-4 flex-1 flex flex-col min-h-0">
        <label className="text-white/40 uppercase tracking-[0.25em] text-[10px] font-black mb-2 block">Notities</label>
        <RichTextEditor value={draftNotes} onChange={handleNotesChange} />
      </div>

      {/* Footer */}
      <div className={`px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs ${sc.bg}`}>
        <span className={`font-black uppercase tracking-[0.25em] ${status.tone}`}>{status.text}</span>
        <button
          onClick={flushSave}
          disabled={!dirty}
          className="flex items-center gap-2 bg-white text-black font-black uppercase tracking-widest text-[10px] px-3 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 active:scale-95 transition-all"
        >
          <Save className="w-3.5 h-3.5" /> Opslaan nu
        </button>
      </div>
    </div>
  );
}

function SpeakerPill({ children, active, onClick, colorClasses }) {
  const c = colorClasses;
  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded-xl border text-sm font-black uppercase tracking-wider transition-all
        ${active
          ? c
            ? `${c.bg} ${c.border} ${c.accent} ring-1 ring-inset ring-white/10`
            : 'bg-white/15 border-white/30 text-white'
          : 'bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90'}`}
    >
      {children}
    </button>
  );
}
