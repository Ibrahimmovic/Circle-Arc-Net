"use client";

import { cn } from "@/lib/utils";
import { ARC_FEE_COPY } from "@/lib/token-visuals";
import { RecipientField } from "@/components/ui/recipient-field";

const SLIPPAGE_PRESETS = [
  { label: "0.5%", bps: 50 },
  { label: "1%", bps: 100 },
  { label: "1.5%", bps: 150 },
  { label: "3%", bps: 300 },
] as const;

export function ExchangeSettingsPanel({
  slippageBps,
  onSlippageChange,
  bridgeFast,
  onBridgeFastChange,
  recipient,
  onRecipientChange,
}: {
  slippageBps: number;
  onSlippageChange: (bps: number) => void;
  bridgeFast: boolean;
  onBridgeFastChange: (fast: boolean) => void;
  recipient: string;
  onRecipientChange: (value: string) => void;
}) {
  return (
    <div className="forge-settings-panel mt-3 space-y-4 rounded-2xl p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Slippage tolerance
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SLIPPAGE_PRESETS.map(({ label, bps }) => (
            <button
              key={bps}
              type="button"
              onClick={() => onSlippageChange(bps)}
              className={cn(
                "forge-chip rounded-lg px-3 py-1.5 text-xs",
                slippageBps === bps && "forge-chip--active",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          CCTP bridge speed
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onBridgeFastChange(false)}
            className={cn(
              "forge-chip rounded-lg px-3 py-1.5 text-xs",
              !bridgeFast && "forge-chip--active",
            )}
          >
            Standard · lower fee
          </button>
          <button
            type="button"
            onClick={() => onBridgeFastChange(true)}
            className={cn(
              "forge-chip rounded-lg px-3 py-1.5 text-xs",
              bridgeFast && "forge-chip--active",
            )}
          >
            Fast · quicker mint
          </button>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Recipient wallet
        </p>
        <p className="mt-1 text-[11px] text-white/50">
          Leave blank to receive on your connected wallet.
        </p>
        <div className="mt-2">
          <RecipientField value={recipient} onChange={onRecipientChange} />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-white/45">{ARC_FEE_COPY}</p>
    </div>
  );
}
