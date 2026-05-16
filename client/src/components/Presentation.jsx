import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlideContext } from './SlideContext';
import Background from './Background';
import AssetPreloader from './AssetPreloader';

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

export default function Presentation({ slides, slideMetadata = {}, interstitials = [], navigate }) {
  const [isStarted, setIsStarted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('slide');
  });
  const [selectedOption, setSelectedOption] = useState('without-questions');
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'ok', 'error'

  const [currentSlideIndex, setCurrentSlideIndex] = useState(() =>
    slideIndexFromSearch(
      typeof window !== 'undefined' ? window.location.search : '',
      slides?.length ?? 0
    )
  );
  const [direction, setDirection] = useState(1);
  const [background, setBackground] = useState(null);
  const [lastSectionBackground, setLastSectionBackground] = useState(null);
  const [scale, setScale] = useState(1);
  const [activeInterstitial, setActiveInterstitial] = useState(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const handleAssetsComplete = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  // Update lastSectionBackground based on slide sequence
  useEffect(() => {
    let lastBg = null;
    for (let i = 0; i <= currentSlideIndex; i++) {
      if (slideMetadata[i]?.isSection && slideMetadata[i]?.background) {
        lastBg = slideMetadata[i].background;
      }
    }
    setLastSectionBackground(lastBg);
    
    // Also check if current slide has its own specific background defined in metadata
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

  // Keep ?slide= in sync (1-based) so URLs are shareable; replaceState avoids history spam.
  useEffect(() => {
    if (!isStarted) return;
    
    const url = new URL(window.location.href);
    const next = String(currentSlideIndex + 1);
    if (url.searchParams.get('slide') === next) return;
    url.searchParams.set('slide', next);
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, [currentSlideIndex, isStarted]);

  const goToNextSlide = useCallback(() => {
    if (activeInterstitial) return;

    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < slides.length) {
      // Check for interstitials
      const interstitial = interstitials.find(i => i.atIndex === nextIndex);
      
      // Only show interstitial if not in "without-questions" mode
      if (interstitial && selectedOption !== 'without-questions') {
        setActiveInterstitial(interstitial);
      } else {
        setDirection(1);
        setCurrentSlideIndex(nextIndex);
      }
    }
  }, [currentSlideIndex, slides.length, activeInterstitial, interstitials, selectedOption]);

  const goToPrevSlide = useCallback(() => {
    if (activeInterstitial) return;
    
    if (currentSlideIndex > 0) {
      setDirection(-1);
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex, activeInterstitial]);

  // Keyboard navigation
  useEffect(() => {
    if (!isStarted) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, isStarted]);

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
      activeInterstitial
    }}>
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
              // Prevent clicks on interactive elements from advancing the slide
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
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <h1 className="text-8xl font-black mb-12 tracking-tighter text-white/90">KOUDE OORLOG</h1>
                  
                  <div className="bg-white/5 border border-white/10 p-12 rounded-3xl backdrop-blur-2xl flex flex-col items-center shadow-2xl">
                    <label className="text-white/40 uppercase tracking-[0.2em] text-xs mb-6 font-bold">Selecteer Presentatie Modus</label>
                    
                    <div className="relative mb-10">
                      <select 
                        value={selectedOption} 
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="bg-slate-950 text-white border border-white/10 p-5 pr-12 rounded-2xl w-96 text-lg outline-none focus:border-white/30 appearance-none cursor-pointer transition-colors hover:bg-black"
                      >
                        <option value="without-questions">Presentatie zonder vragen</option>
                        <option value="with-questions">Presentatie met vragen</option>
                        <option value="test-questions">Test vragen (Dev only)</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>

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
                      onClick={() => {
                        if (selectedOption === 'test-questions') {
                          navigate('/host-test');
                        } else {
                          setIsStarted(true);
                          if (selectedOption !== 'without-questions') {
                            const firstInterstitial = interstitials.find(i => i.atIndex === currentSlideIndex);
                            if (firstInterstitial) {
                              setActiveInterstitial(firstInterstitial);
                            }
                          }
                        }
                      }}
                      className="group relative bg-white text-black font-black py-5 px-16 rounded-2xl text-xl hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      disabled={selectedOption === 'test-questions' && apiStatus !== 'development'}
                    >
                      START PRESENTATIE
                    </button>
                  </div>
                </div>
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
          </div>
        </div>
      </div>
    </SlideContext.Provider>
  );
}
