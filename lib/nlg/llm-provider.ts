/**
 * Multi-Provider LLM Client
 *
 * Unified interface for Anthropic Claude, OpenAI, and Google Gemini
 */

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  provider?: 'anthropic' | 'openai' | 'gemini';
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  finishReason: string;
}

export class LLMProvider {
  private anthropicKey: string;
  private openaiKey: string;
  private geminiKey: string;

  constructor(anthropicKey: string, openaiKey: string, geminiKey: string) {
    this.anthropicKey = anthropicKey;
    this.openaiKey = openaiKey;
    this.geminiKey = geminiKey;
  }

  /**
   * Generate content using Anthropic Claude
   */
  private async generateWithAnthropic(request: LLMRequest): Promise<LLMResponse> {
    const apiUrl = 'https://api.anthropic.com/v1/messages';

    const payload = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;

    return {
      content: data.content[0].text,
      provider: 'anthropic',
      model: data.model,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      finishReason: data.stop_reason,
    };
  }

  /**
   * Generate content using OpenAI GPT
   */
  private async generateWithOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const payload = {
      model: 'gpt-4o', // Latest GPT-4 Optimized model
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      messages: [
        {
          role: 'system',
          content: request.systemPrompt,
        },
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;

    return {
      content: data.choices[0].message.content,
      provider: 'openai',
      model: data.model,
      tokensUsed: data.usage.total_tokens,
      finishReason: data.choices[0].finish_reason,
    };
  }

  /**
   * Generate content using Google Gemini
   */
  private async generateWithGemini(request: LLMRequest): Promise<LLMResponse> {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiKey}`;

    // Gemini doesn't have separate system/user prompts, so we combine them
    const combinedPrompt = `${request.systemPrompt}\n\n---\n\n${request.userPrompt}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: combinedPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2000,
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;

    // Gemini response structure
    const content = data.candidates[0].content.parts[0].text;
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return {
      content,
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      tokensUsed,
      finishReason: data.candidates[0].finishReason,
    };
  }

  /**
   * Generate content with automatic provider failover
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const provider = request.provider || 'anthropic'; // Default to Anthropic

    // Try primary provider
    try {
      console.log(`[LLMProvider] Attempting generation with ${provider}...`);

      if (provider === 'anthropic') {
        return await this.generateWithAnthropic(request);
      } else if (provider === 'openai') {
        return await this.generateWithOpenAI(request);
      } else if (provider === 'gemini') {
        return await this.generateWithGemini(request);
      }

      throw new Error(`Unknown provider: ${provider}`);
    } catch (error) {
      console.error(`[LLMProvider] ${provider} failed:`, error);

      // Try fallback providers
      const fallbackProviders: Array<'anthropic' | 'openai' | 'gemini'> = [
        'anthropic',
        'openai',
        'gemini',
      ].filter((p) => p !== provider) as Array<'anthropic' | 'openai' | 'gemini'>;

      for (const fallback of fallbackProviders) {
        try {
          console.log(`[LLMProvider] Trying fallback: ${fallback}...`);

          if (fallback === 'anthropic') {
            return await this.generateWithAnthropic(request);
          } else if (fallback === 'openai') {
            return await this.generateWithOpenAI(request);
          } else if (fallback === 'gemini') {
            return await this.generateWithGemini(request);
          }
        } catch (fallbackError) {
          console.error(`[LLMProvider] ${fallback} failed:`, fallbackError);
          continue;
        }
      }

      // All providers failed
      throw new Error(`All LLM providers failed. Last error: ${error}`);
    }
  }

  /**
   * Generate with retry logic and exponential backoff
   */
  async generateWithRetry(
    request: LLMRequest,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.generate(request);
      } catch (error) {
        lastError = error as Error;
        console.error(`[LLMProvider] Attempt ${attempt + 1}/${maxRetries} failed:`, error);

        if (attempt < maxRetries - 1) {
          const delay = initialDelayMs * Math.pow(2, attempt);
          console.log(`[LLMProvider] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}
