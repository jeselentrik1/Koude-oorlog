import { useState, useEffect } from 'react';
import { useSlideContext } from '../components/SlideContext';
import { useSubslide } from '../components/SubslideContext';
import BerlinWall3D from '../components/BerlinWall3D';
import { motion } from 'framer-motion';

const BERLIN_SUBSLIDES = 7;

function berlinPhaseFromSubslide(si) {
  if (si <= 3) return si;
  if (si <= 5) return 4;
  return 5;
}

export default function Slide13() {
  const { subslideIndex } = useSubslide();
  const { setBackground, goToNextSlide } = useSlideContext();
  const [isExiting, setIsExiting] = useState(false);

  const phase = berlinPhaseFromSubslide(subslideIndex);
  const phase4WallDrawStarted = subslideIndex >= 5;

  useEffect(() => {
    setBackground({ color: '#050608', plain: true });
  }, [setBackground]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (subslideIndex < BERLIN_SUBSLIDES - 1) {
      goToNextSlide();
    }
  };

  const handleWallDrawComplete = () => {
    goToNextSlide();
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
      onClick={handleClick}
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

Slide13.subslides = BERLIN_SUBSLIDES;
