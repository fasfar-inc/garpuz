import { TRAVEL_SPAN } from "./morph";

/** Ashima Arts / Stefan Gustavson 3D simplex noise (MIT). */
const simplexNoise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const particleVertexShader = /* glsl */ `
#define PI 3.14159265359
#define TRAVEL_SPAN ${TRAVEL_SPAN.toFixed(4)}

uniform float uTime;
uniform float uProgress;
uniform float uVortex;
uniform float uSwirlPhase;
uniform float uToSwirl;
uniform float uNoiseAmp;
uniform float uNoiseScale;
uniform float uTurbulence;
uniform float uEnergy;
uniform float uBreath;
uniform float uPulse;
uniform float uPulseRadius;
uniform vec3 uPointer;
uniform float uPointerStrength;
uniform float uSize;
uniform float uScale;
uniform float uFocus;

attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec4 aRand;
attribute float aDelay;
attribute vec2 aTone;

varying float vAlpha;
varying float vCore;

${simplexNoise}

float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

vec2 rotate2(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

void main() {
  // ---- Deterministic transition path (mirrored on the CPU in morph.ts) ----
  float t = clamp((uProgress - aDelay) / TRAVEL_SPAN, 0.0, 1.0);
  float e = easeInOutCubic(t);

  vec3 to = aTo;
  if (uToSwirl > 0.0) {
    float a = uSwirlPhase * uToSwirl * (0.55 + 0.9 * aRand.z) / (0.6 + length(to.xz));
    to.xz = rotate2(to.xz, a);
  }
  vec3 p = mix(aFrom, to, e);

  float bump = sin(PI * t) * uVortex;
  if (bump > 0.0) {
    float len = length(p) + 1e-4;
    p += (p / len) * bump * (0.22 + 0.5 * aRand.y);
    float r = length(p.xz);
    p.xz = rotate2(p.xz, bump * (2.2 + 2.4 * aRand.z) / (0.35 + r));
    p.y += bump * (aRand.w - 0.5) * 0.9;
  }

  // ---- Continuous life: everything below is driven by smoothed uniforms ----
  float slow = uTime * 0.11;
  vec3 q = p * uNoiseScale;
  vec3 flow = vec3(
    snoise(q + vec3(0.0, slow, 0.0)),
    snoise(q + vec3(31.4, -slow, 7.1)),
    snoise(q + vec3(-12.7, 4.3, slow))
  );
  p += flow * (uNoiseAmp + uTurbulence * 0.3 + uEnergy * 0.05);

  float radius = length(p);
  p *= 1.0 + uBreath * sin(uTime * 1.25 - radius * 2.2);

  vec3 orbit = vec3(
    sin(uTime * (0.6 + aRand.x) + aRand.y * 6.2831),
    cos(uTime * (0.5 + aRand.z) + aRand.w * 6.2831),
    sin(uTime * (0.7 + aRand.w) + aRand.x * 6.2831)
  );
  p += orbit * 0.01 * (1.0 + uEnergy * 2.5);

  float ripple = uPulse * exp(-pow(radius - uPulseRadius, 2.0) * 9.0);
  p += (p / (radius + 1e-4)) * ripple * 0.22;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vec3 away = world.xyz - uPointer;
  float dist = length(away) + 1e-4;
  world.xyz += (away / dist) * uPointerStrength * smoothstep(0.85, 0.0, dist) * 0.3;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float sizeVariance = 0.5 + 1.25 * pow(aRand.y, 4.0);
  float depth = -mv.z;
  gl_PointSize = max(1.0, uSize * sizeVariance * uScale / depth * (1.0 + ripple * 1.5 + bump * 0.35));

  // Depth cue: particles behind the focal plane dim into the dark.
  float fog = clamp(1.0 - (depth - uFocus) * 0.32, 0.25, 1.15);
  float twinkle = 0.78 + 0.22 * sin(uTime * (1.3 + aRand.w * 2.7) + aRand.x * 40.0);
  float tone = mix(aTone.x, aTone.y, e);
  vAlpha = tone * fog * twinkle * (1.0 + bump * 0.45 + ripple * 1.5 + uEnergy * 0.15);
  vCore = clamp(tone - 1.0, 0.0, 1.0);
}
`;

export const particleFragmentShader = /* glsl */ `
uniform float uBrightness;
varying float vAlpha;
varying float vCore;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c) * 4.0;
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 10.0);
  float halo = exp(-r2 * 3.0) * 0.32;
  float a = (core + halo) * vAlpha * uBrightness;
  // Cool-white halo, pure-white core; highlights (eyes, lights) run hotter.
  vec3 color = mix(vec3(0.68, 0.78, 1.0), vec3(1.0), clamp(core * 1.4 + vCore, 0.0, 1.0));
  gl_FragColor = vec4(color * a, a);
}
`;

export const dustVertexShader = /* glsl */ `
uniform float uTime;
uniform float uScale;
uniform float uSize;
attribute vec4 aRand;
varying float vAlpha;

void main() {
  vec3 p = position;
  float a = uTime * (0.006 + aRand.x * 0.012);
  float c = cos(a);
  float s = sin(a);
  p.xz = vec2(p.x * c - p.z * s, p.x * s + p.z * c);
  p.y += sin(uTime * 0.07 + aRand.y * 6.2831) * 0.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, uSize * (0.6 + aRand.z) * uScale / -mv.z);
  vAlpha = (0.25 + 0.75 * aRand.w) * (0.6 + 0.4 * sin(uTime * (0.4 + aRand.z) + aRand.x * 30.0));
}
`;

export const dustFragmentShader = /* glsl */ `
uniform float uBrightness;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c) * 4.0;
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 5.0) * vAlpha * uBrightness;
  gl_FragColor = vec4(vec3(0.8, 0.86, 1.0) * a, a);
}
`;
