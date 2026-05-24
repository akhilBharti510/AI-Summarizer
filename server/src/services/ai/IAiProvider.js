/**
 * AI provider interface — all providers MUST implement these methods.
 *
 *   summarizeText({ prompt, text, signal }) => Promise<{ output, model, tokensIn?, tokensOut? }>
 *   summarizeImage({ prompt, image: { buffer, mimeType }, signal }) => Promise<{ output, model, tokensIn?, tokensOut? }>
 */
export class IAiProvider {
  // eslint-disable-next-line no-unused-vars
  async summarizeText(_args) {
    throw new Error('Not implemented');
  }
  // eslint-disable-next-line no-unused-vars
  async summarizeImage(_args) {
    throw new Error('Not implemented');
  }
}
