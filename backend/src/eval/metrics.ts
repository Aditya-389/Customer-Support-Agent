// Computes Intent Accuracy, Macro-F1, Escalation Precision, and Recall.

import { AmazonIntent } from "../config";

export interface MetricSummary {
  accuracy: number;
  macroF1: number;
  escalationPrecision: number;
  escalationRecall: number;
  escalationF1: number;
}

export function calculateClassificationMetrics(
  predictions: { intent: AmazonIntent; groundTruth: AmazonIntent }[]
): { accuracy: number; macroF1: number } {
  let correct = 0;
  const classes = Array.from(new Set(predictions.map((p) => p.groundTruth)));
  const f1Scores: number[] = [];

  for (const p of predictions) {
    if (p.intent === p.groundTruth) correct++;
  }

  const accuracy = correct / predictions.length;

  // Compute per-class F1 for Macro-F1
  for (const c of classes) {
    let tp = 0;
    let fp = 0;
    let fn = 0;

    for (const p of predictions) {
      if (p.intent === c && p.groundTruth === c) tp++;
      else if (p.intent === c && p.groundTruth !== c) fp++;
      else if (p.intent !== c && p.groundTruth === c) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    f1Scores.push(f1);
  }

  const macroF1 = f1Scores.reduce((a, b) => a + b, 0) / f1Scores.length;

  return { accuracy, macroF1 };
}

export function calculateTriageMetrics(
  predictions: { action: "AUTO_HANDLE" | "ESCALATE"; groundTruth: "AUTO_HANDLE" | "ESCALATE" }[]
): { precision: number; recall: number; f1: number } {
  let tp = 0; // Correctly escalated
  let fp = 0; // Unnecessarily escalated
  let fn = 0; // Missed escalation (DANGEROUS!)

  for (const p of predictions) {
    if (p.action === "ESCALATE" && p.groundTruth === "ESCALATE") tp++;
    else if (p.action === "ESCALATE" && p.groundTruth === "AUTO_HANDLE") fp++;
    else if (p.action === "AUTO_HANDLE" && p.groundTruth === "ESCALATE") fn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { precision, recall, f1 };
}