import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SlideContext } from './SlideContext';
import Background from './Background';

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

export default function Presentation({ slides }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(() =>
    slideIndexFromSearch(
      typeof window !== 'undefined' ? window.location.search : '',
      slides?.length ?? 0
    )
  );
  const [direction, setDirection] = useState(1);
  const [background, setBackground] = useState(null);
  const [scale, setScale] = useState(1);

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
    const url = new URL(window.location.href);
    const next = String(currentSlideIndex + 1);
    if (url.searchParams.get('slide') === next) return;
    url.searchParams.set('slide', next);
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, [currentSlideIndex]);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setDirection(1);
      setCurrentSlideIndex((prev) => prev + 1);
    }
  }, [currentSlideIndex, slides.length]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setDirection(-1);
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide]);

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
      goToNextSlide,
      goToPrevSlide
    }}>
      <div 
        className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden fixed inset-0"
        onClick={goToNextSlide}
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
            <Background background={background} />
            
            <div className="relative z-10 w-full h-full">
              <AnimatePresence initial={false} mode="sync">
                <CurrentSlideComponent key={currentSlideIndex} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </SlideContext.Provider>
  );
}
