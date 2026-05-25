"use client";

import { formatUsd } from "@/lib/utils";
import type { PortfolioNft } from "@/lib/portfolio-wallet-types";
import { ImageIcon } from "lucide-react";

export function PortfolioNftGrid({ nfts }: { nfts: PortfolioNft[] }) {
  if (!nfts.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        No NFTs on this network — collections appear when Zerion indexes them.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {nfts.map((n) => (
        <div
          key={n.id}
          className="group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 transition hover:border-violet-500/30"
        >
          <div className="relative aspect-square bg-slate-950">
            {n.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.imageUrl}
                alt={n.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-600">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-semibold text-white">{n.name}</p>
            {n.collection && (
              <p className="truncate text-[10px] text-slate-500">{n.collection}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">{n.chain}</span>
              {n.floorUsd != null && n.floorUsd > 0 && (
                <span className="font-mono text-cyan-300/90">
                  {formatUsd(n.floorUsd)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
