/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Content Classification
   Niche/topic detection for YouTube content (keyword-based)
   ══════════════════════════════════════════════════════════════════ */

const NICHES = {
  tech: { keywords: ['tech', 'review', 'unboxing', 'phone', 'laptop', 'gadget', 'software', 'app', 'code', 'programming', 'computer', 'gpu', 'cpu', 'build', 'setup', 'ai', 'machine learning', 'tutorial', 'how to', 'iphone', 'android', 'samsung', 'apple', 'windows', 'linux', 'gaming pc', 'benchmark'], weight: 1.5 },
  gaming: { keywords: ['game', 'gaming', 'gameplay', 'walkthrough', 'lets play', 'fps', 'rpg', 'mmorpg', 'esports', 'ps5', 'xbox', 'nintendo', 'steam', 'fortnite', 'minecraft', 'valorant', 'league', 'apex', 'cod', 'warzone', 'speedrun', 'ranked'], weight: 1.5 },
  education: { keywords: ['learn', 'tutorial', 'course', 'study', 'school', 'university', 'science', 'math', 'history', 'physics', 'chemistry', 'biology', 'lecture', 'lesson', 'explain', 'explained', 'education', 'student', 'teacher', 'exam', 'test'], weight: 1.3 },
  vlogs: { keywords: ['vlog', 'day in my life', 'routine', 'life', 'daily', 'week', 'month', 'travel vlog', 'come with me', 'grwm', 'get ready', 'morning', 'night'], weight: 1.0 },
  music: { keywords: ['music', 'song', 'cover', 'album', 'ep', 'music video', 'mv', 'remix', 'beat', 'producer', 'rapper', 'singer', 'guitar', 'piano', 'drums', 'lyrics', 'concert', 'festival', 'spotify'], weight: 1.3 },
  finance: { keywords: ['money', 'invest', 'stock', 'crypto', 'bitcoin', 'trading', 'passive income', 'side hustle', 'budget', 'saving', 'wealth', 'real estate', 'entrepreneur', 'business', 'startup', 'income', 'salary', 'debt', 'loan'], weight: 1.5 },
  fitness: { keywords: ['workout', 'exercise', 'gym', 'fitness', 'muscle', 'weight', 'diet', 'nutrition', 'protein', 'cardio', 'yoga', 'bodybuilding', 'transformation', 'fat loss', 'gain muscle', 'health'], weight: 1.2 },
  cooking: { keywords: ['recipe', 'cook', 'bake', 'food', 'meal', 'kitchen', 'chef', 'restaurant', 'eating', 'dinner', 'lunch', 'breakfast', 'vegan', 'vegetarian', 'healthy', 'easy recipe'], weight: 1.2 },
  beauty: { keywords: ['beauty', 'makeup', 'skincare', 'hair', 'fashion', 'style', 'outfit', 'grwm', 'haul', 'review beauty', 'cosmetic', 'tutorial makeup', 'routine', 'glow', 'skin'], weight: 1.1 },
  travel: { keywords: ['travel', 'trip', 'vacation', 'hotel', 'flight', 'adventure', 'explore', 'country', 'city', 'backpack', 'tourist', 'destination', 'guide', 'budget travel'], weight: 1.2 },
  comedy: { keywords: ['funny', 'comedy', 'skit', 'sketch', 'prank', 'meme', 'parody', 'reaction', 'try not to laugh', 'compilation', 'joke', 'hilarious', 'lol'], weight: 1.0 },
  news: { keywords: ['news', 'breaking', 'update', 'politics', 'election', 'president', 'war', 'economy', 'crisis', 'report', 'analysis', 'current events'], weight: 1.3 },
  motivation: { keywords: ['motivation', 'motivational', 'inspire', 'discipline', 'grind', 'hustle', 'success', 'mindset', 'self improvement', 'growth', 'habits', 'goals', 'dream'], weight: 1.1 },
  automotive: { keywords: ['car', 'auto', 'vehicle', 'driving', 'review car', 'supercar', 'truck', 'suv', 'sedan', 'electric car', 'tesla', 'bmw', 'audi', 'mercedes', 'engine', 'speed'], weight: 1.2 },
  diy: { keywords: ['diy', 'build', 'project', 'craft', 'how to make', 'homemade', 'woodworking', '3d print', 'repair', 'fix', 'mod', 'custom', 'handmade'], weight: 1.1 },
};

/**
 * Classify content into niches based on title + description + tags.
 * Returns: { primary, secondary, confidence, scores }
 */
export function classifyNiche(title = '', description = '', tags = []) {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const tagsLower = (tags || []).map(t => String(t).toLowerCase());
  const combined = `${titleLower} ${descLower} ${tagsLower.join(' ')}`;

  const scores = {};

  for (const [niche, config] of Object.entries(NICHES)) {
    let score = 0;

    // Title match (highest weight: 3x)
    for (const keyword of config.keywords) {
      if (titleLower.includes(keyword)) score += 3 * config.weight;
    }

    // Tags match (2x weight)
    for (const keyword of config.keywords) {
      for (const tag of tagsLower) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          score += 2 * config.weight;
          break;
        }
      }
    }

    // Description match (1x weight)
    for (const keyword of config.keywords) {
      if (descLower.includes(keyword)) score += 1 * config.weight;
    }

    scores[niche] = Math.round(score * 100) / 100;
  }

  // Sort by score
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) {
    return { primary: 'other', secondary: null, confidence: 0, scores };
  }

  const primary = sorted[0][0];
  const secondary = sorted.length > 1 ? sorted[1][0] : null;
  const totalScore = sorted.reduce((sum, [, s]) => sum + s, 0);
  const confidence = totalScore > 0 ? Math.min(sorted[0][1] / totalScore, 1) : 0;

  return {
    primary,
    secondary,
    confidence: Math.round(confidence * 100) / 100,
    scores: Object.fromEntries(sorted),
  };
}

/**
 * Extract key topics from text.
 */
export function extractTopics(text) {
  if (!text) return [];

  const textLower = text.toLowerCase();
  const found = new Map();

  for (const [niche, config] of Object.entries(NICHES)) {
    for (const keyword of config.keywords) {
      if (textLower.includes(keyword) && !found.has(keyword)) {
        found.set(keyword, { word: keyword, niche, count: (textLower.match(new RegExp(keyword.replace(/\s+/g, '\\s+'), 'gi')) || []).length });
      }
    }
  }

  return Array.from(found.values()).sort((a, b) => b.count - a.count).slice(0, 10);
}

/**
 * Infer target audience from content.
 * Returns: { ageRange, gender, interests, platform }
 */
export function getTargetAudience(title = '', description = '', tags = []) {
  const { primary } = classifyNiche(title, description, tags);

  const audienceMap = {
    tech: { ageRange: '18-45', gender: 'mixed', interests: ['technology', 'gadgets', 'software'] },
    gaming: { ageRange: '13-35', gender: 'predominantly male', interests: ['gaming', 'esports', 'entertainment'] },
    education: { ageRange: '15-40', gender: 'mixed', interests: ['learning', 'academics', 'self-improvement'] },
    vlogs: { ageRange: '16-30', gender: 'predominantly female', interests: ['lifestyle', 'entertainment', 'relatability'] },
    music: { ageRange: '13-35', gender: 'mixed', interests: ['music', 'entertainment', 'culture'] },
    finance: { ageRange: '22-55', gender: 'predominantly male', interests: ['money', 'investing', 'career'] },
    fitness: { ageRange: '18-45', gender: 'mixed', interests: ['health', 'fitness', 'self-improvement'] },
    cooking: { ageRange: '20-55', gender: 'predominantly female', interests: ['food', 'cooking', 'home'] },
    beauty: { ageRange: '14-35', gender: 'predominantly female', interests: ['beauty', 'fashion', 'self-care'] },
    travel: { ageRange: '18-40', gender: 'mixed', interests: ['travel', 'adventure', 'culture'] },
    comedy: { ageRange: '13-30', gender: 'mixed', interests: ['humor', 'entertainment', 'viral'] },
    news: { ageRange: '25-65', gender: 'mixed', interests: ['current events', 'politics', 'world'] },
    motivation: { ageRange: '16-40', gender: 'mixed', interests: ['self-improvement', 'motivation', 'success'] },
    automotive: { ageRange: '18-55', gender: 'predominantly male', interests: ['cars', 'vehicles', 'performance'] },
    diy: { ageRange: '20-50', gender: 'mixed', interests: ['crafting', 'building', 'learning'] },
  };

  return audienceMap[primary] || { ageRange: 'unknown', gender: 'unknown', interests: [] };
}
