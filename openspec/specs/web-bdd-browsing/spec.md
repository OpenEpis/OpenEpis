## ADDED Requirements

### Requirement: Feature list page

The app SHALL display a page at `/projects/:projectId/features` listing all BDD Features in the project. Each feature item SHALL show the title, description (truncated), status badge (draft/active/deprecated), tags, scenario count, and last updated date. The list SHALL support filtering by status and searching by title/description.

#### Scenario: View feature list

- **WHEN** user navigates to `/projects/:projectId/features`
- **THEN** all features for the project are listed with title, status badge, tags, scenario count, and updated date

#### Scenario: Filter by status

- **WHEN** user selects a status filter (e.g., "active")
- **THEN** only features matching that status are displayed

#### Scenario: Search features

- **WHEN** user types a search query in the search input
- **THEN** features are filtered to those whose title or description contains the query

#### Scenario: Empty feature list

- **WHEN** a project has no features
- **THEN** an empty state message is shown indicating no BDD features exist yet

#### Scenario: Loading state

- **WHEN** the feature list is being fetched
- **THEN** skeleton placeholders are shown

### Requirement: Feature detail page

The app SHALL display a page at `/projects/:projectId/features/:featureId` showing the full Feature with all its Scenarios. The page SHALL display the feature title, description, status, version, tags, and a list of all scenarios. Each scenario SHALL show its title, tags, and BDD steps (Given/When/Then) with proper formatting and color-coding by step type.

#### Scenario: View feature detail

- **WHEN** user navigates to `/projects/:projectId/features/:featureId`
- **THEN** the feature title, description, status badge, version number, tags, and all scenarios with their steps are displayed

#### Scenario: BDD step formatting

- **WHEN** a scenario's steps are rendered
- **THEN** each step displays its type keyword (Given, When, Then, And) with distinct visual styling per type, followed by the step text

#### Scenario: Feature not found

- **WHEN** user navigates to a feature detail page with an invalid feature ID
- **THEN** a "Feature not found" error message is displayed

### Requirement: Feature revision history

The app SHALL display revision history at `/projects/:projectId/features/:featureId/revisions`. Each revision entry SHALL show the version number, change summary, who made the change, and when. Users SHALL be able to view a specific historical revision's full content.

#### Scenario: View revision list

- **WHEN** user navigates to the feature revisions page
- **THEN** a chronological list of revisions is displayed with version number, change summary, author, and date

#### Scenario: View historical revision

- **WHEN** user clicks on a specific revision entry
- **THEN** the full Feature snapshot for that version is displayed, including all scenarios and steps as they were at that point in time

### Requirement: Navigation between feature views

The feature detail page SHALL provide navigation links/tabs to switch between the current feature content and its revision history. The feature list page SHALL link each feature to its detail page.

#### Scenario: Navigate from list to detail

- **WHEN** user clicks on a feature in the feature list
- **THEN** user is navigated to the feature detail page

#### Scenario: Navigate to revisions

- **WHEN** user is on the feature detail page and clicks the "History" or "Revisions" tab/link
- **THEN** user is navigated to the revisions page for that feature
