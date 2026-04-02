## MODIFIED Requirements

### Requirement: Conversation list e2e selectors

The conversation list e2e tests SHALL use `getByTestId()` instead of fragile CSS class selectors.

#### Scenario: List conversations uses testid for cards

- **WHEN** the conversation list test checks for conversation entries
- **THEN** it SHALL use `getByTestId("conversation-list-card")` instead of `page.locator("[class*=cursor-pointer]").filter({ hasText: "Conversation" })`

#### Scenario: Delete conversation uses testid for delete button

- **WHEN** the conversation list test clicks the delete button
- **THEN** it SHALL use `getByTestId("conversation-list-delete-btn")` instead of `getByRole("button")` on the card

#### Scenario: Empty state uses testid

- **WHEN** the conversation list test checks for the empty state
- **THEN** it SHALL use `getByTestId("conversation-list-empty")` instead of `getByText("No conversations yet")`

### Requirement: Conversation chat e2e selectors

The conversation chat e2e tests SHALL use `getByTestId()` instead of generic element selectors.

#### Scenario: Chat input uses testid

- **WHEN** the conversation chat test locates the text input
- **THEN** it SHALL use `getByTestId("conversation-detail-textarea")` instead of `page.locator("textarea")`

#### Scenario: Send button uses testid

- **WHEN** the conversation chat test locates the send button
- **THEN** it SHALL use `getByTestId("conversation-detail-send-btn")` instead of `page.getByRole("main").getByRole("button")`

#### Scenario: Message bubbles use testid

- **WHEN** the conversation chat test checks for message bubbles
- **THEN** it SHALL use `getByTestId("conversation-detail-message")` instead of `page.locator(".rounded-lg.px-4.py-2")`

#### Scenario: Thinking indicator uses testid

- **WHEN** the conversation chat test waits for the thinking indicator
- **THEN** it SHALL use `getByTestId("conversation-detail-thinking")` instead of `getByText("Thinking...")`

### Requirement: BDD preview panel e2e selectors

The BDD preview panel e2e tests SHALL use `getByTestId()` instead of CSS class selectors.

#### Scenario: Preview panel uses testid

- **WHEN** the BDD preview test locates the preview panel
- **THEN** it SHALL use `getByTestId("bdd-preview-panel")` instead of `page.locator(".border-l")`

#### Scenario: Empty preview state uses testid

- **WHEN** the BDD preview test checks for "No pending BDD changes"
- **THEN** it SHALL use `getByTestId("bdd-preview-empty")` instead of `getByText("No pending BDD changes")`

#### Scenario: Apply button uses testid

- **WHEN** the apply/discard test clicks Apply All
- **THEN** it SHALL use `getByTestId("bdd-preview-apply-btn")` instead of `getByRole("button", { name: /Apply All/i })`

#### Scenario: Discard button uses testid

- **WHEN** the apply/discard test clicks Discard
- **THEN** it SHALL use `getByTestId("bdd-preview-discard-btn")` instead of `getByRole("button", { name: /Discard/i })`
