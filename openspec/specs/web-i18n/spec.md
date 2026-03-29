### Requirement: i18next initialization

The app SHALL initialize i18next with `react-i18next` before rendering the component tree. The configuration SHALL include:

- `fallbackLng: 'en'`
- `supportedLngs: ['en', 'zh-CN']`
- `interpolation.escapeValue: false` (React already escapes)
- `i18next-browser-languagedetector` plugin with detection order: `localStorage`, `navigator`

The i18n instance SHALL be initialized in `apps/web/src/i18n/index.ts` and imported in `main.tsx` before `createRoot`.

#### Scenario: App starts with browser language detected

- **WHEN** a user with browser language `zh-CN` opens the app for the first time
- **THEN** the app renders in Chinese using the `zh-CN` translation bundle

#### Scenario: App starts with unsupported browser language

- **WHEN** a user with browser language `fr` opens the app for the first time
- **THEN** the app falls back to English (`en`) translations

#### Scenario: App starts with previously selected language

- **WHEN** a user who previously selected `zh-CN` via the language switcher opens the app
- **THEN** the app renders in Chinese, using the value stored in `localStorage`

### Requirement: Translation resource files

The app SHALL maintain JSON translation files at:

- `apps/web/src/i18n/locales/en/translation.json`
- `apps/web/src/i18n/locales/zh-CN/translation.json`

Both files SHALL contain identical key sets. Keys SHALL be organized by section: `common`, `projects`, `features`, `sidebar`, `header`, `errors`. The English file SHALL serve as the reference/source-of-truth for key structure.

#### Scenario: All keys present in both locales

- **WHEN** a developer compares `en/translation.json` and `zh-CN/translation.json`
- **THEN** both files contain the same set of translation keys

#### Scenario: Key structure follows naming convention

- **WHEN** a developer adds a new UI string
- **THEN** the key follows the pattern `<section>.<element>` (e.g., `projects.createButton`, `common.loading`)

### Requirement: UI string extraction

All hardcoded English strings in page components and layout components SHALL be replaced with `t()` calls from the `useTranslation` hook. This includes:

- Page headings and labels
- Button text
- Placeholder text
- Empty state messages
- Error messages
- Status labels (draft, active, deprecated)
- Plural forms (e.g., "1 feature" / "N features")

Dynamic content (project names, feature titles, BDD step text) SHALL NOT be translated.

#### Scenario: Page displays translated static text

- **WHEN** a user views the project list page with locale set to `zh-CN`
- **THEN** the page heading, button labels, and empty state text are displayed in Chinese

#### Scenario: Dynamic content remains untranslated

- **WHEN** a user views a project named "My Project" with locale set to `zh-CN`
- **THEN** the project name "My Project" is displayed as-is, not translated

#### Scenario: Plural forms render correctly

- **WHEN** a project has 1 feature and locale is `en`
- **THEN** the text reads "1 feature" (singular)
- **WHEN** a project has 3 features and locale is `en`
- **THEN** the text reads "3 features" (plural)

### Requirement: Language switcher control

The app SHALL provide a language switcher in the header bar (right-aligned) that allows users to change the active locale. The switcher SHALL display the current language name and offer a dropdown with all supported locales.

#### Scenario: User switches from English to Chinese

- **WHEN** user clicks the language switcher and selects "中文"
- **THEN** the entire UI re-renders in Chinese immediately without page reload
- **AND** the selection is persisted to `localStorage`

#### Scenario: Language switcher shows current language

- **WHEN** the app is displaying in English
- **THEN** the language switcher shows "English" (or "EN") as the current selection

### Requirement: Locale-aware date formatting

All date displays in the app SHALL use the active i18next locale for formatting via `Intl.DateTimeFormat`. A shared utility function SHALL be provided that accepts a date and returns a locale-formatted string.

#### Scenario: Date formatted in English

- **WHEN** locale is `en` and a date "2025-03-15" is displayed
- **THEN** the date is formatted as "3/15/2025" (or equivalent en-US format)

#### Scenario: Date formatted in Chinese

- **WHEN** locale is `zh-CN` and a date "2025-03-15" is displayed
- **THEN** the date is formatted as "2025/3/15" (or equivalent zh-CN format)
