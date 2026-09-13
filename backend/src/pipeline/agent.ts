import { AgentResponse } from "../types";
import { classifyTweet } from "./classifier";
import { HistoricalRetriever } from "./retriever";
import { evaluateTriage } from "./triager";
import { generateGroundedReply } from "./generator";

export class AmazonSupportAgent {
  private retriever: HistoricalRetriever;

  constructor() {
    this.retriever = new HistoricalRetriever();
  }

  public async processTicket(ticketId: string, customerTweet: string): Promise<AgentResponse> {
    // 1. Classify
    const classification = await classifyTweet(customerTweet);

    // 2. Retrieve Historical Grounding
    const retrievedHistoricalExamples = this.retriever.retrieveSimilar(
      classification.intent,
      customerTweet,
      2
    );

    // 3. Triage / Escalation Decision
    const triage = evaluateTriage(customerTweet, classification);

    // 4. Draft Grounded Response
    const draftReply = await generateGroundedReply(
      customerTweet,
      classification,
      triage,
      retrievedHistoricalExamples
    );

    return {
      ticketId,
      customerTweet,
      classification,
      triage,
      draftReply,
      retrievedHistoricalExamples,
    };
  }
}