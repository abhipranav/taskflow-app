# AI Provider Configuration

TaskFlow supports multiple AI providers, allowing you to use free cloud APIs during development and switch to local models for privacy in production.

## Provider Comparison

| Provider | Free Tier | Speed | Privacy | Best For |
|----------|-----------|-------|---------|----------|
| **Google Gemini** | 1M tokens/month | Fast | Cloud | Development & Testing |
| **Groq** | 14,400 req/day | Very Fast | Cloud | High-volume testing |
| **Ollama** | Unlimited | Varies | Local | Production & Privacy |

## Quick Start

### 1. Choose Your Provider

Set `AI_PROVIDER` in `.env.local`:

```bash
AI_PROVIDER="gemini"  # Options: gemini, groq, ollama
```

### 2. Get API Keys

#### Google Gemini (Recommended for Development)

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Add to `.env.local`:

```bash
GOOGLE_AI_API_KEY="your-api-key-here"
```

#### Groq

1. Visit [Groq Console](https://console.groq.com/keys)
2. Create an API key
3. Add to `.env.local`:

```bash
GROQ_API_KEY="your-api-key-here"
```

#### Ollama (Local)

1. Install Ollama: https://ollama.ai
2. Pull a model:

```bash
ollama pull llama3.2
```

3. Configure in `.env.local`:

```bash
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
```

## Provider Details

### Google Gemini

**Models Available:**
- `gemini-1.5-flash` - Fast, good for most tasks (default)
- `gemini-1.5-pro` - Higher quality, slower

**Rate Limits (Free Tier):**
- 15 requests per minute
- 1 million tokens per month
- 1,500 requests per day

**Best For:**
- Development and testing
- Prototyping AI features
- Teams without GPU resources

### Groq

**Models Available:**
- `llama-3.3-70b-versatile` - High quality
- `llama-3.1-8b-instant` - Fast responses
- `mixtral-8x7b-32768` - Good balance

**Rate Limits (Free Tier):**
- 30 requests per minute
- 14,400 requests per day
- 6,000 tokens per minute

**Best For:**
- Fast inference testing
- High-volume development
- Latency-sensitive features

### Ollama (Local)

**Recommended Models:**
- `llama3.2` - Best balance of speed/quality
- `mistral` - Fast and capable
- `codellama` - Code-focused tasks

**Requirements:**
- 8GB+ RAM for 7B models
- 16GB+ RAM for 13B models
- GPU recommended but not required

**Best For:**
- Production deployments
- Privacy-sensitive teams
- Offline capability
- No usage limits

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  AI Service Layer               │
│                   (lib/ai.ts)                   │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐     │
│   │ Gemini  │   │  Groq   │   │ Ollama  │     │
│   │ Provider│   │ Provider│   │ Provider│     │
│   └────┬────┘   └────┬────┘   └────┬────┘     │
│        │             │             │           │
│        └─────────────┼─────────────┘           │
│                      │                         │
│              ┌───────▼───────┐                 │
│              │ AI_PROVIDER   │                 │
│              │ env variable  │                 │
│              └───────────────┘                 │
└─────────────────────────────────────────────────┘
```

## Environment-Based Configuration

```typescript
// Recommended setup
const config = {
  development: {
    provider: "gemini",  // Free, easy to use
  },
  staging: {
    provider: "groq",    // Fast, good for testing
  },
  production: {
    provider: "ollama",  // Private, no data leakage
  },
};
```

## Troubleshooting

### Gemini: "API key not valid"
- Ensure the key is correctly copied without extra spaces
- Check that the Generative Language API is enabled

### Groq: "Rate limit exceeded"
- Wait a few seconds between requests
- Consider switching to Gemini for heavy development

### Ollama: "Connection refused"
- Ensure Ollama is running: `ollama serve`
- Check the port matches `OLLAMA_BASE_URL`
- Verify the model is pulled: `ollama list`

## Security Notes

> [!CAUTION]
> Never commit API keys to version control. Always use `.env.local` (which is gitignored).

> [!TIP]
> For production with cloud providers, consider using a secrets manager like Vault or cloud-native solutions.
