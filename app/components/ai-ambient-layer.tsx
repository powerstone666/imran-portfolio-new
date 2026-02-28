"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSafeWebGLRenderer } from "../lib/safe-webgl";

type AiAmbientLayerProps = {
  isActive?: boolean;
};

export default function AiAmbientLayer({ isActive = true }: AiAmbientLayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const mountNode = mountRef.current;
    if (!mountNode) return;

    const bounds = mountNode.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);

    const renderer = createSafeWebGLRenderer({ alpha: true, antialias: true });
    if (!renderer) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mountNode.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const particleCount = width < 900 ? 95 : 150;
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);

    for (let index = 0; index < particleCount; index += 1) {
      const i3 = index * 3;
      positions[i3] = Math.random() * 2 - 1;
      positions[i3 + 1] = Math.random() * 2 - 1;
      positions[i3 + 2] = 0;
      seeds[index] = Math.random() * Math.PI * 2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xe5e9f2,
      size: 0.01,
      transparent: true,
      opacity: 0.16,
      sizeAttenuation: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xdce2f1,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulse = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.38), pulseMaterial);
    pulse.position.y = -0.46;
    scene.add(pulse);

    let frameId = 0;
    let tick = 0;
    let lastRender = performance.now();
    const targetFrameDelta = 1000 / 30;

    const resize = () => {
      const nextBounds = mountNode.getBoundingClientRect();
      const nextWidth = Math.max(1, nextBounds.width);
      const nextHeight = Math.max(1, nextBounds.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(nextWidth, nextHeight);
    };

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
      tick += 0.01;

      const attribute = particleGeometry.getAttribute("position") as THREE.BufferAttribute;
      for (let index = 0; index < particleCount; index += 1) {
        const i3 = index * 3;
        let y = attribute.array[i3 + 1] as number;
        y -= 0.0008 + Math.sin(tick + seeds[index]) * 0.00028;
        if (y < -1) y = 1;
        attribute.array[i3 + 1] = y;
      }
      attribute.needsUpdate = true;

      pulseMaterial.opacity = 0.07 + Math.sin(tick * 1.35) * 0.02;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mountNode);
    window.addEventListener("resize", resize);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId);
      particleGeometry.dispose();
      particleMaterial.dispose();
      pulse.geometry.dispose();
      pulseMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, [isActive]);

  return <div ref={mountRef} className="ai-ambient-layer" aria-hidden="true" />;
}
