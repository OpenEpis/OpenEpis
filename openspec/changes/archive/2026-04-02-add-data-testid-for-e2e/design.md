## Context

The web frontend (`apps/web`) has 10 page components and several layout components. There are 6 web e2e test files using Playwright. Currently, tests locate elements via:

- `getByRole` / `getByLabel` — stable, but not always specific enough for complex UIs
- `getByText` — fragile under i18n changes
- CSS class selectors (`[class*=cursor-pointer]`, `.rounded-lg.px-4.py-2`, `.border-l`) — break when styling changes
- Generic `page.locator("textarea")` — ambiguous when multiple elements exist

Adding `data-testid` attributes provides a dedicated, stable test anchor layer.

## Goals / Non-Goals

**Goals:**

- Add `data-testid` to all interactive elements and key containers in web pages where e2e tests need to locate them.
- Replace fragile CSS class selectors and text-based selectors in e2e tests with `getByTestId()`.
- Establish a consistent naming convention for test IDs.

**Non-Goals:**

- Adding `data-testid` to shared UI primitives (`components/ui/*`) — these are shadcn components best accessed via role/label.
- Stripping `data-testid` in production builds — the attribute is harmless and simplifies debugging.
- Rewriting tests that already use stable `getByRole`/`getByLabel` locators — only fragile selectors are replaced.

## Decisions

### 1. Naming convention: `<page>-<element>`

Test IDs follow `<page-or-component>-<element-description>` in kebab-case.

Examples:

- `project-list-create-btn` — Create Project button on project list page
- `conversation-list-card` — Conversation card on the list page
- `conversation-detail-textarea` — Chat input textarea
- `conversation-detail-message-bubble` — Message bubble in chat
- `conversation-detail-send-btn` — Send button
- `bdd-preview-panel` — BDD preview panel container
- `feature-list-search` — Search input on feature list page

**Rationale**: Scoping by page avoids collisions across pages. Kebab-case is consistent with the project's CSS class conventions.

### 2. Selective replacement — only fragile selectors

Tests that already use `getByRole`, `getByLabel`, `getByText` with stable anchor text keep those locators. Only replace:

- CSS class-based selectors (`page.locator("[class*=...]")`, `page.locator(".class.class")`)
- Generic element selectors (`page.locator("textarea")`)
- Fragile text selectors that could break under i18n

**Rationale**: `getByRole` is the Playwright-recommended approach for accessibility; we don't want to regress on that. `data-testid` is a fallback for elements that lack good accessibility semantics.

### 3. Place `data-testid` directly on JSX elements (not via component props)

Add `data-testid` as a prop directly in page components. Don't pass it through custom component APIs.

**Rationale**: Keeps changes minimal and localized. UI primitives don't need to know about test IDs.

## Risks / Trade-offs

- **Minor HTML bloat** → Negligible. `data-testid` adds ~20-30 bytes per attribute. No runtime cost.
- **Maintenance burden** → Low. Test IDs are co-located with the elements they describe. If an element is removed, the test that references it will fail immediately (which is the desired behavior).
- **Over-reliance on testid** → Mitigated by only replacing fragile selectors. Stable role/label selectors are preserved.
