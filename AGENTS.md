# Repository Guidelines

## Project Structure & Module Organization
`community-insights` is a Next.js 16 + TypeScript App Router project.

- `src/app/`: routes, page shells, and API endpoints (`api/scrape`, `api/analyze`).
- `src/components/`: UI modules such as `InsightsDashboard.tsx`.
- `src/lib/`: shared logic and types (`ai.ts`, `types.ts`).
- `public/`: static assets.
- `docs/plans/`: feature planning docs (use date-prefixed kebab-case filenames like `2026-03-05-feat-...-plan.md`).

## Build, Test, and Development Commands
- `npm run dev`: start local dev server (`http://localhost:3000`).
- `npm run dev -- -p 3333`: run on an alternate port if 3000 is busy.
- `npm run lint`: run ESLint (Next.js core-web-vitals + TypeScript rules).
- `npm run build`: production build check before opening a PR.
- `npm run start`: run the production build locally.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`) with React 19 function components.
- Formatting: follow existing style (2-space indentation, semicolons, double quotes).
- Components/types: `PascalCase` (`InsightsDashboard`, `AnalysisResult`).
- Variables/functions: `camelCase`.
- Use the path alias `@/*` for internal imports (example: `@/lib/types`).
- Keep API route handlers in `src/app/api/**/route.ts`; keep shared interfaces in `src/lib/types.ts`.

## Testing Guidelines
There is currently no dedicated automated test runner configured. For every change:

- Run `npm run lint` and `npm run build` as the minimum quality gate.
- Manually verify key flows: URL input -> `/api/scrape` -> `/api/analyze` -> dashboard rendering.
- If adding tests, place them near the feature (`*.test.ts`/`*.test.tsx`) and keep them deterministic.

## Commit & Pull Request Guidelines
Git history is minimal (`Initial commit from Create Next App`), so no strong legacy convention exists yet. Use clear, imperative commit messages, preferably Conventional Commit style:

- `feat(api): add scrape timeout fallback`
- `fix(ui): handle analyze error state`

PRs should include: concise summary, linked plan/issue, screenshots for UI changes, environment/config changes, and local verification steps (`lint`, `build`, manual flow).

## Security & Configuration Tips
- Keep secrets in `.env.local` only; never commit API keys.
- Use `AI_*` env vars (`AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`) to avoid shell-level `ANTHROPIC_*` conflicts.
- Treat proxy/network behavior changes in `src/lib/ai.ts` as high-risk and document them in the PR.
