import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssetCache } from './AssetContext';

const CONFIG = {
  ambientIntensity: 0.01 * Math.PI,
  keyIntensity: 0.625 * Math.PI,
  focusKeyIntensity: 7.8 * Math.PI,
  bookScale: 3.5,
};

const bookData = [
  { file: 'Heldere hemel.glb', color: 0x88aaff },
  { file: 'Erfenis van spionnen.glb', color: 0xffaa88 },
  { file: 'Muurziek.glb', color: 0xaa88ff },
];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function Books3D({ phase = 0 }) {
  const containerRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const { getCachedModel } = useAssetCache();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2(0x050505, 0.04);

    const getSize = () => ({
      w: container.clientWidth || window.innerWidth,
      h: container.clientHeight || window.innerHeight,
    });

    const { w, h } = getSize();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, CONFIG.ambientIntensity);
    scene.add(ambientLight);

    const keyLight = new THREE.SpotLight(0xfff5e6, CONFIG.keyIntensity);
    keyLight.position.set(6, 12, 10);
    keyLight.angle = Math.PI / 6;
    keyLight.penumbra = 0.7;
    keyLight.decay = 1;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x3355aa, 1.3 * Math.PI, 30);
    fillLight.position.set(-8, 3, -3);
    fillLight.decay = 1;
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 0.9 * Math.PI, 20);
    rimLight.position.set(0, 6, -8);
    rimLight.decay = 1;
    scene.add(rimLight);

    const bounceLight = new THREE.PointLight(0x222233, 0.5 * Math.PI, 15);
    bounceLight.position.set(0, -4, 5);
    bounceLight.decay = 1;
    scene.add(bounceLight);

    const loader = new GLTFLoader();
    const bookGroups = [];
    const bookPivots = [];
    const wiggleGroups = [];
    const bookMaterials = [];

    let loadedCount = 0;
    const onModelLoad = () => {
      loadedCount++;
      if (loadedCount === bookData.length) {
        setIsLoading(false);
      }
    };

    bookData.forEach((data, index) => {
      const group = new THREE.Group();
      scene.add(group);
      bookGroups.push(group);

      const pivot = new THREE.Group();
      group.add(pivot);
      bookPivots.push(pivot);

      const wiggle = new THREE.Group();
      pivot.add(wiggle);
      wiggleGroups.push(wiggle);

      const mats = [];
      bookMaterials.push(mats);

      const cached = getCachedModel(`/${data.file}`);

      const handleModel = (gltf) => {
        const model = gltf.scene.clone(); // Clone for safety if reused
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 1.0;
            mats.push(child.material);
          }
        });

        model.scale.set(CONFIG.bookScale, CONFIG.bookScale, CONFIG.bookScale);
        model.rotation.x = Math.PI / 2;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        wiggle.add(model);
        onModelLoad();
      };

      if (cached) {
        handleModel(cached);
      } else {
        loader.load(
          `/${data.file}`,
          handleModel,
          undefined,
          (error) => {
            console.warn(`Could not load ${data.file}, using placeholder.`, error);
            const geometry = new THREE.BoxGeometry(2.5, 3.5, 0.5);
            const material = new THREE.MeshStandardMaterial({
              color: data.color,
              roughness: 0.3,
              metalness: 0.05,
              transparent: true,
              opacity: 1.0,
            });
            mats.push(material);
            const placeholder = new THREE.Mesh(geometry, material);
            placeholder.castShadow = true;
            wiggle.add(placeholder);
            onModelLoad();
          }
        );
      }
    });

    // Initial positions
    bookGroups[0].position.set(-4.5, 0, 0);
    bookGroups[1].position.set(0, 0, 0);
    bookGroups[2].position.set(4.5, 0, 0);

    const clock = new THREE.Clock();
    const cameraSmoothPos = new THREE.Vector3().copy(camera.position);
    const cameraSmoothLookAt = new THREE.Vector3(0, 0, 0);

    const update = () => {
      const time = clock.getElapsedTime();
      const ph = phaseRef.current;

      // Target camera position
      const targetCamPos = new THREE.Vector3();
      const targetLookAt = new THREE.Vector3(0, 0, 0);

      if (ph === 0) {
        targetCamPos.set(0, 0.5, 14);
      } else {
        targetCamPos.set(1.5, 0.3, 13);
      }

      cameraSmoothPos.lerp(targetCamPos, 0.05);
      camera.position.copy(cameraSmoothPos);
      camera.lookAt(cameraSmoothLookAt.lerp(targetLookAt, 0.05));

      // Lighting and book positions
      if (ph === 0) {
        keyLight.intensity = THREE.MathUtils.lerp(keyLight.intensity, CONFIG.keyIntensity, 0.05);
        keyLight.position.lerp(new THREE.Vector3(0, 12, 10), 0.05);
        fillLight.intensity = THREE.MathUtils.lerp(fillLight.intensity, 0.1 * Math.PI, 0.05);
        ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, CONFIG.ambientIntensity, 0.05);
        rimLight.intensity = THREE.MathUtils.lerp(rimLight.intensity, 0.1 * Math.PI, 0.05);
        bounceLight.intensity = THREE.MathUtils.lerp(bounceLight.intensity, 0.05 * Math.PI, 0.05);
      } else {
        keyLight.intensity = THREE.MathUtils.lerp(keyLight.intensity, CONFIG.focusKeyIntensity, 0.05);
        keyLight.position.lerp(new THREE.Vector3(6, 10, 8), 0.05);
        fillLight.intensity = THREE.MathUtils.lerp(fillLight.intensity, 0.5 * Math.PI, 0.05);
        ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, 0.035 * Math.PI, 0.05);
        rimLight.intensity = THREE.MathUtils.lerp(rimLight.intensity, 0.9 * Math.PI, 0.05);
        bounceLight.intensity = THREE.MathUtils.lerp(bounceLight.intensity, 0.5 * Math.PI, 0.05);
      }

      bookGroups.forEach((group, i) => {
        const wiggle = wiggleGroups[i];
        const pivot = bookPivots[i];
        const mats = bookMaterials[i];

        if (ph === 0) {
          // Overview
          const xPos = (i - 1) * 4.5;
          group.position.lerp(new THREE.Vector3(xPos, 0, 0), 0.05);
          group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, 0.05);
          pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, 0, 0.05);
          
          mats.forEach(mat => {
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1.0, 0.05);
          });

          // Wiggle
          wiggle.rotation.y = Math.sin(time * 0.35 + i * 2.1) * 0.12;
          wiggle.rotation.x = Math.sin(time * 0.22 + i * 1.3) * 0.06;
        } else {
          // Focus
          const activeIndex = ph - 1;
          const isActive = (i === activeIndex);

          if (isActive) {
            group.position.lerp(new THREE.Vector3(4.2, 0, 3), 0.05);
            
            // Slow rotation for focus
            // Phase 1: show front, Phase 2: rotate to back, Phase 3: settle 3/4
            // Since we don't have GSAP timeline here, we'll use a time-based approach for the rotation phase
            // or just a nice continuous rotation that resets on phase change.
            // For simplicity and "super smooth" feel, let's just lerp to a nice angle + wiggle.
            pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, Math.PI * 2 - 0.35, 0.03);
            
            mats.forEach(mat => {
              mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1.0, 0.05);
            });

            const ampY = 0.28;
            const ampX = 0.14;
            const speed = 0.4;
            wiggle.rotation.y = Math.sin(time * speed + i) * ampY;
            wiggle.rotation.x = Math.sin(time * speed * 0.8 + i) * ampX;
          } else {
            // Inactive
            const inactiveIndices = bookGroups.map((_, idx) => idx).filter(idx => idx !== activeIndex);
            const slotIndex = inactiveIndices.indexOf(i);
            const xTarget = slotIndex === 0 ? -14 : 14;
            const zTarget = -12;

            group.position.lerp(new THREE.Vector3(xTarget, -2, zTarget), 0.05);
            pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, 0, 0.05);

            mats.forEach(mat => {
              mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.12, 0.05);
            });

            const ampY = 0.10;
            const ampX = 0.05;
            const speed = 0.2;
            wiggle.rotation.y = Math.sin(time * speed + i) * ampY;
            wiggle.rotation.x = Math.sin(time * speed * 0.8 + i) * ampX;
          }
        }
      });
    };

    let rafId;
    const animate = () => {
      update();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const { w, h } = getSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const slideContent = [
    {
      title: 'Onze Invalshoeken',
      subtitle: 'De 3 Fictieboeken',
      body1: 'Historische feiten versus persoonlijke verhalen.',
      body2: 'Drie perspectieven, drie boeken, één diepgaande analyse over de impact van conflict en dictatuur.',
    },
    {
      speaker: 'Jess',
      title: 'Heldere hemel',
      subtitle: 'Tom Lanoye',
      body1: 'De onschuldige burger.',
      body2: 'De tragische focus op het onverwachte slachtoffer van het grote conflict. Hoe de gewone mens wordt meegesleurd in zaken die zijn macht te boven gaan.',
    },
    {
      speaker: 'Nour',
      title: 'Erfenis van spionnen',
      subtitle: 'John le Carré',
      body1: 'De wereld van spionage.',
      body2: 'De harde, onverbiddelijke realiteit van de Koude Oorlog en de verwoestende gevolgen van geheime operaties voor achtergebleven families.',
    },
    {
      speaker: 'Thibo',
      title: 'Muurziek',
      subtitle: 'Wouter Polspoel',
      body1: 'Het leven achter de Muur als journalist',
      body2: 'We volgden Emma en haar familie op in Oost-Berlijn, die onder strenge controle van de Stasi leefden. Het boek toont heel goed hoe mensen in angst leefden en dat niemand te vertrouwen was.',
    },
  ];

  const current = slideContent[phase];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-[42%] ml-[8%]"
          >
            {current.speaker && (
              <div className="inline-block bg-white/5 border border-white/15 px-4 py-1.5 rounded-full text-[0.7rem] uppercase tracking-[0.3em] text-slate-400 mb-6">
                Spreker: {current.speaker}
              </div>
            )}
            <div className="w-12 h-px bg-white/25 mb-6" />
            <h1 className="text-white font-black text-7xl md:text-8xl uppercase mb-4 leading-[0.85] tracking-tighter">
              {current.title}
            </h1>
            <h2 className="text-slate-400 text-3xl md:text-4xl mb-10 font-bold tracking-tight uppercase">
              {current.subtitle}
            </h2>
            <p className="text-slate-200 text-2xl md:text-3xl font-medium leading-relaxed max-w-2xl mb-6">
              {current.body1}
            </p>
            <p className="text-slate-400 text-xl md:text-2xl font-normal leading-relaxed max-w-2xl">
              {current.body2}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-10 right-12 z-20 flex gap-2.5 items-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-700 ease-[0.22,1,0.36,1] ${
              i === phase ? 'w-6 bg-white/90' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
