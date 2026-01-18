# BSI Second Opinion MCP Server

MCP server that allows Claude Code to consult GPT-4.1 and Gemini 2.0 Flash for coding second opinions.

## Tools

### `ask_gpt`

Send a coding question to OpenAI GPT-4.1 and get a second opinion.

**Parameters:**

- `question` (required): The coding question or problem
- `context` (optional): Background context about your project
- `code` (optional): Code snippet to analyze

### `ask_gemini`

Send a coding question to Google Gemini 2.0 Flash and get a second opinion.

**Parameters:**

- `question` (required): The coding question or problem
- `context` (optional): Background context about your project
- `code` (optional): Code snippet to analyze

### `compare_opinions`

Send the same question to both models and get side-by-side responses.

**Parameters:**

- `question` (required): The coding question or problem
- `context` (optional): Background context about your project
- `code` (optional): Code snippet to analyze

## Setup

### 1. Install Dependencies

```bash
cd mcp/second-opinion-server
npm install
```

### 2. Configure API Keys

Add these environment variables to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export OPENAI_API_KEY="sk-your-openai-api-key"
export GOOGLE_AI_API_KEY="your-google-ai-studio-key"
```

**Get your API keys:**

- OpenAI: https://platform.openai.com/api-keys
- Google AI Studio: https://aistudio.google.com/apikey

### 3. MCP Configuration

The server is registered in `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "second-opinion": {
      "command": "npx",
      "args": ["tsx", "/path/to/BSI/mcp/second-opinion-server/index.ts"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "GOOGLE_AI_API_KEY": "${GOOGLE_AI_API_KEY}"
      }
    }
  }
}
```

### 4. Restart Claude Code

After adding API keys, restart your Claude Code session for the MCP server to pick up the environment variables.

## Usage Examples

Once configured, you can use these tools in Claude Code:

**Ask GPT for a code review:**

```
Use ask_gpt to review this TypeScript function for potential issues:
[paste code]
```

**Compare model opinions on architecture:**

```
Use compare_opinions to analyze whether I should use Redux or Zustand for state management in a React app with 50+ components
```

**Get Gemini's take on performance:**

```
Use ask_gemini with context about my Cloudflare Workers project to review this database query pattern
```

## Model Information

- **GPT-4.1**: OpenAI's latest flagship model (as of December 2024)
- **Gemini 2.0 Flash**: Google's fastest multimodal model with excellent reasoning

Both models are prompted to act as expert coding assistants focusing on correctness, performance, best practices, security, and maintainability.

## Troubleshooting

**"OpenAI client not available"**

- Verify `OPENAI_API_KEY` is set: `echo $OPENAI_API_KEY`
- Restart Claude Code after setting the variable

**"Gemini client not available"**

- Verify `GOOGLE_AI_API_KEY` is set: `echo $GOOGLE_AI_API_KEY`
- Restart Claude Code after setting the variable

**Timeout errors**

- API calls may take 10-30 seconds for complex queries
- Consider breaking large code blocks into smaller chunks
