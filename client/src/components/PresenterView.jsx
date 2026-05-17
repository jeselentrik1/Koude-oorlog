import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Mic, Clock, Layers } from 'lucide-react';
import { PresenterDataProvider, usePresenterData, formatDuration, speakerColor, PRESENTER_SPEAKERS } from './PresenterDataContext';

/**
 * Standalone presenter window (`/present/notes`) — designed to be opened on a
 * second screen via the "Presenteermodus" toggle in the main presentation.
 *
 * The window mirrors the main deck's current slide/subslide via socket.io, so
 * the audience-facing screen stays clean while the presenter sees:
 *  - active speaker (colour-coded, large)
 *  - speaker notes (rich HTML)
 *  - main stopwatch + per-speaker stopwatches
 *  - timer controls
 *
 * All writes go through the same MongoDB-backed store as the edit panel.
 */
export default function PresenterView({ slidesMeta }) {
  return (
    <PresenterDataProvider>
      <PresenterViewInner slidesMeta={slidesMeta} />
    </PresenterDataProvider>
  );
}

function PresenterViewInner({ slidesMeta }) {
  const { timerState, notes, available, computeElapsed, timerAction, emitDeckNav } = usePresenterData();
  const [, setTick] = useState(0);

  useEffect(() => {
    let raf;
    const loop = () => {
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Prev/next drives the main /present tab via socket (same logic as arrow keys there — substappen inbegrepen).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.target.isContentEditable) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        emitDeckNav('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        emitDeckNav('prev');
      } else if (e.key === ' ' || e.code === 'Space') {
        if (e.target.closest('button')) return;
        e.preventDefault();
        emitDeckNav('next');
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [emitDeckNav]);

  const slideKey = timerState?.currentSlideKey || '0.0';
  const [slideIdxStr, subIdxStr] = slideKey.split('.');
  const slideIndex = Number(slideIdxStr) || 0;
  const subslideIndex = Number(subIdxStr) || 0;

  const meta = slidesMeta?.[slideIndex] || { name: `Slide ${slideIndex + 1}`, subslides: 1 };
  const subslideCount = meta.subslides || 1;
  const totalSlides = slidesMeta?.length || 0;

  const currentNote = notes[slideKey] || { speaker: '', notes: '' };
  const currentSpeaker = currentNote.speaker || '';

  // Compute "next" slide key for preview (next subslide if any, else next slide's first sub).
  const nextSlideKey = (() => {
    if (subslideIndex < subslideCount - 1) return `${slideIndex}.${subslideIndex + 1}`;
    if (slideIndex < totalSlides - 1) return `${slideIndex + 1}.0`;
    return null;
  })();
  const nextNote = nextSlideKey ? notes[nextSlideKey] : null;

  const elapsed = computeElapsed();
  const isRunning = !!timerState?.running;

  return (
    <div className="w-screen h-screen bg-slate-950 text-white font-sans overflow-hidden flex flex-col">
      {!available && (
        <div className="px-6 py-3 bg-red-950/60 border-b border-red-500/30 text-red-200 text-sm font-mono shrink-0">
          MongoDB onbereikbaar — notities & timer worden niet bewaard.
        </div>
      )}

      <DeckNavControls onPrev={() => emitDeckNav('prev')} onNext={() => emitDeckNav('next')} />

      <div className="flex-1 grid grid-cols-12 gap-6 p-6 min-h-0 overflow-hidden">
        {/* Left: speaker + notes */}
        <div className="col-span-8 flex flex-col gap-6 min-h-0">
          <SpeakerHeader
            speaker={currentSpeaker}
            slideIndex={slideIndex}
            subslideIndex={subslideIndex}
            subslideCount={subslideCount}
            totalSlides={totalSlides}
            slideName={meta.name}
          />
          <NotesPanel html={currentNote.notes} />
        </div>

        {/* Right: timers + next */}
        <div className="col-span-4 flex flex-col gap-6 min-h-0">
          <MainTimer
            running={isRunning}
            elapsedMs={elapsed.main}
            onStart={() => timerAction('start')}
            onPause={() => timerAction('pause')}
            onReset={() => timerAction('reset')}
          />
          <SpeakerTimers
            current={currentSpeaker}
            running={isRunning}
            elapsed={elapsed.speakers}
          />
          <NextSlidePreview nextNote={nextNote} nextSlideKey={nextSlideKey} slidesMeta={slidesMeta} />
        </div>
      </div>
    </div>
  );
}

function DeckNavControls({ onPrev, onNext }) {
  return (
    <div
      className="shrink-0 flex flex-wrap items-center justify-center gap-3 px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md"
      data-no-slide
    >
      <button
        type="button"
        onClick={onPrev}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 active:scale-[0.98] transition-all"
      >
        <ChevronLeft className="w-5 h-5" /> Vorige stap
      </button>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-white/15 active:scale-[0.98] transition-all"
      >
        Volgende stap <ChevronRight className="w-5 h-5" />
      </button>
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35 hidden sm:inline">
        Pijlen · spatie · zelfde volgorde als hoofdscherm (ook substappen)
      </span>
    </div>
  );
}

function SpeakerHeader({ speaker, slideIndex, subslideIndex, subslideCount, totalSlides, slideName }) {
  const sc = speakerColor(speaker);
  return (
    <div className={`p-8 rounded-3xl border ${sc.border} ${sc.bg} shadow-2xl backdrop-blur-xl relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 h-2 w-full ${sc.solid}`} />
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 text-white/40 uppercase tracking-[0.3em] text-[10px] font-black mb-3">
            <Mic className="w-3.5 h-3.5" /> Spreker
          </div>
          <div className={`text-7xl font-black tracking-tighter uppercase ${speaker ? sc.accent : 'text-white/30'} drop-shadow-2xl`}>
            {speaker || '—'}
          </div>
          {slideName && (
            <div className="mt-3 text-lg text-white/60 font-medium truncate">{slideName}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <div className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">Slide</div>
            <div className="text-5xl font-black tracking-tighter">
              {slideIndex + 1}
              <span className="text-white/30 text-3xl mx-1">/</span>
              <span className="text-white/50 text-3xl">{totalSlides}</span>
            </div>
          </div>
          {subslideCount > 1 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
              <Layers className="w-4 h-4 text-white/60" />
              <span className="text-xs uppercase tracking-[0.25em] font-black text-white/60">Stap</span>
              <span className="text-base font-black text-white">
                {subslideIndex + 1}<span className="text-white/30">/{subslideCount}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotesPanel({ html }) {
  return (
    <div className="flex-1 min-h-0 bg-white/[0.03] border border-white/10 rounded-3xl p-8 overflow-y-auto shadow-2xl backdrop-blur-xl">
      <div className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black mb-4">Notities</div>
      {html && html.replace(/<[^>]+>/g, '').trim() ? (
        <div
          className="notes-render text-2xl leading-relaxed text-white/85"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="text-white/30 italic text-xl">Geen notities voor deze stap. Kies op het startscherm &ldquo;Notities bewerken&rdquo; om ze toe te voegen.</div>
      )}
    </div>
  );
}

function MainTimer({ running, elapsedMs, onStart, onPause, onReset }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">
          <Clock className="w-3.5 h-3.5" /> Totale tijd
        </div>
        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] px-2 py-1 rounded-md
          ${running ? 'text-emerald-300 bg-emerald-500/10' : 'text-white/40 bg-white/5'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
          {running ? 'loopt' : 'gepauzeerd'}
        </div>
      </div>
      <div className="text-7xl font-black font-mono tracking-tighter text-white tabular-nums mb-5">
        {formatDuration(elapsedMs)}
      </div>
      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-sm py-3 rounded-xl active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" /> Start
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-sm py-3 rounded-xl active:scale-95 transition-all"
          >
            <Pause className="w-4 h-4 fill-current" /> Pauzeer
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-black uppercase tracking-widest text-sm py-3 px-4 rounded-xl active:scale-95 transition-all"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SpeakerTimers({ current, running, elapsed }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2 text-white/40 uppercase tracking-[0.3em] text-[10px] font-black mb-4">
        <Mic className="w-3.5 h-3.5" /> Per spreker
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PRESENTER_SPEAKERS.map((sp) => {
          const sc = speakerColor(sp);
          const isCurrent = current === sp;
          const ms = elapsed[sp] || 0;
          return (
            <div
              key={sp}
              className={`p-3 rounded-2xl border transition-all
                ${isCurrent
                  ? `${sc.bg} ${sc.border} shadow-[0_0_30px_rgba(255,255,255,0.05)]`
                  : 'bg-black/30 border-white/10'}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isCurrent && running ? `${sc.dot} animate-pulse` : sc.dot} ${isCurrent ? 'opacity-100' : 'opacity-40'}`} />
                <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${isCurrent ? sc.accent : 'text-white/50'}`}>{sp}</span>
              </div>
              <div className={`font-mono font-black tabular-nums tracking-tight text-2xl ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                {formatDuration(ms)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NextSlidePreview({ nextNote, nextSlideKey, slidesMeta }) {
  if (!nextSlideKey) {
    return (
      <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-5 text-center text-white/30 italic text-sm">
        Einde van de presentatie
      </div>
    );
  }
  const [idxStr, subStr] = nextSlideKey.split('.');
  const slideIndex = Number(idxStr) || 0;
  const subslideIndex = Number(subStr) || 0;
  const meta = slidesMeta?.[slideIndex];
  const speaker = nextNote?.speaker || '';
  const sc = speakerColor(speaker);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" /> Volgende
        </div>
        <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">
          Slide {slideIndex + 1}{(meta?.subslides || 1) > 1 ? ` · stap ${subslideIndex + 1}` : ''}
        </div>
      </div>
      <div className={`text-2xl font-black tracking-tight ${speaker ? sc.accent : 'text-white/40'}`}>
        {speaker || '—'}
      </div>
      {nextNote?.notes && nextNote.notes.replace(/<[^>]+>/g, '').trim() ? (
        <div
          className="notes-render mt-2 text-sm text-white/60 line-clamp-3 max-h-20 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: nextNote.notes }}
        />
      ) : (
        <div className="mt-2 text-sm text-white/30 italic">Geen notities</div>
      )}
    </div>
  );
}
