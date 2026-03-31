## ADDED Requirements

### Requirement: Two-panel conversation layout

The conversation page SHALL display a two-panel layout: chat panel on the left, BDD preview panel on the right.

#### Scenario: Initial conversation view

- **WHEN** user navigates to a conversation page
- **THEN** the left panel shows the message history and input area, and the right panel is empty (no pending changes yet)

#### Scenario: Responsive layout

- **WHEN** the viewport width is below the mobile breakpoint
- **THEN** the layout switches to a single-column view with a tab/toggle to switch between chat and BDD preview

### Requirement: Streaming message display

The chat panel SHALL display AI responses in real-time as `text-delta` SSE events arrive, showing a typewriter effect.

#### Scenario: Streaming text appears incrementally

- **WHEN** user sends a message and the server streams `text-delta` events
- **THEN** the AI response text appears character-by-character in the chat panel with auto-scroll to bottom

#### Scenario: Loading state during streaming

- **WHEN** the AI is processing (between message send and `done` event)
- **THEN** a loading indicator is shown and the send button is disabled

#### Scenario: User can abort streaming

- **WHEN** user clicks the stop/abort button during streaming
- **THEN** the SSE connection is closed, partial response is kept in the chat, and the input is re-enabled

### Requirement: BDD preview panel

The right panel SHALL show proposed BDD changes as they arrive via `bdd-change` SSE events. Only affected Features (new + modified) are displayed.

#### Scenario: New feature appears in preview

- **WHEN** a `bdd-change` event arrives with `new_features`
- **THEN** the right panel shows the new Feature card(s) with all Scenarios and steps, marked as "New"

#### Scenario: Modified feature appears in preview

- **WHEN** a `bdd-change` event arrives with `modified_features`
- **THEN** the right panel shows the modified Feature card(s) with changed Scenarios highlighted and unchanged Scenarios collapsed

#### Scenario: Changes accumulate across turns

- **WHEN** multiple conversation turns each produce `bdd-change` events
- **THEN** the right panel shows the accumulated state of all proposed changes, merging updates to the same Feature

### Requirement: Apply and discard actions

The right panel SHALL provide "Apply All" and "Discard Changes" buttons when pending changes exist.

#### Scenario: Apply all changes

- **WHEN** user clicks "Apply All" (全部应用)
- **THEN** system sends `POST /api/conversations/:id/apply`, and on success the right panel shows a success confirmation and pending changes are cleared

#### Scenario: Discard changes

- **WHEN** user clicks "Discard Changes" (放弃变更)
- **THEN** system sends `POST /api/conversations/:id/discard`, pending changes are cleared from the right panel

#### Scenario: Confirm before discard

- **WHEN** user clicks "Discard Changes"
- **THEN** a confirmation dialog appears before actually discarding

### Requirement: Message input

The chat input area SHALL support text input with send action.

#### Scenario: Send text message

- **WHEN** user types a message and presses Enter or clicks Send
- **THEN** the message is sent to `POST /api/conversations/:id/messages` and appears in the chat

### Requirement: Conversation list page

The project detail page SHALL include a section or link to view all conversations for that project, with the ability to create a new conversation.

#### Scenario: View conversations for a project

- **WHEN** user navigates to the conversations section of a project
- **THEN** system displays a list of conversations showing status, creation date, and a preview of the first message

#### Scenario: Create new conversation

- **WHEN** user clicks "New Conversation"
- **THEN** system creates a new conversation via API and navigates to the conversation page

### Requirement: Chat uses @ai-sdk/react integration

The chat interface SHALL use `@ai-sdk/react` hooks (or a compatible custom hook) for managing streaming state, message history, loading state, and abort functionality.

#### Scenario: Hook manages streaming lifecycle

- **WHEN** user sends a message
- **THEN** the `useChat`-compatible hook handles the SSE connection, parses events, updates message state, and manages loading/error states
