## ADDED Requirements

### Requirement: Conversation list page e2e tests

The test suite SHALL verify the conversation list page at `/projects/:projectId/conversations` displays correctly and supports creating/deleting conversations.

#### Scenario: View empty conversation list

- **WHEN** user navigates to `/projects/:projectId/conversations` for a project with no conversations
- **THEN** the page SHALL display the conversations heading and an empty state message

#### Scenario: Create new conversation from list page

- **WHEN** user clicks the "New" button on the conversation list page
- **THEN** the browser SHALL navigate to the new conversation detail page at `/projects/:projectId/conversations/:id`

#### Scenario: List page shows existing conversations

- **WHEN** a project has conversations created via API
- **THEN** the conversation list page SHALL display each conversation with its creation date and message count

#### Scenario: Delete conversation from list page

- **WHEN** user clicks the delete button on a conversation card
- **THEN** the conversation SHALL be removed from the list

### Requirement: Conversation detail page chat e2e tests

The test suite SHALL verify the conversation detail page's chat interface including message input, streaming display, and BDD preview. These tests require LLM configuration.

#### Scenario: Chat page shows input area

- **WHEN** user navigates to a conversation detail page
- **THEN** the page SHALL display a textarea input and a send button

#### Scenario: Send message and see streaming response

- **WHEN** user types a message in the textarea and presses Enter (or clicks send)
- **THEN** the user message SHALL appear in the chat as a right-aligned bubble
- **THEN** a thinking indicator SHALL appear while the agent processes
- **THEN** the assistant response SHALL stream in as a left-aligned bubble with incremental text

#### Scenario: BDD preview panel shows generated changes

- **WHEN** the agent generates BDD via update_bdd during streaming
- **THEN** the right-side BDD preview panel SHALL display new features with "New" badge, scenario titles, and BDD steps (Given/When/Then)

#### Scenario: Apply pending changes via UI

- **WHEN** the BDD preview panel shows pending changes and user clicks the "Apply" button
- **THEN** the pending changes SHALL be cleared from the preview panel
- **THEN** the features SHALL be created in the project

#### Scenario: Discard pending changes via UI

- **WHEN** the BDD preview panel shows pending changes and user clicks the "Discard" button
- **THEN** a confirmation dialog SHALL appear
- **WHEN** user confirms the discard
- **THEN** the pending changes SHALL be cleared from the preview panel without creating features
