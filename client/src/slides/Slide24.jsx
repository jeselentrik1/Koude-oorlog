import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSlideContext } from '../components/SlideContext';
import UssrStagnation3D from '../components/UssrStagnation3D';

const MAX_PHASE = 4;

export default function Slide24() {
  const [phase, setPhase] = useState(0);
  const { goToNextSlide } = useSlideContext();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        e.stopImmediatePropagation();
        if (phase < MAX_PHASE) {
          setPhase((p) => p + 1);
        } else if (!isExiting) {
          setIsExiting(true);
          setTimeout(() => {
            goToNextSlide();
          }, 1000);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (phase > 0) {
          e.stopImmediatePropagation();
          setPhase((p) => p - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [phase, isExiting, goToNextSlide]);

  const handleAdvance = (e) => {
    e.stopPropagation();
    if (phase < MAX_PHASE) {
      setPhase((p) => p + 1);
    } else if (!isExiting) {
      setIsExiting(true);
      setTimeout(() => {
        goToNextSlide();
      }, 1000);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full min-h-0 overflow-hidden bg-[#020202]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      onClick={handleAdvance}
    >
      <UssrStagnation3D phase={phase} />
    </motion.div>
  );
}
