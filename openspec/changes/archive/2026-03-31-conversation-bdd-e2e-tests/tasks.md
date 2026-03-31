## 1. Fixtures 准备

- [x] 1.1 在 `tests/e2e/fixtures/data-fixtures.ts` 中添加 `createLlmConfig` / `deleteLlmConfig` helper 函数，从 `.env.test` 环境变量读取 LLM 配置并通过 `/api/llm-configs` API 创建 platform 级别配置
- [x] 1.2 在 `data-fixtures.ts` 中添加 `testLlmConfig` fixture，自动创建和清理 LLM config
- [x] 1.3 在 `data-fixtures.ts` 中添加 `testConversation` fixture（依赖 testProject），自动创建对话并在测试后清理
- [x] 1.4 添加 `hasLlmConfig` 辅助常量，用于 `test.skip(!hasLlmConfig, ...)` 跳过无 LLM 配置的测试
- [x] 1.5 添加 SSE 流解析工具函数 `parseSSEStream(response)`，使用原生 fetch + ReadableStream 解析 SSE 事件，返回事件数组

## 2. Conversation API CRUD 测试

- [x] 2.1 创建 `tests/e2e/api/conversations.spec.ts`，编写 CRUD describe 块：创建对话、创建对话（无效项目）、列表对话、空列表、获取详情、获取不存在的对话、删除对话

## 3. Conversation API SSE 消息流测试

- [x] 3.1 在 `conversations.spec.ts` 中编写 SSE 消息流 describe 块：使用 fetch 发送 POST 请求，解析 SSE 事件流，验证 text-delta 和 done 事件格式
- [x] 3.2 编写 BDD 生成测试：发送要求生成 BDD 的消息，验证 bdd-change 事件和 pending_changes 更新
- [x] 3.3 编写错误场景测试：空消息（400）、不存在的对话（404）
- [x] 3.4 编写消息持久化测试：验证 done 事件后 GET 对话详情包含更新的 messages

## 4. Conversation API Apply / Discard 测试

- [x] 4.1 编写 apply 测试：在对话有 pending_changes 后调用 apply，验证返回 applied_features，验证 features 被创建
- [x] 4.2 编写 apply 无 pending_changes 测试：验证返回 400 NO_PENDING_CHANGES
- [x] 4.3 编写 discard 测试：验证 pending_changes 被清空

## 5. Conversation Web UI 测试

- [x] 5.1 创建 `tests/e2e/web/conversations.spec.ts`，编写列表页 describe 块：空列表展示、创建新对话导航、对话列表展示、删除对话
- [x] 5.2 编写聊天页 describe 块：输入区域展示、发送消息后看到用户气泡和流式助手回复
- [x] 5.3 编写 BDD 预览面板 describe 块：生成 BDD 后右侧面板展示 new feature 卡片、Given/When/Then 步骤
- [x] 5.4 编写 Apply/Discard 按钮 describe 块：点击 Apply 后 pending changes 清空、点击 Discard 后确认对话框和清空

## 6. Agent 行为测试

- [x] 6.1 创建 `tests/e2e/api/agent-behavior.spec.ts`，编写 update_bdd describe 块：验证 bdd-change 事件中 new_features 结构正确（title、description、scenarios、steps）
- [x] 6.2 编写 tool_calls 持久化测试：验证 conversation messages 中包含 assistant 的 tool_calls 元数据
- [x] 6.3 编写上下文查询测试：先创建 Feature，再发消息要求修改，验证 agent 使用 search_features/get_feature_detail
- [x] 6.4 编写多轮对话测试：第一轮生成 BDD，第二轮追加场景，验证 pending_changes 被合并更新

## 7. 运行验证

- [x] 7.1 运行完整测试套件 `pnpm exec playwright test`，确保所有测试通过，修复发现的问题
