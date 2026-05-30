"use client";

import type { ExecutionPipelineStep } from "@/lib/execution/execution-intent-ui";
import { cn } from "@/lib/utils";

export function ForgeExecutionPipeline({ steps }: { steps: ExecutionPipelineStep[] }) {
  return (
    <ol className="forge-pipeline space-y-0">
      {steps.map((step, i) => (
        <li key={step.id} className="forge-pipeline__step flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "forge-pipeline__dot flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                i === 0 && "forge-pipeline__dot--active",
              )}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span className="forge-pipeline__connector my-1 w-px flex-1 min-h-[1.25rem]" />
            )}
          </div>
          <div className="pb-4 pt-0.5">
            <p className="text-sm font-semibold text-white">{step.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
