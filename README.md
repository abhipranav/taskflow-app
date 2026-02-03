# TaskFlow 🚀

A fast, privacy-focused, open-source Kanban app inspired by [Linear](https://linear.app) and [Trello](https://trello.com).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)

## ✨ Features

### Core (MVP)
- **Kanban Board** - Drag-and-drop task management
- **List View** - Spreadsheet-style task overview with sorting/filtering
- **Sidebar Navigation** - Quick access to boards, settings, and user menu
- **Multiple Boards** - Create and manage multiple project boards
- **Settings** - Profile, appearance, integrations, and data management
- **Dark Mode** - System-aware theming
- **Custom Columns** - Flexible workflow stages
- **Labels & Assignees** - Task organization and ownership
- **GitHub/GitLab Links** - Connect tasks to issues and PRs

### AI-Powered
- **Text-to-Subtasks** - Auto-generate checklists from descriptions
- **Task Summarization** - Quick summaries of long descriptions
- **Multi-Provider Support** - Use Gemini/Groq (free) for dev, [Ollama](https://ollama.ai) for privacy

> 💡 See [AI Provider Setup](./docs/ai-providers.md) for configuration options.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Drag & Drop | @dnd-kit |
| Database | Drizzle ORM + SQLite |
| Auth | NextAuth (GitHub) |
| State | Zustand |
| Themes | next-themes |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- GitHub OAuth App (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/taskflow-app.git
cd taskflow-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Database Setup

Before starting the app, you need to push the schema and seed the database with initial data:

```bash
# Push schema to SQLite
npm run db:push

# Seed database with dummy data (users, boards, tasks)
npm run db:seed
```

### Development

```bash
# Run database migrations
npm run db:push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

> 📚 **Detailed Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including Vercel, Docker, Railway, and self-hosted options.

## 📁 Project Structure

```
taskflow-app/
├── src/
│   ├── app/                  # Next.js App Router pages
│   ├── actions/              # Server Actions
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── board/           # Kanban board components
│   │   └── modals/          # Modal dialogs
│   ├── lib/                  # Utility functions
│   ├── db/                   # Database schema & migrations
│   ├── hooks/                # Custom React hooks
│   └── auth.ts               # Authentication config
├── docs/                     # Documentation
│   └── internal/            # Internal docs for agents/devs
├── public/                   # Static assets
└── ...
```

## 🧠 For AI Agents

See [AGENTS.md](./docs/internal/AGENTS.md) for architectural context and deep-dive information.

## 🎯 Roadmap

- [x] Project documentation
- [ ] MVP implementation (2-day build)
- [ ] Command Palette (Cmd+K)
- [ ] Offline support
- [ ] Ollama integration
- [ ] Multi-user collaboration

See [PRD.md](./PRD.md) for the full roadmap.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Linear](https://linear.app) for speed and keyboard-first design
- Visual inspiration from [Trello](https://trello.com)
- Built with [shadcn/ui](https://ui.shadcn.com) components
