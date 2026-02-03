# TaskFlow - Product Requirements Document (PRD) v2

## Revision History

| Version | Date       | Author | Changes |
|---------|------------|--------|---------|
| v2      | 2026-01-29 | Abhijeet Pranav Mishra | Updated for 2-day MVP focus and future roadmap |

## 1. Introduction

This Product Requirements Document (PRD) outlines the requirements for TaskFlow, a privacy-focused, open-source Kanban application. The document serves as a guide for the development team to build a modern, efficient task management tool inspired by Linear and Trello.

## 2. Product Vision

TaskFlow is a fast, privacy-focused, open-source Kanban app inspired by Linear (speed + keyboard-first) with Trello-like visuals. Long-term goal: Become the "Open-Source Linear" with local AI differentiation (Ollama support) for privacy-sensitive devs/teams.

**Core Differentiator (Future)**: BYO local models for AI features — no cloud data leakage.

## 3. Objectives

### 3.1 MVP Objectives (2-Day Build)
- Implement all "Must-Have (Baseline)" features to establish a solid, modern foundation
- Create a functional Kanban board application with essential features
- Ensure fast performance and keyboard-first interactions

### 3.2 Long-term Objectives
- Become the leading open-source alternative to Linear
- Integrate local AI capabilities for enhanced privacy
- Support multi-user collaboration and advanced workflows

## 4. Target Audience

- Privacy-conscious developers and development teams
- Users seeking fast, efficient task management tools
- Open-source enthusiasts
- Teams requiring local AI integration without data leakage

## 5. Features and Requirements

### 5.1 Must-Have Features (Baseline - MVP)

| Feature Category | Requirements |
|------------------|--------------|
| **Interface** | - Kanban Board view<br>- List View<br>- Dark Mode support<br>- Sidebar Navigation<br>- Multiple Boards support<br>- Settings Pages |
| **AI** | - Text-to-Subtasks generation<br>- Task Summarization |
| **Workflow** | - Custom Columns<br>- Labels<br>- Assignees (self-assign or text field) |
| **Integrations** | - GitHub/GitLab Link integration |

### 5.2 Innovative Features (Differentiation - Future)

| Feature Category | Requirements |
|------------------|--------------|
| **Interface** | - Command Palette (Cmd+K)<br>- Offline Support |
| **AI** | - Local LLM Support (Ollama)<br>- Duplicate Detection |
| **Workflow** | - Predictive Risk/Delay Warnings |
| **Integrations** | - Automated PR Summaries via AI |

### 5.3 Additional MVP Features
- Card details modal (description, due date, checklists)
- Delete with confirmation
- Search and filter functionality
- Board background customization
- Single-user authentication (GitHub auth)

## 6. Technical Requirements

### 6.1 Tech Stack
- **Frontend**: Next.js 14+ App Router
- **Styling**: Tailwind CSS + shadcn/ui + next-themes
- **Drag-and-Drop**: @dnd-kit
- **Database**: Drizzle ORM + SQLite
- **Authentication**: NextAuth (GitHub)
- **State Management**: Zustand

### 6.2 Non-Functional Requirements
- Fast performance
- Keyboard-first interactions
- Privacy-focused (no cloud data leakage)
- Open-source

## 7. MVP Scope and Timeline

### 7.1 MVP Scope
- All Must-Have features listed in Section 5.1
- Additional features: Card details, delete confirmation, search/filter, board backgrounds
- Single-user support

### 7.2 Timeline
- **2-Day Build**: Complete MVP implementation
- **Post-MVP**: Implement innovative features and multi-user support

## 8. Future Roadmap

### 8.1 Phase 1 (Post-MVP)
- Implement all Innovative features from Section 5.2
- Multi-user collaboration support

### 8.2 Phase 2
- Ollama integration for local AI capabilities
- Cycles (Linear-style timeboxes)
- Bi-directional Git sync

### 8.3 Phase 3
- Switch to PostgreSQL for vector embeddings
- RAG chat functionality
- Advanced AI features

## 9. Success Metrics

- Successful 2-day MVP build
- User adoption and feedback
- Performance benchmarks (speed, responsiveness)
- Privacy compliance and data security

## 10. Risks and Assumptions

### 10.1 Assumptions
- Team has expertise in Next.js and modern web development
- GitHub authentication will suffice for initial user base
- SQLite is adequate for MVP scale

### 10.2 Risks
- Complexity of AI integration may extend timelines
- Open-source adoption may be slower than expected
- Competition from established tools

## 11. References

See detailed specifications in sub-files for implementation details.