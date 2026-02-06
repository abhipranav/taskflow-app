---
title: "How We Built Voice-to-Task with Local AI"
slug: "voice-to-task-local-ai"
excerpt: "A deep dive into implementing speech recognition and local LLM processing for privacy-first voice commands."
date: "2026-01-25"
author: "Engineering Team"
category: "Engineering"
readTime: "8 min read"
image: "/blog/voice-ai.jpg"
featured: false
---

# How We Built Voice-to-Task with Local AI

Voice input has long been a feature request from our users. But as a privacy-first app, we couldn't just pipe audio to cloud services. Here's how we built voice-to-task capture that respects your privacy.

## The Challenge

Traditional voice-to-text solutions require sending audio to external servers:
- Google Speech-to-Text
- AWS Transcribe
- OpenAI Whisper API

For TaskFlow, this was a non-starter. Our users trust us with their task data, and sending audio recordings to third parties violates that trust.

## Our Solution: Web Speech API + Local Processing

We leveraged the **Web Speech API**, which is built into modern browsers and processes speech entirely on-device.

```typescript
// Simplified voice capture implementation
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Process locally - never leaves the browser
  createTask(transcript);
};
```

### Browser Support

The Web Speech API is supported in:
- ✅ Chrome/Chromium (full support)
- ✅ Edge (full support)
- ✅ Safari (partial support)
- ⚠️ Firefox (limited, flag required)

For unsupported browsers, we gracefully fall back to manual text input.

## AI Enhancement: Smart Parsing

Raw transcription is just the beginning. We use AI to enhance the captured text:

### 1. Task Title Extraction
"Remind me to review the pull request tomorrow" becomes:
- **Title**: "Review the pull request"
- **Due Date**: Tomorrow

### 2. Priority Detection
"Urgent: fix the production bug" automatically gets flagged as high priority.

### 3. Project Assignment
If you say "Add to the marketing board," we route the task accordingly.

## Local LLM Integration

For users who want AI features without cloud dependencies, we support **Ollama** — a local LLM runtime.

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# TaskFlow automatically detects and uses it
```

Set `AI_PROVIDER=ollama` in your environment, and all AI processing happens on your machine.

## Performance Optimizations

Voice capture needs to feel instant. Here's how we optimized:

### Streaming Transcription
We show interim results as you speak, giving immediate feedback:

```typescript
recognition.interimResults = true;

recognition.onresult = (event) => {
  const interim = event.results[0][0].transcript;
  showPreview(interim); // Update UI immediately
  
  if (event.results[0].isFinal) {
    processTask(interim);
  }
};
```

### Debounced Processing
AI processing only triggers after speech is complete, avoiding unnecessary API calls.

### Optimistic UI
The task appears in your board immediately while AI processing happens in the background.

## Lessons Learned

1. **Privacy and UX can coexist** — Local processing doesn't mean slow or limited.

2. **Progressive enhancement works** — Start with basic functionality, enhance with AI.

3. **Fallbacks matter** — Not everyone has the latest browser. Always provide alternatives.

## What's Next

We're exploring:
- **Whisper.cpp** integration for fully offline transcription
- **Wake word detection** ("Hey TaskFlow, add a task...")
- **Voice commands** for navigation and task management

## Try It Yourself

Press `Q` anywhere in TaskFlow, then click the microphone icon. Speak your task naturally, and watch it appear in your board.

---

*Have questions about our implementation? Reach out on [GitHub](https://github.com/taskflow) or join our engineering discussions on Discord.*

*— The TaskFlow Engineering Team*
