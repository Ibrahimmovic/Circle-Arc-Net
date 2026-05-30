"use client";

import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import type { ExecutionJob } from "@/lib/execution/types";
import { runExecutionJob, runExecutionQueue } from "@/lib/execution/orchestrator";

const DEMO =
  process.env.NEXT_PUBLIC_DEMO_WALLET ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

export function useExecutionRunner() {
  const { address, isConnected } = useAccount();
  const [jobs, setJobs] = useState<ExecutionJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 40));
  };

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const watch = address ?? DEMO;
      const res = await fetch(`/api/execute/plan?address=${watch}`);
      const json = await res.json();
      if (res.ok && json.jobs) setJobs(json.jobs);
      else pushLog(json.error ?? "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [address]);

  const runOne = useCallback(
    async (job: ExecutionJob) => {
      if (!isConnected || !address) {
        pushLog("Connect wallet to execute.");
        return;
      }
      setRunning(true);
      try {
        const result = await runExecutionJob(job, {
          executorAddress: address,
          circleKitKey: process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY,
          stopOnError: true,
          onProgress: ({ message }) => pushLog(message),
        });
        setJobs((prev) => prev.map((j) => (j.id === result.id ? result : j)));
        pushLog(`Job ${result.title}: ${result.summary}`);
      } catch (e) {
        pushLog(e instanceof Error ? e.message : "Run failed");
      } finally {
        setRunning(false);
      }
    },
    [address, isConnected],
  );

  const runAll = useCallback(async () => {
    if (!isConnected || !address) {
      pushLog("Connect wallet to run queue.");
      return;
    }
    setRunning(true);
    try {
      const pending = jobs.filter((j) => j.status === "pending" || j.status === "failed");
      const results = await runExecutionQueue(pending, {
        executorAddress: address,
        circleKitKey: process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY,
        stopOnError: false,
        onProgress: ({ message }) => pushLog(message),
      });
      setJobs((prev) => {
        const map = new Map(results.map((r) => [r.id, r]));
        return prev.map((j) => map.get(j.id) ?? j);
      });
      pushLog(`Queue complete: ${results.length} job(s)`);
    } catch (e) {
      pushLog(e instanceof Error ? e.message : "Queue failed");
    } finally {
      setRunning(false);
    }
  }, [address, isConnected, jobs]);

  return {
    jobs,
    loading,
    running,
    log,
    loadQueue,
    runOne,
    runAll,
    setJobs,
  };
}
