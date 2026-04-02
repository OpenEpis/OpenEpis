## ADDED Requirements

### Requirement: Project list page e2e tests

The system SHALL have browser e2e tests that verify the project list page displays projects and allows navigation.

#### Scenario: Display project list

- **WHEN** a user navigates to `/projects`
- **THEN** the page SHALL display a list of existing projects
- **THEN** each project SHALL show its name and feature count

#### Scenario: Navigate to create project

- **WHEN** a user clicks the "create project" action on the project list page
- **THEN** the browser SHALL navigate to `/projects/new`

### Requirement: Project creation e2e tests

The system SHALL have browser e2e tests that verify project creation through the web UI.

#### Scenario: Create project via form

- **WHEN** a user fills in the project name and description on `/projects/new`
- **WHEN** the user submits the form
- **THEN** the browser SHALL navigate to the new project's detail page
- **THEN** the project name SHALL be visible on the page

#### Scenario: Validation on empty name

- **WHEN** a user submits the create project form without filling in the name
- **THEN** the form SHALL display a validation error

### Requirement: Project detail page e2e tests

The system SHALL have browser e2e tests that verify the project detail page shows project information and navigation links.

#### Scenario: Display project detail

- **WHEN** a user navigates to `/projects/:id` for an existing project
- **THEN** the page SHALL display the project name
- **THEN** the page SHALL show feature count and repository count

#### Scenario: Navigate to features

- **WHEN** a user clicks the features link on the project detail page
- **THEN** the browser SHALL navigate to `/projects/:id/features`

### Requirement: Feature browsing e2e tests

The system SHALL have browser e2e tests that verify feature listing and detail viewing.

#### Scenario: Display feature list

- **WHEN** a user navigates to `/projects/:id/features` for a project with features
- **THEN** the page SHALL display a list of features with their titles and status

#### Scenario: View feature detail with BDD scenarios

- **WHEN** a user clicks on a feature in the feature list
- **THEN** the browser SHALL navigate to the feature detail page
- **THEN** the page SHALL display the feature title, description, and BDD scenarios
- **THEN** each scenario SHALL display its steps (Given/When/Then)

### Requirement: Navigation and breadcrumb e2e tests

The system SHALL have browser e2e tests that verify navigation breadcrumbs work correctly across the page hierarchy.

#### Scenario: Breadcrumb navigation

- **WHEN** a user is on the feature detail page at `/projects/:id/features/:featureId`
- **THEN** the breadcrumb SHALL show the navigation path (Projects > Project > Features > Feature)
- **WHEN** the user clicks the "Projects" breadcrumb
- **THEN** the browser SHALL navigate back to `/projects`

#### Scenario: 404 page

- **WHEN** a user navigates to a non-existent route
- **THEN** the page SHALL display a not-found message

### Requirement: Project list e2e selectors

The project list e2e tests SHALL use `getByTestId()` for elements that previously used fragile CSS or text selectors.

#### Scenario: Display projects test uses testid for project card

- **WHEN** the project list test checks for a project entry
- **THEN** it SHALL locate the project card using `getByTestId("project-list-card")` instead of generic text matching on `main`

### Requirement: Project detail e2e selectors

The project detail e2e tests SHALL continue using stable `getByRole` selectors where appropriate.

#### Scenario: Navigate to features uses stable selector

- **WHEN** the project detail test clicks "View Features"
- **THEN** it SHALL use `getByTestId("project-detail-view-features")` to locate the link

### Requirement: Feature browsing e2e selectors

The feature browsing e2e tests SHALL use `getByTestId()` for feature card navigation.

#### Scenario: List features test uses testid for feature cards

- **WHEN** the feature list test checks for a feature entry
- **THEN** it SHALL locate the feature card using `getByTestId("feature-list-card")` instead of generic text matching on `main`

#### Scenario: View feature detail uses testid for card click

- **WHEN** the feature browsing test clicks on a feature to navigate to detail
- **THEN** it SHALL use `getByTestId("feature-list-card")` to locate the clickable element

### Requirement: Navigation e2e selectors

The navigation e2e test SHALL retain stable `getByRole` selectors for breadcrumbs and headings.

#### Scenario: Breadcrumb navigation retains role selector

- **WHEN** the navigation test checks breadcrumbs
- **THEN** it SHALL continue using `getByRole("link", { name: "Projects" })` as this is stable

### Requirement: Create project e2e selectors

The create project e2e tests SHALL use `getByTestId()` for form validation errors.

#### Scenario: Validation error uses testid

- **WHEN** the create project test checks for a validation error
- **THEN** it SHALL use `getByTestId("create-project-name-error")` instead of `getByText(/name is required/i)`
