"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSafeWebGLRenderer } from "../lib/safe-webgl";

const LIGHTNING_MIN_DELAY_MS = 2200;
const LIGHTNING_MAX_DELAY_MS = 5600;
const FLASH_DECAY = 0.93;

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type LightningLayerProps = {
  isActive?: boolean;
  isLowEnd?: boolean;
};

export default function LightningLayer({ isActive = true, isLowEnd = false }: LightningLayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || isLowEnd) {
      return;
    }

    const mountNode = mountRef.current;
    if (!mountNode) {
      return;
    }

    const renderer = createSafeWebGLRenderer({ alpha: true, antialias: true });
    if (!renderer) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountNode.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const flashPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flashMaterial);
    scene.add(flashPlane);

    const boltGroup = new THREE.Group();
    scene.add(boltGroup);

    let frameId = 0;
    let flashIntensity = 0;
    let lastFrameTime = performance.now();
    let nextLightningAt = performance.now() + randomInRange(LIGHTNING_MIN_DELAY_MS, LIGHTNING_MAX_DELAY_MS);

    const disposeGroup = () => {
      boltGroup.children.forEach((child) => {
        const line = child as THREE.Line;
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      boltGroup.clear();
    };

    const spawnBolt = (originX: number, baseOpacity: number, thickness: number) => {
      const segments = 11;
      const points: THREE.Vector3[] = [];
      let driftX = originX;

      for (let index = 0; index <= segments; index += 1) {
        const y = 1 - (index / segments) * 2;
        driftX += randomInRange(-0.08, 0.08);
        points.push(new THREE.Vector3(THREE.MathUtils.clamp(driftX, -0.95, 0.95), y, 0.2));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xe8ecff,
        transparent: true,
        opacity: baseOpacity,
        blending: THREE.AdditiveBlending,
        linewidth: thickness,
      });

      const line = new THREE.Line(geometry, material);
      boltGroup.add(line);
    };

    const triggerLightning = () => {
      disposeGroup();

      const originX = randomInRange(-0.75, 0.75);
      spawnBolt(originX, 0.9, 1.5);

      if (Math.random() > 0.45) {
        spawnBolt(originX + randomInRange(-0.12, 0.12), 0.5, 1);
      }

      flashIntensity = randomInRange(0.55, 0.95);
      nextLightningAt = performance.now() + randomInRange(LIGHTNING_MIN_DELAY_MS, LIGHTNING_MAX_DELAY_MS);
    };

    const onResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = (time: number) => {
      const delta = time - lastFrameTime;
      lastFrameTime = time;

      if (time >= nextLightningAt) {
        triggerLightning();
      }

      flashIntensity *= Math.pow(FLASH_DECAY, Math.max(1, delta / 16.6));
      flashMaterial.opacity = flashIntensity * 0.42;

      boltGroup.children.forEach((child, index) => {
        const line = child as THREE.Line;
        const material = line.material as THREE.LineBasicMaterial;
        material.opacity = flashIntensity * (index === 0 ? 1 : 0.65);
      });

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", onResize);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      disposeGroup();
      flashPlane.geometry.dispose();
      flashMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, [isActive, isLowEnd]);

  return <div ref={mountRef} className="noir-layer-lightning" aria-hidden="true" />;
}
