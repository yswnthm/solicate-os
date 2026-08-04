// Shared types for the AI-assisted Capture pipeline.

export type CaptureScope = "existing_project" | "new_project" | "projectless";

export interface CaptureInput {
  scope: CaptureScope;
  project_id: string | null;
  phase_id: string | null;
  person_id: string | null;
  /** Existing client to attach a new project to (new_project scope). */
  client_id: string | null;
  /** A brand-new client name when the new project has no client yet. */
  new_client_name: string | null;
  /** A new phase the operator expects to create. */
  new_phase_name: string | null;
  /** Update categories the operator explicitly requested (mandatory). */
  update_types: string[];
  text: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
  allow_other: boolean;
}

export type ClarificationAnswers = Record<string, string>;

/** Output of the capture-analyze template. */
export interface AnalyzeResult {
  title: string;
  confidence: number;
  understanding: string;
  clarifying_questions: ClarificationQuestion[];
}

export type CaptureSessionStatus =
  | "processing"
  | "awaiting_clarification"
  | "proposals_ready"
  | "approved"
  | "executed"
  | "discarded"
  | "error";

/** Serializable state handed back to the capture UI after each server action. */
export interface CaptureSessionState {
  sessionId: string;
  status: CaptureSessionStatus;
  title: string;
  understanding: string;
  confidence: number;
  questions: ClarificationQuestion[];
  actions: ActionProposal[];
  /** Update categories the operator required (mandatory). */
  requiredTypes: string[];
  /** Required categories with no proposed action. */
  missingTypes: string[];
  projectId: string | null;
  phaseId: string | null;
  personId: string | null;
  summary: string;
  errors: string[];
  error?: string;
}

/** One proposed operational update, reviewed before execution. */
export interface ActionProposal {
  id: string;
  kind: string;
  label: string;
  summary: string;
  project_id: string | null;
  phase_id: string | null;
  person_id: string | null;
  ref_id: string | null;
  payload: Record<string, unknown>;
}

/** The operator's decision on one action at approval time. */
export interface ActionDecision {
  actionId: string;
  approved: boolean;
  /** Optional edited payload, sent back when the operator edited a proposal. */
  payload?: Record<string, unknown>;
}
