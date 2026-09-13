import { AmazonIntent } from "../config";
import { AgentResponse } from "../types";

export class TrivialBaseline {
  // Majority class in Twitter support is delivery/tracking issues
  private majorityIntent: AmazonIntent = "ORDER_TRACKING_DELIVERY";

  public async processTicket(ticketId: string, customerTweet: string): Promise<AgentResponse> {
    return {
      ticketId,
      customerTweet,
      classification: {
        intent: this.majorityIntent,
        confidence: 0.5,
        reasoning: "Trivial baseline: predicts majority class for all inputs.",
      },
      triage: {
        action: "AUTO_HANDLE",
        reason: "Trivial baseline: auto-handles all tickets.",
        triggeredRules: [],
      },
      draftReply: "Hello, thanks for reaching out to Amazon Support! Please check your order status on amazon.com/help or contact us via our website for assistance.",
      retrievedHistoricalExamples: [],
    };
  }
}