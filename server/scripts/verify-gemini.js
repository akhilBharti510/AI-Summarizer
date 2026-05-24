// One-shot smoke test: mirrors GeminiProvider.summarizeText with abort signal.
// Run: node scripts/verify-gemini.js
import 'dotenv/config';
import { aiProvider } from '../src/services/ai/GeminiProvider.js';

const SAMPLE = `The James Webb Space Telescope, launched in December 2021, is the largest and most powerful
space telescope ever built. It observes primarily in infrared, allowing it to see through cosmic dust
and study some of the earliest galaxies formed after the Big Bang. Its 6.5-meter segmented mirror,
sunshield the size of a tennis court, and L2 orbit work together to keep its instruments extremely cold.`;

const controller = new AbortController();
const t = setTimeout(() => controller.abort(), 60_000);

try {
  const res = await aiProvider.summarizeText({
    prompt: 'Summarize the following text in 2 concise sentences.',
    text: SAMPLE,
    signal: controller.signal,
  });
  console.log('OK model=', res.model, 'tokensIn=', res.tokensIn, 'tokensOut=', res.tokensOut);
  console.log('---');
  console.log(res.output);
} catch (e) {
  console.error('FAILED:', e?.status || '', e?.message || e);
  process.exitCode = 1;
} finally {
  clearTimeout(t);
}
