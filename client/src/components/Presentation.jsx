import { useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PanelRight } from 'lucide-react';
import { SlideContext } from './SlideContext';
import { SubslideContext } from './SubslideContext';
import Background from './Background';
import AssetPreloader from './AssetPreloader';
import { PresenterDataProvider, usePresenterData } from './PresenterDataContext';
import PresenterEditPanel from './PresenterEditPanel';

/** Design canvas: uniform scale to fit viewport (letterboxing via outer black frame). */
export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

/** 1-based slide number from ?slide= (e.g. slide=24 → index 23). */
function slideIndexFromSearch(search, slideCount) {
  if (slideCount <= 0 || typeof window === 'undefined') return 0;
  try {
    const raw = new URLSearchParams(search).get('slide');
    if (raw == null || raw === '') return 0;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return 0;
    const idx = n - 1;
    return Math.min(Math.max(idx, 0), slideCount - 1);
  } catch {
    return 0;
  }
}

function subslideCountFor(SlideComp) {
  const n = SlideComp?.subslides;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

/** Kahoot interstitials only for "met vragen" modes (present or edit). */
function skipsQuizInterstitials(mode) {
  return mode === 'without-questions' || mode === 'edit-without-questions';
}

function isEditPresentationMode(mode) {
  return mode === 'edit-without-questions' || mode === 'edit-with-questions';
}

export default function Presentation(props) {
  return (
    <PresenterDataProvider>
      <PresentationInner {...props} />
    </PresenterDataProvider>
  );
}

function PresentationInner({ slides, slideMetadata = {}, interstitials = [], navigate }) {
  const [isStarted, setIsStarted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('slide');
  });
  const [selectedOption, setSelectedOption] = useState(() => {
    if (typeof window === 'undefined') return 'without-questions';
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === '1') return 'edit-without-questions';
    return 'without-questions';
  });
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'ok', 'error'

  const [currentSlideIndex, setCurrentSlideIndex] = useState(() =>
    slideIndexFromSearch(
      typeof window !== 'undefined' ? window.location.search : '',
      slides?.length ?? 0
    )
  );
  const [subslideIndex, setSubslideIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [background, setBackground] = useState(null);
  const [lastSectionBackground, setLastSectionBackground] = useState(null);
  const [scale, setScale] = useState(1);
  const [activeInterstitial, setActiveInterstitial] = useState(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(true);
  /** When set on the start screen, `/present/notes` opens automatically on START PRESENTATIE. */
  const [openPresenterNotesOnStart, setOpenPresenterNotesOnStart] = useState(false);

  const isEditMode = isEditPresentationMode(selectedOption);

  const { sendSlideChange, socket } = usePresenterData();

  // Slide metadata exposed to the presenter view (used for "next slide preview").
  const slidesMeta = useMemo(() => slides.map((SlideComp, idx) => ({
    name: SlideComp?.title || `Slide ${idx + 1}`,
    subslides: subslideCountFor(SlideComp),
  })), [slides]);

  const subslideCount = subslideCountFor(slides[currentSlideIndex]);
  const slideKey = `${currentSlideIndex}.${subslideIndex}`;

  const handleAssetsComplete = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  // Section-background tracking (unchanged behaviour).
  useEffect(() => {
    let lastBg = null;
    for (let i = 0; i <= currentSlideIndex; i++) {
      if (slideMetadata[i]?.isSection && slideMetadata[i]?.background) {
        lastBg = slideMetadata[i].background;
      }
    }
    setLastSectionBackground(lastBg);

    if (slideMetadata[currentSlideIndex]?.background) {
      setBackground(slideMetadata[currentSlideIndex].background);
    } else {
      setBackground(null);
    }
  }, [currentSlideIndex, slideMetadata]);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.env || 'error'))
      .catch(() => setApiStatus('error'));
  }, []);

  useLayoutEffect(() => {
    const updateScale = () => {
      const s = Math.min(
        window.innerWidth / DESIGN_WIDTH,
        window.innerHeight / DESIGN_HEIGHT
      );
      setScale(s);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Whenever the visible (slide, subslide) changes, broadcast it so the
  // presenter view + edit panel can stay in lockstep.
  useEffect(() => {
    sendSlideChange(slideKey);
  }, [slideKey, sendSlideChange]);

  // Clamp subslide if the active slide doesn't have that many sub-steps.
  useEffect(() => {
    if (subslideIndex >= subslideCount) {
      setSubslideIndex(Math.max(0, subslideCount - 1));
    }
  }, [currentSlideIndex, subslideCount, subslideIndex]);

  // Keep ?slide= and ?edit= in sync (1-based) so URLs are shareable.
  useEffect(() => {
    if (!isStarted) return;
    const url = new URL(window.location.href);
    const next = String(currentSlideIndex + 1);
    let changed = false;
    if (url.searchParams.get('slide') !== next) {
      url.searchParams.set('slide', next);
      changed = true;
    }
    const wantEdit = isEditMode ? '1' : null;
    if ((url.searchParams.get('edit') || null) !== wantEdit) {
      if (wantEdit) url.searchParams.set('edit', '1');
      else url.searchParams.delete('edit');
      changed = true;
    }
    if (changed) {
      window.history.replaceState(
        {},
        '',
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, [currentSlideIndex, isStarted, isEditMode]);

  const goToNextSlide = useCallback(() => {
    if (activeInterstitial) return;

    // Subslides have priority — if the current slide has more steps, advance step.
    if (subslideIndex < subslideCount - 1) {
      setSubslideIndex((i) => i + 1);
      return;
    }

    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < slides.length) {
      const interstitial = interstitials.find(i => i.atIndex === nextIndex);
      if (interstitial && !skipsQuizInterstitials(selectedOption)) {
        setActiveInterstitial(interstitial);
      } else {
        setDirection(1);
        setCurrentSlideIndex(nextIndex);
        setSubslideIndex(0);
      }
    }
  }, [currentSlideIndex, slides.length, activeInterstitial, interstitials, selectedOption, subslideIndex, subslideCount]);

  const goToPrevSlide = useCallback(() => {
    if (activeInterstitial) return;

    if (subslideIndex > 0) {
      setSubslideIndex((i) => i - 1);
      return;
    }

    if (currentSlideIndex > 0) {
      const prevIdx = currentSlideIndex - 1;
      setDirection(-1);
      setCurrentSlideIndex(prevIdx);
      // Land on the *last* subslide of the previous slide so back-nav feels right.
      setSubslideIndex(Math.max(0, subslideCountFor(slides[prevIdx]) - 1));
    }
  }, [currentSlideIndex, activeInterstitial, subslideIndex, slides]);

  // Presenter window ( /present/notes ) and co. can request prev/next — same as arrow keys here.
  useEffect(() => {
    if (!socket || !isStarted) return;

    const onNav = ({ direction }) => {
      if (activeInterstitial) return;
      if (direction === 'next') goToNextSlide();
      else if (direction === 'prev') goToPrevSlide();
    };

    socket.on('presenter:nav', onNav);
    return () => {
      socket.off('presenter:nav', onNav);
    };
  }, [socket, isStarted, activeInterstitial, goToNextSlide, goToPrevSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isStarted) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.target.isContentEditable) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, isStarted]);

  const openPresenterWindow = useCallback(() => {
    const url = new URL(window.location.href);
    url.pathname = '/present/notes';
    url.search = '';
    url.hash = '';
    const w = Math.min(1400, window.screen.availWidth - 40);
    const h = Math.min(900, window.screen.availHeight - 40);
    window.open(url.toString(), 'koude-oorlog-presenter', `noopener=no,popup=yes,width=${w},height=${h}`);
  }, []);

  if (!slides || slides.length === 0) {
    return <div className="text-white text-center p-10">No slides provided.</div>;
  }

  const CurrentSlideComponent = slides[currentSlideIndex];

  return (
    <SlideContext.Provider value={{
      direction,
      currentSlideIndex,
      totalSlides: slides.length,
      background,
      setBackground,
      lastSectionBackground,
      goToNextSlide,
      goToPrevSlide,
      presentationMode: selectedOption,
      activeInterstitial,
      slidesMeta,
    }}>
      <SubslideContext.Provider value={{ subslideIndex, subslideCount }}>
        <div
          className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden fixed inset-0"
          onClick={() => isStarted && goToNextSlide()}
        >
          <div
            className="shrink-0"
            style={{
              width: DESIGN_WIDTH * scale,
              height: DESIGN_HEIGHT * scale,
            }}
          >
            <div
              className="relative bg-[#020617] shadow-2xl overflow-hidden border border-white/5"
              style={{
                width: DESIGN_WIDTH,
                height: DESIGN_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
              onClick={(e) => {
                if (e.target.closest('button, a, input, textarea, select, [data-no-slide]')) {
                  e.stopPropagation();
                }
              }}
            >
              <div className="noise" />
              <Background background={background} lastSectionBackground={lastSectionBackground} />

              <div className="relative z-10 w-full h-full">
                {!assetsLoaded ? (
                  <div className="flex flex-col items-center justify-center h-full text-white bg-[#020617]">
                    <h1 className="text-6xl font-black mb-12 tracking-tighter text-white/90 opacity-50">KOUDE OORLOG</h1>
                    <AssetPreloader onComplete={handleAssetsComplete} />
                  </div>
                ) : !isStarted ? (
                  <StartScreen
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                    apiStatus={apiStatus}
                    openPresenterNotesOnStart={openPresenterNotesOnStart}
                    setOpenPresenterNotesOnStart={setOpenPresenterNotesOnStart}
                    onStart={() => {
                      if (selectedOption === 'test-questions') {
                        navigate('/host-test');
                        return;
                      }
                      setIsStarted(true);
                      if (isEditPresentationMode(selectedOption)) {
                        setEditPanelOpen(true);
                      }
                      if (!skipsQuizInterstitials(selectedOption)) {
                        const firstInterstitial = interstitials.find(i => i.atIndex === currentSlideIndex);
                        if (firstInterstitial) setActiveInterstitial(firstInterstitial);
                      }
                      if (openPresenterNotesOnStart) {
                        openPresenterWindow();
                      }
                    }}
                  />
                ) : activeInterstitial ? (
                  <activeInterstitial.component
                    onComplete={() => {
                      const targetIndex = activeInterstitial.atIndex;
                      setActiveInterstitial(null);
                      setDirection(1);
                      setCurrentSlideIndex(targetIndex);
                    }}
                  />
                ) : (
                  <AnimatePresence initial={false} mode="sync">
                    <CurrentSlideComponent key={currentSlideIndex} />
                  </AnimatePresence>
                )}
              </div>

              {/* Floating presenter toggles — anchored to the design canvas so they scale with it */}
              {isStarted && !activeInterstitial && (
                <PresenterToolbar
                  showEditPanelButton={isEditMode && !editPanelOpen}
                  onOpenEditPanel={() => setEditPanelOpen(true)}
                />
              )}

              {/* Edit panel: chosen only via start-screen mode; optional re-open from toolbar */}
              {isStarted && isEditMode && editPanelOpen && !activeInterstitial && (
                <PresenterEditPanel
                  slideKey={slideKey}
                  slideIndex={currentSlideIndex}
                  subslideIndex={subslideIndex}
                  subslideCount={subslideCount}
                  totalSlides={slides.length}
                  onClose={() => setEditPanelOpen(false)}
                  onPrevSlide={() => {
                    if (currentSlideIndex > 0) {
                      setDirection(-1);
                      setCurrentSlideIndex((i) => i - 1);
                      setSubslideIndex(0);
                    }
                  }}
                  onNextSlide={() => {
                    if (currentSlideIndex < slides.length - 1) {
                      setDirection(1);
                      setCurrentSlideIndex((i) => i + 1);
                      setSubslideIndex(0);
                    }
                  }}
                  onPrevSubslide={() => setSubslideIndex((i) => Math.max(0, i - 1))}
                  onNextSubslide={() => setSubslideIndex((i) => Math.min(subslideCount - 1, i + 1))}
                />
              )}
            </div>
          </div>
        </div>
      </SubslideContext.Provider>
    </SlideContext.Provider>
  );
}

function PresenterToolbar({ showEditPanelButton, onOpenEditPanel }) {
  return (
    <div
      data-no-slide
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-6 right-6 z-40 flex gap-2"
    >
      {showEditPanelButton && (
        <button
          onClick={onOpenEditPanel}
          type="button"
          title="Notitiespaneel openen"
          className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 text-white/80 hover:text-white px-4 py-2.5 rounded-xl text-xs uppercase tracking-[0.2em] font-black transition-all active:scale-95 shadow-2xl"
        >
          <PanelRight className="w-4 h-4" /> Notities paneel
        </button>
      )}
    </div>
  );
}

function StartScreen({
  selectedOption,
  setSelectedOption,
  apiStatus,
  openPresenterNotesOnStart,
  setOpenPresenterNotesOnStart,
  onStart,
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <h1 className="text-8xl font-black mb-12 tracking-tighter text-white/90">KOUDE OORLOG</h1>

      <div className="bg-white/5 border border-white/10 p-12 rounded-3xl backdrop-blur-2xl flex flex-col items-center shadow-2xl">
        <label className="text-white/40 uppercase tracking-[0.2em] text-xs mb-6 font-bold">Selecteer Presentatie Modus</label>

        <div className="relative mb-10">
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="bg-slate-950 text-white border border-white/10 p-5 pr-12 rounded-2xl w-[28rem] max-w-[90vw] text-lg outline-none focus:border-white/30 appearance-none cursor-pointer transition-colors hover:bg-black"
          >
            <option value="without-questions">Presentatie zonder vragen</option>
            <option value="with-questions">Presentatie met vragen</option>
            <option value="edit-without-questions">Notities bewerken (zonder vragen)</option>
            <option value="edit-with-questions">Notities bewerken (met vragen)</option>
            <option value="test-questions">Test vragen (Dev only)</option>
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        <label className="flex items-center gap-3 mb-10 cursor-pointer select-none group max-w-[28rem]">
          <input
            type="checkbox"
            checked={openPresenterNotesOnStart}
            onChange={(e) => setOpenPresenterNotesOnStart(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-slate-950 accent-white cursor-pointer shrink-0"
          />
          <span className="text-white/55 group-hover:text-white/85 transition-colors text-sm font-bold leading-snug">
            Presenteernotities-venster openen bij start
            <span className="block text-[11px] font-normal text-white/35 mt-1 normal-case tracking-normal">
              Opent het tweede scherm met timers en sprekernotities zodra je op start drukt.
            </span>
          </span>
        </label>

        {selectedOption === 'test-questions' && (
          <div className={`mb-8 px-4 py-2 rounded-lg text-sm font-mono border ${
            apiStatus === 'development'
              ? 'text-green-400 border-green-400/20 bg-green-400/5'
              : apiStatus === 'checking'
                ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
                : 'text-red-400 border-red-400/20 bg-red-400/5'
          }`}>
            ENVIRONMENT: {apiStatus.toUpperCase()}
          </div>
        )}

        <button
          onClick={onStart}
          className="group relative bg-white text-black font-black py-5 px-16 rounded-2xl text-xl hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={selectedOption === 'test-questions' && apiStatus !== 'development'}
        >
          START PRESENTATIE
        </button>
      </div>
    </div>
  );
}
