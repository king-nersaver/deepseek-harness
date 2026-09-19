---
description: "叠加在 dsh-base 之上的可选低外发（low-egress）覆盖层：在部署重新启用前，关闭随附的 DeepSeek 请求路径、遥测上传与内置 Web 搜索。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-base-barebones

[English](README.md) | 中文

## 概述

`dsh-base-barebones` 是面向已挂载 [`dsh-base`](../base/README.zh.md) 的 profile 的可选覆盖层。它会禁用随附的 DeepSeek 适配器、请求侧 DeepSeek 元数据、模型生成的会话标题、遥测导出以及由 DeepSeek 驱动的 Web 搜索，从而提供一个更少默认外发路径的起点，供部署再通过后续 patch 或 bundle 逐项重建。它不会让 harness 变成离线或完全安全的系统：shell 工具、MCP 服务器，以及你重新启用的任意 provider 或 Web 后端仍可访问远端系统。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

当你想保留共享核心、同时关闭随附的 DeepSeek 外发路径时，请在自定义 profile 中把本 bundle 放在 `@deepseek-ai/dsh-base` 之后：

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

此覆盖层会让这些 base 配置行保持不激活，直到后续 patch 或 bundle 再次替换它们：`llm-deepseek`、`session-log-deepseek`、`plugin-package-inventory-deepseek`、`session-title-llm`、`session-telemetry-otel` 与 `web-search-deepseek`。它还会清除 base 对 Web 搜索 provider 的固定选择，让 `tool-web` 仅保留 `web_fetch`，并把 `agent-default-model` 改写为 `configure-provider` / `configure-model`，使部署必须显式选择模型路由，而不是继承随附的 DeepSeek 默认值。

因为它只是覆盖层，所以之后的 profile、home 或单次调用 patch 仍可显式重新启用任意配置行。例如，部署可以挂载别的 LLM 适配器、恢复 `web_search`，或在保留其余精简默认值的同时，用自己的 exporter URL 重新打开遥测。

-----

<a id="model-experience"></a>
## 模型体验

### 更低外发的默认表面

#### 模型会看到什么

在后续层重新启用前，不会有可用的 provider 路由、模型生成的标题请求，也不会有 `web_search` 工具。`web_fetch` 仍保留 base 包的默认引导文本。

#### Token 影响

该覆盖层本身不增加任何请求前缀。禁用随附的标题生成器也会移除它的辅助标题模型请求。

#### KV Cache 影响

本身没有；该 bundle 只负责禁用配置行或替换配置，后续重新启用后的缓存行为仍由对应行所属的包负责。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **它不是隔离边界**——harness 仍暴露 shell 工具、配置沙盒内的本地进程执行、文件系统访问，以及之后重新启用的任意 provider 或 Web 后端。
- **仍需显式选择模型**——此覆盖层把 base 的默认模型改写为占位值，因此部署必须先提供并保存一个真实的 provider/model，之后模型驱动的工作才会成功。
- **公开 Web 抓取仍可用**——该覆盖层禁用的是随附的 DeepSeek Web 搜索路径，而不是 provider-neutral 的 `web_fetch` 能力；若某个 profile 也必须避免这条外发路径，还需额外禁用 `tool-web` 或 `web-fetch-http`。


<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>

**运行时不变式：** 不发布 companion。该 bundle 只是叠加在 `dsh-base` 所有 id 之上的静态 patch；每条受影响配置行的运行时行为仍由所属包各自负责。
