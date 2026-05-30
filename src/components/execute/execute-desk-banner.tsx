"use client";

import { motion } from "framer-motion";
import { ForgeCrossChainVisual } from "@/components/ui/forge-cross-chain-visual";
import { figmaEaseOut } from "@/design/motion-presets";
import { GlassBadge, GlassPanel } from "@/components/ui/glass-ui";

const QUOTE_ENGINES = ["CCTP", "LI.FI", "Uniswap"] as const;

/** Slim execute-tab header — home glass colors, desk-only motion, no hero copy block. */
export function ExecuteDeskBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={figmaEaseOut}
    >
      <GlassPanel strong className="execute-desk-banner relative overflow-hidden px-4 py-3 sm:px-5">
        <div className="execute-desk-banner__scan" aria-hidden />
        <div className="execute-desk-banner__glow execute-desk-banner__glow--violet" aria-hidden />
        <div className="execute-desk-banner__glow execute-desk-banner__glow--coral" aria-hidden />

        <div className="relative z-10 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="execute-live-dot" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">
                Execution Desk
              </p>
              <GlassBadge className="!py-0.5 text-[10px]">Workbench</GlassBadge>
            </div>
            <p className="mt-0.5 text-sm text-white/55">
              Quote · compare · run — swap panel below
            </p>

            <div className="execute-engine-rail mt-2.5" aria-label="Live quote engines">
              {QUOTE_ENGINES.map((engine, i) => (
                <motion.span
                  key={engine}
                  className="execute-engine-rail__chip"
                  animate={{
                    borderColor: [
                      "rgba(255,255,255,0.12)",
                      "rgba(34,211,238,0.55)",
                      "rgba(255,255,255,0.12)",
                    ],
                    color: [
                      "rgba(255,255,255,0.5)",
                      "rgba(165,243,252,1)",
                      "rgba(255,255,255,0.5)",
                    ],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: i * 0.55,
                    ease: "easeInOut",
                  }}
                >
                  {engine}
                </motion.span>
              ))}
              <motion.span
                className="execute-engine-rail__beam"
                animate={{ left: ["0%", "100%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                aria-hidden
              />
            </div>
          </div>

          <div className="execute-desk-banner__orbit hidden shrink-0 sm:block">
            <ForgeCrossChainVisual />
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
