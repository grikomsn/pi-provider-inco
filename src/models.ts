import type { Model } from "@earendil-works/pi-ai";
import { INCO_BASE_URL, type ReasoningEffort, type CatalogModel } from "./catalog.ts";

export function toPiModel(model: CatalogModel): Model<"openai-completions"> {
  const value = (effort: ReasoningEffort): ReasoningEffort | null => model.efforts.includes(effort) ? effort : null;
  return {
    id: model.id, name: model.name, provider: "inco", api: "openai-completions", baseUrl: INCO_BASE_URL,
    reasoning: model.efforts.length > 0,
    thinkingLevelMap: { off: value("none"), minimal: value("minimal"), low: value("low"), medium: value("medium"), high: value("high"), xhigh: value("xhigh"), max: value("max") },
    input: model.imageInput ? ["text", "image"] : ["text"],
    contextWindow: model.contextWindow, maxTokens: model.maxTokens,
    cost: { input: model.cost?.input ?? 0, output: model.cost?.output ?? 0, cacheRead: model.cost?.cacheRead ?? 0, cacheWrite: 0 },
    compat: { supportsStore: false, supportsDeveloperRole: false, supportsUsageInStreaming: true, maxTokensField: "max_completion_tokens", thinkingFormat: "openai" },
  };
}
