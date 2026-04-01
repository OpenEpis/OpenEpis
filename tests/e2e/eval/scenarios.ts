// --- Types ---

export type EvalDimension = "conflict" | "classification" | "relevance" | "quality";

export interface HardAssertions {
  expectToolCalled?: string[];
  expectToolNotCalled?: string[];
}

export interface SetupFeature {
  title: string;
  description: string;
  tags: string[];
  scenarios: Array<{
    title: string;
    tags: string[];
    steps: Array<{ type: string; text: string }>;
  }>;
}

export interface EvalScenario {
  name: string;
  dimension: EvalDimension;
  setup?: {
    existingFeatures: SetupFeature[];
  };
  input: string;
  goal: string;
  hardAssertions?: HardAssertions;
}

// --- Conflict Detection Scenarios ---

const conflictA: EvalScenario = {
  name: "Policy contradiction",
  dimension: "conflict",
  setup: {
    existingFeatures: [
      {
        title: "User Login",
        description: "User authentication and login functionality",
        tags: ["auth"],
        scenarios: [
          {
            title: "Lock account after three failed password attempts",
            tags: [],
            steps: [
              { type: "given", text: "a user has entered wrong password 3 times" },
              { type: "when", text: "the user tries to log in again" },
              { type: "then", text: "the account is locked for 30 minutes" },
            ],
          },
        ],
      },
    ],
  },
  input:
    "Write BDD for user login with no restrictions on failed attempts — users can retry unlimited times",
  goal: "The agent should mention or detect that the new requirement (unlimited retries) contradicts the existing scenario (lock after three failed attempts). The reply should flag this conflict rather than silently creating contradictory BDD.",
};

const conflictB: EvalScenario = {
  name: "Duplicate feature",
  dimension: "conflict",
  setup: {
    existingFeatures: [
      {
        title: "Shopping Cart",
        description: "Shopping cart management functionality",
        tags: ["cart"],
        scenarios: [
          {
            title: "Add item to cart",
            tags: [],
            steps: [
              { type: "given", text: "a user is viewing a product page" },
              { type: "when", text: "the user clicks add to cart" },
              { type: "then", text: "the item is added to the shopping cart" },
            ],
          },
        ],
      },
    ],
  },
  input: "Write BDD for shopping cart functionality",
  goal: "The agent should recognize that a Shopping Cart feature already exists and ask whether to modify the existing feature or create a new one, rather than ignoring the existing content and creating a duplicate.",
};

// --- Intent Classification Scenarios ---

const classificationA: EvalScenario = {
  name: "Create intent",
  dimension: "classification",
  input: "Write BDD for user favorites functionality",
  goal: "The agent should generate new BDD features related to user favorites. The reply should contain new feature definitions with scenarios.",
  hardAssertions: {
    expectToolCalled: ["update_bdd"],
  },
};

const classificationB: EvalScenario = {
  name: "Modify intent",
  dimension: "classification",
  setup: {
    existingFeatures: [
      {
        title: "Shopping Cart",
        description: "Shopping cart management functionality",
        tags: ["cart"],
        scenarios: [
          {
            title: "Add item to cart",
            tags: [],
            steps: [
              { type: "given", text: "a user is viewing a product page" },
              { type: "when", text: "the user clicks add to cart" },
              { type: "then", text: "the item is added to the shopping cart" },
            ],
          },
        ],
      },
    ],
  },
  input: "Add a scenario to shopping cart: notify user when quantity exceeds stock",
  goal: "The agent should search for the existing Shopping Cart feature and modify it by adding the new scenario, rather than creating an entirely new feature.",
  hardAssertions: {
    expectToolCalled: ["search_features"],
  },
};

const classificationC: EvalScenario = {
  name: "Query intent",
  dimension: "classification",
  setup: {
    existingFeatures: [
      {
        title: "User Registration",
        description: "User registration functionality",
        tags: ["auth"],
        scenarios: [
          {
            title: "Register with valid email",
            tags: [],
            steps: [
              { type: "given", text: "a new user visits the registration page" },
              { type: "when", text: "they enter a valid email and password" },
              { type: "then", text: "the account is created successfully" },
            ],
          },
        ],
      },
      {
        title: "User Profile",
        description: "User profile management functionality",
        tags: ["profile"],
        scenarios: [
          {
            title: "Update display name",
            tags: [],
            steps: [
              { type: "given", text: "a logged-in user is on the profile page" },
              { type: "when", text: "they change their display name and save" },
              { type: "then", text: "the display name is updated" },
            ],
          },
        ],
      },
    ],
  },
  input: "What features does the project currently have?",
  goal: "The agent should search and list existing features without generating new BDD. The reply should describe the existing features.",
  hardAssertions: {
    expectToolNotCalled: ["update_bdd"],
  },
};

// --- Output Relevance Scenario ---

const relevance: EvalScenario = {
  name: "Payment topic matching",
  dimension: "relevance",
  input: "Write BDD for payment functionality",
  goal: "All generated feature and scenario titles and content should be related to payment (e.g., checkout, payment methods, refunds, payment confirmation). No generated content should drift to unrelated topics like user profiles or search.",
};

// --- BDD Quality Scenario ---

const quality: EvalScenario = {
  name: "Step specificity",
  dimension: "quality",
  input: "Write BDD for order management functionality",
  goal: 'Given/When/Then steps should be specific and testable. Steps should NOT contain vague expressions like "works correctly", "handles properly", or "functions as expected". Steps should reference concrete actions (e.g., "the user clicks Submit") and observable outcomes (e.g., "an order confirmation email is sent"). The scenarios should cover both happy path and at least one error path.',
};

// --- Export All ---

export const evalScenarios: EvalScenario[] = [
  conflictA,
  conflictB,
  classificationA,
  classificationB,
  classificationC,
  relevance,
  quality,
];
