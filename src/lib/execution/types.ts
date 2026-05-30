import type { ExecutionRailId } from "@/lib/cross-chain-execution";

export type StepStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped"
  | "planned";

export interface ExecutionStep {
  id: string;
  rail: ExecutionRailId;
  label: string;
  status: StepStatus;
  fromChain?: string;
  toChain?: string;
  token: string;
  toToken?: string;
  amount: string;
  txHash?: string;
  error?: string;
  detail?: string;
}

export type JobStatus =
  | "pending"
  | "running"
  | "success"
  | "partial"
  | "failed";

export interface ExecutionJob {
  id: string;
  title: string;
  kind: ExecutionRailId;
  status: JobStatus;
  steps: ExecutionStep[];
  createdAt: string;
  finishedAt?: string;
  summary?: string;
}

export interface ExecutionRunResult {
  job: ExecutionJob;
  ok: boolean;
}
