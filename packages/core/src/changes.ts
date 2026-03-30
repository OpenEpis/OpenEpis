import type { GeneratedChanges } from "@openepis/types";

/**
 * Merge incoming BDD changes into existing accumulated changes.
 *
 * Merge rules:
 * - New feature with same title: incoming replaces existing (updated proposal)
 * - New feature with new title: appended
 * - Modified feature with same feature_id: incoming modifications merged into existing
 * - Modified feature with new feature_id: appended
 */
export function mergeChanges(
  existing: GeneratedChanges | null,
  incoming: GeneratedChanges,
): GeneratedChanges {
  if (!existing) {
    return incoming;
  }

  // Merge new_features: same title replaces, new title appends
  const mergedNewFeatures = [...existing.new_features];
  for (const incomingFeature of incoming.new_features) {
    const existingIndex = mergedNewFeatures.findIndex((f) => f.title === incomingFeature.title);
    if (existingIndex >= 0) {
      mergedNewFeatures[existingIndex] = incomingFeature;
    } else {
      mergedNewFeatures.push(incomingFeature);
    }
  }

  // Merge modified_features: same feature_id merges, new feature_id appends
  const mergedModifiedFeatures = [...existing.modified_features];
  for (const incomingMod of incoming.modified_features) {
    const existingIndex = mergedModifiedFeatures.findIndex(
      (f) => f.feature_id === incomingMod.feature_id,
    );
    if (existingIndex >= 0) {
      const existingMod = mergedModifiedFeatures[existingIndex]!;
      mergedModifiedFeatures[existingIndex] = {
        feature_id: incomingMod.feature_id,
        reason: incomingMod.reason,
        updated_title: incomingMod.updated_title ?? existingMod.updated_title,
        updated_description: incomingMod.updated_description ?? existingMod.updated_description,
        added_scenarios: [
          ...(existingMod.added_scenarios ?? []),
          ...(incomingMod.added_scenarios ?? []),
        ],
        modified_scenarios: mergeModifiedScenarios(
          existingMod.modified_scenarios,
          incomingMod.modified_scenarios,
        ),
        removed_scenario_ids: mergeRemovedIds(
          existingMod.removed_scenario_ids,
          incomingMod.removed_scenario_ids,
        ),
      };
    } else {
      mergedModifiedFeatures.push(incomingMod);
    }
  }

  return {
    new_features: mergedNewFeatures,
    modified_features: mergedModifiedFeatures,
  };
}

function mergeModifiedScenarios(
  existing?: GeneratedChanges["modified_features"][number]["modified_scenarios"],
  incoming?: GeneratedChanges["modified_features"][number]["modified_scenarios"],
): GeneratedChanges["modified_features"][number]["modified_scenarios"] {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const merged = [...existing];
  for (const incomingScenario of incoming) {
    const existingIndex = merged.findIndex((s) => s.scenario_id === incomingScenario.scenario_id);
    if (existingIndex >= 0) {
      merged[existingIndex] = incomingScenario;
    } else {
      merged.push(incomingScenario);
    }
  }
  return merged;
}

function mergeRemovedIds(existing?: string[], incoming?: string[]): string[] | undefined {
  if (!existing && !incoming) return undefined;
  const set = new Set([...(existing ?? []), ...(incoming ?? [])]);
  return [...set];
}
