import type { ZodSchema } from 'zod';

export interface LLMCompleteInput {
  system?: string;
  prompt: string;
  schema?: ZodSchema;
}

export interface LLMVisionInput {
  prompt: string;
  images: Buffer[];
}

export interface LLMProvider {
  readonly name: string;
  complete(input: LLMCompleteInput): Promise<string | object>;
  vision?(input: LLMVisionInput): Promise<string>;
}
