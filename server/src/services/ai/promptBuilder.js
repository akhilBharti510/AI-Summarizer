const TYPE = {
  QUICK: 'Write a concise quick summary capturing the essence.',
  DETAILED: 'Write a thorough, detailed summary covering all major points.',
  BULLETS: 'Summarize as a clean bulleted list. Each bullet should stand on its own.',
  TLDR: 'Write a single-paragraph TL;DR.',
  KEY_TAKEAWAYS: 'List the key takeaways as numbered points.',
  EXECUTIVE: 'Write an executive summary suitable for a busy decision-maker: outcomes, implications, recommendations.',
  ELI_BEGINNER: 'Explain like the reader is a complete beginner. Avoid jargon; introduce terms simply.',
};

const LENGTH = {
  SHORT: 'Keep it under ~120 words.',
  MEDIUM: 'Aim for ~250 words.',
  LONG: 'Up to ~500 words, with structure.',
};

const TONE = {
  SIMPLE: 'Use simple, friendly language.',
  PROFESSIONAL: 'Use a professional, neutral tone.',
  ACADEMIC: 'Use a formal, academic tone with precise terminology.',
};

function languageInstruction(language) {
  if (!language) return 'Write the summary in English.';
  if (language.startsWith('custom:')) {
    return `Write the summary in ${language.slice(7).trim()}.`;
  }
  const map = {
    en: 'English',
    hi: 'Hindi',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
  };
  return `Write the summary in ${map[language] || language}.`;
}

export function buildSummaryPrompt({ summaryType, length, tone, language, sourceHint }) {
  const parts = [
    'You are an expert summarizer.',
    TYPE[summaryType] || TYPE.QUICK,
    LENGTH[length] || LENGTH.MEDIUM,
    TONE[tone] || TONE.SIMPLE,
    languageInstruction(language),
    'Do not include preambles like "Here is the summary". Output only the summary itself.',
    sourceHint ? `Source: ${sourceHint}` : null,
  ].filter(Boolean);
  return parts.join('\n');
}

export function buildImagePrompt(opts) {
  return [
    buildSummaryPrompt(opts),
    'The user has provided an image. If it contains text, extract and summarize that text. If it is a chart, diagram, or photo, describe and summarize what it conveys.',
  ].join('\n');
}
