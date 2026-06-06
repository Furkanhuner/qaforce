import Anthropic from '@anthropic-ai/sdk';
import type { ZodSchema } from 'zod';
import type { LLMCompleteInput, LLMProvider, LLMVisionInput } from './provider';

interface AiSubConfig {
  apiKeyEnv: string;
  model: string;
}

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(aiConfig: AiSubConfig) {
    const apiKey = process.env[aiConfig.apiKeyEnv];
    if (!apiKey) {
      throw new Error(
        `Anthropic API key not found. Set the ${aiConfig.apiKeyEnv} environment variable.`
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = process.env['AI_MODEL'] ?? aiConfig.model;
  }

  async complete(input: LLMCompleteInput): Promise<string | object> {
    if (input.schema) {
      return this.completeStructured(input);
    }
    return this.completeText(input);
  }

  private async completeText(input: LLMCompleteInput): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: input.system,
      messages: [{ role: 'user', content: input.prompt }],
    });
    const block = response.content[0];
    if (!block || block.type !== 'text') throw new Error('Unexpected response from Anthropic');
    return block.text;
  }

  private async completeStructured(input: LLMCompleteInput): Promise<object> {
    const schema = input.schema as ZodSchema;
    const systemParts = [
      input.system,
      'You MUST respond with valid JSON only, matching the requested schema. No markdown fences, no explanation — raw JSON only.',
    ].filter(Boolean);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemParts.join('\n\n'),
      messages: [{ role: 'user', content: input.prompt }],
    });

    const block = response.content[0];
    if (!block || block.type !== 'text') throw new Error('Unexpected response from Anthropic');

    const jsonText = block.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonText) as unknown;
    return schema.parse(parsed) as object;
  }

  async vision(input: LLMVisionInput): Promise<string> {
    const imageContent = input.images.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/png' as const,
        data: img.toString('base64'),
      },
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [...imageContent, { type: 'text' as const, text: input.prompt }],
        },
      ],
    });

    const block = response.content[0];
    if (!block || block.type !== 'text') throw new Error('Unexpected vision response from Anthropic');
    return block.text;
  }
}
