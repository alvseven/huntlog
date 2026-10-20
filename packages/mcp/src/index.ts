#!/usr/bin/env node
const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
if (process.versions.bun || major < 24 || (major === 24 && minor < 20)) {
  process.stderr.write("huntlog-mcp needs Node.js 24.20 or newer. Run it with `npx -y huntlog-mcp`.\n");
  process.exit(1);
}

await import("./server");

export {};
