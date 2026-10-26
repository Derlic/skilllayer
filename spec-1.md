# Context
I am building the MVP for my "Final Year Project: SkillLayer - An adaptive AI assistance governor for software development that balances developer productivity, code quality and developer skill formation."[cite: 1, 4]

This is a distributed system consisting of a TypeScript VS Code extension (the client) and a serverless Node.js/TypeScript backend (the Policy Engine)[cite: 1, 3]. We are currently building the **Backend Policy Engine**.

The goal of this backend is to intercept AI code generation requests and govern them using a Hierarchical State Machine (HSM) and Bayesian Knowledge Tracing (BKT)[cite: 4]. It evaluates the developer's competence across 8 abstraction layers (Problem, System, Design, Algorithm, Implementation, Language, Runtime, Operations)[cite: 4] and actively restricts AI assistance if the developer's skill in a specific layer is unproven or decaying[cite: 4].

# Technical Stack
* Language: TypeScript / Node.js
* Framework: Express.js (or Fastify)
* State Machine: XState (v5)
* Database: Supabase (PostgreSQL)

# System Architecture & State Formalism
The State Machine governs the developer's permissions based on 4 Macro-States (Dreyfus skill stages):
1. State 1: Diagnostic (Baseline telemetry gathering)
2. State 2: Active Cognitive Friction (Activated when P(L_t) < 0.5. Caps assistance at Level 3. Injects Socratic checkpoints)
3. State 3: Calibrated Scaffolding (Activated when P(L_t) >= 0.5. Caps assistance at Level 5. Allows code fragments)
4. State 4: Unrestricted Delegation (Activated when P(L_t) >= 0.8. Allows Level 6-7 multi-file completion)

# Task 1: Database Schema (Supabase)
Please generate the SQL migration script for the following tables:
1. `users`: user_id (UUID), github_handle
2. `capability_scores`: user_id (FK), layer_id (e.g., 'runtime', 'design'), p_mastery (float default 0.2), p_transit, p_slip, p_guess, updated_at
3. `intervention_logs`: log_id, user_id, requested_level, permitted_level, abstraction_layer, checkpoint_triggered, checkpoint_passed, timestamp

# Task 2: Bayesian Knowledge Tracing (BKT) Engine
Please generate a TypeScript utility file `src/engine/bktEngine.ts` that exports a function to update the Bayesian probability `P(L_t)`.
Formula for Likelihood based on observation:
* If Correct: (P(L_{t-1}) * (1 - P(S))) / (P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G))
* If Incorrect: (P(L_{t-1}) * P(S)) / (P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G)))
Formula for Posterior Update (Applying Transition Probability P(T)):
* New Mastery = Likelihood + (1 - Likelihood) * P(T)

# Task 3: XState Hierarchical State Machine
Please generate `src/engine/stateMachine.ts` using XState v5.
* Context should include: userId, layerId, masteryScore.
* States should strictly match the 4 Macro-States defined above.
* Transitions should be triggered by a `SUBMIT_CHECKPOINT` event (passed: boolean, scoreDelta: number).
* Transition guards must check if the new masteryScore crosses the thresholds (0.5 and 0.8).

# Task 4: Express API Implementation
Please generate `src/server.ts` with the following REST endpoint:
* `POST /api/v1/assist`
* Payload: `{ userId: string, context: { currentFileContext: string, userPrompt: string }, requestedAssistanceLevel: number }`
* Logic: 
  1. Detect the target abstraction layer from the prompt (e.g., if it contains "async", layer = 'runtime').
  2. Fetch the current `p_mastery` for that layer from Supabase.
  3. Determine the Permitted Assistance Level based on the 4 Macro-States.
  4. If in State 2 (Active Cognitive Friction), cap assistance at Level 3 and return `requiresCheckpoint: true` with a Socratic prompt.
  5. Log the intervention to the database.
  6. Return the response payload.

Please provide the implementation for these 4 tasks sequentially, starting with the SQL schema and `bktEngine.ts`.