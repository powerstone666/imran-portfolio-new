import * as THREE from "three";

function hasWebGLSupport() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  const context =
    canvas.getContext("webgl2") ??
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl");

  return Boolean(context);
}

export function createSafeWebGLRenderer(parameters?: THREE.WebGLRendererParameters) {
  if (!hasWebGLSupport()) {
    return null;
  }

  try {
    return new THREE.WebGLRenderer(parameters);
  } catch {
    return null;
  }
}
