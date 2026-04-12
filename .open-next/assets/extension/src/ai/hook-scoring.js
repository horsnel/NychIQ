/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Hook Scoring
   Title hook quality assessment (0-100 score)
   ══════════════════════════════════════════════════════════════════ */

const CURIOSITY_WORDS = ['secret', 'truth', 'why', 'how', 'what if', 'you wont believe', "won't believe", 'never knew', 'nobody tells you', 'hidden', 'exposed', 'reveal', 'discovered', 'mistake', 'wrong', 'myth', 'real reason'];
const EMOTIONAL_WORDS = ['shocking', 'heartbreaking', 'insane', 'unbelievable', 'terrifying', 'beautiful', 'powerful', 'emotional', 'inspiring', 'devastating', 'miracle', 'nightmare', 'dream', 'struggle', 'journey'];
const POWER_WORDS = ['ultimate', 'essential', 'complete', 'proven', 'exclusive', 'limited', 'guaranteed', 'breakthrough', 'revolutionary', 'master', 'expert', 'advanced', 'critical', 'deadly', 'genius'];
const URGENCY_WORDS = ['now', 'today', 'before its too late', 'before you', 'dont wait', 'urgent', 'immediate', 'last chance', 'ending soon', 'running out', 'act now', 'stop'];
const NUMBER_PATTERNS = ['\\d+', '\\d+ ways?', '\\d+ things?', '\\d+ tips?', '\\d+ steps?', '\\d+ mistakes?', '\\d+ reasons?', '\\d+ hacks?', '\\d+ secrets?'];

/**
 * Score a title's hook quality 0-100.
 * Returns: { score, breakdown, suggestions }
 */
export function scoreHook(title) {
  if (!title || typeof title !== 'string') return { score: 0, breakdown: {}, suggestions: ['Provide a title'] };

  const breakdown = {};
  const titleLower = title.toLowerCase();

  // 1. Curiosity gap (0-25 points)
  const curiosityScore = scorePatternMatch(titleLower, CURIOSITY_WORDS);
  breakdown.curiosityGap = curiosityScore;
  breakdown.curiosityMax = 25;
  breakdown.curiosityPoints = Math.round(curiosityScore * 25);

  // 2. Emotional trigger (0-20 points)
  const emotionalScore = scorePatternMatch(titleLower, EMOTIONAL_WORDS);
  breakdown.emotionalTrigger = emotionalScore;
  breakdown.emotionalMax = 20;
  breakdown.emotionalPoints = Math.round(emotionalScore * 20);

  // 3. Power words (0-15 points)
  const powerScore = scorePatternMatch(titleLower, POWER_WORDS);
  breakdown.powerWords = powerScore;
  breakdown.powerMax = 15;
  breakdown.powerPoints = Math.round(powerScore * 15);

  // 4. Length optimization (0-15 points)
  // Ideal: 40-60 chars for YouTube
  const len = title.length;
  let lengthScore = 0;
  if (len >= 40 && len <= 60) lengthScore = 1.0;
  else if (len >= 30 && len <= 70) lengthScore = 0.7;
  else if (len >= 20 && len <= 80) lengthScore = 0.4;
  else if (len >= 10 && len <= 100) lengthScore = 0.2;
  else lengthScore = 0.1;
  breakdown.length = { value: len, ideal: '40-60', score: lengthScore };
  breakdown.lengthPoints = Math.round(lengthScore * 15);

  // 5. Number usage (0-10 points)
  const numberRegex = new RegExp(NUMBER_PATTERNS.join('|'), 'gi');
  const numberMatches = (titleLower.match(numberRegex) || []).length;
  let numberScore = Math.min(numberMatches * 0.5, 1.0);
  breakdown.numberUsage = numberScore;
  breakdown.numberMax = 10;
  breakdown.numberPoints = Math.round(numberScore * 10);

  // 6. Urgency (0-10 points)
  const urgencyScore = scorePatternMatch(titleLower, URGENCY_WORDS);
  breakdown.urgency = urgencyScore;
  breakdown.urgencyMax = 10;
  breakdown.urgencyPoints = Math.round(urgencyScore * 10);

  // 7. Capitalization pattern (0-5 points)
  // Title Case or ALL CAPS power words score higher
  let capScore = 0;
  const words = title.split(/\s+/);
  const capitalizedWords = words.filter(w => w.length > 2 && w[0] === w[0].toUpperCase()).length;
  if (capitalizedWords / Math.max(words.length, 1) > 0.6) capScore = 0.8;
  else if (capitalizedWords / Math.max(words.length, 1) > 0.3) capScore = 0.5;
  breakdown.capitalization = capScore;
  breakdown.capMax = 5;
  breakdown.capPoints = Math.round(capScore * 5);

  // Total
  const total = breakdown.curiosityPoints + breakdown.emotionalPoints + breakdown.powerPoints +
                breakdown.lengthPoints + breakdown.numberPoints + breakdown.urgencyPoints + breakdown.capPoints;

  const suggestions = generateSuggestions(title, breakdown);

  return {
    score: Math.min(total, 100),
    breakdown,
    suggestions,
  };
}

/**
 * Compare and rank multiple titles.
 */
export function compareTitles(titles) {
  if (!Array.isArray(titles)) return [];

  return titles.map(title => {
    const result = scoreHook(title);
    return { title, ...result };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Suggest improved title variants.
 */
export function suggestImprovements(title, niche) {
  const words = title.split(/\s+/);
  const suggestions = [];

  // Add number prefix
  suggestions.push(`7 ${title.charAt(0).toUpperCase() + title.slice(1)} (You Need to Know)`);
  suggestions.push(`${title.charAt(0).toUpperCase() + title.slice(1)} — 5 Things Nobody Tells You`);

  // Add curiosity words
  if (CURIOSITY_WORDS.every(w => !title.toLowerCase().includes(w))) {
    suggestions.push(`The Real Reason Why ${title}`);
    suggestions.push(`${title} — The Truth Nobody Tells You`);
  }

  // Add emotional words if niche-specific
  if (niche) {
    suggestions.push(`How ${title} Completely Changed Everything`);
  }

  // Score all suggestions and return top 3
  return compareTitles(suggestions).slice(0, 3);
}

function scorePatternMatch(text, wordList) {
  let matches = 0;
  for (const word of wordList) {
    if (text.includes(word)) matches++;
  }
  return Math.min(matches / Math.max(wordList.length * 0.3, 1), 1.0);
}

function generateSuggestions(title, breakdown) {
  const suggestions = [];

  if (breakdown.curiosityPoints < 10) {
    suggestions.push('Add curiosity gap: "The Secret Behind...", "Why Nobody Tells You...", "You Won\'t Believe..."');
  }
  if (breakdown.emotionalPoints < 8) {
    suggestions.push('Add emotional trigger: "Shocking", "Insane", "Heartbreaking"');
  }
  if (breakdown.numberPoints < 5) {
    suggestions.push('Add numbers: "7 Ways...", "5 Mistakes...", "10 Tips..."');
  }
  if (breakdown.lengthPoints < 8) {
    suggestions.push(`Optimize length: currently ${breakdown.length.value} chars, aim for 40-60`);
  }
  if (breakdown.powerPoints < 5) {
    suggestions.push('Add power words: "Ultimate", "Proven", "Essential"');
  }
  if (breakdown.urgencyPoints < 3) {
    suggestions.push('Add urgency: "Before It\'s Too Late", "Stop Doing This Now"');
  }
  if (suggestions.length === 0) {
    suggestions.push('Title is well-optimized!');
  }

  return suggestions;
}
