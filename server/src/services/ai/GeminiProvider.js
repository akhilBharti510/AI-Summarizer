import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { IAiProvider } from './IAiProvider.js';

class GeminiProvider extends IAiProvider {
  constructor() {
    super();
    this.modelName = env.GEMINI_MODEL;
    this.client = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;
  }

  #ensure() {
    if (!this.client) throw ApiError.internal('Gemini API key is not configured');
    return this.client.getGenerativeModel({ model: this.modelName });
  }

  async summarizeText({ prompt, text, signal }) {
    const model = this.#ensure();
    const result = await model.generateContent(
      {
        contents: [{ role: 'user', parts: [{ text: `${prompt}\n\n---\n\n${text}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      },
      signal ? { signal } : undefined,
    );
    return this.#unwrap(result);
  }

  async summarizeImage({ prompt, image, signal }) {
    const model = this.#ensure();
    const result = await model.generateContent(
      {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: image.mimeType, data: image.buffer.toString('base64') } },
            ],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      },
      signal ? { signal } : undefined,
    );
    return this.#unwrap(result);
  }

  #unwrap(result) {
    const response = result.response;
    const output = response?.text?.() || '';
    if (!output.trim()) throw ApiError.internal('AI returned an empty response');
    const usage = response?.usageMetadata || {};
    return {
      output: output.trim(),
      model: this.modelName,
      tokensIn: usage.promptTokenCount ?? null,
      tokensOut: usage.candidatesTokenCount ?? null,
    };
  }
}

export const aiProvider = new GeminiProvider();
