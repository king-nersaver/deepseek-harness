---
description: "An opt-in low-egress overlay over dsh-base: disable the shipped DeepSeek request path, telemetry upload, and bundled web search until a deployment re-enables them."
kind: "package-bundle"
---

# @deepseek-ai/dsh-base-barebones

English | [中文](README.zh.md)

## Summary

`dsh-base-barebones` is an opt-in overlay for profiles that already mount [`dsh-base`](../base/README.md). It disables the shipped DeepSeek adapter, request-side DeepSeek metadata, model-generated session titles, telemetry export, and DeepSeek-backed web search, leaving a lower-egress starting point that a deployment can rebuild with later patches or bundles. It does not make the harness offline or fully safe: shell tools, MCP servers, and any provider or web backend you re-enable can still reach remote systems.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

List this bundle after `@deepseek-ai/dsh-base` in a custom profile when you want a shipped core with the default DeepSeek egress paths turned off:

```json
{
  "name": "my-profile",
  "private": true,
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-base-barebones"
      ]
    }
  }
}
```

The overlay makes these base rows inert until a later patch or bundle replaces them: `llm-deepseek`, `session-log-deepseek`, `plugin-package-inventory-deepseek`, `session-title-llm`, `session-telemetry-otel`, and `web-search-deepseek`. It also clears the base web search pin, keeps only `web_fetch` enabled in `tool-web`, and rewrites `agent-default-model` to `configure-provider` / `configure-model` so a deployment must choose a model route deliberately instead of inheriting the shipped DeepSeek default.

Because this is only an overlay, all later profile, home, or invocation patches can re-enable a row explicitly. For example, a deployment can mount another LLM adapter, restore `web_search`, or turn telemetry back on with its own exporter URL while keeping the rest of the stripped-down base.

-----

<a id="model-experience"></a>
## Model Experience

### Lower-egress default surface

#### What the model sees

No provider route, no model-generated title request, and no `web_search` tool are available until a later layer re-enables them. `web_fetch` remains available with the base package's default guidance.

#### Token effect

The overlay itself adds no request prefix. Disabling the bundled title generator also removes its auxiliary title-model requests.

#### KV Cache effect

None on its own; the bundle only disables rows or replaces config that later enabled rows would own.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Not an isolation boundary** — the harness still exposes shell tools, local process execution, filesystem access inside the configured sandbox, and any later-enabled provider or web backend.
- **Deliberate model selection is still required** — this overlay rewrites the base default model to a placeholder so a deployment must supply and save a real provider/model before model-backed work succeeds.
- **Public web fetch remains available** — the overlay disables the bundled DeepSeek web-search path, not the provider-neutral `web_fetch` capability; disable `tool-web` or `web-fetch-http` too when a profile must avoid that egress path.


<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

**Runtime invariant:** No companion is published. The bundle is a static patch overlay over ids owned by `dsh-base`; each affected row's package owns its own runtime behavior.
