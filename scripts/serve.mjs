#!/usr/bin/env node
/**
 * Start `next start` on port 3000, killing whatever is already holding it.
 *
 * The measurement scripts — scripts/visual-hero.mjs and
 * scripts/measure-vitals.mjs — drive a real browser against a real production
 * server, so they only tell the truth if the server is serving the build that
 * was just made. A stale `next start` left over from an earlier run keeps its
 * own build in memory and answers on the same port, which produces a clean
 * pass against the wrong bytes. That is the worst possible failure mode for a
 * verification harness, so freeing the port is part of starting it.
 *
 *   node scripts/serve.mjs           # blocks, serving .next
 *   node scripts/serve.mjs --stop    # just free the port
 */

import { spawn, execSync } from "node:child_process";
import net from "node:net";

const PORT = Number(process.env.PORT || 3000);

function portHolders() {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${PORT}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return [
        ...new Set(
          out
            .trim()
            .split(/\r?\n/)
            .map((line) => line.trim().split(/\s+/).pop())
            .filter((pid) => pid && pid !== "0")
        ),
      ];
    }
    const out = execSync(`lsof -ti tcp:${PORT}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return [...new Set(out.trim().split(/\s+/).filter(Boolean))];
  } catch {
    return [];
  }
}

function freePort() {
  for (const pid of portHolders()) {
    try {
      if (process.platform === "win32") execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      else process.kill(Number(pid), "SIGKILL");
      console.log(`freed port ${PORT} (pid ${pid})`);
    } catch {
      console.error(`could not kill pid ${pid} on port ${PORT}`);
    }
  }
}

function waitForPort(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(PORT, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`port ${PORT} never opened`));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

freePort();

if (process.argv.includes("--stop")) process.exit(0);

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "-p", String(PORT)],
  { stdio: "inherit", shell: process.platform === "win32" }
);

process.on("SIGINT", () => child.kill());
process.on("SIGTERM", () => child.kill());

await waitForPort();
console.log(`serving .next on http://localhost:${PORT}`);
