## 1. Add data-testid to page components

- [x] 1.1 Add data-testid attributes to `project-list.tsx` (cards, create button, empty state)
- [x] 1.2 Add data-testid attributes to `create-project.tsx` (form fields, submit/cancel buttons, error message)
- [x] 1.3 Add data-testid attributes to `project-detail.tsx` (heading, stat cards, nav links, repo cards, add-repo button)
- [x] 1.4 Add data-testid attributes to `feature-list.tsx` (search input, status filter, feature cards, empty state)
- [x] 1.5 Add data-testid attributes to `feature-detail.tsx` (title heading, history button, scenario cards)
- [x] 1.6 Add data-testid attributes to `conversation-list.tsx` (new button, conversation cards, delete buttons, empty state)
- [x] 1.7 Add data-testid attributes to `conversation-detail.tsx` (textarea, send/stop buttons, message bubbles, thinking indicator, BDD preview panel, apply/discard buttons, new/modified feature cards, empty preview state)

## 2. Update web e2e tests to use getByTestId

- [x] 2.1 Update `tests/e2e/web/project-list.spec.ts` to use `getByTestId` for project cards
- [x] 2.2 Update `tests/e2e/web/create-project.spec.ts` to use `getByTestId` for validation error
- [x] 2.3 Update `tests/e2e/web/project-detail.spec.ts` to use `getByTestId` for navigation links
- [x] 2.4 Update `tests/e2e/web/features.spec.ts` to use `getByTestId` for feature cards
- [x] 2.5 Update `tests/e2e/web/conversations.spec.ts` to use `getByTestId` for conversation cards, delete buttons, textarea, message bubbles, thinking indicator, BDD preview panel, and apply/discard buttons

## 3. Verify

- [x] 3.1 Run all web e2e tests to confirm they pass with the new selectors
