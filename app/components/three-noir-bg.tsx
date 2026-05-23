"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSafeWebGLRenderer } from "../lib/safe-webgl";
import { performanceMonitor } from "../lib/performance-monitor";

type PerformanceTier = "slow" | "fast" | "blazing";

type ThreeNoirBgProps = {
  jitTier?: PerformanceTier;
};

export default function ThreeNoirBg({ jitTier = "fast" }: ThreeNoirBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const CAMERA_BASE_Y = 120;
    const RAIN_WORLD_TOP = 1200;
    const RAIN_WORLD_BOTTOM = -1200;

    const isLow = jitTier === "slow";
    const isMid = jitTier === "fast";
    const isHigh = jitTier === "blazing";

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();

    // Slight fog to blend particles into the distance
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.0015);

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 3000);
    camera.position.z = 900;
    camera.position.y = CAMERA_BASE_Y;
    camera.lookAt(0, CAMERA_BASE_Y, 0);

    const renderer = createSafeWebGLRenderer({ alpha: true, antialias: isHigh });
    if (!renderer) {
      return;
    }
    renderer.setPixelRatio(performanceMonitor.getPixelRatio());
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // Append to container
    container.appendChild(renderer.domElement);

    const applyViewportSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    applyViewportSize();

    // 2. Rain Particles (Tiered counts)
    const rainCount = isHigh ? 1500 : isMid ? 400 : 100;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    const rainVelocities: { y: number }[] = [];

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 3000;
      rainPositions[i * 3 + 1] = Math.random() * (RAIN_WORLD_TOP - RAIN_WORLD_BOTTOM) + RAIN_WORLD_BOTTOM;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

      // Random downward velocity (slower)
      rainVelocities.push({
        y: -5 - Math.random() * 6,
      });
    }

    rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));

    // Simple white/cyan material for rain
    const rainMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: isHigh ? 4.0 : 3.0,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    // Store the system
    const rainSystem = new THREE.Points(rainGeometry, rainMaterial);

    // Crucial: ensure Three.js knows we intend to constantly update these positions
    (rainGeometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);

    scene.add(rainSystem);

    // 3. Ground Fog (Simple planes) — only on high-end
    let fogGroup: THREE.Group | null = null;
    let fogGeo: THREE.PlaneGeometry | null = null;
    let fogMat: THREE.MeshBasicMaterial | null = null;

    if (isHigh) {
      fogGroup = new THREE.Group();
      fogGeo = new THREE.PlaneGeometry(2500, 500);

      // Create a very soft gradient material to simulate fog bands
      // We don't have a texture loader handy without an asset, so we'll
      // rely on opacity blending of planes in the background
      fogMat = new THREE.MeshBasicMaterial({
        color: 0xc8d2ff,
        transparent: true,
        opacity: 0.03,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      for (let i = 0; i < 5; i++) {
        const fogMesh = new THREE.Mesh(fogGeo, fogMat);
        fogMesh.position.y = -300 + Math.random() * 100;
        fogMesh.position.z = Math.random() * 400 - 200;
        // Random slight rotation
        fogMesh.rotation.z = (Math.random() - 0.5) * 0.1;
        fogGroup.add(fogMesh);
      }
      scene.add(fogGroup);
    }

    // 4. Mouse interaction (Parallax)
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const localX = (event.clientX - rect.left) / Math.max(1, rect.width);
      const localY = (event.clientY - rect.top) / Math.max(1, rect.height);
      mouseX = localX * 2 - 1;
      mouseY = -(localY * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove);

    // 5. Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    // Frame throttling for mid/low devices
    const targetFrameInterval = isHigh ? 16.67 : isMid ? 33.33 : 66.67;
    let lastFrameTime = 0;

    const animate = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // Frame throttling
      if (timestamp - lastFrameTime < targetFrameInterval) {
        return;
      }
      lastFrameTime = timestamp;

      const time = (performance.now() - startTime) / 1000;

      // Animate Rain
      const positions = rainGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
      // Drop y based on individual velocity (slower rain)
      positions[i * 3 + 1] += rainVelocities[i].y * 0.5;

      // Slight wind in x direction (slower wind)
      positions[i * 3] -= 0.8;

        // Reset if it falls below bottom of screen
        if (positions[i * 3 + 1] < RAIN_WORLD_BOTTOM) {
          positions[i * 3 + 1] = RAIN_WORLD_TOP + Math.random() * 300;
          positions[i * 3] = (Math.random() - 0.5) * 3000;
          // Randomize velocity on reset to break uniform patterns (slower)
          rainVelocities[i].y = -5 - Math.random() * 6;
        }
      }
      rainGeometry.attributes.position.needsUpdate = true;

      // Animate Fog gently swaying (only on high-end)
      if (fogGroup && isHigh) {
        fogGroup.children.forEach((fog, idx) => {
          fog.position.x = Math.sin(time * 0.5 + idx) * 50;
        });
      }

      // Camera Parallax (reduce intensity on mid/low)
      const parallaxMultiplier = isHigh ? 1 : isMid ? 0.5 : 0.2;
      camera.position.x += (mouseX * 50 * parallaxMultiplier - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 30 * parallaxMultiplier + CAMERA_BASE_Y - camera.position.y) * 0.05;
      camera.lookAt(0, CAMERA_BASE_Y, 0);

      renderer.render(scene, camera);
    };

    animate(0);

    // 6. Handle Resize (window + container content changes)
    const onResize = () => applyViewportSize();
    const resizeObserver = new ResizeObserver(() => applyViewportSize());
    resizeObserver.observe(container);
    window.addEventListener("resize", onResize);

    // 7. Cleanup
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      rainGeometry.dispose();
      rainMaterial.dispose();
      fogGeo?.dispose();
      fogMat?.dispose();
      renderer.dispose();
    };
  }, [jitTier]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden"
      aria-hidden="true"
    />
  );
}
