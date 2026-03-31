## Context

现有 e2e 测试使用 Playwright Test 框架：

- API 测试通过 `APIRequestContext` 调用 REST API（`tests/e2e/api/`）
- Web 测试通过 Playwright page 对象操作浏览器（`tests/e2e/web/`）
- 自定义 fixture：`api-fixture.ts` 提供 API client，`data-fixtures.ts` 提供 testProject/testFeature
- `global-setup.ts` 在测试运行前清空数据库
- `playwright.config.ts` 配置了 api 和 web 两个 project，分别使用 localhost:3001 和 localhost:3000

Conversation API 包含 7 个端点：CRUD（创建/列表/详情/删除）、SSE 消息流、apply 和 discard。SSE 消息端点需要有效的 LLM 配置。

Web UI 包含两个页面：

- `ConversationListPage`（`/projects/:projectId/conversations`）：列表、创建、删除对话
- `ConversationDetailPage`（`/projects/:projectId/conversations/:id`）：聊天界面、BDD 预览面板、Apply/Discard

Agent 使用 `@mariozechner/pi-agent-core`，有 3 个 tools：`update_bdd`、`search_features`、`get_feature_detail`。

## Goals / Non-Goals

**Goals:**

- 验证 Conversation CRUD 端点的正确性
- 验证 SSE 消息流端点能正确返回 text-delta、bdd-change、done 事件
- 验证 apply/discard pending changes 的完整流程
- 验证 Web UI 的对话列表页、聊天页、BDD 预览面板、Apply/Discard 交互
- 验证 Agent 行为：调用 update_bdd 生成正确的 GeneratedChanges 结构
- 验证 Agent 在有已有 Feature 时使用 search_features/get_feature_detail 查询上下文
- 验证错误场景（404、400 等）

**Non-Goals:**

- 不 mock LLM 响应（这是真正的 e2e 测试）
- 不测试 LLM 回答的内容质量
- 不测试 Web UI 的样式/布局

## Decisions

### 1. API 测试文件拆分

API 测试拆分为两个文件：

- `conversations.spec.ts`：CRUD + SSE 消息流 + Apply/Discard
- `agent-behavior.spec.ts`：Agent tool 使用行为验证

**理由**: CRUD 和消息流是同一端点的不同层面，放在一起。Agent 行为测试关注的是 LLM agent 的工具使用模式，是独立的验证维度。

### 2. Web 测试集中在一个文件

`tests/e2e/web/conversations.spec.ts`，按功能分 describe 块。

**理由**: 与现有 web 测试模式一致（features.spec.ts 等），对话列表和详情页关联紧密。

### 3. LLM 配置策略

测试运行前，通过 API 创建 platform 级别的 LLM config（从 `.env.test` 环境变量读取）。使用 fixture 自动创建和清理。

**理由**: `.env.test` 已包含 LLM 配置项（`LLM_CONFIG_BASE_URL`, `LLM_CONFIG_API_KEY`, `LLM_CONFIG_PROVIDER`, `LLM_CONFIG_MODEL`）。

### 4. SSE 流解析方案

使用原生 fetch + ReadableStream 手动解析 SSE 事件，而不是 EventSource。

**理由**: `POST /api/conversations/:id/messages` 是 POST 请求，EventSource 只支持 GET。Playwright 的 APIRequestContext 也不直接支持 SSE。

### 5. Agent 行为验证方式

通过 SSE 事件流中的 `bdd-change` 事件来验证 agent 调用了 `update_bdd`，检查 pending_changes 结构。通过 conversation messages 中的 tool_calls 来验证 agent 是否使用了 search_features/get_feature_detail。

**理由**: 不需要 mock agent，直接通过 API 返回的数据验证 agent 的实际行为。

### 6. 超时与 skip 策略

- LLM 相关测试设置 90s 超时
- 如果 LLM 环境变量未配置，跳过需要 LLM 的测试
- Web 对话测试同样依赖 LLM，也需要 skip 逻辑

## Risks / Trade-offs

- **LLM API 不可用** → `test.skip()` 条件跳过，CRUD 测试不受影响
- **LLM 响应不稳定** → 只验证事件格式和数据结构，不验证具体文本内容
- **测试执行时间长** → LLM 测试可能需要 30-90s，设置独立超时
- **Agent 行为不确定性** → Agent 可能不总是调用 search_features，测试设计为"当有已有 Feature 时应该查询"
