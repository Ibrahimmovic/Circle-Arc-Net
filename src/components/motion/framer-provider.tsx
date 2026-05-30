"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import { figmaTokenCssVars } from "@/design/figma-tokens";

export function FramerProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <div style={figmaTokenCssVars()} className="contents">
        {children}
      </div>
    </LazyMotion>
  );
}
