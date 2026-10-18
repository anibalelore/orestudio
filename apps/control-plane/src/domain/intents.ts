export type IntentKind =
  | "create_client" | "create_project" | "select_context" | "assign_work"
  | "show_progress" | "show_deliverables" | "answer_question" | "approve"
  | "request_changes" | "pause_project" | "pause_global" | "resume" | "attach_material" | "unknown";

export type Intent = { kind: IntentKind; text: string; fields: Record<string, string>; attachmentFileId?: string };
