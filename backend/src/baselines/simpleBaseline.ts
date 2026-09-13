import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { AmazonIntent, AMAZON_INTENTS } from "../config";
import { AgentResponse } from "../types";

export class SimpleBaseline {
  public async processTicket(ticketId: string, customerTweet: string): Promise<AgentResponse> {
    // 1. Naive text generation prompt with no schema or grounding
    const prompt = `You are a customer support bot for Amazon.
Analyze this tweet: "${customerTweet}"

Return your answer in this exact format:
INTENT: [one of ORDER_TRACKING_DELIVERY, RETURN_REFUND_REPLACEMENT, DIGITAL_PRIME_SERVICES, ACCOUNT_SECURITY_LOGIN, PRODUCT_INQUIRY_STOCK, FEEDBACK_OR_CHITCHAT]
ACTION: [AUTO_HANDLE or ESCALATE]
REPLY: [Your reply to the customer]`;

    try {
      const response = await generateText({
        model: groq("openai/gpt-oss-120b"),
        prompt,
      });

      const text = response.text;
      
      // Fragile regex parsing (typical of naive implementations)
      const intentMatch = text.match(/INTENT:\s*([A-Z_]+)/);
      const actionMatch = text.match(/ACTION:\s*(AUTO_HANDLE|ESCALATE)/);
      const replyMatch = text.match(/REPLY:\s*([\s\S]+)/);

      const parsedIntent = (intentMatch ? intentMatch[1] : "ORDER_TRACKING_DELIVERY") as AmazonIntent;
      const validIntent = AMAZON_INTENTS.includes(parsedIntent) ? parsedIntent : "ORDER_TRACKING_DELIVERY";
      const action = actionMatch ? (actionMatch[1] as "AUTO_HANDLE" | "ESCALATE") : "AUTO_HANDLE";
      const draftReply = replyMatch ? replyMatch[1].trim() : "Thanks for reaching out to Amazon. Please visit amazon.com for help.";

      return {
        ticketId,
        customerTweet,
        classification: {
          intent: validIntent,
          confidence: 0.7,
          reasoning: "Simple baseline: unconstrained zero-shot generation.",
        },
        triage: {
          action,
          reason: "Simple baseline: zero-shot LLM determination.",
          triggeredRules: [],
        },
        draftReply,
        retrievedHistoricalExamples: [],
      };
    } catch {
      return {
        ticketId,
        customerTweet,
        classification: {
          intent: "ORDER_TRACKING_DELIVERY",
          confidence: 0.0,
          reasoning: "Fallback due to parsing error.",
        },
        triage: { action: "ESCALATE", reason: "Error", triggeredRules: [] },
        draftReply: "Please visit amazon.com/help.",
        retrievedHistoricalExamples: [],
      };
    }
  }
}