# AGENTS.md

## Package manager & engine

- **pnpm only**: package manager pinned to `pnpm@10.33.2` in `package.json`. `pnpm install` to install.
- **Node**: `^20.19.0 || >=22.12.0`

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on `localhost:5173` (Vite HMR) |
| `pnpm build` | Runs `type-check` + `build-only` in parallel via `run-p`. Pass extra args to build via `pnpm build -- --mode staging` |
| `pnpm type-check` | `vue-tsc --build` (type-checks all tsconfig references) |
| `pnpm lint` | `eslint . --fix` (flat config in `eslint.config.ts`) |
| `pnpm format` | `prettier --write src/` (src/ only) |
| `pnpm preview` | Preview the production build locally |

## Build tooling quirks

- **Vite is `rolldown-vite`** (v7 beta): `"vite": "npm:rolldown-vite@^7.3.1"`. This is an alias, not standard Vite. Most Vite plugins work, but the bundler is Rolldown. Do not upgrade `vite` without checking compatibility.
- **Tailwind CSS v4** via `@tailwindcss/vite` Vite plugin (no PostCSS config or `tailwind.config.ts`). The import is in `src/assets/main.css` as `@import 'tailwindcss'`.
- **UI components**: shadcn-vue (`components.json`), style `new-york`, base `neutral`, with CSS variables in `src/assets/main.css`. Use `@/lib/utils` for the `cn()` helper. Add components via `npx shadcn-vue@latest add <name>`.

## Architecture

```
Browser (Vue 3 SPA)
  └─ file upload (client-side WebP compression + thumbnail via canvas)
       └─ POST /api/upload/img (multipart/form-data)
            └─ node-functions/api/[[default]].ts (Express + Multer)
                 └─ CNB Object Storage API (cnb.cool)
                      └─ returns proxy URLs

Image serving:
  GET /img-api/* (e.g. https://img.example.com/img-api/path/to/img.webp)
    └─ edge-functions/img-api/[[path]].ts (EdgeOne Edge Function)
         └─ proxies to CNB with CORS + 30s cache
```

- **Frontend**: Vue 3 + `<script setup lang="ts">` + Composition API. Single route (`/` → `HomeView`). No state library (refs + props/emits only).
- **Backend API**: `node-functions/api/[[default]].ts` — single `POST /upload/img` endpoint. Uses multer (20MB limit). `_utils.ts` has `uploadToCnb()`; `_reply.ts` has `reply()` helper (shape: `{ code, msg, data }` where code=0 is success).
- **Edge proxy**: `edge-functions/img-api/[[path]].ts` — catches `/img-api/*`, forwards to CNB with CORS headers.
- **`[[default]].ts` / `[[path]].ts`** naming is EdgeOne Pages convention (catch-all and dynamic route functions). Do not rename.
- **No tests exist** in this project.

## Environment variables (required for deployment)

These are set in EdgeOne console — not in code or `.env` files:

| Variable | Example |
|---|---|
| `BASE_IMG_URL` | `https://img.example.com/` (trailing slash required) |
| `SLUG_IMG` | `username/repo-name` |
| `TOKEN_IMG` | CNB personal access token |

## Code conventions

- **Prettier**: no semicolons, single quotes, 100 char print width, 2-space indent
- **LF** line endings (`.gitattributes` enforces `eol=lf`)
- **Path alias**: `@` → `./src` (configured in `vite.config.ts`, `tsconfig.json`)
- **VS Code**: use Volar (not Vetur), ESLint, Prettier extensions
