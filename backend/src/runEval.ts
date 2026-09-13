import fs from "fs";
import path from "path";
import { AmazonSupportAgent } from "./pipeline/agent";
import { TrivialBaseline } from "./baselines/trivialBaseline";
import { SimpleBaseline } from "./baselines/simpleBaseline";
import { calculateClassificationMetrics, calculateTriageMetrics } from "./eval/metrics";
import { evaluateReplyQuality } from "./eval/llmJudge";
import { computeJudgeAgreement } from "./eval/humanAgreement";
import { GoldenSample } from "./data/create_golden_set";

async function runBenchmark() {
  console.log("=================================================");
  console.log("   HIVERT SDE INTERN BENCHMARK HARNESS           ");
  console.log("   Evaluating: Proposed Agent vs Baselines       ");
  console.log("=================================================\n");

  const goldenPath = path.resolve(__dirname, "../../data/golden_eval_set.json");
  if (!fs.existsSync(goldenPath)) {
    console.error("Golden dataset not found. Run 'npm run data:golden' first.");
    return;
  }

  const dataset: GoldenSample[] = JSON.parse(fs.readFileSync(goldenPath, "utf-8"));
  console.log(`Loaded ${dataset.length} evaluation test samples.\n`);

  const agent = new AmazonSupportAgent();
  const baselineTrivial = new TrivialBaseline();
  const baselineSimple = new SimpleBaseline();

  async function evaluateSystem(name: string, runner: any) {
    console.log(`Running evaluation on: ${name}...`);
    const intentPairs: any[] = [];
    const triagePairs: any[] = [];
    const judgeScores: number[] = [];
    const humanScores: number[] = [];


    // Adding rate limiter
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const sample of dataset) {
      const res = await runner.processTicket(sample.id, sample.customer_text);

      intentPairs.push({
        intent: res.classification.intent,
        groundTruth: sample.ground_truth_intent,
      });

      triagePairs.push({
        action: res.triage.action,
        groundTruth: sample.ground_truth_escalation,
      });

      // Run LLM Judge
      const judge = await evaluateReplyQuality(
        sample.customer_text,
        res.draftReply,
        res.classification.intent,
        res.triage.action
      );

      judgeScores.push(judge.overallScore);
      humanScores.push(sample.human_baseline_quality);

      await delay(1500); // 1500ms delay between requests to avoid rate limits
    }

    const clsMetrics = calculateClassificationMetrics(intentPairs);
    const triageMetrics = calculateTriageMetrics(triagePairs);
    const avgJudge = judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length;

    return {
      name,
      clsMetrics,
      triageMetrics,
      avgJudge,
      judgeScores,
      humanScores,
    };
  }

  // Run all 3 systems
  const rTrivial = await evaluateSystem("1. Trivial Baseline", baselineTrivial);
  const rSimple = await evaluateSystem("2. Simple Baseline (Zero-Shot)", baselineSimple);
  const rProposed = await evaluateSystem("3. Proposed Agent (Ours)", agent);

  // Compute Judge Agreement using proposed agent's run
  const agreement = computeJudgeAgreement(rProposed.humanScores, rProposed.judgeScores);

  // Output Headline Results Table
  console.log("\n==========================================================================================");
  console.log("                               HEADLINE RESULTS SUMMARY TABLE                             ");
  console.log("==========================================================================================");
  console.log("| System                     | Intent Acc | Intent Macro-F1 | Triage Recall | Avg Quality (1-5) |");
  console.log("|----------------------------|------------|-----------------|---------------|-------------------|");
  for (const r of [rTrivial, rSimple, rProposed]) {
    console.log(
      `| ${r.name.padEnd(26)} | ${(r.clsMetrics.accuracy * 100).toFixed(1)}%     | ${(r.clsMetrics.macroF1 * 100).toFixed(1)}% | ${(r.triageMetrics.recall * 100).toFixed(1)}%         | ${r.avgJudge.toFixed(2)} / 5.00        |`
    );
  }
  console.log("==========================================================================================\n");

  console.log("--- EVIDENCE OF LLM-AS-A-JUDGE RELIABILITY ---");
  console.log(`- Sample size evaluated: ${agreement.sampleSize}`);
  console.log(`- Exact Human Agreement Rate: ${(agreement.exactAgreementRate * 100).toFixed(1)}%`);
  console.log(`- Adjacent Agreement (+/- 1 score): ${(agreement.adjacentAgreementRate * 100).toFixed(1)}%`);
  console.log(`- Human Avg: ${agreement.averageHumanScore.toFixed(2)} vs Judge Avg: ${agreement.averageJudgeScore.toFixed(2)}`);
  console.log("--------------------------------------------------\n");
}

runBenchmark();