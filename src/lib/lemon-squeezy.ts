/**
 * Extracts the user ID from a Lemon Squeezy webhook payload.
 * The user ID can be located in several places within the meta object
 * depending on how it was passed during the checkout process.
 *
 * @param payload - The Lemon Squeezy webhook payload
 * @returns The user ID as a string, or undefined if not found
 */
export function getUserIdFromPayload(payload: any): string | undefined {
  const userId =
    payload?.meta?.custom_data?.user_id ??
    payload?.meta?.custom?.user_id ??
    payload?.meta?.custom_data?.userId ??
    payload?.meta?.custom?.userId;

  if (typeof userId === "string") {
    return userId;
  }

  if (typeof userId === "number") {
    return String(userId);
  }

  return undefined;
}
