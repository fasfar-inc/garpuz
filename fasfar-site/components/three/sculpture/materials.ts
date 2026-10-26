import * as THREE from "three";
import type { PartMaterial } from "./parts";

/** Concentric "turned metal" streaks for the chrome roughness. */
function brushedTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < size; y++) {
    const v = 205 + Math.random() * 30 + Math.sin(y * 0.35) * 8;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 4, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/**
 * Glass without a transmission pass: the canvas is transparent so the DOM
 * typography shows through, and a Fresnel term keeps rims and reflections
 * bright while the faces stay clear. Much cheaper than real transmission.
 */
function fresnelGlass() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.4,
    specularIntensity: 1,
    transparent: true,
    opacity: 0.025,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `#include <opaque_fragment>
      float fasfarFres = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 2.6);
      float fasfarLum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor.a = saturate(opacity + fasfarFres * 0.8 + smoothstep(0.7, 1.8, fasfarLum) * 0.45);`,
    );
  };
  return mat;
}

export type SculptureMaterials = Record<PartMaterial, THREE.MeshPhysicalMaterial>;

export function createMaterials(): SculptureMaterials {
  const brushed = brushedTexture();
  return {
    chrome: new THREE.MeshPhysicalMaterial({
      color: "#e4e4e7",
      metalness: 1,
      roughness: 0.2,
      roughnessMap: brushed,
      clearcoat: 0.4,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.25,
      side: THREE.DoubleSide,
    }),
    glass: fresnelGlass(),
    pearl: new THREE.MeshPhysicalMaterial({
      color: "#e6e0d7",
      roughness: 0.3,
      metalness: 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.25,
      sheen: 1,
      sheenColor: new THREE.Color("#fff1dc"),
      sheenRoughness: 0.5,
      emissive: new THREE.Color("#ffb070"),
      emissiveIntensity: 0,
      envMapIntensity: 0.75,
    }),
  };
}

/** Soft radial sprite used for glows, stars and orbit nodes. */
export function radialTexture(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, inner.replace(/[\d.]+\)$/, "0.55)"));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
