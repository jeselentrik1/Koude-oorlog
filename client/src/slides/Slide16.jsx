import { useState, useEffect } from 'react';
import { useSlideContext } from '../components/SlideContext';
import BerlinWall3D from '../components/BerlinWall3D';
import { motion } from 'framer-motion';

export default function Slide16() {
  const [phase, setPhase] = useState(0);
  const [phase4WallDrawStarted, setPhase4WallDrawStarted] = useState(false);
  const { setBackground, goToNextSlide } = useSlideContext();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setBackground({ color: '#050608', plain: true });
  }, [setBackground]);

  useEffect(() => {
    if (phase !== 4) setPhase4WallDrawStarted(false);
  }, [phase]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        e.stopImmediatePropagation();
        if (phase === 4 && !phase4WallDrawStarted) {
          setPhase4WallDrawStarted(true);
          return;
        }
        if (phase < 5) {
          setPhase((p) => p + 1);
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
  }, [phase, phase4WallDrawStarted]);

  const handleAdvance = (e) => {
    e.stopPropagation();
    if (phase === 4 && !phase4WallDrawStarted) {
      setPhase4WallDrawStarted(true);
      return;
    }
    if (phase < 5) {
      setPhase((p) => p + 1);
    }
  };

  const handleWallDrawComplete = () => {
    setPhase(5);
  };

  const handleFinalPhaseEnd = () => {
    if (!isExiting) {
      setIsExiting(true);
      setTimeout(() => {
        goToNextSlide();
      }, 1000);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full min-h-0 bg-[#050608] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      onClick={handleAdvance}
    >
      <BerlinWall3D
        phase={phase}
        phase4WallDrawStarted={phase4WallDrawStarted}
        onWallDrawComplete={handleWallDrawComplete}
        onFinalPhaseEnd={handleFinalPhaseEnd}
      />
    </motion.div>
  );
}
