import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { BRAND_CONFIG } from "../config";
import { ClassificationResult, HistoricalExample, TriageDecision } from "../types";

export async function generateGroundedReply(
  tweetText: string,
  classification: ClassificationResult,
  triage: TriageDecision,
  historicalExamples: HistoricalExample[]
): Promise<string> {
  const fewShotPrompt = historicalExamples
    .map(
      (ex, i) => `Example ${i + 1}:
Customer: "${ex.customer_tweet}"
AmazonHelp: "${ex.agent_reply}"`
    )
    .join("\n\n");

  const triageInstruction =
    triage.action === "ESCALATE"
      ? "This issue is ESCALATED. Acknowledge the issue empathetically, do NOT ask for sensitive personal details in public, and direct them to connect via Twitter DM or secure help link so an agent can access their account."
      : "This issue is AUTO-HANDLED. Provide immediate self-service guidance, clear instructions, and standard help links.";

  const systemPrompt = `You are @AmazonHelp, Amazon's official customer support on Twitter.
Tone Guidelines:
- Empathetic, concise, clear, and professional.
- Max length: STRICTLY under ${BRAND_CONFIG.maxTweetLength} characters (fits in a single Tweet).
- Never fabricate fake URLs. Use standard references like amazon.com/help or amzn.to/orders.
- Ground your response in the historical examples provided.

${triageInstruction}

Historical Examples of how @AmazonHelp responded to similar issues:
${fewShotPrompt}`;

  const response = await generateText({
    model: groq("openai/gpt-oss-120b"),
    system: systemPrompt,
    prompt: `Customer Tweet: "${tweetText}"
Classified Intent: ${classification.intent}
Draft the official @AmazonHelp response:`,
  });

  return response.text.trim();
}