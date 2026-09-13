import fs from "fs";
import csv from "csv-parser";

interface RawTweet {
  tweet_id: string;
  author_id: string;
  inbound: string;
  created_at: string;
  text: string;
  response_tweet_id: string;
  in_response_to_tweet_id: string;
}

export interface ConversationPair {
  id: string;
  customer_tweet: string;
  agent_reply: string;
}

const CSV_PATH = "../data/twcs.csv";
const OUTPUT_PATH = "../data/amazon_pairs.json";
const MAX_SAMPLES = 3000; // Keep it lightweight & fast

export async function extractAmazonPairs(): Promise<void> {
  if (!fs.existsSync(CSV_PATH)) {
    console.warn(`[WARN] ${CSV_PATH} not found. Ensure twcs.csv is placed in ../data directory.`);
    return;
  }

  console.log("Parsing raw CSV for @AmazonHelp conversations...");
  const tweetsById = new Map<string, RawTweet>();
  const pairs: ConversationPair[] = [];

  const stream = fs.createReadStream(CSV_PATH).pipe(csv());

  for await (const row of stream) {
    const tweet = row as RawTweet;
    tweetsById.set(tweet.tweet_id, tweet);

    // If it is a reply from @AmazonHelp to an inbound tweet
    if (
      tweet.author_id === "AmazonHelp" &&
      tweet.in_response_to_tweet_id &&
      tweetsById.has(tweet.in_response_to_tweet_id)
    ) {
      const parent = tweetsById.get(tweet.in_response_to_tweet_id)!;
      if (parent.inbound === "True") {
        pairs.push({
          id: tweet.tweet_id,
          customer_tweet: parent.text.replace(/\n/g, " ").trim(),
          agent_reply: tweet.text.replace(/\n/g, " ").trim(),
        });

        if (pairs.length >= MAX_SAMPLES) break;
      }
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(pairs, null, 2));
  console.log(`Saved ${pairs.length} @AmazonHelp historical pairs to ${OUTPUT_PATH}`);
}

// Run if executed directly
if (require.main === module) {
  extractAmazonPairs();
}