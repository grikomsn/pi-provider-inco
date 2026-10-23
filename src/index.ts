import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createProvider, envApiKeyAuth, lazyApi, type Provider, type ProviderStreams } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { FALLBACK_MODELS, INCO_BASE_URL, type CatalogModel } from "./catalog.ts";
import { discoverModels, credentialScope, type CatalogStorage } from "./discovery.ts";
import { toPiModel } from "./models.ts";
import { prepareRequest } from "./request.ts";

function diskStorage(): CatalogStorage {
  const directory = join(process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent"), "cache", "pi-provider-inco");
  return {
    read: async (scope) => JSON.parse(await readFile(join(directory, `${scope}.json`), "utf8")),
    write: async (scope, value) => {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const target = join(directory, `${scope}.json`);
      const temp = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify(value), { mode: 0o600 });
      await rename(temp, target);
    },
  };
}

export function incoProvider(storage: CatalogStorage = diskStorage(), fetcher: typeof fetch = fetch): Provider<"openai-completions"> {
  let catalog: CatalogModel[] = FALLBACK_MODELS;
  let scope: string | undefined;
  const api = lazyApi(() => import("@earendil-works/pi-ai/api/openai-completions"));
  const wrap: ProviderStreams = {
    stream: (model, context, options) => api.stream({ ...model, baseUrl: INCO_BASE_URL }, context, {
      ...options,
      onPayload: async (payload, selected) => prepareRequest(await options?.onPayload?.(payload, selected) ?? payload, model.id, catalog),
    }),
    streamSimple: (model, context, options) => api.streamSimple({ ...model, baseUrl: INCO_BASE_URL }, context, {
      ...options,
      onPayload: async (payload, selected) => prepareRequest(await options?.onPayload?.(payload, selected) ?? payload, model.id, catalog),
    }),
  };
  const provider = createProvider<"openai-completions">({
    id: "inco", name: "Inco AI", baseUrl: INCO_BASE_URL,
    auth: { apiKey: envApiKeyAuth("Inco AI API key", ["INCO_API_KEY"]) },
    models: [], api: wrap,
  });
  return {
    ...provider,
    getModels: () => catalog.map(toPiModel),
    getAllModels: () => catalog.map(toPiModel),
    filterModels: (models, credential) => {
      const key = (credential?.type === "api_key" ? credential.key : undefined) ?? process.env.INCO_API_KEY;
      return key && scope && scope !== credentialScope(key) ? [] : models;
    },
    refreshModels: async (context) => {
      const key = (context.credential?.type === "api_key" ? context.credential.key : undefined) ?? process.env.INCO_API_KEY;
      const nextScope = key ? credentialScope(key) : undefined;
      let next = FALLBACK_MODELS;
      if (key && context.allowNetwork) next = await discoverModels(key, storage, context.signal, fetcher);
      else if (key) {
        try {
          const { parseCatalog } = await import("./catalog.ts");
          next = parseCatalog(await storage.read(nextScope!));
        } catch { /* Offline initialization without a matching cache. */ }
      }
      await context.publish({ update: () => { catalog = next; scope = nextScope; } });
    },
  };
}

export default async function incoExtension(pi: ExtensionAPI): Promise<void> {
  // Pi initially restores newly registered native providers cache-only. Complete
  // discovery before registration so startup model selection also sees new routes.
  const { readStoredCredential } = await import("@earendil-works/pi-coding-agent");
  const provider = incoProvider();
  const offline = /^(1|true|yes)$/i.test(process.env.PI_OFFLINE ?? "") || process.argv.includes("--offline");
  await provider.refreshModels!({
    credential: readStoredCredential("inco"),
    allowNetwork: !offline,
    signal: new AbortController().signal,
    publish: async (publication) => { publication.update?.(); return true; },
  });
  pi.registerProvider(provider);
}
export * from "./catalog.ts";
export { toPiModel } from "./models.ts";
