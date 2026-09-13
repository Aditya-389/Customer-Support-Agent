import fs from "fs";
import path from "path";
import { AmazonIntent } from "../config";
import { HistoricalExample } from "../types";

export class HistoricalRetriever {
  private allPairs: HistoricalExample[] = [];

  constructor() {
    const historicalFilePath = path.resolve(__dirname, "../../../data/amazon_pairs.json");
    
    if (fs.existsSync(historicalFilePath)) {
      const raw = JSON.parse(fs.readFileSync(historicalFilePath, "utf-8"));
      this.allPairs = raw;
      console.log(`[HistoricalRetriever] Successfully indexed ${this.allPairs.length} real historical @AmazonHelp tweets from Kaggle.`);
    } else {
      console.warn(`[HistoricalRetriever] Warning: ${historicalFilePath} not found. Run "npm run data:prep" first.`);
    }
  }

  public retrieveSimilar(intent: AmazonIntent, query: string, topK: number = 2): HistoricalExample[] {
    if (this.allPairs.length === 0) {
      return [];
    }

    const queryTokens = new Set(
      query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
    );

    // Score real tweets by token overlap (TF matching)
    const scored = this.allPairs.map((pair) => {
      const targetTokens = pair.customer_tweet
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/);
      
      let matchCount = 0;
      for (const t of targetTokens) {
        if (queryTokens.has(t)) matchCount++;
      }

      return { pair, score: matchCount };
    });

    // Sort descending by relevance
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map((s) => s.pair);
  }
}