# Contributing to TaskFlow

Thank you for your interest in contributing to TaskFlow! This document provides guidelines for contributing.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/taskflow-app.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Submit a pull request

## 📋 Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## 🔧 Code Guidelines

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add command palette
fix: resolve drag-drop issue on mobile
docs: update README with setup instructions
refactor: extract card component logic
```

### Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Run `npm run lint` before committing
- Use Prettier for formatting

### Component Structure

```tsx
// components/feature/ComponentName.tsx
import { cn } from "@/lib/utils"

interface ComponentNameProps {
  // Props interface
}

export function ComponentName({ ...props }: ComponentNameProps) {
  // Component logic
  return (/* JSX */)
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Pull Request Process

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Screenshots**: Include for UI changes
4. **Tests**: Add/update tests as needed
5. **Docs**: Update documentation if applicable

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings

## 🐛 Bug Reports

Open an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)

## 💡 Feature Requests

Open an issue with:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (optional)

## 📚 Documentation

- Keep docs up to date with code changes
- Use clear, concise language
- Include code examples where helpful

## 🤝 Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
