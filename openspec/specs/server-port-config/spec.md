## ADDED Requirements

### Requirement: Server port is configurable via PORT environment variable

The server SHALL read the `PORT` environment variable to determine the listening port. If `PORT` is not set, the server SHALL default to port `3001`.

#### Scenario: Custom port via environment variable

- **WHEN** `PORT` environment variable is set to `4000`
- **THEN** the server SHALL listen on port `4000`

#### Scenario: Default port when PORT is not set

- **WHEN** `PORT` environment variable is not set
- **THEN** the server SHALL listen on port `3001`

#### Scenario: PORT is documented in .env.example

- **WHEN** a developer checks `.env.example`
- **THEN** the `PORT` variable SHALL be listed with a description and default value
