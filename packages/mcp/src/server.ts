import { Console } from "node:console";
import * as Evolu from "@evolu/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createStore } from "@huntlog/shared/store";
import { connect } from "./evolu";
import { registerTools } from "./tools";
import { version } from "../package.json";

globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr });

const DEFAULT_RELAY = "wss://free.evoluhq.com";

const phrase = Evolu.Mnemonic.fromUnknown(
  (process.env.HUNTLOG_RECOVERY_PHRASE ?? "").trim().replace(/\s+/g, " ")
);
if (!phrase.ok) {
  console.error(
    "huntlog-mcp needs HUNTLOG_RECOVERY_PHRASE: the 24 words from Settings → Recovery phrase at https://app.huntlog.dev."
  );
  process.exit(1);
}

const connection = connect(phrase.value, process.env.HUNTLOG_RELAY_URL || DEFAULT_RELAY);
const ready = connection.then((connection) => ({
  connection,
  store: createStore(() => Promise.resolve(connection.evolu)),
}));
ready.catch((error: unknown) => {
  console.error("huntlog-mcp couldn't open the database:", error);
  process.exit(1);
});

const server = new McpServer(
  { name: "huntlog", version },
  {
    instructions:
      "huntlog is the user's job search tracker. Applications move through the stages applied → assessment → recruiter_screen → technical_interview → offer, and end as rejected or accepted. Leads are jobs to apply to later. Every change syncs, end-to-end encrypted, to the user's other devices. Check list_applications before adding one, to avoid duplicates.",
  }
);
registerTools(server, ready);
await server.connect(new StdioServerTransport());
