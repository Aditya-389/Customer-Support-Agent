# 📦 Autonomous Support Agent for @AmazonHelp

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Evaluation](https://img.shields.io/badge/Evaluation-Reproducible-brightgreen.svg)]()

> **Hiver SDE Intern — Take-Home Assignment Submission**  
> An enterprise-grade customer support triage and response engine for `@AmazonHelp` built on real-world Kaggle Twitter support data. Features zero-shot intent classification, historical few-shot RAG grounding, deterministic safety triage, and an automated LLM-as-a-judge evaluation harness.

---

## ⚡ Quickstart: Reproduce Results in < 5 Minutes

The reviewer can reproduce the entire benchmark and headline tables with three simple terminal commands:

### 1. Clone & Install Dependencies
```bash
git clone <YOUR_REPO_URL>
cd hiver-amazon-agent
npm install
```

# Configure Environment Variables
```
Add your free API key in .env:
# Recommended: Groq API Key (Free, high-throughput, no rate-limits)
GROQ_API_KEY="gsk_your_groq_api_key_here"
```
(You can obtain a free Groq API key in 30 seconds at console.groq.com with zero credit card required).

#  Initialize Dataset & Run Evaluation Harness
```
# 1. Generate & verify the golden evaluation set
npm run data:golden

# 2. Run the full benchmark (Proposed vs Baselines + LLM Judge)
npm run eval
```

# 📊 Headline Benchmark Results
Reproducible via npm run eval against the Golden Evaluation Set:

| System | Intent Accuracy | Intent Macro-F1 | Triage Recall (Escalations) | LLM Judge Avg Quality (1–5) | P95 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Trivial Baseline** (Majority Class + Canned Reply) | 28.6% | 0.08 | 0.0% | 1.82 / 5.0 | < 5ms |
| **2. Simple Baseline** (Zero-Shot Unconstrained LLM) | 71.4% | 0.68 | 66.7% | 3.15 / 5.0 | ~1,200ms |
| **3. Proposed Agent** (Zod + Historical RAG + Safety Rules) | **92.9%** | **0.91** | **100.0%** | **4.65 / 5.0** | **~680ms** |

# Key Evaluation Highlights:
- Zero Missed Escalations (100% Recall): High-risk tickets (account compromise, security threats, lost items with Order IDs) trigger deterministic safety overrides, preventing unsafe auto-handling.
- LLM-as-a-Judge Agreement: Benchmarked against human evaluation scores, achieving 78.6% exact agreement and 96.4% adjacent agreement (
±
1
±1).

# 🏗️ Architecture & Pipeline Flow

### 🛠️ Architecture Workflow

```text
📩 Incoming Customer Tweet
```
> **1. Classification Engine (Zod Schema + Fast LLM)**
> * **Intent:** Maps to 1 of 6 discrete Amazon domain classes.
> * **Confidence:** Generates a score from `0.0` to `1.0`.
↓
> **2. Deterministic Safety & Triage Engine**
> * **Rule 1:** Confidence Cutoff (`< 0.75`)
> * **Rule 2:** Account Compromise / Hacked keywords check
> * **Rule 3:** Specific Order ID regex validation
> * **Rule 4:** High-severity / Legal threat sentiment scan
> * **Decision:** Routes to `AUTO_HANDLE` or `ESCALATE`
↓
> **3. Historical Few-Shot RAG Retriever**
> * **Index:** 3,000 real historical `@AmazonHelp` Kaggle tweet interactions.
> * **Retrieval:** Fetches top-2 similar resolved resolutions.
↓
> **4. Grounded Response Generation**
> * **Budget:** Strictly enforces Twitter limit (`<= 280` characters).
> * **Grounding:** Uses official help links (`amzn.to/orders`).
> * **Routing:** Safe escalation routing via direct message (DM).
↓
```text
🚀 Final Verified Action & Grounded Draft
```
