import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { AMAZON_INTENTS } from "../config";
import { ClassificationResult } from "../types";

const ClassificationSchema = z.object({
  intent: z.enum(AMAZON_INTENTS),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0"),
  reasoning: z.string().describe("1 sentence explanation of why this intent was selected"),
});

export async function classifyTweet(tweetText: string): Promise<ClassificationResult> {
  try {
    const result = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: ClassificationSchema,
      prompt: `You are an expert customer support classifier for @AmazonHelp on Twitter.
Analyze the customer's incoming tweet and categorize it into exactly one defined intent.

Customer Tweet:
"""
${tweetText}
"""

Defined Intents:
- ORDER_TRACKING_DELIVERY: Inquiries about shipment location, courier delays, missing items marked delivered.
- RETURN_REFUND_REPLACEMENT: Damaged packages, wrong products, return pickups, refund timing.
- DIGITAL_PRIME_SERVICES: Prime Video error codes, Kindle downloads, Prime subscription charges.
- ACCOUNT_SECURITY_LOGIN: Password resets, unauthorized charges, 2FA/OTP issues, hacked accounts.
- PRODUCT_INQUIRY_STOCK: Specifications, availability, warranty, compatibility before/after buying.
- FEEDBACK_OR_CHITCHAT: Praise, general rants, driver shoutouts without a support request.

Assign an accurate confidence score and intent.`,
    });

    return result.object;
  } catch (error) {
    console.error("Classification error:", error);
    // Safe fallback
    return {
      intent: "FEEDBACK_OR_CHITCHAT",
      confidence: 0.3,
      reasoning: "Classification failed; defaulted to fallback intent.",
    };
  }
}