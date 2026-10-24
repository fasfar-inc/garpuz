import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypeScript,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  {
    // React Three Fiber mutates scene objects (materials, uniforms, refs) inside
    // useFrame by design; the React Compiler immutability rule does not apply there.
    files: ["components/three/**"],
    rules: { "react-hooks/immutability": "off" },
  },
];

export default config;
