import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { createRng } from "../shapes/random";
import { dustFragmentShader, dustVertexShader } from "./shaders";

/** Faint, slow motes far behind the organism that give the void depth. */
export class DustField {
  readonly geometry = new BufferGeometry();
  readonly material: ShaderMaterial;

  constructor(count: number) {
    const rng = createRng(99);
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const r = 3.5 + rng() * 9;
      const a = rng() * Math.PI * 2;
      const y = (rng() * 2 - 1) * 0.8;
      const s = Math.sqrt(1 - y * y);
      positions[i * 3] = Math.cos(a) * s * r;
      positions[i * 3 + 1] = y * r * 0.7;
      // Keep dust behind the focal plane so nothing balloons in front of the camera.
      positions[i * 3 + 2] = -Math.abs(Math.sin(a) * s * r) - 1;
      for (let c = 0; c < 4; c++) rand[i * 4 + c] = rng();
    }
    this.geometry.setAttribute("position", new BufferAttribute(positions, 3));
    this.geometry.setAttribute("aRand", new BufferAttribute(rand, 4));
    this.material = new ShaderMaterial({
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uSize: { value: 0.035 }, uBrightness: { value: 0.35 } },
    });
  }

  update(time: number, scale: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uScale.value = scale;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
