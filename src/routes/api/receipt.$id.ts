import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/receipt/:id — the stored receipt image or PDF, owner-only.
 *
 * Auth is the same-origin session cookie (Better Auth), resolved the same way
 * the owner server functions do it, so `<img src="/api/receipt/12">` on the
 * books page just works and a logged-out or non-owner request gets a 404 —
 * not a 403 — so the URL space leaks nothing about which ids exist.
 */
export const Route = createFileRoute("/api/receipt/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = Number(params.id);
        if (!Number.isInteger(id) || id <= 0) return new Response("not found", { status: 404 });
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const { isOwnerEmail } = await import("@/lib/owner");
        const user = await getSessionUser();
        if (!isOwnerEmail(user?.email)) return new Response("not found", { status: 404 });
        const { readReceipt } = await import("@/lib/receipts");
        const r = await readReceipt(id);
        if (!r) return new Response("not found", { status: 404 });
        return new Response(new Uint8Array(r.bytes), {
          status: 200,
          headers: {
            "content-type": r.mime,
            "content-length": String(r.bytes.byteLength),
            "cache-control": "private, max-age=3600",
            "content-disposition": `inline; filename="receipt-${id}.${r.mime === "application/pdf" ? "pdf" : "jpg"}"`,
          },
        });
      },
    },
  },
});
