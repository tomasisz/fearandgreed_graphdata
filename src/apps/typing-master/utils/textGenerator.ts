
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

const EASY_WORDS = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it",
  "that", "for", "they", "i", "with", "as", "not", "on", "she", "at",
  "by", "this", "we", "you", "do", "but", "from", "or", "which", "one",
  "say", "who", "make", "when", "can", "more", "if", "no", "man", "out",
  "up", "go", "about", "than", "into", "could", "state", "only", "new", "year",
  "some", "take", "come", "these", "know", "see", "use", "get", "like", "then",
  "first", "any", "work", "now", "may", "such", "give", "over", "think", "most",
  "even", "find", "day", "also", "after", "way", "many", "must", "look", "before",
  "great", "back", "through", "long", "where", "much", "should", "well", "people", "down"
];

const MEDIUM_WORDS = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it",
  "that", "for", "they", "i", "with", "as", "not", "on", "she", "at",
  "by", "this", "we", "you", "do", "but", "from", "or", "which", "one",
  "would", "all", "will", "there", "say", "who", "make", "when", "can", "more",
  "if", "no", "man", "out", "other", "so", "what", "time", "up", "go",
  "about", "than", "into", "could", "state", "only", "new", "year", "some", "take",
  "come", "these", "know", "see", "use", "get", "like", "then", "first", "any",
  "work", "now", "may", "such", "give", "over", "think", "most", "even", "find",
  "day", "also", "after", "way", "many", "must", "look", "before", "great", "back",
  "through", "long", "where", "much", "should", "well", "people", "down"
];
const HARD_WORDS = [
  "Absolute", "Building", "Calendar", "Database", "Economy", "Favorite", "Generate", "Heritage", "Identity", "Judgment",
  "Keyboard", "Language", "Material", "Northern", "Opposite", "Position", "Question", "Relation", "Sentence", "Together",
  "Universe", "Vacation", "Whatever", "Yellow", "Zone", "Account", "Balance", "Capture", "Defense", "Edition",
  "Failure", "Gallery", "However", "Include", "Journey", "Kitchen", "Liberty", "Machine", "Nothing", "Opinion",
  "Pattern", "Quality", "Reason", "Science", "Traffic", "Utility", "Victory", "WARNING", "Xylophone", "Yesterday",
  "Development", "Environment", "Government", "Information", "Management", "Organization", "Performance", "Technology", "Understanding", "Relationship"
];

const EXPERT_WORDS = [
  "function", "constant", "variable", "return", "condition", "loop", "switch",
  "import", "export", "default", "class", "extends", "implements", "interface",
  "public", "private", "protected", "static", "void", "null", "undefined",
  "async", "await", "Promise", "catch", "finally", "throw", "instanceof",
  "console", "document", "window", "useEffect", "useState", "component",
  "filter", "reduce", "forEach", "splice", "string", "number", "boolean",
  "object", "array", "date", "math", "json", "value", "props", "state",
  "event", "error", "result", "algorithm", "database", "network", "server",
  "client", "browser", "request", "response", "header", "footer", "section"
];

export const generateText = (wordCount: number = 25, difficulty: Difficulty = 'Medium'): string => {
  const words: string[] = [];
  let sourceList: string[] = MEDIUM_WORDS;

  if (difficulty === 'Easy') sourceList = EASY_WORDS;
  if (difficulty === 'Hard') sourceList = HARD_WORDS;
  if (difficulty === 'Expert') sourceList = EXPERT_WORDS;

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * sourceList.length);
    words.push(sourceList[randomIndex]);
  }
  return words.join(" ");
};

