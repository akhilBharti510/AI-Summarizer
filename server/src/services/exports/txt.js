export function buildTxt(summary) {
  const lines = [
    summary.title,
    '='.repeat(Math.min(summary.title.length, 80)),
    '',
    `Type: ${summary.summaryType}    Length: ${summary.length}    Tone: ${summary.tone}    Language: ${summary.language}`,
    `Source: ${summary.sourceType}`,
    `Created: ${new Date(summary.createdAt).toISOString()}`,
    '',
    summary.output,
  ];
  return lines.join('\n');
}
