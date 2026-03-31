## Why

Conversation BDD 是系统的核心功能流程（创建对话 → 发送消息 → AI 生成 BDD → 应用/丢弃变更），但目前没有 e2e 测试覆盖。现有 e2e 测试只覆盖了 Project、Feature、Repository、Task 等 CRUD 端点和基础 Web UI，需要补充：

1. Conversation API 的完整 e2e 测试
2. Conversation Web UI 的 e2e 测试（列表页、对话页、BDD 预览面板、Apply/Discard 操作）
3. Agent 行为的 e2e 测试（验证 BDD agent 正确使用 tools：update_bdd、search_features、get_feature_detail）

## What Changes

- 新增 `tests/e2e/api/conversations.spec.ts`，覆盖 Conversation API CRUD、SSE 消息流、apply/discard 流程
- 新增 `tests/e2e/web/conversations.spec.ts`，覆盖 Conversation Web UI：列表页、创建对话、对话聊天页、消息发送与流式展示、BDD 预览面板、Apply/Discard 按钮
- 新增 `tests/e2e/api/agent-behavior.spec.ts`，覆盖 Agent 行为：验证 agent 调用 update_bdd 生成正确结构的 BDD、验证多轮对话中 agent 使用 search_features/get_feature_detail 查询已有 Feature
- 在 `data-fixtures.ts` 中添加 conversation 相关的 fixture（testConversation、testLlmConfig）
- 测试需要真实 LLM 配置（从 .env.test 读取）

## Capabilities

### New Capabilities

- `e2e-conversation-api-tests`: E2e test suite for Conversation BDD API endpoints covering CRUD, SSE streaming messages, and apply/discard flows
- `e2e-conversation-web-tests`: E2e test suite for Conversation Web UI covering conversation list, chat interface, streaming display, BDD preview panel, and apply/discard buttons
- `e2e-agent-behavior-tests`: E2e test suite verifying BDD agent tool usage behavior — update_bdd produces valid GeneratedChanges, agent uses search_features/get_feature_detail for context

### Modified Capabilities

## Impact

- 新增测试文件: `tests/e2e/api/conversations.spec.ts`, `tests/e2e/api/agent-behavior.spec.ts`, `tests/e2e/web/conversations.spec.ts`
- 修改 fixture: `tests/e2e/fixtures/data-fixtures.ts` 添加 conversation 和 llm-config helpers
- 依赖: 需要运行中的 PostgreSQL、有效的 LLM API 配置、Web dev server
- 不影响生产代码，只新增测试代码
