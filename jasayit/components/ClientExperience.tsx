"use client";

import dynamic from "next/dynamic";

// The whole experience depends on browser APIs (WebGL, matchMedia, device hints).
export const ClientExperience = dynamic(() => import("./Experience"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />,
});
