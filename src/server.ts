import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const layers = ["problem", "system", "design", "algorithm", "implementation", "language", "runtime", "operations"] as const;
type AbstractionLayer = (typeof layers)[number];

interface AssistRequest {
  userId: string;
  context: { currentFileContext: string; userPrompt: string };
  requestedAssistanceLevel: number;
}

function detectLayer(prompt: string): AbstractionLayer {
  const normalizedPrompt = prompt.toLowerCase();
  if (/\b(async|await|promise|thread|concurr|latency|event loop)\b/.test(normalizedPrompt)) return "runtime";
  if (/\b(class|function|type|syntax|variable|typescript|javascript)\b/.test(normalizedPrompt)) return "language";
  if (/\b(sort|search|complexity|algorithm|recursion)\b/.test(normalizedPrompt)) return "algorithm";
  if (/\b(api|database|schema|architecture|service)\b/.test(normalizedPrompt)) return "system";
  if (/\b(design|pattern|interface|component)\b/.test(normalizedPrompt)) return "design";
  if (/\b(deploy|docker|ci|monitor|production)\b/.test(normalizedPrompt)) return "operations";
  return "implementation";
}

function getMacroState(mastery: number): "activeCognitiveFriction" | "calibratedScaffolding" | "unrestrictedDelegation" {
  if (mastery < 0.5) return "activeCognitiveFriction";
  if (mastery < 0.8) return "calibratedScaffolding";
  return "unrestrictedDelegation";
}

function validatePayload(body: unknown): AssistRequest {
  if (!body || typeof body !== "object") throw new Error("Request body must be an object");
  const payload = body as Partial<AssistRequest>;
  if (!payload.userId || typeof payload.userId !== "string") throw new Error("userId is required");
  if (!payload.context || typeof payload.context.userPrompt !== "string" || typeof payload.context.currentFileContext !== "string") {
    throw new Error("context.currentFileContext and context.userPrompt are required");
  }
  if (typeof payload.requestedAssistanceLevel !== "number" || !Number.isInteger(payload.requestedAssistanceLevel) || payload.requestedAssistanceLevel < 0) {
    throw new Error("requestedAssistanceLevel must be a non-negative integer");
  }
  return payload as AssistRequest;
}

app.post("/api/v1/assist", async (request: Request, response: Response) => {
  try {
    const payload = validatePayload(request.body);
    const abstractionLayer = detectLayer(payload.context.userPrompt);
    const { data: capability, error: capabilityError } = await supabase
      .from("capability_scores")
      .select("p_mastery")
      .eq("user_id", payload.userId)
      .eq("layer_id", abstractionLayer)
      .maybeSingle();
    if (capabilityError) throw capabilityError;

    const mastery = capability?.p_mastery ?? 0.2;
    const macroState = getMacroState(mastery);
    const permittedLevel = macroState === "activeCognitiveFriction"
      ? Math.min(payload.requestedAssistanceLevel, 3)
      : macroState === "calibratedScaffolding"
        ? Math.min(payload.requestedAssistanceLevel, 5)
        : Math.min(payload.requestedAssistanceLevel, 7);
    const requiresCheckpoint = macroState === "activeCognitiveFriction";
    const { error: logError } = await supabase.from("intervention_logs").insert({
      user_id: payload.userId,
      requested_level: payload.requestedAssistanceLevel,
      permitted_level: permittedLevel,
      abstraction_layer: abstractionLayer,
      checkpoint_triggered: requiresCheckpoint,
      checkpoint_passed: null,
    });
    if (logError) throw logError;

    return response.json({
      permittedAssistanceLevel: permittedLevel,
      abstractionLayer,
      macroState,
      masteryScore: mastery,
      requiresCheckpoint,
      socraticPrompt: requiresCheckpoint
        ? `Before receiving more assistance, explain what you think is happening in the ${abstractionLayer} layer and identify one approach you would try.`
        : null,
    });
  } catch (error) {
    console.error("Assist request failed:", error);
    return response.status(400).json({ error: error instanceof Error ? error.message : "Unable to process assist request" });
  }
});

export { app, detectLayer };

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`SkillLayer policy engine listening on port ${port}`));
}
