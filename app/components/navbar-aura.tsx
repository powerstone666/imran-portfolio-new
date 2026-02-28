"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSafeWebGLRenderer } from "../lib/safe-webgl";

const AURA_MIN_DELAY_MS = 500;
const AURA_MAX_DELAY_MS = 1200;
const AURA_DECAY = 0.94;

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function toNdcX(px: number, width: number) {
  return (px / width) * 2 - 1;
}

function toNdcY(py: number, height: number) {
  return 1 - (py / height) * 2;
}

type NavbarAuraProps = {
  isActive?: boolean;
};

export default function NavbarAura({ isActive = true }: NavbarAuraProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
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



    const boltGroup = new THREE.Group();
    scene.add(boltGroup);

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let frameId = 0;
    let lastFrameTime = performance.now();
    let auraIntensity = 0;
    let nextAuraAt = performance.now() + randomInRange(AURA_MIN_DELAY_MS, AURA_MAX_DELAY_MS);
    let navbarElement = document.querySelector(".noir-navbar");

    const syncAuraStrength = (strength: number) => {
      if (!(navbarElement instanceof HTMLElement)) {
        navbarElement = document.querySelector(".noir-navbar");
      }
      if (navbarElement instanceof HTMLElement) {
        navbarElement.style.setProperty("--navbar-aura-strength", String(Math.max(0, Math.min(strength, 1))));
      }
    };

    const getNavbarRect = (): Rect => {
      const navbar = document.querySelector(".noir-navbar");
      if (!(navbar instanceof HTMLElement)) {
        return {
          left: viewportWidth * 0.2,
          right: viewportWidth * 0.8,
          top: 20,
          bottom: 88,
        };
      }

      const box = navbar.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      };
    };

    const clearBolts = () => {
      boltGroup.children.forEach((child) => {
        const line = child as THREE.Line;
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      boltGroup.clear();
    };

    const spawnArc = (startX: number, startY: number, endX: number, endY: number, opacity: number) => {
      const points: THREE.Vector3[] = [];
      const segments = 7;
      for (let index = 0; index <= segments; index += 1) {
        const t = index / segments;
        const x = THREE.MathUtils.lerp(startX, endX, t) + randomInRange(-0.016, 0.016);
        const y = THREE.MathUtils.lerp(startY, endY, t) + randomInRange(-0.02, 0.02);
        points.push(new THREE.Vector3(x, y, 0.2));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xd0d8ff,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        linewidth: 2,
      });
      boltGroup.add(new THREE.Line(geometry, material));
    };

    const triggerAura = () => {
      clearBolts();
      const rect = getNavbarRect();
      const padding = 14;

      const left = toNdcX(rect.left - padding, viewportWidth);
      const right = toNdcX(rect.right + padding, viewportWidth);
      const top = toNdcY(rect.top - padding, viewportHeight);
      const bottom = toNdcY(rect.bottom + padding, viewportHeight);

      const side = Math.floor(randomInRange(0, 4));
      if (side === 0) {
        spawnArc(left, top, right, top, 0.65);
      } else if (side === 1) {
        spawnArc(right, top, right, bottom, 0.65);
      } else if (side === 2) {
        spawnArc(left, bottom, right, bottom, 0.65);
      } else {
        spawnArc(left, top, left, bottom, 0.65);
      }

      if (Math.random() > 0.35) {
        spawnArc(left, top, right, bottom, 0.42);
      }

      auraIntensity = randomInRange(0.45, 0.85);
      nextAuraAt = performance.now() + randomInRange(AURA_MIN_DELAY_MS, AURA_MAX_DELAY_MS);
    };

    const onResize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(viewportWidth, viewportHeight);
    };

    const animate = (time: number) => {
      const delta = time - lastFrameTime;
      lastFrameTime = time;

      if (time >= nextAuraAt) {
        triggerAura();
      }

      auraIntensity *= Math.pow(AURA_DECAY, Math.max(1, delta / 16.6));
      syncAuraStrength(auraIntensity);


      boltGroup.children.forEach((child, index) => {
        const material = (child as THREE.Line).material as THREE.LineBasicMaterial;
        material.opacity = auraIntensity * (index === 0 ? 0.9 : 0.6);
      });

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", onResize);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      clearBolts();
      renderer.dispose();
      if (navbarElement instanceof HTMLElement) {
        navbarElement.style.setProperty("--navbar-aura-strength", "0");
      }
      if (renderer.domElement.parentElement === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, [isActive]);

  return <div ref={mountRef} className="noir-navbar-aura" aria-hidden="true" />;
}
