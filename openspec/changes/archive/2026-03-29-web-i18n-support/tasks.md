## 1. Setup & Dependencies

- [x] 1.1 Install `i18next`, `react-i18next`, and `i18next-browser-languagedetector` in `@openepis/web`
- [x] 1.2 Create i18n directory structure: `apps/web/src/i18n/index.ts` and `locales/en/translation.json`, `locales/zh-CN/translation.json`

## 2. i18next Initialization

- [x] 2.1 Configure i18next in `apps/web/src/i18n/index.ts` with `react-i18next`, browser language detector, fallback to `en`, supported languages `['en', 'zh-CN']`
- [x] 2.2 Import `i18n/index.ts` in `main.tsx` before `createRoot` to ensure initialization before rendering

## 3. Translation Resource Files

- [x] 3.1 Create English translation file (`en/translation.json`) with all UI strings extracted from existing components, organized by section: `common`, `projects`, `features`, `sidebar`, `header`, `errors`
- [x] 3.2 Create Chinese translation file (`zh-CN/translation.json`) with the same key structure and Chinese translations for all strings

## 4. Locale-Aware Utilities

- [x] 4.1 Create a `formatDate(date: string | Date, locale: string)` utility in `apps/web/src/lib/utils.ts` using `Intl.DateTimeFormat`
- [x] 4.2 Create a `useFormattedDate` hook or integrate locale-aware formatting into existing date display patterns

## 5. Extract Strings from Pages

- [x] 5.1 Replace hardcoded strings in `project-list.tsx` with `t()` calls (heading, buttons, empty state, plural "features")
- [x] 5.2 Replace hardcoded strings in `create-project.tsx` with `t()` calls
- [x] 5.3 Replace hardcoded strings in `project-detail.tsx` with `t()` calls
- [x] 5.4 Replace hardcoded strings in `feature-list.tsx` with `t()` calls (heading, search placeholder, status labels, plural "scenarios")
- [x] 5.5 Replace hardcoded strings in `feature-detail.tsx` with `t()` calls
- [x] 5.6 Replace hardcoded strings in `feature-revisions.tsx` with `t()` calls
- [x] 5.7 Replace hardcoded strings in `revision-detail.tsx` with `t()` calls
- [x] 5.8 Replace hardcoded strings in `not-found.tsx` with `t()` calls

## 6. Extract Strings from Layout & Shared Components

- [x] 6.1 Replace hardcoded strings in `sidebar.tsx` with `t()` calls ("Projects", "Current Project", "Overview", "Features")
- [x] 6.2 Update `header.tsx` to translate static breadcrumb labels while keeping dynamic labels (project/feature names) as-is
- [x] 6.3 Replace hardcoded strings in `bdd-steps.tsx` with `t()` calls for step type labels (Given/When/Then/And/But stay in English as BDD keywords)

## 7. Language Switcher

- [x] 7.1 Create a `LanguageSwitcher` component using shadcn/ui `DropdownMenu` that displays the current locale and allows switching between "English" and "中文"
- [x] 7.2 Integrate the `LanguageSwitcher` into the header (right-aligned, after breadcrumbs)

## 8. Date Formatting Integration

- [x] 8.1 Update all `toLocaleDateString()` calls in page components to use the i18n-aware `formatDate` utility with the active locale from `useTranslation`

## 9. Verification

- [x] 9.1 Verify the app renders correctly in English (default) with no missing translation keys
- [x] 9.2 Switch to Chinese and verify all static UI text displays in Chinese, dates are formatted in zh-CN locale, and dynamic content (project names, BDD steps) remains unchanged
- [x] 9.3 Verify language preference persists across page reloads via localStorage
