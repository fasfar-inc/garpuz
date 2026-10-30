/** Pick a particle budget the device can animate at ~60 FPS; the runtime governor refines it. */

export interface DeviceProfile {
  particles: number;
  maxDpr: number;
  mobile: boolean;
}

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function rendererName(): string {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return name;
  } catch {
    return "";
  }
}

export function detectDeviceProfile(): DeviceProfile {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mobile =
    window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const renderer = rendererName();
  const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);

  let particles: number;
  if (software) particles = 12000;
  else if (mobile) particles = cores >= 8 && memory >= 6 ? 24000 : 15000;
  else particles = cores >= 8 ? 42000 : 30000;

  const override = Number(new URLSearchParams(window.location.search).get("particles"));
  if (Number.isFinite(override) && override >= 2000 && override <= 120000) particles = Math.round(override);

  return { particles, maxDpr: mobile ? 2 : 1.75, mobile };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
