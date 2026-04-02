## ADDED Requirements

### Requirement: Project list page test IDs

The project list page SHALL include `data-testid` attributes on key interactive elements.

#### Scenario: Project card has test ID

- **WHEN** the project list page renders with projects
- **THEN** each project card link SHALL have `data-testid="project-list-card"`

#### Scenario: Create project button has test ID

- **WHEN** the project list page renders
- **THEN** the "Create Project" button/link SHALL have `data-testid="project-list-create-btn"`

#### Scenario: Empty state has test ID

- **WHEN** the project list page renders with no projects
- **THEN** the empty state container SHALL have `data-testid="project-list-empty"`

### Requirement: Create project page test IDs

The create project page SHALL include `data-testid` attributes on form elements.

#### Scenario: Form fields have test IDs

- **WHEN** the create project page renders
- **THEN** the name input SHALL have `data-testid="create-project-name"`
- **THEN** the description textarea SHALL have `data-testid="create-project-description"`
- **THEN** the submit button SHALL have `data-testid="create-project-submit"`
- **THEN** the cancel button SHALL have `data-testid="create-project-cancel"`

#### Scenario: Validation error has test ID

- **WHEN** the form shows a validation error for the name field
- **THEN** the error message SHALL have `data-testid="create-project-name-error"`

### Requirement: Project detail page test IDs

The project detail page SHALL include `data-testid` attributes on key elements.

#### Scenario: Project info and navigation have test IDs

- **WHEN** the project detail page renders
- **THEN** the project heading SHALL have `data-testid="project-detail-name"`
- **THEN** the feature count card SHALL have `data-testid="project-detail-feature-count"`
- **THEN** the repo count card SHALL have `data-testid="project-detail-repo-count"`
- **THEN** the "View Features" link SHALL have `data-testid="project-detail-view-features"`
- **THEN** the "Conversations" link SHALL have `data-testid="project-detail-conversations"`

#### Scenario: Repository list items have test IDs

- **WHEN** the project detail page renders with repositories
- **THEN** each repository card SHALL have `data-testid="project-detail-repo-card"`
- **THEN** the "Add Repository" button SHALL have `data-testid="project-detail-add-repo-btn"`

### Requirement: Feature list page test IDs

The feature list page SHALL include `data-testid` attributes on key elements.

#### Scenario: Feature cards and filters have test IDs

- **WHEN** the feature list page renders
- **THEN** the search input SHALL have `data-testid="feature-list-search"`
- **THEN** the status filter select SHALL have `data-testid="feature-list-status-filter"`

#### Scenario: Feature card has test ID

- **WHEN** the feature list page renders with features
- **THEN** each feature card link SHALL have `data-testid="feature-list-card"`

#### Scenario: Feature empty state has test ID

- **WHEN** the feature list page renders with no features
- **THEN** the empty state container SHALL have `data-testid="feature-list-empty"`

### Requirement: Feature detail page test IDs

The feature detail page SHALL include `data-testid` attributes on key elements.

#### Scenario: Feature detail elements have test IDs

- **WHEN** the feature detail page renders
- **THEN** the feature title heading SHALL have `data-testid="feature-detail-title"`
- **THEN** the history button/link SHALL have `data-testid="feature-detail-history-btn"`
- **THEN** each scenario card SHALL have `data-testid="feature-detail-scenario-card"`

### Requirement: Conversation list page test IDs

The conversation list page SHALL include `data-testid` attributes on key elements.

#### Scenario: Conversation list elements have test IDs

- **WHEN** the conversation list page renders
- **THEN** the "New" conversation button SHALL have `data-testid="conversation-list-new-btn"`

#### Scenario: Conversation card has test ID

- **WHEN** the conversation list page renders with conversations
- **THEN** each conversation card SHALL have `data-testid="conversation-list-card"`
- **THEN** each delete button SHALL have `data-testid="conversation-list-delete-btn"`

#### Scenario: Empty state has test ID

- **WHEN** the conversation list page renders with no conversations
- **THEN** the empty state text SHALL have `data-testid="conversation-list-empty"`

### Requirement: Conversation detail page test IDs

The conversation detail page SHALL include `data-testid` attributes on key elements.

#### Scenario: Chat panel elements have test IDs

- **WHEN** the conversation detail page renders
- **THEN** the chat message input textarea SHALL have `data-testid="conversation-detail-textarea"`
- **THEN** the send button SHALL have `data-testid="conversation-detail-send-btn"`
- **THEN** the stop button (when streaming) SHALL have `data-testid="conversation-detail-stop-btn"`

#### Scenario: Message bubbles have test IDs

- **WHEN** messages are displayed in the chat
- **THEN** each message bubble SHALL have `data-testid="conversation-detail-message"`

#### Scenario: Thinking indicator has test ID

- **WHEN** the assistant is streaming and no text yet
- **THEN** the thinking indicator SHALL have `data-testid="conversation-detail-thinking"`

#### Scenario: BDD preview panel has test IDs

- **WHEN** the conversation detail page renders
- **THEN** the BDD preview panel container SHALL have `data-testid="bdd-preview-panel"`
- **THEN** the "No pending BDD changes" text SHALL have `data-testid="bdd-preview-empty"`

#### Scenario: Pending changes elements have test IDs

- **WHEN** pending BDD changes exist
- **THEN** the Apply All button SHALL have `data-testid="bdd-preview-apply-btn"`
- **THEN** the Discard button SHALL have `data-testid="bdd-preview-discard-btn"`
- **THEN** each new feature card SHALL have `data-testid="bdd-preview-new-feature"`
- **THEN** each modified feature card SHALL have `data-testid="bdd-preview-modified-feature"`

### Requirement: Naming convention

All `data-testid` values SHALL follow the `<page-or-component>-<element-description>` pattern in kebab-case.

#### Scenario: Consistent naming

- **WHEN** a developer adds a new `data-testid` to a page component
- **THEN** the value MUST be prefixed with the page name in kebab-case (e.g., `project-list-`, `feature-detail-`)
- **THEN** the suffix MUST describe the element's purpose (e.g., `-card`, `-btn`, `-search`)
