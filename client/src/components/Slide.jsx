import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useSlideContext } from './SlideContext';

function backgroundKey(background) {
  if (background == null) return 'null';
  return `${background.image ?? ''}|${background.color ?? ''}|${background.brightness ?? ''}|${background.plain ? '1' : '0'}`;
}

const easeSmooth = [0.22, 1, 0.36, 1];

/** Crossfade with a subtle zoom — overlaps with exiting slide via AnimatePresence mode="sync" */
const defaultVariants = {
  enter: {
    opacity: 0,
    scale: 1.012,
    zIndex: 2,
  },
  center: {
    opacity: 1,
    scale: 1,
    zIndex: 2,
  },
  exit: {
    opacity: 0,
    scale: 0.988,
    zIndex: 1,
  },
};

const defaultTransition = {
  opacity: { duration: 0.5, ease: easeSmooth },
  scale: { duration: 0.55, ease: easeSmooth },
};

export default function Slide({ 
  children, 
  className = '', 
  variants = defaultVariants, 
  transition = defaultTransition,
  background = null // Allow passing background config directly
}) {
  const { setBackground } = useSlideContext();
  const lastBackgroundKeyRef = useRef(null);

  useEffect(() => {
    const key = backgroundKey(background);
    if (key === lastBackgroundKeyRef.current) return;
    lastBackgroundKeyRef.current = key;
    setBackground(background);
  }, [background, setBackground]);

  return (
    <motion.div
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className={`absolute inset-0 w-full h-full flex flex-col p-12 ${className}`}
    >
      {children}
    </motion.div>
  );
}
