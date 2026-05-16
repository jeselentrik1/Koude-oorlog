import Slide from '../components/Slide';
import ChessSet3D from '../components/ChessSet3D';
import { motion } from 'framer-motion';
import { useAssetCache } from '../components/AssetContext';

/** Radial scrim: avoids long linear CSS gradients (they band into gray “bars” on 8‑bit displays). */
const TEXT_SCRIM_STYLE = {
  background: `
    radial-gradient(
      ellipse 95% 115% at 72% 50%,
      rgba(0, 0, 0, 0.52) 0%,
      rgba(0, 0, 0, 0.28) 38%,
      rgba(0, 0, 0, 0.12) 55%,
      rgba(0, 0, 0, 0.04) 72%,
      transparent 100%
    )
  `,
};

const BG_FADE_EASE = [0.22, 1, 0.36, 1];
const BG_FADE_DURATION = 2.6;
/** CSS opacity fade begins this many seconds after the slide mounts (model + scrims). */
const BG_FADE_DELAY = 0.5;

export default function Slide21() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className="text-white !p-0" background={{ color: '#020202', plain: true }}>
      <div className="relative flex h-full w-full min-h-0">
        <div className="absolute inset-0 z-0 min-h-0">
          <ChessSet3D
            fadeInDelaySec={BG_FADE_DELAY}
            fadeInDurationSec={BG_FADE_DURATION}
          />
        </div>
        <motion.div
          className="pointer-events-none absolute inset-0 z-[1]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: BG_FADE_DELAY,
            duration: BG_FADE_DURATION,
            ease: BG_FADE_EASE,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={TEXT_SCRIM_STYLE}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                `url('${getAssetUrl('https://www.transparenttextures.com/patterns/stardust.png')}')`,
            }}
            aria-hidden
          />
        </motion.div>
        <div className="relative z-10 flex h-full w-full flex-col justify-center p-12">
          <div className="w-full max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-4 text-sm font-bold uppercase tracking-[0.4em] text-blue-500"
            >
              Een erfenis van spionnen
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-10 text-7xl font-black uppercase leading-[0.9] tracking-tighter text-white md:text-8xl"
            >
              De <span className="text-slate-500">Realiteit</span>
            </motion.h2>

            <div className="w-full space-y-8 text-2xl text-slate-300">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Geen romantische James Bond wereld.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="border-l-2 border-blue-500/40 pl-6 font-medium italic text-white"
              >
                Manipulatie en kille opofferingen.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                Operatie Windfall: Het grote spel.
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="my-10 h-px origin-left bg-gradient-to-r from-slate-600 to-transparent"
              />

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 1.4 }}
                className="text-xl italic leading-relaxed text-slate-400"
              >
                &quot;Karakters zoals Elizabeth Gold waren slechts pionnen op een schaakbord.&quot;
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}
