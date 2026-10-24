/**
 * The Stripe account is shared with other businesses. American Penny Power
 * (APP) tags every object it creates with metadata.app = "apg" and uses price
 * lookup keys starting with "apg_". Its checkout, subscription and invoice
 * events also reach this webhook; they must never create or change a
 * Pick It Up E subscription, so the webhook acknowledges them (200) and stops.
 */
type Meta = Record<string, string> | null | undefined;
type PriceLike = {
  id?: string;
  lookup_key?: string | null;
  metadata?: Meta;
  product?: string | { id?: string; metadata?: Meta } | null;
} | null | undefined;

const APP_PRODUCT_IDS = new Set([
  "prod_VV7WilOqfRELCF", // Collector membership
  "prod_VUhl5D48mS8KYU", "prod_VUhlJirhcINPSR", "prod_VUhlXCV6vVOdwg", "prod_VUhlLoOiw9waOz", // one-time products
]);

const isAppMeta = (md: Meta) => !!md && (md.app === "apg" || md.app === "american-penny-power");

function isAppPrice(p: PriceLike): boolean {
  if (!p || typeof p !== "object") return false;
  const product = typeof p.product === "string" ? p.product : p.product?.id;
  const productMeta = typeof p.product === "object" && p.product ? p.product.metadata : undefined;
  return isAppMeta(p.metadata) || isAppMeta(productMeta) ||
    (typeof p.lookup_key === "string" && p.lookup_key.startsWith("apg_")) ||
    (!!product && APP_PRODUCT_IDS.has(product));
}

export function isAmericanPennyPowerObject(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as {
    metadata?: Meta;
    subscription_details?: { metadata?: Meta } | null;
    parent?: { subscription_details?: { metadata?: Meta } | null } | null;
    items?: { data?: unknown[] };
    lines?: { data?: unknown[] };
    line_items?: { data?: unknown[] };
  };
  if (isAppMeta(o.metadata)) return true;
  if (isAppMeta(o.subscription_details?.metadata) || isAppMeta(o.parent?.subscription_details?.metadata)) return true;
  const items = [...(o.items?.data ?? []), ...(o.lines?.data ?? []), ...(o.line_items?.data ?? [])] as Array<{
    metadata?: Meta; price?: PriceLike; plan?: PriceLike; pricing?: { price_details?: PriceLike } | null;
  } | null>;
  return items.some((it) => !!it && (isAppMeta(it.metadata) || isAppPrice(it.price) || isAppPrice(it.plan) || isAppPrice(it.pricing?.price_details)));
}
