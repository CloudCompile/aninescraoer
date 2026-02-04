/**
 * Interface for HTTP error with status and message
 */
interface HttpError {
  status?: number;
  message?: string;
}

/**
 * Type guard to check if an error has status property
 */
function isHttpError(err: unknown): err is HttpError {
  return (
    typeof err === "object" &&
    err !== null &&
    ("status" in err || "message" in err)
  );
}

/**
 * Extracts status code from an error object
 * @param err The error object
 * @param defaultStatus Default status code if none found
 * @returns The status code
 */
export function getErrorStatus(err: unknown, defaultStatus = 500): number {
  if (isHttpError(err) && typeof err.status === "number") {
    return err.status;
  }
  return defaultStatus;
}

/**
 * Extracts message from an error object
 * @param err The error object
 * @param defaultMessage Default message if none found
 * @returns The error message
 */
export function getErrorMessage(err: unknown, defaultMessage: string): string {
  if (isHttpError(err) && typeof err.message === "string") {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMessage;
}
