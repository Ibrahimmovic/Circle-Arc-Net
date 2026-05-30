import { fetchLifiBridgeQuote } from "@/lib/execution/lifi-executor";
import { runCctpBridgeStep, runCircleSwapStep } from "@/lib/execution/circle-kit-executor";
import type { ExecutionJob, ExecutionStep } from "@/lib/execution/types";

export type RunProgress = {
  jobId: string;
  stepId: string;
  message: string;
  job: ExecutionJob;
};

export async function runExecutionJob(
  job: ExecutionJob,
  options: {
    executorAddress?: string;
    circleKitKey?: string;
    onProgress?: (p: RunProgress) => void;
    stopOnError?: boolean;
  },
): Promise<ExecutionJob> {
  const working: ExecutionJob = {
    ...job,
    status: "running",
    steps: job.steps.map((s) => ({ ...s })),
  };

  const emit = (stepId: string, message: string) => {
    options.onProgress?.({ jobId: job.id, stepId, message, job: working });
  };

  let failures = 0;
  let successes = 0;
  let skipped = 0;

  for (const step of working.steps) {
    if (step.status === "planned") {
      step.status = "skipped";
      step.detail = step.detail ?? "Planned rail — not auto-executed in v1.";
      skipped++;
      emit(step.id, `Skipped (planned): ${step.label}`);
      continue;
    }

    step.status = "running";
    emit(step.id, `Running: ${step.label}`);

    try {
      if (step.rail === "cctp_bridge") {
        const res = await runCctpBridgeStep(step, (msg) => emit(step.id, msg));
        step.status = "success";
        step.txHash = res.txHint;
        step.detail = res.state;
        successes++;
      } else if (step.rail === "circle_swap") {
        const res = await runCircleSwapStep(
          step,
          options.circleKitKey,
          (msg) => emit(step.id, msg),
        );
        step.status = "success";
        step.detail = res.state;
        successes++;
      } else if (step.rail === "external_bridge" && options.executorAddress) {
        const quote = await fetchLifiBridgeQuote({
          fromChain: step.fromChain ?? "Ethereum",
          toChain: step.toChain ?? "Base",
          fromAddress: options.executorAddress,
          amountUsd: step.amount,
        });
        step.status = "skipped";
        step.detail = quote.note;
        skipped++;
        emit(step.id, quote.note);
      } else if (step.rail === "intent_solver" || step.rail === "generic_calldata") {
        step.status = "skipped";
        step.detail = "Intent/calldata executor hooks reserved for agent v2.";
        skipped++;
      } else {
        step.status = "skipped";
        skipped++;
      }
    } catch (e) {
      step.status = "failed";
      step.error = e instanceof Error ? e.message : String(e);
      failures++;
      emit(step.id, `Failed: ${step.error}`);
      if (options.stopOnError) break;
    }
  }

  working.finishedAt = new Date().toISOString();
  if (failures > 0 && successes === 0) {
    working.status = "failed";
    working.summary = `${failures} failed · ${skipped} skipped`;
  } else if (failures > 0) {
    working.status = "partial";
    working.summary = `${successes} ok · ${failures} failed · ${skipped} skipped`;
  } else if (successes > 0) {
    working.status = "success";
    working.summary = `${successes} step(s) executed · ${skipped} skipped`;
  } else {
    working.status = "pending";
    working.summary = "No runnable steps — connect wallet or use CCTP routes.";
  }

  return working;
}

export async function runExecutionQueue(
  jobs: ExecutionJob[],
  options: Parameters<typeof runExecutionJob>[1],
): Promise<ExecutionJob[]> {
  const results: ExecutionJob[] = [];
  for (const job of jobs) {
    results.push(await runExecutionJob(job, options));
  }
  return results;
}
