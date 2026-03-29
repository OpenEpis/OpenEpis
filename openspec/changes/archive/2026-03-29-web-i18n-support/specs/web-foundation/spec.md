## MODIFIED Requirements

### Requirement: Application layout shell

The app SHALL render a responsive layout with a sidebar, header with breadcrumbs, and main content area. The sidebar SHALL be collapsible on desktop and rendered as a sheet/drawer on mobile viewports. The sidebar SHALL display project navigation links. The header SHALL include a language switcher control on the right side for changing the app locale.

#### Scenario: Desktop layout

- **WHEN** user views the app on a viewport wider than 768px
- **THEN** the sidebar is visible and collapsible, header shows breadcrumbs and a language switcher on the right, and main content fills the remaining space

#### Scenario: Mobile layout

- **WHEN** user views the app on a viewport 768px or narrower
- **THEN** the sidebar is hidden by default and accessible via a menu button that opens a sheet/drawer overlay, and the header includes a language switcher
