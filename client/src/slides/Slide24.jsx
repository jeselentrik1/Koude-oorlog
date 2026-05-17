import { motion } from 'framer-motion';
import { useSlideContext } from '../components/SlideContext';
import { useSubslide } from '../components/SubslideContext';
import UssrStagnation3D from '../components/UssrStagnation3D';

export default function Slide24() {
  const { subslideIndex } = useSubslide();
  const { goToNextSlide } = useSlideContext();

  const handleClick = (e) => {
    e.stopPropagation();
    goToNextSlide();
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full min-h-0 overflow-hidden bg-[#020202]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      onClick={handleClick}
    >
      <UssrStagnation3D phase={subslideIndex} />
    </motion.div>
  );
}

Slide24.subslides = 5;
