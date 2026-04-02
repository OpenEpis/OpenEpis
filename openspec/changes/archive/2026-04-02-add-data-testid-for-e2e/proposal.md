## Why

The web e2e tests currently rely on CSS class selectors (e.g., `[class*=cursor-pointer]`), text content matching, and generic element locators (e.g., `page.locator("textarea")`). These selectors are fragile — they break when styling changes, when text is translated (i18n), or when component structure is refactored. Adding `data-testid` attributes to key interactive elements provides stable, purpose-built anchors for e2e tests, decoupling test logic from presentation.

## What Changes

- Add `data-testid` attributes to interactive and semantically important elements across all web pages and layout components.
- Refactor existing web e2e tests (`tests/e2e/web/*.spec.ts`) to use `page.getByTestId()` instead of fragile CSS/text selectors.
- Establish a naming convention for `data-testid` values (kebab-case, scoped by page/component).

## Capabilities

### New Capabilities

- `web-testid`: Convention and placement of `data-testid` attributes on web UI elements for e2e test stability.

### Modified Capabilities

- `e2e-web-tests`: Update web e2e test selectors to use `data-testid` via `page.getByTestId()` instead of CSS class and text selectors.
- `e2e-conversation-web-tests`: Update conversation web e2e test selectors to use `data-testid`.

## Impact

- **Web components**: All page components in `apps/web/src/pages/` and key layout components in `apps/web/src/components/layout/` gain `data-testid` attributes.
- **E2e tests**: All files in `tests/e2e/web/` updated to use `getByTestId()` for element selection where appropriate.
- **No API or backend changes**.
- **No breaking changes** — `data-testid` attributes are invisible to end users.
