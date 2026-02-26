"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeNoirBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const CAMERA_BASE_Y = 120;
    const RAIN_WORLD_TOP = 1200;
    const RAIN_WORLD_BOTTOM = -1200;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Slight fog to blend particles into the distance
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.0015);

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 3000);
    camera.position.z = 900;
    camera.position.y = CAMERA_BASE_Y;
    camera.lookAt(0, CAMERA_BASE_Y, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    // 2. Rain Particles
    const rainCount = 1500;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    const rainVelocities: { y: number }[] = [];

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 3000;
      rainPositions[i * 3 + 1] = Math.random() * (RAIN_WORLD_TOP - RAIN_WORLD_BOTTOM) + RAIN_WORLD_BOTTOM;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

      // Random downward velocity
      rainVelocities.push({
        y: -10 - Math.random() * 10,
      });
    }

    rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));

    // Simple white/cyan material for rain
    const rainMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 4.0, // increased size slightly to ensure visibility
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    // Store the system
    const rainSystem = new THREE.Points(rainGeometry, rainMaterial);
    
    // Crucial: ensure Three.js knows we intend to constantly update these positions
    (rainGeometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    
    scene.add(rainSystem);

    // 3. Ground Fog (Simple planes)
    const fogGroup = new THREE.Group();
    const fogGeo = new THREE.PlaneGeometry(2500, 500);
    
    // Create a very soft gradient material to simulate fog bands
    // We don't have a texture loader handy without an asset, so we'll 
    // rely on opacity blending of planes in the background
    const fogMat = new THREE.MeshBasicMaterial({
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
    // Replace deprecated Clock with modern Date/time fallback until Timer is properly typed
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = (performance.now() - startTime) / 1000;

      // Animate Rain
      const positions = rainGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        // Drop y based on individual velocity
        positions[i * 3 + 1] += rainVelocities[i].y;
        
        // Slight wind in x direction
        positions[i * 3] -= 2;

        // Reset if it falls below bottom of screen
        if (positions[i * 3 + 1] < RAIN_WORLD_BOTTOM) {
          positions[i * 3 + 1] = RAIN_WORLD_TOP + Math.random() * 300;
          positions[i * 3] = (Math.random() - 0.5) * 3000;
          // Randomize velocity on reset to break uniform patterns
          rainVelocities[i].y = -10 - Math.random() * 10;
        }
      }
      rainGeometry.attributes.position.needsUpdate = true;

      // Animate Fog gently swaying
      fogGroup.children.forEach((fog, idx) => {
          fog.position.x = Math.sin(time * 0.5 + idx) * 50;
      });

      // Camera Parallax
      camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 30 + CAMERA_BASE_Y - camera.position.y) * 0.05;
      camera.lookAt(0, CAMERA_BASE_Y, 0);

      renderer.render(scene, camera);
    };

    animate();

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
      fogGeo.dispose();
      fogMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden"
      aria-hidden="true"
    />
  );
}
