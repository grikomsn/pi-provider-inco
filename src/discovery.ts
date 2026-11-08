import { createHash } from "node:crypto";
import { CatalogError, FALLBACK_MODELS, fetchCatalog, parseCatalog, type CatalogModel } from "./catalog.ts";

export interface CatalogStorage {
  read(scope: string): Promise<unknown>;
  write(scope: string, value: ReturnType<typeof catalogPayload>): Promise<void>;
}

export function credentialScope(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function catalogPayload(models: readonly CatalogModel[]): { version: number; data: Record<string, unknown>[] } {
  // Versioned payload: a future CatalogModel shape change must not silently
  // mis-parse an older cache into fallback values.
  return { version: 2, data: models.map((m) => ({
    id: m.id, name: m.name, context_length: m.contextWindow, max_output_tokens: m.maxTokens,
    capabilities: { tool_calling: m.toolCalling }, modalities: { input: m.imageInput ? ["text", "image"] : ["text"] },
    reasoning_efforts: m.efforts,
    ...(m.defaultEffort !== undefined ? { reasoning_effort_default: m.defaultEffort } : {}),
    ...(m.cost ? { pricing: { input: m.cost.input, output: m.cost.output, cached_input: m.cost.cacheRead } } : {}),
  })) };
}

/** Accept only cache payloads this build wrote; older shapes parse as fallback values. */
export function isCurrentCachePayload(saved: unknown): boolean {
  return typeof saved === "object" && saved !== null && !Array.isArray(saved)
    && (saved as Record<string, unknown>).version === 2
    && Array.isArray((saved as Record<string, unknown>).data);
}

/** Only public catalog metadata is persisted, under a one-way key fingerprint. */
export async function discoverModels(apiKey: string, storage: CatalogStorage, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<CatalogModel[]> {
  const scope = credentialScope(apiKey);
  const save = async (models: CatalogModel[]): Promise<CatalogModel[]> => {
    try { await storage.write(scope, catalogPayload(models)); } catch { /* Cache failure does not invalidate a live catalog. */ }
    return models;
  };
  try { return await save(await fetchCatalog(apiKey, signal, fetcher)); }
  catch (error) {
    if (error instanceof CatalogError && error.refused) return save([]);
    if (signal?.aborted) throw error;
    try {
      const saved = await storage.read(scope);
      if (isCurrentCachePayload(saved)) return parseCatalog(saved);
    } catch { /* Invalid or unavailable cache: use the public snapshot. */ }
    return FALLBACK_MODELS;
  }
}
