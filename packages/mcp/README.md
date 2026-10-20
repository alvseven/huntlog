# huntlog-mcp

An [MCP](https://modelcontextprotocol.io) server for [huntlog](https://huntlog.dev). It lets an AI agent read and update your job search: log applications, move them through stages, add interview notes, save leads. Every change shows up in [app.huntlog.dev](https://app.huntlog.dev) on all your devices.

## How it works

huntlog has no server that can read your data. Your recovery phrase is your identity and your encryption key, and any device that has it holds a copy of your data and syncs it, end-to-end encrypted, through a relay that only ever sees ciphertext.

huntlog-mcp is one more of those devices. It runs on your machine, uses your recovery phrase to decrypt your data in memory, and syncs changes through the same relay. It writes nothing to disk. Each write waits until the relay confirms it, so when the agent says it saved something, your phone and laptop already have it.

## Before you start

- **Your recovery phrase gives full access to your data, and it can't be changed.** Only put it in config files on machines you trust.
- **The AI model sees whatever the agent reads.** If you use a hosted model, the data the agent reads goes to that provider, as with anything else you share in a chat.
- **Run it locally.** Don't give your phrase to a hosted agent or a remote MCP server: whoever runs it can read and change everything.

## Setup

You need Node.js 24.20 or newer and your recovery phrase from **Settings → Recovery phrase** at [app.huntlog.dev](https://app.huntlog.dev).

### Claude Desktop, Cursor, Windsurf and other MCP clients

Add this to your client's MCP config file (`claude_desktop_config.json`, `.cursor/mcp.json`, …):

```json
{
  "mcpServers": {
    "huntlog": {
      "command": "npx",
      "args": ["-y", "huntlog-mcp"],
      "env": {
        "HUNTLOG_RECOVERY_PHRASE": "your twenty four words ..."
      }
    }
  }
}
```

### Claude Code

```sh
claude mcp add huntlog --scope user --env HUNTLOG_RECOVERY_PHRASE="your twenty four words ..." -- npx -y huntlog-mcp
```

This puts the phrase in your shell history. To avoid that, add the JSON above to `~/.claude.json` instead.

## Configuration

| Variable | Required | Default |
| --- | --- | --- |
| `HUNTLOG_RECOVERY_PHRASE` | yes | |
| `HUNTLOG_RELAY_URL` | no | `wss://free.evoluhq.com`, the relay app.huntlog.dev uses |

If you [self-host a relay](https://github.com/alvseven/huntlog#self-host-the-relay), point the app and huntlog-mcp at the same URL.

## Tools

| Tool | What it does |
| --- | --- |
| `get_overview` | Stats, stage funnel, overdue follow-ups and tags |
| `list_applications`, `get_application` | Find applications by stage or text; read one with its prep notes |
| `create_application` | Log an application; flags possible duplicates |
| `update_application` | Change any field, such as the stage or the next action |
| `delete_application` | Delete an application and its notes |
| `add_prep_note`, `update_prep_note`, `delete_prep_note` | Interview prep notes on an application |
| `list_leads`, `create_lead`, `update_lead`, `delete_lead` | Jobs to apply to later |
| `convert_lead_to_application` | Mark a lead as applied |
| `list_resources`, `create_resource`, `update_resource`, `delete_resource` | Saved links |
| `list_resumes`, `delete_resume` | Resume versions uploaded in the app |

Delete tools are marked destructive, so clients that ask before destructive actions will ask you first.

## Things to ask

- "I just applied to Acme for Senior Backend Engineer via LinkedIn. Log it and remind me to follow up next Friday."
- "Which follow-ups are overdue? Draft a short message for each."
- "Move my Globex application to technical interview and add a note that they asked about Kafka."
- "What's my response rate by source this month?"

## Development

From the repo root, `bun install`, then in `packages/mcp`:

```sh
bun run build   # bundles to dist/
bun run test    # starts a relay in-process and drives the server through an MCP client
```

## License

[MIT](./LICENSE)
