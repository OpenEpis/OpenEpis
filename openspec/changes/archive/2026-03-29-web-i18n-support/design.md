## Context

The `@openepis/web` frontend is a React 19 + Vite 8 SPA using Tailwind CSS, shadcn/ui, Jotai for UI state, and TanStack React Query for server data. All UI text is currently hardcoded in English across ~10 page components and ~5 layout/shared components. The app has no i18n infrastructure.

The target audience includes both English and Chinese-speaking PMs and developers. The UI surface is still small, making this the right time to introduce i18n before the string count grows.

## Goals / Non-Goals

**Goals:**

- Establish a scalable i18n architecture for the web app
- Support English (`en`) and Simplified Chinese (`zh-CN`) as the first two locales
- Auto-detect the user's preferred language from the browser
- Allow manual language switching via a UI control
- Locale-aware date formatting and pluralization

**Non-Goals:**

- Server-side / API response localization (BDD content stays in its authored language)
- Right-to-left (RTL) layout support
- Translation management platform integration (Crowdin, Lokalise, etc.)
- Dynamic translation loading / lazy-loaded locale bundles (unnecessary at current scale)
- Localization of BDD content (Given/When/Then steps) — those are user-authored

## Decisions

### 1. i18n Framework: react-i18next

**Choice**: `react-i18next` (with `i18next` core)

**Alternatives considered**:

- **FormatJS / react-intl**: More opinionated, ICU message format. Heavier setup for a small app. Better suited for apps with complex plural/gender rules at scale.
- **Lingui**: Compile-time extraction, smaller runtime. Less ecosystem adoption, fewer tutorials.
- **Custom solution**: Not worth the maintenance burden.

**Rationale**: `react-i18next` is the most widely adopted React i18n solution. It integrates well with React hooks (`useTranslation`), has excellent TypeScript support, and the ecosystem offers language detection, interpolation, and pluralization out of the box. The team can find answers to most questions quickly.

### 2. Translation file format: JSON namespaces

**Choice**: Flat JSON files organized by locale, single namespace per locale for now.

```
apps/web/src/
  i18n/
    index.ts          # i18next init
    locales/
      en/
        translation.json
      zh-CN/
        translation.json
```

**Rationale**: JSON is natively supported by i18next without plugins. A single `translation` namespace is sufficient at the current scale (~100-150 keys). Namespaces can be added later if the string count grows significantly.

### 3. Translation key structure: dot-separated, grouped by page/component

**Choice**: Keys follow the pattern `<section>.<element>` — e.g., `projects.title`, `features.searchPlaceholder`, `common.createButton`.

**Rationale**: Grouping by page/component makes it easy to find and maintain translations. A `common` group handles shared strings (button labels, error messages, etc.) to avoid duplication.

### 4. Language detection: browser-first, user-overridable

**Choice**: Use `i18next-browser-languagedetector` for initial detection. When the user manually selects a language, persist to `localStorage`. Detection order: `localStorage` → `navigator` → fallback `en`.

**Rationale**: Most users want the app in their browser's language. Manual override is persisted so users don't have to re-select each visit. No backend dependency needed.

### 5. Language switcher placement: Header, right side

**Choice**: A compact dropdown in the header bar (right side), showing the current locale code/name.

**Rationale**: Header is always visible, consistent with common web app patterns. Doesn't require changes to the sidebar or routing. Uses existing shadcn/ui `DropdownMenu` component.

### 6. Date formatting: Intl.DateTimeFormat

**Choice**: Use the browser's native `Intl.DateTimeFormat` API with the active i18next language as the locale parameter. Create a shared utility function `formatDate(date, locale)`.

**Rationale**: No additional dependency needed. `Intl.DateTimeFormat` is supported in all modern browsers and produces locale-appropriate date strings automatically.

### 7. Pluralization: i18next built-in

**Choice**: Use i18next's built-in plural resolution with `_one` / `_other` suffixes (or `_zero` / `_one` / `_other` for Chinese where needed).

**Rationale**: i18next handles plural rules per locale automatically via CLDR data. No extra library needed. Chinese has simpler plural rules (no grammatical plural distinction), but the system handles it gracefully.

## Risks / Trade-offs

- **Key staleness**: Translation keys can drift from actual UI text if developers forget to update both locales when adding new strings. → Mitigation: Add a CI check (future task) that compares key sets between `en` and `zh-CN` translation files.

- **Incomplete translations at launch**: Some strings may be missed during initial extraction. → Mitigation: Configure i18next `fallbackLng: 'en'` so missing zh-CN keys fall back to English rather than showing raw keys.

- **Bundle size increase**: `i18next` + `react-i18next` + `i18next-browser-languagedetector` add ~30-40KB gzipped. → Acceptable for the functionality gained. Can lazy-load locales later if needed.

- **Breadcrumb translations**: Some breadcrumb labels are dynamic (project names, feature titles from server data). These should NOT be translated — only static breadcrumb labels (e.g., "Projects", "Features") need i18n. → Ensure the breadcrumb handle system distinguishes static vs dynamic labels.
