"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type EnvironmentCursorLayerProps = {
  isActive?: boolean;
};

function createSoftTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.34)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

export default function EnvironmentCursorLayer({ isActive = true }: EnvironmentCursorLayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mountNode = mountRef.current;
    if (!mountNode) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountNode.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const particleCount = window.innerWidth < 900 ? 180 : 280;
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      positions[i3] = Math.random() * 2.4 - 1.2;
      positions[i3 + 1] = Math.random() * 2.4 - 1.2;
      positions[i3 + 2] = 0;
      seeds[i] = Math.random() * Math.PI * 2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xdce5f0,
      size: 0.009,
      transparent: true,
      opacity: 0.19,
      sizeAttenuation: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const softTexture = createSoftTexture();
    const hazeMaterial = new THREE.MeshBasicMaterial({
      map: softTexture ?? undefined,
      color: 0xcad2dc,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), hazeMaterial);
    scene.add(haze);

    let frameId = 0;
    const target = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const onPointerLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    const onResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    let tick = 0;
    let lastRender = performance.now();
    const targetFrameDelta = 1000 / 30;
    const animate = (now: number) => {
      if (document.hidden) {
        frameId = window.requestAnimationFrame(animate);
        return;
      }
      if (now - lastRender < targetFrameDelta) {
        frameId = window.requestAnimationFrame(animate);
        return;
      }
      lastRender = now;

      tick += 0.008;
      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;

      camera.position.x = pointer.x * 0.03;
      camera.position.y = -pointer.y * 0.02;
      camera.lookAt(0, 0, 0);

      const attribute = particleGeometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        const drift = Math.sin(tick + seeds[i]) * 0.00055;
        let y = attribute.array[i3 + 1] as number;
        y -= 0.0011 + drift;
        if (y < -1.25) y = 1.25;
        attribute.array[i3 + 1] = y;
      }
      attribute.needsUpdate = true;

      haze.position.x = pointer.x * 0.02;
      haze.position.y = -pointer.y * 0.015;
      haze.rotation.z = pointer.x * 0.015;

      particleMaterial.opacity = 0.16 + Math.sin(tick * 1.25) * 0.03;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      particleGeometry.dispose();
      particleMaterial.dispose();
      haze.geometry.dispose();
      hazeMaterial.dispose();
      softTexture?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, [isActive]);

  return <div ref={mountRef} className="noir-layer-environment" aria-hidden="true" />;
}
