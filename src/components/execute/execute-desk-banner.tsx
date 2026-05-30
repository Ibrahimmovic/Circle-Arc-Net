"use client";

import { motion } from "framer-motion";
import { ForgeRailsStrip } from "@/components/execute/forge-rails-strip";
import { figmaEaseOut } from "@/design/motion-presets";
import { GlassPanel, GlassBadge } from "@/components/ui/glass-ui";

const QUOTE_ENGINES = ["CCTP", "LI.FI", "Uniswap"] as const;

/** Compact execute-tab header — not the home hero layout. */
export function ExecuteDeskBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={figmaEaseOut}
    >
      <GlassPanel strong className="execute-desk-banner relative overflow-hidden px-4 py-3 sm:px-5">
        <div className="execute-desk-banner__scan" aria-hidden />

        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="execute-live-dot" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">
                Execution Desk
              </p>
              <GlassBadge className="!py-0.5 text-[10px]">Workbench</GlassBadge>
            </div>
            <p className="mt-1 text-sm text-white/60">
              Quote, compare, and run — swap panel below
            </p>
          </div>

          <div className="execute-engine-rail" aria-label="Live quote engines">
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

        <div className="relative z-10 mt-3 border-t border-white/8 pt-3">
          <ForgeRailsStrip />
        </div>
      </GlassPanel>
    </motion.div>
  );
}
