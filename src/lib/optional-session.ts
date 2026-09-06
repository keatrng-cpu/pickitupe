import { createMiddleware } from "@tanstack/react-start";

/** Session if present, null if the visitor is a guest. Booking stays open. */
export const optionalSession = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    return next({ context: { userId: user?.id ?? null, email: user?.email ?? null } });
  });

/** Signed-in user plus email — for the owner board vs customer hauls. */
export const sessionEmail = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { requireUserId, getSessionUser } = await import("@/lib/auth/verify.server");
    assertSameSiteRequest();
    const userId = await requireUserId(context.bearerToken);
    const user = await getSessionUser(context.bearerToken);
    return next({ context: { userId, email: user?.email ?? null } });
  });
