export function parseSlideKey(slideKey) {
  const [slideIdxStr, subIdxStr] = (slideKey || '0.0').split('.');
  return {
    slideIndex: Number(slideIdxStr) || 0,
    subslideIndex: Number(subIdxStr) || 0,
  };
}

export function formatSlideKey(slideIndex, subslideIndex) {
  return `${slideIndex}.${subslideIndex}`;
}

export function subslideCountForMeta(slidesMeta, slideIndex) {
  const n = slidesMeta?.[slideIndex]?.subslides;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

/** Next (slide, subslide) key — same order as keyboard / presenter nav. */
export function nextSlideKey(currentKey, slidesMeta) {
  const { slideIndex, subslideIndex } = parseSlideKey(currentKey);
  const subslideCount = subslideCountForMeta(slidesMeta, slideIndex);
  const totalSlides = slidesMeta?.length || 0;

  if (subslideIndex < subslideCount - 1) {
    return formatSlideKey(slideIndex, subslideIndex + 1);
  }
  if (slideIndex < totalSlides - 1) {
    return formatSlideKey(slideIndex + 1, 0);
  }
  return null;
}

/** Previous (slide, subslide) key — lands on last subslide when entering a slide. */
export function prevSlideKey(currentKey, slidesMeta) {
  const { slideIndex, subslideIndex } = parseSlideKey(currentKey);

  if (subslideIndex > 0) {
    return formatSlideKey(slideIndex, subslideIndex - 1);
  }
  if (slideIndex > 0) {
    const prevIdx = slideIndex - 1;
    const prevSubCount = subslideCountForMeta(slidesMeta, prevIdx);
    return formatSlideKey(prevIdx, Math.max(0, prevSubCount - 1));
  }
  return null;
}
