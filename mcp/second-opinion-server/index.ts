#!/usr/bin/env node
/**
 * BSI Second Opinion MCP Server
 *
 * Allows Claude Code to consult GPT-4.1 and Gemini 2.0 Flash for coding second opinions.
 * Provides three tools:
 *   - ask_gpt: Query OpenAI GPT-4.1 for a coding opinion
 *   - ask_gemini: Query Google Gemini 2.0 Flash for a coding opinion
 *   - compare_opinions: Query both models and return side-by-side comparison
 *
 * Environment variables required:
 *   - OPENAI_API_KEY: Your OpenAI API key
 *   - GOOGLE_AI_API_KEY: Your Google AI Studio API key
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Model IDs - using latest available models as of December 2024
// NOTE: GPT-5.2 and Gemini 3.0 don't exist yet. Using GPT-4.1 and Gemini 2.0 Flash (actual latest)
const OPENAI_MODEL = 'gpt-4.1';
const GEMINI_MODEL = 'gemini-2.0-flash';

// System prompts for consistent coding assistant behavior
const CODING_SYSTEM_PROMPT = `You are an expert coding assistant providing second opinions on implementation decisions, code reviews, and technical architecture questions. Be direct and specific in your feedback. Focus on:

1. Code correctness and potential bugs
2. Performance implications
3. Best practices and patterns
4. Security considerations
5. Maintainability and readability

Provide concrete suggestions when identifying issues. Be honest about trade-offs. If you're uncertain about something, say so. Keep responses focused and actionable.`;

interface SecondOpinionEnv {
  OPENAI_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
}

interface AskGptArgs {
  question: string;
  context?: string;
  code?: string;
}

interface AskGeminiArgs {
  question: string;
  context?: string;
  code?: string;
}

interface CompareOpinionsArgs {
  question: string;
  context?: string;
  code?: string;
}

interface OpinionResponse {
  model: string;
  response: string;
  timestamp: string;
  latencyMs: number;
}

interface ComparisonResponse {
  question: string;
  gpt: OpinionResponse;
  gemini: OpinionResponse;
  totalLatencyMs: number;
}

function formatChicagoTimestamp(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
  const parts = formatter.formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute}:${lookup.second} ${lookup.timeZoneName}`;
}

function buildUserPrompt(question: string, context?: string, code?: string): string {
  const parts: string[] = [];

  if (context) {
    parts.push(`## Context\n${context}`);
  }

  if (code) {
    parts.push(`## Code\n\`\`\`\n${code}\n\`\`\``);
  }

  parts.push(`## Question\n${question}`);

  return parts.join('\n\n');
}

class SecondOpinionServer {
  private server: Server;
  private openaiClient: OpenAI | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiAvailable = false;
  private geminiAvailable = false;

  constructor() {
    this.server = new Server(
      {
        name: 'bsi-second-opinion',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.initializeClients();
    this.setupHandlers();

    // Handle errors gracefully
    this.server.onerror = (error) => {
      console.error('[SecondOpinion MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private initializeClients(): void {
    const env = process.env as SecondOpinionEnv;

    // Initialize OpenAI client
    if (env.OPENAI_API_KEY) {
      try {
        this.openaiClient = new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        });
        this.openaiAvailable = true;
        console.error('[SecondOpinion] OpenAI client initialized');
      } catch (error) {
        console.error('[SecondOpinion] Failed to initialize OpenAI client:', error);
      }
    } else {
      console.error('[SecondOpinion] OPENAI_API_KEY not set - GPT tools unavailable');
    }

    // Initialize Gemini client
    if (env.GOOGLE_AI_API_KEY) {
      try {
        this.geminiClient = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
        this.geminiAvailable = true;
        console.error('[SecondOpinion] Gemini client initialized');
      } catch (error) {
        console.error('[SecondOpinion] Failed to initialize Gemini client:', error);
      }
    } else {
      console.error('[SecondOpinion] GOOGLE_AI_API_KEY not set - Gemini tools unavailable');
    }

    if (!this.openaiAvailable && !this.geminiAvailable) {
      console.error(
        '[SecondOpinion] WARNING: No API keys configured. Set OPENAI_API_KEY and/or GOOGLE_AI_API_KEY.'
      );
    }
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [];

      // Always list tools, but they'll return errors if keys aren't set
      tools.push({
        name: 'ask_gpt',
        description: `Send a coding question to OpenAI ${OPENAI_MODEL} and get a second opinion. Include optional context and code snippets for better analysis.`,
        inputSchema: {
          type: 'object' as const,
          required: ['question'],
          properties: {
            question: {
              type: 'string',
              description: 'The coding question or problem you want GPT to analyze',
            },
            context: {
              type: 'string',
              description:
                'Optional background context about your project, constraints, or goals',
            },
            code: {
              type: 'string',
              description: 'Optional code snippet to analyze or review',
            },
          },
        },
      });

      tools.push({
        name: 'ask_gemini',
        description: `Send a coding question to Google ${GEMINI_MODEL} and get a second opinion. Include optional context and code snippets for better analysis.`,
        inputSchema: {
          type: 'object' as const,
          required: ['question'],
          properties: {
            question: {
              type: 'string',
              description: 'The coding question or problem you want Gemini to analyze',
            },
            context: {
              type: 'string',
              description:
                'Optional background context about your project, constraints, or goals',
            },
            code: {
              type: 'string',
              description: 'Optional code snippet to analyze or review',
            },
          },
        },
      });

      tools.push({
        name: 'compare_opinions',
        description: `Send the same coding question to both ${OPENAI_MODEL} and ${GEMINI_MODEL}, returning their responses side-by-side for comparison. Useful for getting diverse perspectives on complex decisions.`,
        inputSchema: {
          type: 'object' as const,
          required: ['question'],
          properties: {
            question: {
              type: 'string',
              description: 'The coding question or problem you want both models to analyze',
            },
            context: {
              type: 'string',
              description:
                'Optional background context about your project, constraints, or goals',
            },
            code: {
              type: 'string',
              description: 'Optional code snippet to analyze or review',
            },
          },
        },
      });

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ask_gpt':
            return await this.handleAskGpt(args as unknown as AskGptArgs);
          case 'ask_gemini':
            return await this.handleAskGemini(args as unknown as AskGeminiArgs);
          case 'compare_opinions':
            return await this.handleCompareOpinions(args as unknown as CompareOpinionsArgs);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${message}`);
      }
    });
  }

  private async handleAskGpt(args: AskGptArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!this.openaiClient || !this.openaiAvailable) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'OpenAI client not available',
                message: 'OPENAI_API_KEY environment variable is not set. Please configure it to use GPT tools.',
                timestamp: formatChicagoTimestamp(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const startTime = Date.now();
    const userPrompt = buildUserPrompt(args.question, args.context, args.code);

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: CODING_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content ?? 'No response generated';
      const latencyMs = Date.now() - startTime;

      const result: OpinionResponse = {
        model: OPENAI_MODEL,
        response: content,
        timestamp: formatChicagoTimestamp(),
        latencyMs,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OpenAI API error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'OpenAI API call failed',
                message,
                model: OPENAI_MODEL,
                timestamp: formatChicagoTimestamp(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  private async handleAskGemini(args: AskGeminiArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!this.geminiClient || !this.geminiAvailable) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Gemini client not available',
                message: 'GOOGLE_AI_API_KEY environment variable is not set. Please configure it to use Gemini tools.',
                timestamp: formatChicagoTimestamp(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const startTime = Date.now();
    const userPrompt = buildUserPrompt(args.question, args.context, args.code);
    const fullPrompt = `${CODING_SYSTEM_PROMPT}\n\n${userPrompt}`;

    try {
      const model = this.geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const content = response.text();
      const latencyMs = Date.now() - startTime;

      const opinionResult: OpinionResponse = {
        model: GEMINI_MODEL,
        response: content,
        timestamp: formatChicagoTimestamp(),
        latencyMs,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(opinionResult, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Gemini API error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Gemini API call failed',
                message,
                model: GEMINI_MODEL,
                timestamp: formatChicagoTimestamp(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  private async handleCompareOpinions(args: CompareOpinionsArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
    const startTime = Date.now();

    // Run both requests in parallel for faster response
    const [gptResult, geminiResult] = await Promise.allSettled([
      this.getGptOpinion(args),
      this.getGeminiOpinion(args),
    ]);

    const gptResponse: OpinionResponse =
      gptResult.status === 'fulfilled'
        ? gptResult.value
        : {
            model: OPENAI_MODEL,
            response: `Error: ${gptResult.reason?.message ?? 'Unknown error'}`,
            timestamp: formatChicagoTimestamp(),
            latencyMs: 0,
          };

    const geminiResponse: OpinionResponse =
      geminiResult.status === 'fulfilled'
        ? geminiResult.value
        : {
            model: GEMINI_MODEL,
            response: `Error: ${geminiResult.reason?.message ?? 'Unknown error'}`,
            timestamp: formatChicagoTimestamp(),
            latencyMs: 0,
          };

    const totalLatencyMs = Date.now() - startTime;

    const comparison: ComparisonResponse = {
      question: args.question,
      gpt: gptResponse,
      gemini: geminiResponse,
      totalLatencyMs,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  }

  private async getGptOpinion(args: AskGptArgs): Promise<OpinionResponse> {
    if (!this.openaiClient || !this.openaiAvailable) {
      return {
        model: OPENAI_MODEL,
        response: 'OpenAI client not available. Set OPENAI_API_KEY to enable.',
        timestamp: formatChicagoTimestamp(),
        latencyMs: 0,
      };
    }

    const startTime = Date.now();
    const userPrompt = buildUserPrompt(args.question, args.context, args.code);

    const response = await this.openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: CODING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content ?? 'No response generated';
    const latencyMs = Date.now() - startTime;

    return {
      model: OPENAI_MODEL,
      response: content,
      timestamp: formatChicagoTimestamp(),
      latencyMs,
    };
  }

  private async getGeminiOpinion(args: AskGeminiArgs): Promise<OpinionResponse> {
    if (!this.geminiClient || !this.geminiAvailable) {
      return {
        model: GEMINI_MODEL,
        response: 'Gemini client not available. Set GOOGLE_AI_API_KEY to enable.',
        timestamp: formatChicagoTimestamp(),
        latencyMs: 0,
      };
    }

    const startTime = Date.now();
    const userPrompt = buildUserPrompt(args.question, args.context, args.code);
    const fullPrompt = `${CODING_SYSTEM_PROMPT}\n\n${userPrompt}`;

    const model = this.geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const content = response.text();
    const latencyMs = Date.now() - startTime;

    return {
      model: GEMINI_MODEL,
      response: content,
      timestamp: formatChicagoTimestamp(),
      latencyMs,
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[SecondOpinion] MCP server running on stdio');
  }
}

// Main entry point
const server = new SecondOpinionServer();
server.run().catch((error) => {
  console.error('[SecondOpinion] Fatal error:', error);
  process.exit(1);
});
