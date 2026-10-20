# huntlog

Your job hunt, organized. huntlog tracks applications, follow-ups, leads, resumes and interview prep notes, and keeps all of it private.

**[huntlog.dev](https://huntlog.dev)** · open the app at **[app.huntlog.dev](https://app.huntlog.dev)**

## Private by design

huntlog is local-first. Your data lives in a SQLite database on your device and is end-to-end encrypted before it syncs, so the sync relay only ever stores ciphertext it can't read.

There are no accounts. When you start, huntlog creates a 24-word recovery phrase on your device. Enter that phrase on another device to open the same data there. Keep it in a password manager: if it's lost, nobody can recover your data.

Sync is built on [Evolu](https://www.evolu.dev).

## Features

- A pipeline from applied to offer, with a funnel and response rate
- Follow-ups with a next action and a due date, overdue ones first
- Leads you can turn into applications in one click
- Resume versions, attached to the applications you sent them to
- Prep notes for each interview stage
- Tags and stage filters
- Import from a huntlog export file
- Keeps working when your connection drops, and syncs when it comes back
- Light and dark mode, on desktop and phone

## Run it locally

Requires [Bun](https://bun.sh) and Node.js 24 or newer.

```sh
bun install
bun run relay
bun run dev
```

`bun run relay` starts a local sync relay on `ws://localhost:4000`, the landing page runs at `http://localhost:5173`, and the app runs at `http://app.localhost:5173`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_RELAY_URL` | `ws://localhost:4000` in development, Evolu's public relay in production | The relay the app syncs through |

To host your own relay, run `npx @evolu/relay` or the `evoluhq/relay` Docker image, then point `VITE_RELAY_URL` at it.

## Project structure

```
apps/app          the web app and landing page (React, Vite, Tailwind)
packages/shared   shared types and constants
scripts           maintenance scripts
```

## License

[MIT](LICENSE)
