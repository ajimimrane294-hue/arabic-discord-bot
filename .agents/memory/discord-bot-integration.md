---
name: Discord bot authentication
description: The distinction between Replit's Discord OAuth connector and credentials required by a gateway bot.
---

Discord's Replit connector provides a user OAuth token for identity and guild discovery, not the bot token needed for gateway events, moderation, message handling, or role management.

**Why:** Discord rejects gateway sessions that use a user token or that request privileged intents which have not been enabled in the Developer Portal.

**How to apply:** For future Discord bot work, use the connector for user-level API access when appropriate, request `DISCORD_BOT_TOKEN` through secure project secrets, and document that Server Members Intent and Message Content Intent must be enabled when those features are used.