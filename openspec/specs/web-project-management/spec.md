## ADDED Requirements

### Requirement: Project list page

The app SHALL display a page at `/projects` listing all projects. Each project card SHALL show the project name, creation date, and feature count. The page SHALL include a button to create a new project. If no projects exist, an empty state with a call-to-action SHALL be displayed.

#### Scenario: View project list

- **WHEN** user navigates to `/projects`
- **THEN** a list of all projects is displayed with name, creation date, and feature count for each

#### Scenario: Empty project list

- **WHEN** user navigates to `/projects` and no projects exist
- **THEN** an empty state message is shown with a "Create Project" button

#### Scenario: Loading state

- **WHEN** the project list is being fetched
- **THEN** skeleton placeholders are shown in place of project cards

### Requirement: Create project page

The app SHALL provide a page at `/projects/new` with a form to create a new project. The form SHALL require a project name and optionally accept a description. On successful creation, the user SHALL be navigated to the new project's detail page.

#### Scenario: Create a project

- **WHEN** user fills in the project name and clicks "Create"
- **THEN** a new project is created via the API and user is navigated to `/projects/:projectId`

#### Scenario: Validation error

- **WHEN** user submits the form without a project name
- **THEN** a validation error is displayed on the name field

### Requirement: Project detail page

The app SHALL display a project detail page at `/projects/:projectId` showing the project name, description, repository list, and feature count. The page SHALL serve as the hub for navigating to features and managing repositories.

#### Scenario: View project detail

- **WHEN** user navigates to `/projects/:projectId`
- **THEN** the project name, description, repository list, and feature count are displayed

#### Scenario: Project not found

- **WHEN** user navigates to `/projects/:projectId` with an invalid ID
- **THEN** a "Project not found" error message is displayed

### Requirement: Repository management on project detail

The project detail page SHALL list all linked repositories with their name and git URL. Users SHALL be able to add a new repository by providing a name, git URL, and optional default branch. Users SHALL be able to remove a repository.

#### Scenario: View repositories

- **WHEN** user views the project detail page
- **THEN** all linked repositories are listed with their name and git URL

#### Scenario: Add a repository

- **WHEN** user clicks "Add Repository", fills in name and git URL, and confirms
- **THEN** the repository is created via the API and appears in the list

#### Scenario: Remove a repository

- **WHEN** user clicks the delete action on a repository and confirms
- **THEN** the repository is deleted via the API and removed from the list

### Requirement: Project sidebar navigation

When viewing any page within a project, the sidebar SHALL show navigation links to the project overview and features list. The current page SHALL be highlighted in the sidebar.

#### Scenario: Sidebar shows project nav

- **WHEN** user is on any page under `/projects/:projectId/*`
- **THEN** the sidebar shows links to "Overview" and "Features" for that project, with the current page highlighted
