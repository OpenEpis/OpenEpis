## MODIFIED Requirements

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
