import type { Model } from "@earendil-works/pi-ai";
import { INCO_BASE_URL, type ReasoningEffort, type CatalogModel } from "./catalog.ts";

export function toPiModel(model: CatalogModel): Model<"openai-completions"> {
  const value = (effort: ReasoningEffort): ReasoningEffort | null => model.efforts.includes(effort) ? effort : null;
  // pi's default thinking level is "medium"; when the route does not accept
  // "medium" natively the slot steers to the model's nominated default effort
  // (mirroring the ai& and Inco Copilot bridges), so a fresh session starts at
  // the effort the service would pick itself.
  const medium = value("medium") ?? (model.defaultEffort !== undefined ? model.defaultEffort : null);
  return {
    id: model.id, name: model.name, provider: "inco", api: "openai-completions", baseUrl: INCO_BASE_URL,
    reasoning: model.efforts.length > 0,
    thinkingLevelMap: { off: value("none"), minimal: value("minimal"), low: value("low"), medium, high: value("high"), xhigh: value("xhigh"), max: value("max") },
    input: model.imageInput ? ["text", "image"] : ["text"],
    contextWindow: model.contextWindow, maxTokens: model.maxTokens,
    cost: { input: model.cost?.input ?? 0, output: model.cost?.output ?? 0, cacheRead: model.cost?.cacheRead ?? 0, cacheWrite: 0 },
    compat: { supportsStore: false, supportsDeveloperRole: false, supportsUsageInStreaming: true, maxTokensField: "max_completion_tokens", thinkingFormat: "openai" },
  };
}
