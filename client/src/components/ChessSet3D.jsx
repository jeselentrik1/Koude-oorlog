import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useAssetCache } from './AssetContext';

export default function ChessSet3D({
  fadeInDelaySec = 0.5,
  fadeInDurationSec = 2.6,
} = {}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const frameRef = useRef(null);
  const startTimestampRef = useRef(null);
  const { getCachedModel } = useAssetCache();

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    sceneRef.current = scene;

    const width = Math.max(1, containerRef.current.clientWidth);
    const height = Math.max(1, containerRef.current.clientHeight);

    const camera = new THREE.PerspectiveCamera(15, width / height, 0.1, 1000);
    const ORBIT_START_ANGLE = Math.PI * 0.4;
    const ORBIT_START_RADIUS = 2.9;
    const ORBIT_START_HEIGHT = 2.05;
    const camH0 = ORBIT_START_HEIGHT + Math.cos(0) * 0.2;
    camera.position.set(
      Math.cos(ORBIT_START_ANGLE) * ORBIT_START_RADIUS,
      camH0,
      Math.sin(ORBIT_START_ANGLE) * ORBIT_START_RADIUS
    );
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05; // Reverted to original
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // Fix deprecation warning
    
    // Clear container to avoid double canvas in dev mode
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const canvas = renderer.domElement;
    canvas.style.opacity = '0';
    canvas.style.transition = `opacity ${fadeInDurationSec * 1000}ms cubic-bezier(0.22, 1, 0.36, 1) ${fadeInDelaySec * 1000}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        canvas.style.opacity = '1';
      });
    });

    // --- LIGHTING ---
    const LIGHT_START = 0.1;
    const TARGET_AMBIENT = 0.012;
    const TARGET_BULB = 35;

    const ambient = new THREE.AmbientLight(0x141820, TARGET_AMBIENT * LIGHT_START);
    scene.add(ambient);

    const bulbY = 1.28;
    const bulbGroup = new THREE.Group();
    bulbGroup.position.set(0, bulbY, 0);
    scene.add(bulbGroup);

    const bulbPoint = new THREE.PointLight(
      0xfff2e6,
      TARGET_BULB * LIGHT_START,
      1.33
    );
    bulbPoint.decay = 2;
    bulbPoint.castShadow = false; 
    bulbPoint.shadow.mapSize.set(1024, 1024);
    bulbPoint.shadow.bias = -0.00025;
    bulbPoint.shadow.normalBias = 0.08;
    bulbGroup.add(bulbPoint);

    // --- LOAD MODEL ---
    const loader = new GLTFLoader();
    const cached = getCachedModel('/wooden_chess_set.glb');

    const handleModel = (gltf) => {
      const model = gltf.scene.clone();
      modelRef.current = model;

      const box0 = new THREE.Box3().setFromObject(model);
      const size0 = box0.getSize(new THREE.Vector3());
      const maxDim = Math.max(size0.x, size0.y, size0.z);
      model.scale.setScalar(1 / maxDim);
      model.updateMatrixWorld(true);

      const box1 = new THREE.Box3().setFromObject(model);
      const c = box1.getCenter(new THREE.Vector3());
      model.position.x -= c.x;
      model.position.z -= c.z;
      
      const box2 = new THREE.Box3().setFromObject(model);
      model.position.y -= box2.min.y;
      model.updateMatrixWorld(true);

      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) {
            node.material.envMapIntensity = 0.55;
            node.material.roughness = Math.max(node.material.roughness, 0.2);
          }
        }
      });

      scene.add(model);
    };

    if (cached) {
      handleModel(cached);
    } else {
      loader.load('/wooden_chess_set.glb', handleModel);
    }

    const INTRO_DURATION = 8000;
    const LIGHT_DELAY_MS = fadeInDelaySec * 1000;
    /** Slightly slower orbit than before (was 0.0001). */
    const ORBIT_SPEED = 0.00007;

    function easeInOutCubic(p) {
      return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    }

    function setCameraOrbit(target, elapsed) {
      const angle = ORBIT_START_ANGLE + elapsed * ORBIT_SPEED;
      const radius = ORBIT_START_RADIUS + Math.sin(elapsed * 0.0001) * 0.3;
      const camHeight = ORBIT_START_HEIGHT + Math.cos(elapsed * 0.00015) * 0.2;
      target.set(
        Math.cos(angle) * radius,
        camHeight,
        Math.sin(angle) * radius
      );
    }

    // --- ANIMATION ---
    const animate = (timestamp) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const elapsed = timestamp - startTimestampRef.current;

      const lookAtPos = new THREE.Vector3(0, 0, 0);
      const targetPos = new THREE.Vector3();

      setCameraOrbit(targetPos, elapsed);

      const tLight = elapsed - LIGHT_DELAY_MS;
      if (tLight <= 0) {
        ambient.intensity = TARGET_AMBIENT * LIGHT_START;
        bulbPoint.intensity = TARGET_BULB * LIGHT_START;
      } else if (tLight < INTRO_DURATION) {
        const p = Math.min(1, tLight / INTRO_DURATION);
        const ease = easeInOutCubic(p);
        const k = LIGHT_START + (1 - LIGHT_START) * ease;
        ambient.intensity = TARGET_AMBIENT * k;
        bulbPoint.intensity = TARGET_BULB * k;
      } else {
        ambient.intensity = TARGET_AMBIENT;
        bulbPoint.intensity = TARGET_BULB;
      }

      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetPos, 0.01);
        cameraRef.current.lookAt(lookAtPos);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    // --- RESIZE ---
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = Math.max(1, containerRef.current.clientWidth);
      const h = Math.max(1, containerRef.current.clientHeight);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      // Dispose materials and geometries
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [fadeInDelaySec, fadeInDurationSec]);

  return <div ref={containerRef} className="h-full w-full min-h-0" />;
}
