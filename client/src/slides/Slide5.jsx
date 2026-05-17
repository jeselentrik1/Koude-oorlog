import { useSlideContext } from '../components/SlideContext';
import { useSubslide } from '../components/SubslideContext';
import Books3D from '../components/Books3D';
import { motion } from 'framer-motion';

export default function Slide5() {
  const { subslideIndex } = useSubslide();
  const { goToNextSlide } = useSlideContext();

  const handleClick = (e) => {
    e.stopPropagation();
    goToNextSlide();
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full min-h-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      onClick={handleClick}
    >
      <Books3D phase={subslideIndex} />
    </motion.div>
  );
}

Slide5.subslides = 4;
