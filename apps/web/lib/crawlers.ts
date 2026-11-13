/**
 * The crawlers robots.txt names, by class (ADR-013). Kept out of app/robots.ts
 * so the route file exports only what Next expects, and so the tests can assert
 * against the same lists the route renders.
 */
export const SEARCH_CRAWLERS = ["Googlebot", "Bingbot", "Applebot"] as const;

export const ANSWER_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User"
] as const;

export const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Meta-ExternalAgent"
] as const;
