# البوت العربي لخوادم Discord

بوت Node.js باللغة العربية الفصحى لإدارة الخوادم، الترحيب بالأعضاء، منح الخبرة، وتعيين الرتب تلقائياً.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/arabic-discord-bot run dev` — run the Discord bot
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secret: `DISCORD_BOT_TOKEN`
- Optional env: `DISCORD_GUILD_ID` — registers commands to one server immediately instead of globally

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `bots/arabic-discord-bot/src/index.mjs` — Discord gateway, slash commands, moderation, welcome cards, auto-role, and leveling
- `bots/arabic-discord-bot/data/` — runtime JSON persistence for guild settings and member XP
- `bots/arabic-discord-bot/README.md` — Discord Developer Portal setup and required permissions

## Architecture decisions

- The bot is a standalone workspace package and runs as a console workflow, not through the HTTP API server.
- Discord.js handles the gateway and REST APIs; the Replit Discord OAuth connection is not used for bot actions because it cannot perform server moderation or gateway events.
- Small per-guild settings and XP data are stored as local JSON to keep the first version simple and portable.
- Welcome images are generated in-process with Sharp so no external image service or user API key is required.

## Product

The bot provides `/help`, `/welcome`, `/autorole`, `/level`, `/ban`, and `/kick` in Arabic, with an Arabic welcome PNG, automatic roles, message-based XP, and permission-aware moderation.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Enable Server Members Intent and Message Content Intent in the Discord Developer Portal before starting the bot.
- The bot's role must be above roles it needs to assign or moderate.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
