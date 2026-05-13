import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { motion, AnimatePresence } from 'framer-motion';

const BG = 0x020202;

const STAGES = [
  {
    progress: 0.15,
    camPos: (pt) => new THREE.Vector3(pt.x - 35, 25, pt.z + 45),
    lookAt: (pt) => new THREE.Vector3(pt.x + 20, 5, 0),
  },
  {
    progress: 0.65,
    camPos: (pt) => new THREE.Vector3(pt.x - 35, 15, pt.z + 40),
    lookAt: (pt) => new THREE.Vector3(pt.x + 10, 8, 0),
  },
  {
    progress: 0.82,
    camPos: (pt) => new THREE.Vector3(pt.x - 20, 12, pt.z + 35),
    lookAt: (pt) => new THREE.Vector3(pt.x + 5, 10, 0),
  },
  {
    progress: 1.0,
    camPos: (pt) => new THREE.Vector3(pt.x - 10, 10, pt.z + 30),
    lookAt: (pt) => new THREE.Vector3(pt.x, 0, 0),
  },
  {
    progress: 1.0,
    camPos: () => new THREE.Vector3(0, 36, 112),
    lookAt: () => new THREE.Vector3(0, 4, 0),
  },
];

function smootherstep01(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function mapYearToOutput(year) {
  const knots = [
    [1960, 0.0],
    [1965, 4.2],
    [1969, 9.8],
    [1970, 11.4],
    [1975, 16.8],
    [1978, 12.2],
    [1980, 14.55],
    [1982.25, 13.85],
    [1984, 15.05],
    [1985, 14.05],
    [1986, 12.4],
    [1987, 9.5],
    [1989, 3.8],
    [1990, -1.9],
    [1991, -5.4],
  ];

  if (year <= knots[0][0]) return knots[0][1];
  const last = knots[knots.length - 1];
  if (year >= last[0]) return last[1];

  for (let i = 0; i < knots.length - 1; i++) {
    const [y0, v0] = knots[i];
    const [y1, v1] = knots[i + 1];
    if (year <= y1) {
      const u = (year - y0) / (y1 - y0);
      const e = smootherstep01(u);
      let v = v0 + (v1 - v0) * e;
      if (year < 1980 || year > 1985) {
        v += 0.22 * Math.sin(year * 1.15) + 0.08 * Math.sin(year * 2.4);
      }
      return v;
    }
  }
  return last[1];
}

function createTextLabel(text, x, y, z) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 256;
  context.fillStyle = 'rgba(0,0,0,0)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = 'bold 100px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(-1, -1);
  context.fillText(text, 0, 0);
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneGeometry(8, 4);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = Math.PI / 2;
  return mesh;
}

const easeNarrative = [0.22, 1, 0.36, 1];
const narrativeT = { duration: 1.85, ease: easeNarrative };

export default function UssrStagnation3D({ phase = 0 }) {
  const containerRef = useRef(null);
  const phaseRef = useRef(phase);

  const currentStageLerpRef = useRef(0);
  const startTimestampRef = useRef(null);
  const visualPhaseRef = useRef(-1);
  const [visualPhase, setVisualPhase] = useState(0);
  const yearNumberRef = useRef(null);

  useLayoutEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scene;
    let camera;
    let renderer;
    let composer;
    let graphTube;
    let glowPoint;
    let curve;
    let resizeObserver;
    let frameId;

    const curvePoints = [];
    for (let y = 1960; y <= 1991; y += 0.1) {
      const xPos = (y - 1975.5) * 4;
      const yPos = mapYearToOutput(y);
      const zPos =
        Math.sin((y - 1960) * 0.1) * 7.2 +
        (y < 1980 || y > 1985
          ? 1.1 * Math.sin((y - 1960) * 0.22)
          : 0.55 * Math.sin(((y - 1980) / 5) * Math.PI));
      curvePoints.push(new THREE.Vector3(xPos, yPos, zPos));
    }

    curve = new THREE.CatmullRomCurve3(curvePoints);

    const getSize = () => ({
      w: container.clientWidth || 1,
      h: container.clientHeight || 1,
    });

    scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.FogExp2(BG, 0.015);

    let { w, h } = getSize();
    camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    // Tight bloom: radius 0, only mips 0–1 (fine blurs); coarse mips off = rings/halo shrink to a small core.
    // (UnrealBloomPass constructor: resolution, strength, radius, threshold.)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.32, 0, 0.28);
    bloomPass.materialHighPassFilter.uniforms.smoothWidth.value = 0.003;
    bloomPass.compositeMaterial.uniforms.bloomFactors.value = [1, 0.28, 0, 0, 0];

    const outputPass = new OutputPass();

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    scene.add(new THREE.AmbientLight(0xffffff, 0.05));

    const gridGeo = new THREE.PlaneGeometry(300, 100, 60, 20);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -2;
    scene.add(grid);

    const tubeGeo = new THREE.TubeGeometry(curve, 500, 0.4, 16, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xd80000,
      emissive: 0xff0303,
      emissiveIntensity: 3.6,
      roughness: 0.35,
      metalness: 0.45,
      transparent: true,
    });

    tubeMat.onBeforeCompile = (shader) => {
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
      tubeMat.userData.shader = shader;
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

    graphTube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(graphTube);

    glowPoint = new THREE.PointLight(0xff0a0a, 1.6, 50);
    scene.add(glowPoint);

    const sphereGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffd0d0 });
    glowPoint.add(new THREE.Mesh(sphereGeo, sphereMat));

    [1960, 1965, 1970, 1975, 1980, 1985, 1991].forEach((year) => {
      const x = (year - 1975.5) * 4;
      const lineGeo = new THREE.BoxGeometry(0.2, 0.1, 40);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(x, -1.9, 0);
      scene.add(line);
      scene.add(createTextLabel(String(year), x, -1.85, 24));
    });

    const introPt = curve.getPointAt(Math.max(STAGES[0].progress, 0.001));
    camera.position.copy(STAGES[0].camPos(introPt));
    const currentLookAt = STAGES[0].lookAt(introPt).clone();
    camera.lookAt(currentLookAt);

    const onResize = () => {
      const sz = getSize();
      w = sz.w;
      h = sz.h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    const animate = (timestamp) => {
      frameId = requestAnimationFrame(animate);
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const elapsed = timestamp - startTimestampRef.current;

      const targetStage = Math.min(Math.max(phaseRef.current, 0), STAGES.length - 1);

      const settledAtIntro = targetStage === 0 && currentStageLerpRef.current < 0.015;
      let inFirstSegment = !settledAtIntro && currentStageLerpRef.current < 1;
      const STAGE_LERP_FIRST = 0.00715;
      const STAGE_LERP_REST = 0.022;
      const lerpFactor = inFirstSegment ? STAGE_LERP_FIRST : STAGE_LERP_REST;
      currentStageLerpRef.current = THREE.MathUtils.lerp(
        currentStageLerpRef.current,
        targetStage,
        lerpFactor
      );

      const settledAtIntroAfter = targetStage === 0 && currentStageLerpRef.current < 0.015;
      inFirstSegment = !settledAtIntroAfter && currentStageLerpRef.current < 1;
      const camLerp = inFirstSegment ? 0.0142 : 0.026;

      const narrativePhase = Math.floor(currentStageLerpRef.current + 0.5);
      if (narrativePhase !== visualPhaseRef.current) {
        visualPhaseRef.current = narrativePhase;
        setVisualPhase(narrativePhase);
      }

      const stageIndex = Math.floor(currentStageLerpRef.current);
      const nextStageIndex = Math.min(stageIndex + 1, STAGES.length - 1);
      const stageAlpha = currentStageLerpRef.current - stageIndex;

      const stageA = STAGES[stageIndex];
      const stageB = STAGES[nextStageIndex];

      const graphProgress = THREE.MathUtils.lerp(stageA.progress, stageB.progress, stageAlpha);
      const currentPt = curve.getPointAt(Math.max(graphProgress, 0.001));

      const posA = stageA.camPos(currentPt);
      const posB = stageB.camPos(currentPt);
      const lookA = stageA.lookAt(currentPt);
      const lookB = stageB.lookAt(currentPt);

      const targetPos = new THREE.Vector3().lerpVectors(posA, posB, stageAlpha);
      const lookAtPos = new THREE.Vector3().lerpVectors(lookA, lookB, stageAlpha);

      camera.position.lerp(targetPos, camLerp);
      currentLookAt.lerp(lookAtPos, camLerp);
      camera.lookAt(currentLookAt);

      const tubeClipProgress = graphProgress;
      const drawPt = curve.getPointAt(Math.max(tubeClipProgress, 0.001));

      if (drawPt) {
        glowPoint.position.copy(drawPt);

        const intensityPulse =
          targetStage >= 2 && targetStage < 4
            ? (Math.random() - 0.5) * 1.5
            : Math.sin(elapsed * 0.005) * 0.5;
        glowPoint.intensity = 1.35 + intensityPulse * 0.65;
      }

      if (graphTube.material.userData.shader) {
        graphTube.material.userData.shader.uniforms.progress.value = tubeClipProgress;
      }

      let hudYear = Math.round(drawPt.x / 4 + 1975.5);
      if (narrativePhase >= 4) hudYear = 1991;
      hudYear = Math.min(1991, Math.max(1960, hudYear));
      if (yearNumberRef.current) yearNumberRef.current.textContent = String(hudYear);

      composer.render();
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      if (renderer?.domElement?.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      composer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 min-h-0 bg-[#020202]">
      <div ref={containerRef} className="absolute inset-0 z-[1]" />

      <div
        className="pointer-events-none absolute inset-0 z-10 flex w-full items-start justify-start p-8 md:p-12 lg:p-16"
        aria-hidden
      >
        <div className="relative w-full max-w-[min(100%,76rem)]">
          <AnimatePresence mode="sync">
            {visualPhase === 0 && (
              <motion.div
                key="p0"
                className="absolute left-0 top-0 text-left text-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={narrativeT}
              >
                <h1 className="mb-6 text-5xl font-black uppercase leading-[0.9] tracking-tight text-white md:text-6xl">
                  De Ineenstorting
                </h1>
              </motion.div>
            )}
            {visualPhase === 1 && (
              <motion.div
                key="p1"
                className="absolute left-0 top-0 text-left text-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={narrativeT}
              >
                <h2 className="mb-4 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                  Jaren &apos;80
                </h2>
                <p className="mb-2 text-xl leading-snug text-slate-300 md:text-2xl">
                  Nieuwe wapenwedloop drijft de kosten op.
                </p>
                <p className="text-xl italic text-white md:text-2xl">&quot;Star Wars&quot; (Ronald Reagan).</p>
              </motion.div>
            )}
            {visualPhase === 2 && (
              <motion.div
                key="p2"
                className="absolute left-0 top-0 text-left text-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={narrativeT}
              >
                <h2 className="mb-4 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                  Stagnatie
                </h2>
                <p className="text-xl leading-snug text-slate-300 md:text-2xl">
                  De Sovjet-economie gaat failliet onder de onhoudbare druk.
                </p>
              </motion.div>
            )}
            {visualPhase === 3 && (
              <motion.div
                key="p3"
                className="absolute left-0 top-0 w-full max-w-none text-left text-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={narrativeT}
              >
                <span className="mb-2 block text-sm font-bold uppercase tracking-widest text-red-500">
                  Grote tekorten
                </span>
                <h2 className="mb-4 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                  Verval
                </h2>
                <p className="text-xl leading-snug text-slate-300 md:text-2xl">
                  Lege supermarktschappen, ontevreden burgers en hoop op verandering.
                </p>
              </motion.div>
            )}
            {visualPhase === 4 && (
              <motion.div
                key="p4"
                className="absolute left-0 top-0 text-left text-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={narrativeT}
              >
                <h2 className="mb-4 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                  USSR 1991
                </h2>
                <p className="text-xl leading-snug text-slate-300 md:text-2xl">Het einde van een tijdperk.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-10 right-10 z-10 text-right md:bottom-16 md:right-16">
        <div
          ref={yearNumberRef}
          className="text-6xl font-black tabular-nums leading-none tracking-tighter text-white md:text-7xl"
        >
          1980
        </div>
        <div className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-red-500">Jaartal</div>
      </div>
    </div>
  );
}
