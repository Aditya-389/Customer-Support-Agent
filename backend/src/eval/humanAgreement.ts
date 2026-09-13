// Here we measure the Pearson / Linear Agreement between human baseline labels and the LLM judge.

export interface AgreementResult {
  sampleSize: number;
  exactAgreementRate: number;     // Human score === Judge score
  adjacentAgreementRate: number;  // Within +/- 1 point (standard in NLP eval)
  averageHumanScore: number;
  averageJudgeScore: number;
}

export function computeJudgeAgreement(
  humanScores: number[],
  judgeScores: number[]
): AgreementResult {
  const n = humanScores.length;
  if (n === 0) return { sampleSize: 0, exactAgreementRate: 0, adjacentAgreementRate: 0, averageHumanScore: 0, averageJudgeScore: 0 };

  let exact = 0;
  let adjacent = 0;
  let sumHuman = 0;
  let sumJudge = 0;

  for (let i = 0; i < n; i++) {
    const h = humanScores[i];
    const j = judgeScores[i];
    sumHuman += h;
    sumJudge += j;

    if (h === j) exact++;
    if (Math.abs(h - j) <= 1) adjacent++;
  }

  return {
    sampleSize: n,
    exactAgreementRate: exact / n,
    adjacentAgreementRate: adjacent / n,
    averageHumanScore: sumHuman / n,
    averageJudgeScore: sumJudge / n,
  };
}