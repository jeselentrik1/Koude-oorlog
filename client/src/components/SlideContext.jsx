import { createContext, useContext } from 'react';

export const SlideContext = createContext({
  direction: 1,
  currentSlideIndex: 0,
  totalSlides: 0,
  background: null,
  setBackground: () => {},
  goToNextSlide: () => {},
  goToPrevSlide: () => {},
});

export const useSlideContext = () => useContext(SlideContext);
