/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Title Optimizer
   SEO analysis, title variants, competitive comparison
   ══════════════════════════════════════════════════════════════════ */

import { scoreHook } from './hook-scoring.js';
import { classifyNiche } from './content-classification.js';

const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'their']);

/**
 * Analyze title SEO effectiveness.
 * Returns: { seoScore, keywordDensity, readability, ctpPrediction, details }
 */
export function analyzeSEO(title = '', description = '', tags = []) {
  if (!title) return { seoScore: 0, keywordDensity: 0, readability: 0, ctpPrediction: 0, details: {} };

  const titleLower = title.toLowerCase();
  const words = title.split(/\s+/).filter(w => w.length > 0);
  const details = {};

  // 1. Title length (0-20 points) — optimal 50-60 chars
  const len = title.length;
  let lengthScore = 0;
  if (len >= 50 && len <= 60) lengthScore = 20;
  else if (len >= 40 && len <= 70) lengthScore = 15;
  else if (len >= 30 && len <= 80) lengthScore = 10;
  else if (len >= 20 && len <= 90) lengthScore = 5;
  else lengthScore = 2;
  details.length = { value: len, ideal: '50-60', score: lengthScore, max: 20 };

  // 2. Keyword density (0-25 points)
  const keywordWords = words.filter(w => !STOP_WORDS.has(w.toLowerCase()));
  const tagsLower = (tags || []).map(t => String(t).toLowerCase());
  let keywordMatches = 0;
  let totalKeywords = 0;

  for (const tag of tagsLower) {
    const tagWords = tag.split(/\s+/);
    for (const tw of tagWords) {
      if (STOP_WORDS.has(tw)) continue;
      totalKeywords++;
      if (titleLower.includes(tw)) keywordMatches++;
    }
  }

  // Also check description keywords
  const descLower = (description || '').toLowerCase();
  const descWords = descLower.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 3);
  for (const dw of descWords.slice(0, 10)) {
    totalKeywords++;
    if (titleLower.includes(dw)) keywordMatches++;
  }

  const keywordDensity = totalKeywords > 0 ? keywordMatches / totalKeywords : 0;
  let kdScore = 0;
  if (keywordDensity >= 0.3 && keywordDensity <= 0.6) kdScore = 25;
  else if (keywordDensity >= 0.2) kdScore = 20;
  else if (keywordDensity >= 0.1) kdScore = 12;
  else kdScore = 5;
  details.keywordDensity = { value: Math.round(keywordDensity * 100) + '%', ideal: '30-60%', matches: keywordMatches, total: totalKeywords, score: kdScore, max: 25 };

  // 3. Readability (0-20 points)
  const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1);
  const sentenceCount = (title.match(/[.!?]+/g) || []).length || 1;
  const avgSentenceLen = words.length / sentenceCount;

  let readabilityScore = 15; // base score
  if (avgWordLen > 7) readabilityScore -= 5; // long words
  if (avgSentenceLen > 15) readabilityScore -= 5; // long sentences
  if (avgWordLen <= 5 && avgSentenceLen <= 10) readabilityScore = 20;
  details.readability = { avgWordLength: Math.round(avgWordLen * 10) / 10, avgSentenceLength: Math.round(avgSentenceLen * 10) / 10, score: Math.max(readabilityScore, 0), max: 20 };

  // 4. CTR prediction (0-35 points) — combines hook score + niche relevance
  const hookResult = scoreHook(title);
  const nicheResult = classifyNiche(title, description, tags);
  const hookPortion = Math.round((hookResult.score / 100) * 20); // 20 points from hook
  const nichePortion = nicheResult.confidence > 0.3 ? 15 : nicheResult.confidence > 0.15 ? 10 : 5; // 15 points from niche clarity
  const ctrScore = hookPortion + nichePortion;
  details.ctrPrediction = { hookScore: hookResult.score, nicheConfidence: nicheResult.confidence, primaryNiche: nicheResult.primary, score: ctrScore, max: 35 };

  // Total SEO score
  const seoScore = lengthScore + kdScore + readabilityScore + ctrScore;

  return {
    seoScore: Math.min(seoScore, 100),
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    readability: Math.max(readabilityScore, 0),
    ctpPrediction: ctrScore / 35, // 0-1
    details,
  };
}

/**
 * Generate N title variants.
 */
export function generateVariants(title, count = 5) {
  if (!title) return [];

  const words = title.split(/\s+/);
  const { primary } = classifyNiche(title);
  const variants = [];

  // Pattern 1: Number + Title
  const num = [3, 5, 7, 10, 15][Math.floor(Math.random() * 5)];
  variants.push(`${num} Things About ${title} That Will Blow Your Mind`);
  variants.push(`Why ${title} Is More Important Than You Think`);

  // Pattern 2: How/What prefix
  variants.push(`How ${title} Can Change Everything in ${new Date().getFullYear()}`);
  variants.push(`What ${title} Experts Don't Want You to Know`);

  // Pattern 3: Emotional
  variants.push(`The ${title} Nobody Is Talking About (But Should Be)`);
  variants.push(`I Tried ${title} for 30 Days — Here's What Happened`);

  // Pattern 4: Challenge/Controversial
  variants.push(`Stop Doing ${title} Wrong — Here's the Right Way`);
  variants.push(`${title}: Everything You've Been Told Is a Lie`);

  // Score and return top N
  return variants
    .map(v => ({ title: v, ...scoreHook(v) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/**
 * Compare title with competitor titles.
 */
export function compareWithCompetitor(title, competitorTitles = []) {
  const myAnalysis = analyzeSEO(title);
  const myHook = scoreHook(title);

  const competitorResults = competitorTitles.map(ct => ({
    title: ct,
    seoScore: analyzeSEO(ct).seoScore,
    hookScore: scoreHook(ct).score,
  })).sort((a, b) => b.seoScore - a.seoScore);

  const avgCompetitorSEO = competitorResults.length > 0
    ? competitorResults.reduce((sum, c) => sum + c.seoScore, 0) / competitorResults.length
    : 0;

  return {
    yourTitle: { title, seoScore: myAnalysis.seoScore, hookScore: myHook.score },
    competitors: competitorResults,
    averageCompetitorSEO: Math.round(avgCompetitorSEO),
    ranking: competitorResults.filter(c => c.seoScore > myAnalysis.seoScore).length + 1,
    totalCompetitors: competitorResults.length,
    improvement: myAnalysis.seoScore > avgCompetitorSEO
      ? `Above average by ${Math.round(myAnalysis.seoScore - avgCompetitorSEO)} points`
      : `Below average by ${Math.round(avgCompetitorSEO - myAnalysis.seoScore)} points`,
  };
}
