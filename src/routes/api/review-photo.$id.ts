import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/review-photo/:id — a customer's review photo.
 *
 * Public only when the review is published AND the customer ticked the photo
 * consent box; otherwise owner-only (the care board previews pending ones).
 * Unknown, hidden or unconsented ids are a 404, never a 403, so the id space
 * leaks nothing.
 */
export const Route = createFileRoute("/api/review-photo/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = Number(params.id);
        if (!Number.isInteger(id) || id <= 0) return new Response("not found", { status: 404 });
        const { careSql } = await import("@/lib/care.server");
        const sql = await careSql();
        const rows = await sql.query<{ mime: string; bytes: Uint8Array; status: string; photo_consent: boolean }>(
          `select p.mime, p.bytes, r.status, r.photo_consent
             from review_photos p join reviews r on r.id = p.review_id
            where p.id = $1`,
          [id],
        );
        const row = rows[0];
        if (!row) return new Response("not found", { status: 404 });
        const isPublic = row.status === "published" && row.photo_consent;
        if (!isPublic) {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { isOwnerEmail } = await import("@/lib/owner");
          const user = await getSessionUser();
          if (!isOwnerEmail(user?.email)) return new Response("not found", { status: 404 });
        }
        const bytes = new Uint8Array(row.bytes);
        return new Response(bytes, {
          status: 200,
          headers: {
            "content-type": row.mime,
            "content-length": String(bytes.byteLength),
            "cache-control": isPublic ? "public, max-age=86400" : "private, no-store",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
