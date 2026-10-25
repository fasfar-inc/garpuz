"use client";

import { Component, type ReactNode } from "react";

let webglSupport: boolean | undefined;

/** Whether this browser can create a WebGL context at all. Probed once, then cached. */
export function supportsWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webglSupport = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

/**
 * Keeps a WebGL failure (lost context, blocked GPU, driver bug) from taking
 * the page down: the 3D layer disappears and the DOM layers carry on.
 */
export class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("FASFAR: 3D layer disabled —", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
