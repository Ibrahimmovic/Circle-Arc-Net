"use client";

import { formatUsd } from "@/lib/utils";
import type { NftCollectionGroup } from "@/lib/portfolio-wallet-types";
import { ImageIcon } from "lucide-react";

export function PortfolioNftCollections({
  collections,
  totalNftUsd,
}: {
  collections: NftCollectionGroup[];
  totalNftUsd: number;
}) {
  if (!collections.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        No NFT collections indexed yet. Zerion + GoldRush scan Base, Ethereum, and L2s.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {totalNftUsd > 0 && (
        <p className="text-sm text-slate-400">
          Collection value{" "}
          <span className="font-mono font-semibold text-cyan-200">
            {formatUsd(totalNftUsd)}
          </span>
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="pb-3">Collection</th>
              <th className="pb-3">Chain</th>
              <th className="pb-3 text-right">Items</th>
              <th className="pb-3 text-right">Floor</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr
                key={c.id}
                className="border-b border-slate-800/40 hover:bg-white/[0.03]"
              >
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-600">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-white">{c.name}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-400">{c.chain}</td>
                <td className="py-3 text-right font-mono text-slate-200">
                  {c.count}
                </td>
                <td className="py-3 text-right font-mono text-cyan-100">
                  {c.floorUsd != null && c.floorUsd > 0
                    ? formatUsd(c.floorUsd)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {collections.flatMap((c) =>
          c.items.slice(0, 2).map((n) => (
            <div
              key={n.id}
              className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50"
            >
              <div className="aspect-square bg-slate-950">
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
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-white">{n.name}</p>
                <p className="text-[10px] text-slate-500">{n.chain}</p>
              </div>
            </div>
          )),
        )}
      </div>
    </div>
  );
}
