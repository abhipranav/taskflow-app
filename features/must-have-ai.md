# Must-Have Features: AI (Basic Implementation)

## Document Information

| Feature Category | AI |
|------------------|----|
| Priority | Must-Have (MVP) |
| Target Release | v1.0 MVP |
| Implementation Approach | UI Stubs + Non-AI Fallbacks |
| Last Updated | 2026-01-29 |

## Overview

This document specifies the must-have AI features for TaskFlow's MVP. Due to time constraints and complexity, the MVP implements UI components with simple non-AI fallbacks rather than full AI integration. Full privacy-focused AI using Ollama will be implemented in future releases.

**Implementation Strategy**: Create functional UI components now with rule-based logic, allowing for seamless AI integration later.

## AI Provider Options

TaskFlow supports multiple AI providers for flexibility during development and production:

| Environment | Provider | Purpose |
|-------------|----------|---------|
| Development | Google Gemini | Free tier (1M tokens/month), easy setup |
| Testing | Groq | Very fast inference (14,400 req/day free) |
| Production | Ollama (local) | Privacy-first, no data leakage |

> [!TIP]
> See [docs/ai-providers.md](../docs/ai-providers.md) for detailed setup instructions.

## 1. Text-to-Subtasks

### 1.1 Description
Automatically generate checklist items from a task description, helping users break down complex tasks into manageable subtasks.

### 1.2 Requirements

#### Functional Requirements
- Button in card modal labeled "Generate checklist from description"
- Parse task description to extract potential subtasks
- Create checklist items automatically
- Allow manual editing of generated subtasks

#### MVP Implementation (Non-AI)
- Rule-based parsing: split by newlines, numbered lists, or bullet points
- Extract sentences or phrases that appear to be action items
- Simple keyword detection for task-like language

#### Future Implementation (AI)
- Integration with local Ollama models
- Natural language processing for intelligent subtask generation
- Context-aware suggestions based on task description

#### User Interface Requirements
- Clear "Generate" button in card modal
- Loading state during processing
- Preview of generated subtasks before confirmation
- Easy addition/removal of generated items

### 1.3 User Stories
- As a user, I want to quickly break down a complex task into smaller steps
- As a user, I want the system to suggest subtasks based on my task description
- As a user, I want to edit or remove suggested subtasks before saving

### 1.4 Technical Implementation
- MVP: JavaScript string parsing and regex patterns
- Future: API integration with Ollama
- Store generated subtasks as checklist items in database
- Use Zustand for local state management during generation

## 2. Summarization

### 2.1 Description
Automatically create concise summaries of long task descriptions, helping users quickly understand task content without reading full details.

### 2.2 Requirements

#### Functional Requirements
- Button in card modal labeled "Summarize description"
- Generate shortened version of task description
- Display summary prominently in card or modal
- Allow toggling between full description and summary

#### MVP Implementation (Non-AI)
- Text truncation with ellipsis for long descriptions
- Extract first 1-2 sentences as "summary"
- Simple keyword extraction for key points
- Character/word limit-based shortening

#### Future Implementation (AI)
- Ollama-powered natural language summarization
- Intelligent extraction of key information
- Context-preserving condensation
- Multiple summary lengths (short/medium/long)

#### User Interface Requirements
- "Summarize" button next to description field
- Clear visual distinction between summary and full text
- Toggle to expand/collapse full description
- Summary appears in card preview (truncated cards)

### 2.3 User Stories
- As a user, I want to see a quick summary of long task descriptions
- As a user, I want to toggle between summary and full details
- As a user, I want summaries to capture the essential information

### 2.4 Technical Implementation
- MVP: Client-side text processing functions
- Future: Asynchronous API calls to Ollama
- Cache summaries to avoid repeated processing
- Update summary when description changes

## 3. Acceptance Criteria

### 3.1 Text-to-Subtasks
- [ ] "Generate checklist" button appears in card modal
- [ ] Button triggers parsing of description text
- [ ] Generated subtasks appear as editable checklist items
- [ ] Users can modify or delete generated subtasks
- [ ] Subtasks save correctly to database

### 3.2 Summarization
- [ ] "Summarize description" button appears in card modal
- [ ] Button generates shortened version of description
- [ ] Summary displays prominently in UI
- [ ] Toggle exists between summary and full text
- [ ] Summary updates when description changes

## 4. Implementation Notes

### 4.1 MVP Constraints
- No external API calls or AI processing
- Simple, fast client-side algorithms
- Focus on UI/UX completeness over intelligence
- Prepare data structures for future AI integration

### 4.2 Future AI Integration Points
- API endpoints ready for Ollama calls
- Data models support AI-generated content
- UI components designed for async operations
- Error handling for AI service unavailability

## 5. Dependencies

- React for UI components
- Zustand for state management
- Drizzle ORM for database operations
- Tailwind CSS + shadcn/ui for styling

## 6. Testing Considerations

- Test parsing logic with various description formats
- Verify UI responsiveness during "processing" states
- Ensure fallbacks work when AI is unavailable (future)
- Performance testing for text processing algorithms
- Accessibility testing for summary/description toggles