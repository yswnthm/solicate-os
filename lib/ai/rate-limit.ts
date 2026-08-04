import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// Per-user, per-day AI call budget, backed by the ai_usage table (migration
// 0026). Enforcement happens in the executor, the single choke point every AI
// generation flows through.
//
// Fail-open policy: if the usage table is unreachable we allow the call but log
// a warning, so a stats bug never bricks the product. The hard cap is enforced
// atomically in the DB (ai_usage_consume), so double-click races can't overspend.

export const DEFAULT_DAILY_AI_CALL_LIMIT = 100;

export async function consumeAiCall(userId: string, maxCalls = DEFAULT_DAILY_AI_CALL_LIMIT): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("ai_usage_consume", {
      p_user_id: userId,
      p_max_calls: maxCalls,
    });
    if (error) {
      logger.warn("ai_usage_consume failed", { error: error.message, userId });
      return true;
    }
    return data !== false;
  } catch (cause) {
    logger.warn("ai_usage_consume threw", { error: cause instanceof Error ? cause.message : String(cause), userId });
    return true;
  }
}
