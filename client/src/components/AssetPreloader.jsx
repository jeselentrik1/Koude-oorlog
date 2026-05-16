import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Import local assets to get their processed URLs
import berlinWallImg from '../assets/berlin_wall.jpeg';
import coldWarImg from '../assets/cold_war.jpeg';
import familiesImg from '../assets/families.jpg';
import migImage from '../assets/mig_23.jpg';
import nuclearImg from '../assets/nuclear.jpeg';
import nuclearTest from '../assets/nuclear_test.png';
import nuclearWeaponImg from '../assets/nuclear_weapon.jpg';
import stasiImage from '../assets/stasi.webp';
import tensionImg from '../assets/tension.jpeg';
import usFlag from '../assets/us.webp';
import ussrFlag from '../assets/ussr.png';
import vrtNwsLogo from '../assets/vrt_nws.png';
import wallImage from '../assets/wall.png';
import wimImage from '../assets/wim_delaere.jpg';

const ASSETS = {
  images: [
    berlinWallImg,
    coldWarImg,
    familiesImg,
    migImage,
    nuclearImg,
    nuclearTest,
    nuclearWeaponImg,
    stasiImage,
    tensionImg,
    usFlag,
    ussrFlag,
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
  const [totalLoaded, setTotalLoaded] = useState(0);
  const totalAssets = ASSETS.images.length + ASSETS.models.length;

  useEffect(() => {
    let loadedCount = 0;
    const loader = new GLTFLoader();

    const updateProgress = () => {
      loadedCount++;
      setTotalLoaded(loadedCount);
      setProgress(Math.round((loadedCount / totalAssets) * 100));
      if (loadedCount === totalAssets) {
        // Add a small delay for smoothness
        setTimeout(() => onComplete(), 500);
      }
    };

    // Preload Images
    ASSETS.images.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = updateProgress;
      img.onerror = updateProgress; // Continue even if one fails
    });

    // Preload Models
    ASSETS.models.forEach(url => {
      loader.load(url, updateProgress, undefined, (err) => {
        console.error(`Failed to load model: ${url}`, err);
        updateProgress();
      });
    });

  }, [onComplete, totalAssets]);

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
