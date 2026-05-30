"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Layers, Zap } from "lucide-react";
import { PremiumIcon } from "./premium-icon";

export function ForgeCrossChainVisual() {
  return (
    <div className="forge-exec-visual hidden shrink-0 lg:block">
      <div className="forge-exec-visual__orbit">
        <motion.div
          className="forge-exec-visual__ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="forge-exec-visual__ring forge-exec-visual__ring--inner"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="forge-exec-visual__core">
          <PremiumIcon icon={Zap} variant="cyan" size="lg" pulse />
        </div>
        <motion.div
          className="forge-exec-visual__satellite forge-exec-visual__satellite--swap"
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        >
          <span className="forge-exec-visual__chip">
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </span>
        </motion.div>
        <motion.div
          className="forge-exec-visual__satellite forge-exec-visual__satellite--bridge"
          animate={{ rotate: -360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          <span className="forge-exec-visual__chip">
            <Layers className="h-3.5 w-3.5" />
          </span>
        </motion.div>
      </div>
    </div>
  );
}
