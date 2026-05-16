import { motion, AnimatePresence } from 'framer-motion';

const Background = ({ background, lastSectionBackground }) => {
  const activeBackground = background || lastSectionBackground;
  const isFallback = !background && lastSectionBackground;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={(activeBackground?.image || activeBackground?.color || 'default') + (isFallback ? '-fallback' : '')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {activeBackground?.image ? (
            <div className="absolute inset-0">
              <img
                src={activeBackground.image}
                alt=""
                className="w-full h-full object-cover scale-105"
                style={{ 
                  filter: isFallback 
                    ? `blur(12px) brightness(${activeBackground.brightness || 0.4}) contrast(1.1) grayscale(0.3)`
                    : `brightness(${activeBackground.brightness || 0.4}) contrast(1.1) grayscale(0.3)` 
                }}
              />
              {/* Vignette */}
              <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%]" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          ) : activeBackground?.plain ? (
            <div
              className="absolute inset-0 w-full h-full"
              style={{ backgroundColor: activeBackground?.color || '#0a0a0c' }}
            />
          ) : (
            <div 
              className="absolute inset-0 w-full h-full transition-colors duration-1000"
              style={{ backgroundColor: activeBackground?.color || '#0a0a0c' }}
            >
              {/* Subtle grid or industrial texture */}
              <div className="absolute inset-0 opacity-[0.03]" 
                   style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/5" />
              {/* Vignette for solid background too */}
              <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_40%,_rgba(0,0,0,0.4)_100%]" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Background;
