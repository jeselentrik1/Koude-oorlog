import { createContext, useContext } from 'react';

export const SlideContext = createContext({
  direction: 1,
  currentSlideIndex: 0,
  totalSlides: 0,
  background: null,
  setBackground: () => {},
  lastSectionBackground: null,
  goToNextSlide: () => {},
  goToPrevSlide: () => {},
  presentationMode: 'without-questions',
  activeInterstitial: null,
});

export const useSlideContext = () => useContext(SlideContext);
