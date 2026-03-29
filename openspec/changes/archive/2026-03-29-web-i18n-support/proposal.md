## Why

OpenEpis targets teams in both English-speaking and Chinese-speaking markets. The web frontend currently has all UI strings hardcoded in English, making it inaccessible to Chinese-speaking PMs and developers. Adding i18n support now — while the UI surface is still small (~10 pages, ~15 components) — is significantly cheaper than retrofitting later when the codebase grows.

## What Changes

- Introduce an i18n framework (`react-i18next` + `i18next`) to the `@openepis/web` package
- Extract all hardcoded UI strings from pages and components into translation resource files
- Provide English (`en`) and Chinese (`zh-CN`) translation bundles
- Add a language switcher to the app header for users to toggle locale
- Configure browser language auto-detection as the default locale selection strategy
- Format dates and plurals according to the active locale

## Capabilities

### New Capabilities

- `web-i18n`: Core i18n infrastructure — framework setup, translation resource loading, language detection, locale switching, and extraction of all existing UI strings into en/zh-CN translation files

### Modified Capabilities

- `web-foundation`: Header layout gains a language switcher control; date formatting becomes locale-aware

## Impact

- **Code**: All page components (`apps/web/src/pages/`) and layout components (`apps/web/src/components/layout/`) will be modified to replace hardcoded strings with `t()` calls
- **Dependencies**: New npm packages `i18next`, `react-i18next`, `i18next-browser-languagedetector` added to `@openepis/web`
- **APIs**: No backend changes required — i18n is purely frontend
- **Build**: Translation JSON files bundled with the Vite build; no impact on other packages
