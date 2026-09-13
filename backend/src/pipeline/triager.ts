import { BRAND_CONFIG, AmazonIntent } from "../config";
import { ClassificationResult, TriageDecision } from "../types";

export function evaluateTriage(
  tweetText: string,
  classification: ClassificationResult
): TriageDecision {
  const textLower = tweetText.toLowerCase();
  const triggeredRules: string[] = [];

  // Rule 1: Confidence Guardrail
  if (classification.confidence < BRAND_CONFIG.confidenceThreshold) {
    triggeredRules.push(`LOW_MODEL_CONFIDENCE (${classification.confidence.toFixed(2)} < ${BRAND_CONFIG.confidenceThreshold})`);
  }

  // Rule 2: Account Compromise or Unauthorized Transactions
  if (
    classification.intent === "ACCOUNT_SECURITY_LOGIN" ||
    textLower.includes("hacked") ||
    textLower.includes("stolen") ||
    textLower.includes("unauthorized charge")
  ) {
    triggeredRules.push("SECURITY_OR_UNAUTHORIZED_ACTIVITY");
  }

  // Rule 3: Explicit Order ID or Tracking Number Provided (Requires Private Tool Lookup)
  const orderIdPattern = /\b\d{3}-\d{7}-\d{7}\b/;
  if (orderIdPattern.test(tweetText)) {
    triggeredRules.push("SPECIFIC_ORDER_ID_DETECTED");
  }

  // Rule 4: Severe Customer Frustration / Legal Threat
  const escalationKeywords = [
    "lawyer", "attorney", "sue", "consumer court", "better business bureau",
    "police", "fraud", "scam", "worst service ever"
  ];
  if (escalationKeywords.some(k => textLower.includes(k))) {
    triggeredRules.push("HIGH_SEVERITY_OR_LEGAL_SENTIMENT");
  }

  // Rule 5: Damaged / Broken Items (Requires Returns Override or Safety Review)
  if (
    classification.intent === "RETURN_REFUND_REPLACEMENT" &&
    (textLower.includes("broken") || textLower.includes("shattered") || textLower.includes("injury"))
  ) {
    triggeredRules.push("SAFETY_OR_DAMAGED_GOODS_OVERRIDE");
  }

  // Decision
  if (triggeredRules.length > 0) {
    return {
      action: "ESCALATE",
      reason: `Escalated due to: ${triggeredRules.join(", ")}. Requires human agent verification.`,
      triggeredRules,
    };
  }

  return {
    action: "AUTO_HANDLE",
    reason: "Standard self-service inquiry with high confidence. Safe for automated response.",
    triggeredRules: [],
  };
}