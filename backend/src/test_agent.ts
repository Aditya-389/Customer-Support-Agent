import { AmazonSupportAgent } from "./pipeline/agent";

async function main() {
  const agent = new AmazonSupportAgent();
  
  const testTweet = "@AmazonHelp My order #112-984210-482910 was marked delivered 2 hours ago, but nothing arrived on my porch! Was it stolen?";
  console.log("Testing tweet:", testTweet);

  const result = await agent.processTicket("test_01", testTweet);
  console.log("\n--- RESULT ---");
  console.log(JSON.stringify(result, null, 2));
}

main();