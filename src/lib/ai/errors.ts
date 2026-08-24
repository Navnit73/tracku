// ────────────────────────────────────────────────────────────────────────────
// AI Error Types — Safe error mapping for DeepSeek API responses
// ────────────────────────────────────────────────────────────────────────────

export type AIErrorCode =
  | "AI_AUTH_ERROR"
  | "AI_BILLING_ERROR"
  | "AI_RATE_LIMITED"
  | "AI_INVALID_REQUEST"
  | "AI_PROVIDER_ERROR"
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "AI_RESPONSE_INVALID"
  | "AI_CONCURRENCY_LIMITED"
  | "AI_TIMEOUT"
  | "AI_UNKNOWN_ERROR";

/**
 * Application-level AI error. Never exposes raw provider details to the frontend.
 */
export class AIError extends Error {
  public readonly code: AIErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;

  constructor(code: AIErrorCode, message: string, statusCode: number = 500, retryable: boolean = false) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

/**
 * Maps an HTTP status code from DeepSeek's response to a safe application error.
 * Never exposes raw provider error messages, API keys, or stack traces.
 */
export function mapDeepSeekHttpError(httpStatus: number): AIError {
  switch (httpStatus) {
    case 400:
      return new AIError("AI_INVALID_REQUEST", "The AI request was invalid. Please try again.", 400);
    case 401:
      return new AIError("AI_AUTH_ERROR", "AI service authentication failed. Please contact support.", 401);
    case 402:
      return new AIError("AI_BILLING_ERROR", "AI service billing issue. Please contact support.", 402);
    case 422:
      return new AIError("AI_INVALID_REQUEST", "The AI request parameters were invalid. Please try again.", 422);
    case 429:
      return new AIError("AI_RATE_LIMITED", "AI service is temporarily busy. Please try again in a moment.", 429, true);
    case 500:
      return new AIError("AI_PROVIDER_ERROR", "AI service encountered an internal error. Please try again later.", 500, true);
    case 503:
      return new AIError(
        "AI_TEMPORARILY_UNAVAILABLE",
        "AI service is temporarily unavailable due to high demand. Please try again shortly.",
        503,
        true
      );
    default:
      return new AIError("AI_PROVIDER_ERROR", "AI service encountered an unexpected error. Please try again later.", 500);
  }
}

/**
 * Converts an AIError to a safe response object suitable for sending to the frontend.
 * Strips all internal details — only returns code and user-friendly message.
 */
export function toSafeErrorResponse(error: unknown): { error: AIErrorCode; message: string; retryable: boolean } {
  if (error instanceof AIError) {
    return {
      error: error.code,
      message: error.message,
      retryable: error.retryable,
    };
  }

  // Unknown errors — never leak raw messages
  return {
    error: "AI_UNKNOWN_ERROR",
    message: "An unexpected error occurred with the AI service. Please try again later.",
    retryable: false,
  };
}
