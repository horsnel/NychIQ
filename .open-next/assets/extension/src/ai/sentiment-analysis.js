/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Sentiment Analysis
   On-device comment sentiment scoring with rule-based fallback
   ══════════════════════════════════════════════════════════════════ */

import { runInference, isReady, initPipeline } from './transformers-client.js';

const POSITIVE_WORDS = new Set([
  'great', 'amazing', 'love', 'awesome', 'best', 'fantastic', 'excellent', 'perfect',
  'beautiful', 'brilliant', 'incredible', 'wonderful', 'superb', 'outstanding',
  'favorite', 'helpful', 'genius', 'fire', 'goat', 'legend', 'slaps', 'banger',
  'underrated', 'impressive', 'enjoy', 'enjoyed', 'enjoying',
  'good', 'nice', 'cool', 'dope', 'lit', 'insane', 'clean', 'smooth', 'hard',
  'facts', 'based', 'valid', 'agreed', 'exactly', 'absolutely', 'definitely',
  'subscribe', 'subscribed', 'liked', 'shared', 'saved', 'recommended',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'hate', 'worst', 'awful', 'horrible', 'disgusting', 'cringe',
  'boring', 'waste', 'useless', 'trash', 'garbage', 'nonsense', 'clickbait',
  'dislike', 'unsubscribed', 'unsub', 'disappointed', 'annoying', 'spam',
  'fake', 'scam', 'misleading', 'overrated', 'lame', 'weak', 'mid',
  'skip', 'muted', 'turned off', 'stupid', 'ridiculous', 'pathetic',
  'cancel', 'exposed', 'fell off', 'lost', 'declining', 'worse',
]);

const POSITIVE_EMOJIS = new Set(['❤️', '😍', '🔥', '👏', '💯', '🎉', '💪', '⭐', '🤩', '😎', '👑', '🙌', '✨', '👍', '😂']);
const NEGATIVE_EMOJIS = new Set(['👎', '😡', '😤', '呕', '💀', '🤮', '😞', '❌', '🗑️', '📉', '😑', '🙄']);

/**
 * Analyze sentiment of a single text.
 * Returns: { score: -1 to 1, label: 'positive'|'negative'|'neutral', confidence: 0-1 }
 */
export async function analyze(text) {
  if (!text || typeof text !== 'string') return { score: 0, label: 'neutral', confidence: 0 };

  const normalized = text.toLowerCase().trim();

  // Try ML model first — auto-initialize if not ready
  if (!isReady()) {
    try {
      await initPipeline('sentiment', undefined, { dtype: 'q8' });
    } catch { /* model load failed, fall through to rule-based */ }
  }
  if (isReady()) {
    try {
      const result = await runInference('sentiment', normalized);
      if (result) {
        return {
          score: result.score ?? result[0] ?? 0,
          label: result.label ?? (result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral'),
          confidence: result.confidence ?? Math.abs(result.score ?? 0),
          source: 'ml',
        };
      }
    } catch { /* fall through to rule-based */ }
  }

  // Rule-based fallback
  return ruleBasedSentiment(normalized);
}

/**
 * Batch analyze multiple comments.
 */
export async function analyzeBatch(texts) {
  if (!Array.isArray(texts)) return [];
  const results = [];
  for (const text of texts) {
    results.push(await analyze(text));
  }
  return results;
}

/**
 * Get overall sentiment from an array of comments.
 */
export async function getOverallSentiment(comments) {
  if (!comments || comments.length === 0) {
    return { average: 0, label: 'neutral', positive: 0, negative: 0, neutral: 0, total: 0 };
  }

  const texts = comments.map(c => c.text || c.comment || c.content || '');
  const sentiments = await analyzeBatch(texts);

  let totalScore = 0;
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const s of sentiments) {
    totalScore += s.score;
    if (s.label === 'positive') positive++;
    else if (s.label === 'negative') negative++;
    else neutral++;
  }

  const average = totalScore / sentiments.length;
  return {
    average: Math.round(average * 100) / 100,
    label: average > 0.1 ? 'positive' : average < -0.1 ? 'negative' : 'neutral',
    positive,
    negative,
    neutral,
    total: comments.length,
    distribution: { positive: Math.round(positive / comments.length * 100), negative: Math.round(negative / comments.length * 100), neutral: Math.round(neutral / comments.length * 100) },
  };
}

/**
 * Find most controversial/polarizing comments.
 */
export async function getControversialComments(comments, limit = 5) {
  if (!comments || comments.length === 0) return [];

  const texts = comments.map(c => c.text || c.comment || c.content || '');
  const sentiments = await analyzeBatch(texts);

  // Sort by absolute score (most polarized first)
  return comments
    .map((c, i) => ({ ...c, sentiment: sentiments[i] }))
    .filter(c => Math.abs(c.sentiment.score) > 0.3)
    .sort((a, b) => Math.abs(b.sentiment.score) - Math.abs(a.sentiment.score))
    .slice(0, limit);
}

/* ── Rule-based sentiment engine ── */

function ruleBasedSentiment(text) {
  let positiveScore = 0;
  let negativeScore = 0;

  // Word matching
  const words = text.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^\w]/g, '');
    if (POSITIVE_WORDS.has(clean)) positiveScore += 1;
    if (NEGATIVE_WORDS.has(clean)) negativeScore += 1;

    // Negation handling
    const negIndex = text.indexOf(clean);
    const prefix = text.substring(Math.max(0, negIndex - 5), negIndex);
    if (prefix.includes("n't") || prefix.includes('not ') || prefix.includes('no ') || prefix.includes('never ')) {
      if (POSITIVE_WORDS.has(clean)) { positiveScore -= 1; negativeScore += 0.5; }
      if (NEGATIVE_WORDS.has(clean)) { negativeScore -= 1; positiveScore += 0.5; }
    }
  }

  // Emoji matching
  for (const emoji of POSITIVE_EMOJIS) { if (text.includes(emoji)) positiveScore += 0.5; }
  for (const emoji of NEGATIVE_EMOJIS) { if (text.includes(emoji)) negativeScore += 0.5; }

  // Exclamation amplification
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 0) {
    if (positiveScore > negativeScore) positiveScore += Math.min(exclamations * 0.2, 1);
    else negativeScore += Math.min(exclamations * 0.2, 1);
  }

  // ALL CAPS amplification (shouting)
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase());
  if (capsWords.length > 2) {
    if (positiveScore > negativeScore) positiveScore += 0.3;
    else negativeScore += 0.3;
  }

  // Calculate final score
  const total = positiveScore + negativeScore;
  let score = 0;
  if (total > 0) {
    score = (positiveScore - negativeScore) / total;
  }

  const confidence = Math.min(Math.abs(score), 1);
  const label = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral';

  return { score, label, confidence, source: 'rule-based' };
}
