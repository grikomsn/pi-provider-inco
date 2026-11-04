import assert from "node:assert/strict";
import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { diskStorage } from "../src/index.ts";

const ENV = ["HOME", "PI_CODING_AGENT_DIR"] as const;

/** Run with an isolated HOME and cwd; pi's agent directory derives from both. */
async function isolated(agentDir: string | undefined, fn: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "inco-storage-test-"));
  const saved = Object.fromEntries(ENV.map((name) => [name, process.env[name]]));
  const cwd = process.cwd();
  process.env.HOME = join(root, "home");
  if (agentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
  else process.env.PI_CODING_AGENT_DIR = agentDir;
  process.chdir(root);
  try {
    await fn(root);
  } finally {
    process.chdir(cwd);
    for (const name of ENV) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
    await rm(root, { recursive: true, force: true });
  }
}

const payload = { data: [{ id: "glm-5.3" }] };

test("cache defaults to pi's agent directory under HOME", async () => {
  await isolated(undefined, async (root) => {
    const storage = diskStorage();
    await storage.write("scope", payload);
    await access(join(root, "home", ".pi", "agent", "cache", "pi-provider-inco", "scope.json"));
    assert.deepEqual(await storage.read("scope"), payload);
  });
});

test("an empty PI_CODING_AGENT_DIR counts as unset instead of writing under cwd", async () => {
  await isolated("", async (root) => {
    await diskStorage().write("scope", payload);
    await access(join(root, "home", ".pi", "agent", "cache", "pi-provider-inco", "scope.json"));
    assert.deepEqual((await readdir(root)).sort(), ["home"]);
  });
});

test("a tilde PI_CODING_AGENT_DIR expands to HOME", async () => {
  await isolated("~/custom-agent", async (root) => {
    await diskStorage().write("scope", payload);
    await access(join(root, "home", "custom-agent", "cache", "pi-provider-inco", "scope.json"));
    assert.deepEqual((await readdir(root)).sort(), ["home"]);
  });
});

test("the agent directory is resolved at access time, not at construction", async () => {
  await isolated(undefined, async (root) => {
    const storage = diskStorage();
    process.env.PI_CODING_AGENT_DIR = join(root, "late");
    await storage.write("scope", payload);
    await access(join(root, "late", "cache", "pi-provider-inco", "scope.json"));
  });
});

test("an injected agent directory is honoured", async () => {
  await isolated(undefined, async (root) => {
    await diskStorage(() => join(root, "injected")).write("scope", payload);
    await access(join(root, "injected", "cache", "pi-provider-inco", "scope.json"));
  });
});
