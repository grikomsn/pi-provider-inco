import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("packed provider streams GLM through bundled pi without locally installed SDK peers", { timeout: 30_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "inco-packed-test-"));
  const repository = fileURLToPath(new URL("..", import.meta.url));
  const cli = fileURLToPath(new URL("./bundle/cli.js", import.meta.resolve("@earendil-works/pi-coding-agent")));
  try {
    execFileSync("npm", ["pack", "--ignore-scripts", "--pack-destination", root], {
      cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const archives = (await readdir(root)).filter((name) => name.endsWith(".tgz"));
    assert.equal(archives.length, 1);
    execFileSync("tar", ["-xzf", join(root, archives[0]), "-C", root]);
    const fixture = join(root, "host-fetch.ts");
    await copyFile(new URL("./fixtures/host-fetch.ts", import.meta.url), fixture);
    const agent = join(root, "agent");
    await mkdir(agent);
    await writeFile(join(agent, "settings.json"), JSON.stringify({ quietStartup: true, checkForUpdates: false }));
    const log = join(root, "fetch.log");
    const child = spawnSync(process.execPath, [
      cli, "--offline", "--no-extensions", "-e", fixture, "-e", join(root, "package"),
      "--no-mcp", "--no-skills", "--no-context-files", "--no-prompt-templates", "--no-themes",
      "--no-approve", "--no-session", "--no-tools", "--model", "inco/glm-5.3-flash", "--thinking", "high",
      "--mode", "json", "-p", "Reply with OK.",
    ], {
      cwd: root, encoding: "utf8", timeout: 20_000,
      env: {
        PATH: process.env.PATH, HOME: root, TERM: "xterm-256color",
        PI_CODING_AGENT_DIR: agent, PI_TELEMETRY: "0", PI_OFFLINE: "1",
        XDG_CONFIG_HOME: root, XDG_DATA_HOME: root, XDG_STATE_HOME: root, XDG_CACHE_HOME: root,
        INCO_API_KEY: "inco-regression-test-key", INCO_TEST_FETCH_LOG: log,
      },
    });
    assert.equal(child.status, 0, "Bundled pi failed (client output withheld)");
    assert.ok(!/Cannot find module|failed to load|extension error/i.test(child.stdout + child.stderr), "Packed extension failed to load its host transport");
    const events = child.stdout.split("\n").flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
    assert.ok(events.some((event) => event.type === "message_end" && event.message?.role === "assistant"
      && event.message.stopReason === "stop" && event.message.content?.some((part: { type: string; text?: string }) => part.type === "text" && part.text === "PACKED_INCO_OK")),
    "Packed extension did not complete its synthetic streamed response");
    assert.equal(await readFile(log, "utf8"), "inference\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
