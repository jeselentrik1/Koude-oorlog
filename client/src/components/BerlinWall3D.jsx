import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { BERLIN_WALL_MAP_OUTLINE_D } from '../lib/berlin_wall_map_outline.path.js';
import { BERLIN_WALL_ROUTE_D } from '../lib/berlin_wall_route.path.js';
import { motion, AnimatePresence } from 'framer-motion';

const CONFIG = {
  wallColor: 0xff1e46,
  mapColor: 0x4a525d,
  groundColor: 0x050608,
  extrudeDepth: 10,
  previewWallColor: 0x5a6478,
  previewWallEmissiveBase: 0x2a303c,
};

const WALL_HEAD_POINT_INTENSITY = 4500;

/** Intro + narrative pacing */
const PHASE1_ZOOM_MS = 6800;
const PHASE_NARRATIVE_CAM_MS = 5500;
const PHASE4_TO_GRENS_MS = 3200;
const PULSE_WARMUP_MS = 2200;
const WALL_DRAW_MS = 12000;
const PHASE5_OUTRO_MS = 8200;
const OUTRO_CALLBACK_MS_BEFORE_END = 900;
const WALL_ORBIT_BRIDGE_MS = 3500;

const WEST_CENTER = new THREE.Vector3(-350, 0, 0);
const EAST_CENTER = new THREE.Vector3(250, 0, 0);

const TOP_DOWN = new THREE.Vector3(0, 1980, 10);
const LOOK_AT = new THREE.Vector3(0, 0, 0);

const a = (x) => x * Math.PI;
const CAM_P1_END = new THREE.Vector3(Math.sin(a(0.4)) * 1000, 600, Math.cos(a(0.4)) * 1000);
const CAM_P2_END = new THREE.Vector3(Math.sin(a(0.5)) * 1000, 600, Math.cos(a(0.5)) * 1000);
const CAM_P3_END = new THREE.Vector3(700, 400, 0);
const CAM_GRENS = new THREE.Vector3(660, 410, 180);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeWallDraw(rawT) {
  return rawT < 0.5 ? 4 * rawT ** 3 : 1 - (-2 * rawT + 2) ** 3 / 2;
}

function wallOrbitCamera(drawProgress) {
  // Start near CAM_GRENS, sweep less aggressively
  const angle = a(0.4) + drawProgress * Math.PI * 0.3;
  // Gradually climb back up to make Phase 5 transition smoother
  const height = 410 + drawProgress * 800;
  const radius = 700 + drawProgress * 400;
  return new THREE.Vector3(
    Math.sin(angle) * radius,
    height,
    Math.cos(angle) * radius
  );
}

export default function BerlinWall3D({
  phase,
  phase4WallDrawStarted = false,
  onWallDrawComplete,
  onFinalPhaseEnd,
}) {
  const containerRef = useRef(null);
  const onWallDrawCompleteRef = useRef(onWallDrawComplete);
  const onFinalPhaseEndRef = useRef(onFinalPhaseEnd);
  onWallDrawCompleteRef.current = onWallDrawComplete;
  onFinalPhaseEndRef.current = onFinalPhaseEnd;

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const phase4WallDrawStartedRef = useRef(phase4WallDrawStarted);
  phase4WallDrawStartedRef.current = phase4WallDrawStarted;

  const wallDoneNotifiedRef = useRef(false);
  const finalPhaseNotifiedRef = useRef(false);
  const [kmCounter, setKmCounter] = useState(0);
  const [kmHudOpacity, setKmHudOpacity] = useState(0);
  const [p4NarrativeMode, setP4NarrativeMode] = useState(null);
  const wallDrawStartedForUiRef = useRef(false);
  const setP4NarrativeModeRef = useRef(setP4NarrativeMode);
  setP4NarrativeModeRef.current = setP4NarrativeMode;

  useEffect(() => {
    wallDoneNotifiedRef.current = false;
    finalPhaseNotifiedRef.current = false;
    wallDrawStartedForUiRef.current = false;
    if (phase === 4) setP4NarrativeMode('grenzen');
    else setP4NarrativeMode(null);
  }, [phase]);

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const wallMeshRef = useRef(null);
  const wallPreviewMeshRef = useRef(null);
  const wallPreviewMaterialRef = useRef(null);
  const wallRouteCurveRef = useRef(null);
  const westMeshesRef = useRef([]);
  const eastMeshesRef = useRef([]);
  const particlesRef = useRef([]);
  const requestRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    westMeshesRef.current = [];
    eastMeshesRef.current = [];
    particlesRef.current = [];

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(CONFIG.groundColor);
    scene.fog = new THREE.Fog(CONFIG.groundColor, 500, 3200);

    const getSize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      return { w, h };
    };

    const { w: iw, h: ih } = getSize();
    const camera = new THREE.PerspectiveCamera(45, iw / ih, 1, 15000);
    cameraRef.current = camera;
    camera.position.copy(TOP_DOWN);
    camera.lookAt(LOOK_AT);

    const cameraSmoothPos = new THREE.Vector3().copy(TOP_DOWN);
    const cameraSmoothLookAt = new THREE.Vector3().copy(LOOK_AT);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(iw, ih, false);
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    const canvas = renderer.domElement;
    canvas.style.cssText =
      'display:block;position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    container.appendChild(canvas);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(500, 1500, 500);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.3;
    spotLight.decay = 2;
    spotLight.distance = 4000;
    scene.add(spotLight);

    const wallHeadGlow = new THREE.PointLight(CONFIG.wallColor, WALL_HEAD_POINT_INTENSITY, 800, 2);
    scene.add(wallHeadGlow);
    scene.wallHeadGlow = wallHeadGlow;

    const grid = new THREE.GridHelper(8000, 60, 0x333333, 0x111111);
    grid.position.y = -1;
    scene.add(grid);

    const loader = new SVGLoader();
    const mapData = loader.parse(`<svg><path d="${BERLIN_WALL_MAP_OUTLINE_D}"/></svg>`);
    const mapGroup = new THREE.Group();

    mapData.paths.forEach((path, pathIdx) => {
      const shapes = path.toShapes(true);
      shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: CONFIG.extrudeDepth,
          bevelEnabled: true,
          bevelThickness: 1,
          bevelSize: 1,
        });
        const material = new THREE.MeshStandardMaterial({
          color: CONFIG.mapColor,
          roughness: 0.5,
          metalness: 0.15,
          emissive: 0x0a0a0a,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(0.1, -0.1, 1);
        mesh.position.set(197, 1050, 0);
        mapGroup.add(mesh);

        if (pathIdx < 5) westMeshesRef.current.push(mesh);
        else eastMeshesRef.current.push(mesh);
      });
    });

    const box = new THREE.Box3().setFromObject(mapGroup);
    const center = box.getCenter(new THREE.Vector3());
    mapGroup.position.x = -center.x;
    mapGroup.position.z = -center.y;
    mapGroup.position.y = 0;
    mapGroup.rotation.x = Math.PI / 2;
    scene.add(mapGroup);

    const wallData = loader.parse(`<svg><path d="${BERLIN_WALL_ROUTE_D}"/></svg>`);
    const wallPath = wallData.paths[0];
    const rawPoints = wallPath.subPaths[0].getPoints();

    const wallPoints = rawPoints.map((p) => {
      const x_svg = p.x * 0.561 + 122.5;
      const y_svg = p.y * 0.561 - 45;
      return new THREE.Vector3(x_svg - center.x, CONFIG.extrudeDepth + 2, y_svg - center.y);
    });

    const curve = new THREE.CatmullRomCurve3(wallPoints);
    wallRouteCurveRef.current = curve;
    const tubeGeo = new THREE.TubeGeometry(curve, 1000, 2, 8, false);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.wallColor,
      emissive: CONFIG.wallColor,
      emissiveIntensity: 2,
      transparent: true,
    });

    wallMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.progress = { value: 0 };
      shader.vertexShader = `
        varying float vLineProgress;
        attribute float lineProgress;
        ${shader.vertexShader}
      `.replace(`#include <begin_vertex>`, `#include <begin_vertex>\nvLineProgress = lineProgress;`);
      shader.fragmentShader = `
        uniform float progress;
        varying float vLineProgress;
        ${shader.fragmentShader}
      `.replace(
        `#include <dithering_fragment>`,
        `#include <dithering_fragment>\nif (vLineProgress > progress) discard;`
      );
      wallMaterial.userData.shader = shader;
    };

    const numVertices = tubeGeo.attributes.position.count;
    const progressAttr = new Float32Array(numVertices);
    const radialSegments = tubeGeo.parameters.radialSegments;
    const tubularSegments = tubeGeo.parameters.tubularSegments;
    for (let i = 0; i <= tubularSegments; i++) {
      for (let j = 0; j <= radialSegments; j++) {
        const index = i * (radialSegments + 1) + j;
        if (index < numVertices) progressAttr[index] = i / tubularSegments;
      }
    }
    tubeGeo.setAttribute('lineProgress', new THREE.BufferAttribute(progressAttr, 1));

    const previewMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.previewWallColor,
      emissive: CONFIG.previewWallEmissiveBase,
      emissiveIntensity: 0.35,
      roughness: 0.75,
      metalness: 0.08,
      transparent: true,
      opacity: 0,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    wallPreviewMaterialRef.current = previewMaterial;
    const previewGeo = tubeGeo.clone();
    const wallPreviewMesh = new THREE.Mesh(previewGeo, previewMaterial);
    wallPreviewMesh.renderOrder = 0;
    wallPreviewMesh.visible = false;
    wallPreviewMeshRef.current = wallPreviewMesh;
    scene.add(wallPreviewMesh);

    const wallMesh = new THREE.Mesh(tubeGeo, wallMaterial);
    wallMesh.renderOrder = 1;
    wallMeshRef.current = wallMesh;
    scene.add(wallMesh);

    const particleCount = 150;
    const particleGeo = new THREE.SphereGeometry(1.5, 8, 8);
    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(
        particleGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
      );
      resetParticle(p);
      p.visible = false;
      scene.add(p);
      particlesRef.current.push(p);
    }

    const onResize = () => {
      const { w, h } = getSize();
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    onResize();

    let lastKmDeci = -1;
    let lastPhaseForKm = -1;

    let lastPhaseAnim = -999;
    const camSegmentStart = new THREE.Vector3();
    let phaseStartTime = performance.now();
    let lastReportedKmHudOpacity = -1;
    let wallKickAtElapsed = null;

    function resetParticle(p) {
      p.position.set(
        EAST_CENTER.x + (Math.random() - 0.5) * 400,
        2,
        EAST_CENTER.z + (Math.random() - 0.5) * 400
      );
      p.userData.speed = 1.5 + Math.random() * 2;
      p.userData.life = Math.random();
    }

    function updateParticles(visible, opacity = 1) {
      particlesRef.current.forEach((p) => {
        p.visible = visible && opacity > 0;
        if (p.visible) {
          p.position.x -= p.userData.speed;
          p.userData.life += 0.005;
          if (p.position.x < -800 || p.userData.life > 1) {
            resetParticle(p);
            p.userData.life = 0;
          }
          p.scale.setScalar(Math.sin(p.userData.life * Math.PI));
          p.material.opacity = opacity;
        }
      });
    }

    const tmpVecB = new THREE.Vector3();

    function update(time) {
      const wall = wallMeshRef.current;
      if (!wall) return;

      const ph = phaseRef.current;

      if (ph !== lastPhaseAnim) {
        lastPhaseAnim = ph;
        phaseStartTime = time;
        camSegmentStart.copy(camera.position);
        wallKickAtElapsed = null;
      }

      const elapsedInPhase = time - phaseStartTime;

      if (ph !== lastPhaseForKm) {
        lastPhaseForKm = ph;
        if (ph === 4) {
          setKmCounter(0);
          setKmHudOpacity(0);
          lastKmDeci = -1;
          lastReportedKmHudOpacity = -1;
        } else if (ph !== 4) {
          setKmHudOpacity(0);
          if (ph > 4) setKmCounter(155);
        }
      }

      let drawProgress = 0;
      let rawDrawProgress = 0;
      let currentShaderProgress = 0;
      let wallDrawingActive = false;

      if (ph === 4 && phase4WallDrawStartedRef.current && wallKickAtElapsed === null) {
        wallKickAtElapsed = elapsedInPhase;
        if (!wallDrawStartedForUiRef.current) {
          wallDrawStartedForUiRef.current = true;
          queueMicrotask(() => setP4NarrativeModeRef.current('wall'));
        }
      }

      let drawElapsedFromKick = 0;
      if (ph === 4 && wallKickAtElapsed !== null) {
        drawElapsedFromKick = elapsedInPhase - wallKickAtElapsed;
      }

      wallDrawingActive = ph === 4 && wallKickAtElapsed !== null;

      if (ph === 4 && wallKickAtElapsed !== null) {
        const drawElapsed = drawElapsedFromKick;
        rawDrawProgress = Math.min(drawElapsed / WALL_DRAW_MS, 1);
        drawProgress = easeWallDraw(rawDrawProgress);
        currentShaderProgress = drawProgress;

        const fade = Math.min(drawElapsed / 720, 1);
        if (Math.abs(fade - lastReportedKmHudOpacity) >= 0.035 || (fade >= 1 && lastReportedKmHudOpacity < 1)) {
          lastReportedKmHudOpacity = fade;
          setKmHudOpacity(fade);
        }

        const kmDeci = Math.floor(drawProgress * 155 * 10);
        if (kmDeci !== lastKmDeci) {
          lastKmDeci = kmDeci;
          setKmCounter(drawProgress * 155);
        }

        if (rawDrawProgress >= 1 && !wallDoneNotifiedRef.current) {
          wallDoneNotifiedRef.current = true;
          onWallDrawCompleteRef.current?.();
        }
      } else if (ph === 4) {
        lastKmDeci = -1;
        currentShaderProgress = 0;
      } else if (ph === 5) {
        rawDrawProgress = 1;
        drawProgress = 1;
        currentShaderProgress = 1;
      } else {
        lastKmDeci = -1;
        currentShaderProgress = 0;
      }

      if (wall.material.userData.shader) {
        wall.material.userData.shader.uniforms.progress.value = currentShaderProgress;
      }

      const previewMesh = wallPreviewMeshRef.current;
      const previewMat = wallPreviewMaterialRef.current;
      if (previewMesh && previewMat) {
        if (ph <= 3) {
          previewMat.color.setHex(CONFIG.previewWallColor);
          previewMat.emissive.setHex(CONFIG.previewWallEmissiveBase);
          previewMat.emissiveIntensity = 0.32;
          previewMat.opacity = 0.5;
          previewMesh.visible = true;
        } else if (ph === 4) {
          const wallActive = wallKickAtElapsed !== null;
          const fadeIn = Math.min(1, elapsedInPhase / 900);
          const pulseWindow =
            !phase4WallDrawStartedRef.current && elapsedInPhase >= PHASE4_TO_GRENS_MS;

          if (!wallActive) {
            if (pulseWindow) {
              const pulseElapsed = elapsedInPhase - PHASE4_TO_GRENS_MS;
              const pulseWarmup = easeInOutCubic(Math.min(1, pulseElapsed / PULSE_WARMUP_MS));
              const pulseOsc = Math.sin(time * 0.0039) * 0.5 + 0.5;
              const pulseMix = pulseWarmup * pulseOsc;
              previewMat.color.lerpColors(
                new THREE.Color(CONFIG.previewWallColor),
                new THREE.Color(CONFIG.wallColor),
                pulseMix * 0.52
              );
              previewMat.emissive.lerpColors(
                new THREE.Color(CONFIG.previewWallEmissiveBase),
                new THREE.Color(CONFIG.wallColor),
                pulseMix * 0.72
              );
              previewMat.emissiveIntensity =
                THREE.MathUtils.lerp(0.36, 0.42, 1 - pulseWarmup) + pulseMix * pulseWarmup * 1.35;
            } else {
              previewMat.color.setHex(CONFIG.previewWallColor);
              previewMat.emissive.setHex(CONFIG.previewWallEmissiveBase);
              previewMat.emissiveIntensity = 0.38;
            }
          }

          if (wallActive) {
            previewMat.color.setHex(CONFIG.previewWallColor);
            previewMat.emissive.setHex(CONFIG.previewWallEmissiveBase);
            const wipe = easeInOutCubic(Math.min(1, rawDrawProgress * 6));
            previewMat.opacity = 0.78 * Math.max(fadeIn, 0.5) * (1 - wipe);
            previewMat.emissiveIntensity = 0.38 * (1 - wipe);
          } else {
            previewMat.opacity = 0.78 * Math.max(fadeIn, 0.5);
          }

          previewMesh.visible = previewMat.opacity > 0.015;
        } else if (ph === 5) {
          previewMat.opacity = 0;
          previewMesh.visible = false;
          previewMat.color.setHex(CONFIG.previewWallColor);
          previewMat.emissive.setHex(CONFIG.previewWallEmissiveBase);
          previewMat.emissiveIntensity = 0.38;
        } else {
          previewMesh.visible = false;
          previewMat.opacity = 0;
          previewMat.color.setHex(CONFIG.previewWallColor);
          previewMat.emissive.setHex(CONFIG.previewWallEmissiveBase);
          previewMat.emissiveIntensity = 0.38;
        }
      }

      if (ph >= 2) {
        const colorP = ph === 2 ? Math.min(elapsedInPhase / 2000, 1) : 1;
        westMeshesRef.current.forEach((m) =>
          m.material.color.lerpColors(
            new THREE.Color(CONFIG.mapColor),
            new THREE.Color(0x4a7eb3),
            colorP
          )
        );
        eastMeshesRef.current.forEach((m) =>
          m.material.color.lerpColors(
            new THREE.Color(CONFIG.mapColor),
            new THREE.Color(0x7d2b2b),
            colorP
          )
        );
      }

      const idealPos = new THREE.Vector3();
      const idealLookAt = LOOK_AT.clone();

      if (ph === 0) {
        const t = Math.min(elapsedInPhase / 1800, 1);
        const slow = time * 0.00025;
        const subtleOrbit = 35;
        const subtleZoom = Math.sin(slow * 0.7) * 25;
        tmpVecB.set(
          TOP_DOWN.x + Math.sin(slow) * subtleOrbit,
          TOP_DOWN.y + subtleZoom,
          TOP_DOWN.z + Math.cos(slow) * subtleOrbit
        );
        idealPos.lerpVectors(camSegmentStart, tmpVecB, easeInOutCubic(t));
      } else if (ph === 1) {
        const t = Math.min(elapsedInPhase / PHASE1_ZOOM_MS, 1);
        idealPos.lerpVectors(camSegmentStart, CAM_P1_END, easeInOutCubic(t));
      } else if (ph === 2) {
        const t = Math.min(elapsedInPhase / PHASE_NARRATIVE_CAM_MS, 1);
        idealPos.lerpVectors(camSegmentStart, CAM_P2_END, easeInOutCubic(t));
      } else if (ph === 3) {
        const t = Math.min(elapsedInPhase / PHASE_NARRATIVE_CAM_MS, 1);
        idealPos.lerpVectors(camSegmentStart, CAM_P3_END, easeInOutCubic(t));
      } else if (ph === 4) {
        if (elapsedInPhase < PHASE4_TO_GRENS_MS) {
          const t = Math.min(elapsedInPhase / PHASE4_TO_GRENS_MS, 1);
          idealPos.lerpVectors(camSegmentStart, CAM_GRENS, easeInOutCubic(t));
        } else if (!wallDrawingActive) {
          idealPos.copy(CAM_GRENS);
        } else {
          const orbitPos = wallOrbitCamera(drawProgress);
          const bridgeT = Math.min(drawElapsedFromKick / WALL_ORBIT_BRIDGE_MS, 1);
          idealPos.lerpVectors(CAM_GRENS, orbitPos, easeInOutCubic(bridgeT));
        }
      } else if (ph === 5) {
        const t = Math.min(elapsedInPhase / PHASE5_OUTRO_MS, 1);
        idealPos.lerpVectors(camSegmentStart, TOP_DOWN, easeInOutCubic(t));

        if (
          elapsedInPhase > PHASE5_OUTRO_MS - OUTRO_CALLBACK_MS_BEFORE_END &&
          !finalPhaseNotifiedRef.current
        ) {
          finalPhaseNotifiedRef.current = true;
          onFinalPhaseEndRef.current?.();
        }
      }

      const lerpFactorPos = ph === 4 && wallDrawingActive ? 0.05 : 0.035;
      const lerpFactorLook = 0.07; 
      
      cameraSmoothPos.lerp(idealPos, lerpFactorPos);
      cameraSmoothLookAt.lerp(idealLookAt, lerpFactorLook);

      camera.position.copy(cameraSmoothPos);
      camera.lookAt(cameraSmoothLookAt);

      const routeCurve = wallRouteCurveRef.current;
      const glow = scene.wallHeadGlow;
      if (glow && routeCurve) {
        if (ph === 4 && wallDrawingActive) {
          const t = Math.min(Math.max(drawProgress, 0), 1);
          const point = routeCurve.getPointAt(t);
          glow.position.copy(point);
          glow.position.y += 20;
          glow.intensity =
            rawDrawProgress > 0.8
              ? WALL_HEAD_POINT_INTENSITY * (1 - (rawDrawProgress - 0.8) / 0.2)
              : WALL_HEAD_POINT_INTENSITY;
        } else {
          glow.intensity = 0;
        }
      }

      updateParticles(ph === 3);
    }

    const animate = (time) => {
      requestRef.current = requestAnimationFrame(animate);
      update(time);
      renderer.render(scene, camera);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      wallRouteCurveRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  const narratives = [
    { title: 'Waarom een muur?', desc: '' },
    { title: 'Westen vs Oosten', desc: '' },
    { title: 'De braindrain', desc: 'Massale vlucht naar het Westen.' },
  ];

  const grenzenNarrative = {
    title: 'Grens dicht',
    desc: 'Oplossing DDR: Augustus 1961',
  };

  return (
    <div className="relative isolate w-full h-full min-h-0">
      <div ref={containerRef} className="absolute inset-0 z-0 min-h-0 overflow-hidden" />

      <AnimatePresence>
        {phase === 0 && (
          <>
            <motion.div
              key="center-berlijn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <div className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Berlijn
              </div>
            </motion.div>
            <motion.div
              key="intro-sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              className="absolute top-[10%] right-[6%] z-20 max-w-xl text-right pointer-events-none"
            >
              <p className="text-2xl font-semibold text-slate-100 leading-snug md:text-2xl">
                Berlijn: Gedeelde stad in het Oosten
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div
            key="ph1"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 14 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[15%] left-[8%] z-20 w-[42%] pointer-events-none"
          >
            <h1 className="text-7xl md:text-8xl font-black text-white uppercase leading-[0.85] tracking-tighter whitespace-pre-line">
              Waarom een{'\n'}muur?
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase >= 2 && phase <= 3 && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[15%] left-[8%] z-20 w-[40%] pointer-events-none"
          >
            <h1 className="text-7xl md:text-8xl font-black text-white uppercase leading-[0.85] tracking-tighter mb-6 whitespace-pre-line">
              {narratives[phase - 1].title.replace(' vs ', '\nvs\n')}
            </h1>
            {narratives[phase - 1].desc ? (
              <p className="text-2xl md:text-3xl text-slate-300 font-medium leading-relaxed max-w-xl">
                {narratives[phase - 1].desc}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 4 && p4NarrativeMode === 'grenzen' && (
          <motion.div
            key="p4-grenzen"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[15%] left-[8%] z-20 w-[40%] pointer-events-none"
          >
            <h1 className="text-7xl md:text-8xl font-black text-white uppercase leading-[0.85] tracking-tighter mb-6 whitespace-pre-line">
              {grenzenNarrative.title}
            </h1>
            {grenzenNarrative.desc ? (
              <p className="text-2xl md:text-3xl text-slate-300 font-medium leading-relaxed max-w-xl">
                {grenzenNarrative.desc}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 4 && p4NarrativeMode === 'wall' && (
          <motion.div
            key="p4-wall-hud"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-12 right-12 z-10 text-right pointer-events-none max-w-[min(90vw,32rem)]"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-5">
              De Berlijnse muur
            </h2>
            <motion.div
              animate={{ opacity: kmHudOpacity }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="text-6xl md:text-7xl font-black text-white leading-none tracking-tighter">
                {kmCounter.toFixed(2)}
              </div>
              <div className="text-red-500 font-bold tracking-[0.3em] mt-2">KILOMETER</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Labels
        cameraRef={cameraRef}
        containerRef={containerRef}
        phase={phase}
        p4NarrativeMode={p4NarrativeMode}
      />
    </div>
  );
}

function Labels({ cameraRef, containerRef, phase, p4NarrativeMode }) {
  const [labels, setLabels] = useState([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const cam = cameraRef.current;
      if (!cam) return;

      cam.updateMatrixWorld(true);

      const ph = phaseRef.current;
      const el = containerRef?.current;
      const bw = el?.clientWidth || window.innerWidth;
      const bh = el?.clientHeight || window.innerHeight;

      const labelSets = [
        { name: 'West-Berlijn', sub: '(BRD)', desc: 'Vrijheid en welvaart', pos: WEST_CENTER, id: 'west' },
        { name: 'Oost-Berlijn', sub: '(DDR)', desc: 'Armoede en controle', pos: EAST_CENTER, id: 'east' },
      ];

      const newLabels = labelSets.map((set) => {
        const vector = set.pos.clone().project(cam);
        let x = (vector.x * 0.5 + 0.5) * bw;
        let y = (vector.y * -0.5 + 0.5) * bh;
        let visible = true;
        if (
          !Number.isFinite(vector.x) ||
          !Number.isFinite(vector.y) ||
          !Number.isFinite(x) ||
          !Number.isFinite(y)
        ) {
          x = 0;
          y = 0;
          visible = false;
        }
        const dist = cam.position.distanceTo(set.pos);
        const isNear = visible && dist < 4500 && Number.isFinite(dist);

        return { ...set, x, y, opacity: isNear ? 1 : 0 };
      });
      setLabels(newLabels);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraRef, containerRef]);

  const phaseFade = phase === 0 || phase === 5 ? 0 : 1;
  const hideMapLabelsDuringWall = phase === 4 && p4NarrativeMode === 'wall';

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {labels.map((label) => (
        <motion.div
          key={label.id}
          className="absolute text-center uppercase"
          style={{
            left: label.x,
            top: label.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={false}
          animate={{
            opacity:
              label.opacity * phaseFade * (phase >= 1 && phase <= 4 ? 1 : 0) * (hideMapLabelsDuringWall ? 0 : 1),
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {phase === 1 || (phase >= 3 && phase <= 4) ? (
            <div>
              <div className="text-2xl font-black text-white tracking-widest">{label.name}</div>
              <div className="text-sm text-slate-400 font-bold tracking-widest mt-1">{label.sub}</div>
            </div>
          ) : phase === 2 ? (
            <div className="text-xl font-bold text-white/80 tracking-widest">{label.desc}</div>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
