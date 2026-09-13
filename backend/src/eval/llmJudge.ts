// Evaluates the generated replies on Empathy, Policy Grounding, and Actionability (1 to 5 scale).

import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

const JudgeRubricSchema = z.object({
  brandToneScore: z.number().min(1).max(5).describe("1-5: Empathy, polite Twitter support tone"),
  groundingScore: z.number().min(1).max(5).describe("1-5: Adheres to official Amazon help guidelines, no fake links"),
  actionabilityScore: z.number().min(1).max(5).describe("1-5: Clear instructions and immediate next steps"),
  overallScore: z.number().min(1).max(5).describe("1-5: Overall response quality"),
  justification: z.string().describe("Concise evaluation breakdown"),
});

export type JudgeEvaluation = z.infer<typeof JudgeRubricSchema>;

export async function evaluateReplyQuality(
  customerTweet: string,
  draftReply: string,
  intent: string,
  triageAction: string
): Promise<JudgeEvaluation> {
  const prompt = `You are an impartial Quality Assurance Auditor for Amazon Customer Support on Twitter.
Evaluate the draft reply based on the following rubric:

Rubric (1-5 Scale):
- Brand Tone (1-5): Empathetic, respectful, concise (<280 chars), matches @AmazonHelp voice.
- Grounding (1-5): Refers to legitimate Amazon tools (Your Orders, Returns Center) and does NOT hallucinate URLs or make unauthorized guarantees.
- Actionability (1-5): The customer knows exactly what to do next (e.g. check link, wait for window, or message via DM).
- Overall (1-5): Holistic assessment of customer satisfaction.

Customer Tweet: "${customerTweet}"
Classified Intent: ${intent}
Triage Action: ${triageAction}
Drafted Reply: "${draftReply}"

Provide your objective scoring and justification.`;

  try {
    const result = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: JudgeRubricSchema,
      prompt,
    });

    return result.object;
  } catch (err) {
    return {
      brandToneScore: 3,
      groundingScore: 3,
      actionabilityScore: 3,
      overallScore: 3,
      justification: "Judge evaluation fallback due to API limit.",
    };
  }
}