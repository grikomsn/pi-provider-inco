import assert from "node:assert/strict";
import { appendFile } from "node:fs/promises";

// Runs only in the isolated regression-test host. No request can reach a service.
export default function installTestFetch(): void {
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(url.origin, "https://api.inco.ai");
    assert.equal(url.pathname, "/v1/chat/completions");
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.model, "glm-5.3-flash");
    assert.equal(payload.reasoning_effort, "high");
    await appendFile(process.env.INCO_TEST_FETCH_LOG!, "inference\n");
    const chunk = {
      id: "inco-test", object: "chat.completion.chunk", created: 1,
      model: payload.model,
      choices: [{ index: 0, delta: { role: "assistant", content: "PACKED_INCO_OK" }, finish_reason: null }],
    };
    const end = {
      ...chunk,
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    };
    return new Response(`data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(end)}\n\ndata: [DONE]\n\n`, {
      headers: { "content-type": "text/event-stream" },
    });
  };
}
