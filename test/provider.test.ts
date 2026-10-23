import assert from "node:assert/strict";
import { test } from "node:test";
import extension, { incoProvider, toPiModel, FALLBACK_MODELS } from "../src/index.ts";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { RefreshModelsContext } from "@earendil-works/pi-ai";

const context = (key: string, allowNetwork = true): RefreshModelsContext => ({
  credential: { type: "api_key", key }, allowNetwork, signal: new AbortController().signal,
  publish: async (publication) => { publication.update?.(); return true; },
});
test("native provider registers with host and owns chat/all-model inventories", async () => {
  let id: string | undefined;
  await extension({ registerProvider: (provider: { id: string }) => { id = provider.id; } } as unknown as ExtensionAPI);
  assert.equal(id, "inco");
  const provider = incoProvider();
  assert.equal(provider.getModels().length, 10);
  assert.equal(provider.getAllModels!().length, 10);
});
test("native discovery replaces inventories and removes refused credentials", async () => {
  const saved = new Map<string, unknown>();
  let status = 200;
  const provider = incoProvider({ read: async (s) => saved.get(s), write: async (s, v) => { saved.set(s, v); } }, async () =>
    status === 200 ? Response.json({ data: [{ id: "only-live", reasoning_efforts: ["high"] }] }) : new Response(null, { status }));
  await provider.refreshModels!(context("first"));
  assert.deepEqual(provider.getModels().map((m) => m.id), ["only-live"]);
  assert.deepEqual(provider.filterModels!(provider.getModels(), { type: "api_key", key: "second" }), []);
  status = 403;
  await provider.refreshModels!(context("first"));
  assert.deepEqual(provider.getModels(), []);
  await provider.refreshModels!(context("first", false));
  assert.deepEqual(provider.getModels(), []);
});
test("pi thinking mappings expose only accepted model values and native compatibility", () => {
  const glm = toPiModel(FALLBACK_MODELS.find((m) => m.id === "glm-5.3")!);
  assert.equal(glm.thinkingLevelMap!.off, null);
  assert.equal(glm.thinkingLevelMap!.medium, null);
  assert.equal(glm.thinkingLevelMap!.high, "high");
  assert.equal(glm.compat!.maxTokensField, "max_completion_tokens");
  assert.equal(toPiModel(FALLBACK_MODELS.find((m) => m.id === "deepseek-v4.1-flash:fast")!).thinkingLevelMap!.off, "none");
});
