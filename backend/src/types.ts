import { AmazonIntent } from "./config";

export interface ClassificationResult {
  intent: AmazonIntent;
  confidence: number;
  reasoning: string;
}

export interface HistoricalExample {
  id: string;
  customer_tweet: string;
  agent_reply: string;
}

export interface TriageDecision {
  action: "AUTO_HANDLE" | "ESCALATE";
  reason: string;
  triggeredRules: string[];
}

export interface AgentResponse {
  ticketId: string;
  customerTweet: string;
  classification: ClassificationResult;
  triage: TriageDecision;
  draftReply: string;
  retrievedHistoricalExamples: HistoricalExample[];
}