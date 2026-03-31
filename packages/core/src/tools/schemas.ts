import { Type } from "@sinclair/typebox";

export const GetFeatureDetailParams = Type.Object({
  featureId: Type.String({ description: "The ID of the Feature to retrieve" }),
});

export const SearchFeaturesParams = Type.Object({
  query: Type.String({
    description: "Search keyword to find matching Features by title or description",
  }),
});

const BddStepSchema = Type.Object({
  type: Type.Union(
    [
      Type.Literal("given"),
      Type.Literal("when"),
      Type.Literal("then"),
      Type.Literal("and"),
      Type.Literal("but"),
    ],
    { description: "Step keyword" },
  ),
  text: Type.String({ description: "Step text" }),
});

const NewScenarioSchema = Type.Object({
  title: Type.String({ description: "Scenario title" }),
  steps: Type.Array(BddStepSchema, { description: "Scenario steps" }),
  tags: Type.Optional(Type.Array(Type.String(), { description: "Scenario tags" })),
});

export const UpdateBddParams = Type.Object({
  new_features: Type.Optional(
    Type.Array(
      Type.Object({
        title: Type.String({ description: "Feature title" }),
        description: Type.String({ description: "Feature description" }),
        scenarios: Type.Array(NewScenarioSchema, { description: "Feature scenarios" }),
        tags: Type.Optional(Type.Array(Type.String(), { description: "Feature tags" })),
        temp_id: Type.Optional(
          Type.String({
            description: "Temporary ID for client-side tracking (auto-generated if omitted)",
          }),
        ),
      }),
      { description: "New Features to create" },
    ),
  ),
  modified_features: Type.Optional(
    Type.Array(
      Type.Object({
        feature_id: Type.String({ description: "ID of the Feature to modify" }),
        reason: Type.String({ description: "Why this Feature is being modified" }),
        updated_title: Type.Optional(Type.String({ description: "New title" })),
        updated_description: Type.Optional(Type.String({ description: "New description" })),
        added_scenarios: Type.Optional(
          Type.Array(NewScenarioSchema, { description: "Scenarios to add" }),
        ),
        modified_scenarios: Type.Optional(
          Type.Array(
            Type.Object({
              scenario_id: Type.String({ description: "ID of the Scenario to modify" }),
              updated_title: Type.Optional(Type.String({ description: "New title" })),
              updated_steps: Type.Optional(
                Type.Array(BddStepSchema, { description: "Replacement steps" }),
              ),
            }),
            { description: "Scenarios to modify" },
          ),
        ),
        removed_scenario_ids: Type.Optional(
          Type.Array(Type.String(), { description: "IDs of Scenarios to remove" }),
        ),
      }),
      { description: "Existing Features to modify" },
    ),
  ),
});
