# Contributing to Mai-Tai

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repository
2. Copy `.env.example` to `.env`
3. Run `./dev.sh local up` to start services
4. Make your changes
5. Submit a pull request

## Code Style

### Frontend (TypeScript/React)
- Use TypeScript strict mode
- Follow existing component patterns
- Use shadcn/ui components where possible
- Mobile-first CSS with Tailwind

### Backend (Python)
- Use type hints
- Follow PEP 8
- Use async/await for database operations

## Commit Messages

Keep them short and descriptive:
```
fix: correct WebSocket reconnection logic
feat: add workspace sharing
docs: update API documentation
```

Prefixes: `fix:`, `feat:`, `docs:`, `refactor:`, `test:`, `chore:`

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Test locally with `./dev.sh local up`
4. Open a PR with a clear description
5. Wait for review

## Reporting Issues

When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Relevant logs (from `./dev.sh local logs`)

## Questions?

Open an issue with the `question` label.

