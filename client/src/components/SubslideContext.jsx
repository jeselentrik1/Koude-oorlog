import { createContext, useContext } from 'react';

/**
 * Slides can opt-in to multi-step (sub-slide) reveals by exporting a static
 * `subslides` count on the component, e.g.:
 *
 *   export default function Slide5() { ... }
 *   Slide5.subslides = 3;
 *
 * The Presentation component drives a `subslideIndex` (0-based) and exposes it
 * here. Slides read it via `useSubslide()` to decide what to render.
 */
export const SubslideContext = createContext({
  subslideIndex: 0,
  subslideCount: 1,
});

export const useSubslide = () => useContext(SubslideContext);
