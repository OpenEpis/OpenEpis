## 1. Create plugin structure

- [x] 1.1 Create `openepis-claude-plugin/.claude-plugin/plugin.json` — plugin manifest with name `"openepis"`, description, version `0.1.0`, author, and repository metadata
- [x] 1.2 Create `openepis-claude-plugin/README.md` — usage instructions covering installation (marketplace, `--plugin-dir`), prerequisites (`.openepis.json`, `@openepis/cli`), and available skills

## 2. Create skill definitions

- [x] 2.1 Create `openepis-claude-plugin/skills/openepis-features/SKILL.md` — skill that invokes `npx @openepis/cli features` and presents the BDD feature list
- [x] 2.2 Create `openepis-claude-plugin/skills/openepis-bdd/SKILL.md` — skill that accepts a feature name/ID argument and invokes `npx @openepis/cli bdd <feature>`
- [x] 2.3 Create `openepis-claude-plugin/skills/openepis-context/SKILL.md` — skill that accepts a file path (and optional `-r` repo flag) and invokes `npx @openepis/cli context <file>`

## 3. Verification

- [x] 3.1 Load plugin locally with `claude --plugin-dir ./openepis-claude-plugin` and verify all three skills appear in skill list
- [x] 3.2 Test `/openepis:openepis-features` with a running server and valid `.openepis.json`
- [x] 3.3 Test `/openepis:openepis-bdd` with a valid feature name
- [x] 3.4 Test `/openepis:openepis-context` with a source file path
