import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useAssetCache } from './AssetContext';

// Import local assets to get their processed URLs
import berlinWallImg from '../assets/berlin_wall.jpeg';
import coldWarImg from '../assets/cold_war.jpeg';
import conclusionImg from '../assets/conclusion.jpg';
import familiesImg from '../assets/families.jpg';
import ironCurtainMap from '../assets/iron_curtain.svg';
import migImage from '../assets/mig_23.jpg';
import natoLogo from '../assets/nato.svg';
import nuclearImg from '../assets/nuclear.jpeg';
import nuclearTest from '../assets/nuclear_test.png';
import nuclearWeaponImg from '../assets/nuclear_weapon.jpg';
import stasiImage from '../assets/stasi.webp';
import tensionImg from '../assets/tension.jpeg';
import theEndImg from '../assets/the_end.jpg';
import usFlag from '../assets/us.webp';
import ussrFlag from '../assets/ussr.png';
import ussrLogo from '../assets/ussr.svg';
import vrtNwsLogo from '../assets/vrt_nws.png';
import wallImage from '../assets/wall.png';
import wimImage from '../assets/wim_delaere.jpg';

const ASSETS = {
  images: [
    berlinWallImg,
    coldWarImg,
    conclusionImg,
    familiesImg,
    ironCurtainMap,
    migImage,
    natoLogo,
    nuclearImg,
    nuclearTest,
    nuclearWeaponImg,
    stasiImage,
    tensionImg,
    theEndImg,
    usFlag,
    ussrFlag,
    ussrLogo,
    vrtNwsLogo,
    wallImage,
    wimImage,
    'https://www.transparenttextures.com/patterns/stardust.png'
  ],
  models: [
    '/Heldere hemel.glb',
    '/Erfenis van spionnen.glb',
    '/Muurziek.glb',
    '/wooden_chess_set.glb'
  ]
};

export default function AssetPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const { setAssetMap, setModelCache } = useAssetCache();
  const totalAssets = ASSETS.images.length + ASSETS.models.length;
  const loadedCountRef = useRef(0);

  useEffect(() => {
    const loader = new GLTFLoader();
    const newAssetMap = {};
    const newModelCache = {};

    const updateProgress = () => {
      loadedCountRef.current++;
      const current = loadedCountRef.current;
      setProgress(Math.round((current / totalAssets) * 100));
      
      if (current === totalAssets) {
        setAssetMap(newAssetMap);
        setModelCache(newModelCache);
        // Add a small delay for smoothness
        setTimeout(() => onComplete(), 600);
      }
    };

    // Preload Images as Blobs
    ASSETS.images.forEach(async (url) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        newAssetMap[url] = objectUrl;
        updateProgress();
      } catch (err) {
        console.error(`Failed to fetch image: ${url}`, err);
        updateProgress();
      }
    });

    // Preload Models and cache the GLTF object
    ASSETS.models.forEach((url) => {
      loader.load(
        url, 
        (gltf) => {
          newModelCache[url] = gltf;
          updateProgress();
        }, 
        undefined, 
        (err) => {
          console.error(`Failed to load model: ${url}`, err);
          updateProgress();
        }
      );
    });

    // Cleanup object URLs on unmount is tricky because they are needed for the presentation.
    // We'll let the browser handle them since this is a SPA and they'll live for the session.
  }, [onComplete, totalAssets, setAssetMap, setModelCache]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="text-white/40 uppercase tracking-[0.3em] text-xs font-bold">
        Assets laden... {progress}%
      </div>
      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
