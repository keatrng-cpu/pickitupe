/**
 * The brand truck, drawn once: a vintage cream pickup (rounded fenders,
 * chrome trim, whitewalls, walnut stake rails, a tarp-covered load roped
 * down). Faces right — never flip it. Owner, Nov 13: "a little more classy".
 *
 * Plain SVG markup (no JSX) so the site (`TruckSvg`) and the print build
 * (`scripts/make-winter-print.mjs`) draw the identical truck. viewBox is
 * 0 0 320 160 — same box as the truck it replaced, so no layout moves.
 * No user input ever reaches this string.
 */

export type TruckArtOptions = {
  /** Window glass — page green on the site, deep mahogany in print. */
  glass?: string;
  /** Class on each wheel group (e.g. "truck-wheel" to spin on the road). */
  wheelClass?: string;
  /** Snow on the roof and tarp. */
  snow?: boolean;
  /** Ground shadow under the tires. */
  shadow?: boolean;
};

const CREAM = "#efe2c4";
const CREAM_SHADE = "#e0cfa8";
const CREAM_DEEP = "#cdb88c";
const CHROME = "#dcd8cf";
const CHROME_HI = "#ffffff";
const TIRE = "#1b1612";
const WHITEWALL = "#f4ecdc";
const WALNUT = "#6b4128";
const CANVAS = "#cbb68c";
const CANVAS_FOLD = "#b39c70";
const ROPE = "#8a6a3a";
const PINSTRIPE = "#a8783e";
const SCRIPT = "#5a2a1c";
const SNOW = "#fffaf0";

function wheel(cx: number, wheelClass?: string) {
  const cls = wheelClass ? ` class="${wheelClass}"` : "";
  return `<g${cls} style="transform-origin:${cx}px 128px">
  <circle cx="${cx}" cy="128" r="21" fill="${TIRE}"/>
  <circle cx="${cx}" cy="128" r="14.5" fill="${WHITEWALL}"/>
  <circle cx="${cx}" cy="128" r="9.5" fill="${CHROME}"/>
  <circle cx="${cx}" cy="128" r="9.5" fill="none" stroke="#b9b3a6" stroke-width="0.8"/>
  <circle cx="${cx - 2.5}" cy="125.5" r="3" fill="${CHROME_HI}" opacity="0.7"/>
  <circle cx="${cx}" cy="128" r="2.6" fill="${SCRIPT}"/>
  <rect x="${cx - 0.8}" y="119.6" width="1.6" height="4" rx="0.8" fill="#9a958b"/>
</g>`;
}

export function truckArt({ glass = "#16362a", wheelClass, snow = true, shadow = true }: TruckArtOptions = {}) {
  return [
    shadow ? `<ellipse cx="160" cy="151" rx="142" ry="5.5" fill="#000" opacity="0.2"/>` : "",
    // load: tarp over the bed, roped down, inside walnut stake rails
    `<path d="M24 82 C24 60 40 49 70 48 C102 47 128 51 137 64 L139 82 Z" fill="${CANVAS}"/>`,
    `<path d="M46 80 C50 66 58 56 70 52 M92 80 C94 66 98 56 108 51" stroke="${CANVAS_FOLD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    `<path d="M36 82 L44 53 M84 82 L84 48 M128 82 L124 58" stroke="${ROPE}" stroke-width="1.5" stroke-linecap="round"/>`,
    snow
      ? `<path d="M40 52 C62 44 104 44 126 54 C104 50 66 50 40 55 Z" fill="${SNOW}" opacity="0.95"/>`
      : "",
    ...[21, 59, 97, 135].map((x) => `<rect x="${x}" y="60" width="4" height="24" rx="1" fill="${WALNUT}"/>`),
    `<rect x="19" y="61" width="122" height="3.2" rx="1.6" fill="${WALNUT}"/>`,
    `<rect x="19" y="71" width="122" height="3.2" rx="1.6" fill="${WALNUT}"/>`,
    // bed
    `<path d="M18 82 H142 V120 H22 Q18 120 18 116 Z" fill="${CREAM}"/>`,
    `<rect x="18" y="82" width="124" height="3" fill="${CREAM_DEEP}" opacity="0.55"/>`,
    `<rect x="13" y="87" width="5" height="10" rx="2" fill="#a5281b"/>`,
    // rear fender
    `<path d="M50 121 C50 100 62 91 78 91 C95 91 107 100 108 121 Z" fill="${CREAM_SHADE}"/>`,
    `<path d="M53 112 C56 99 66 94 78 94" stroke="${CHROME_HI}" stroke-width="1.2" fill="none" opacity="0.55" stroke-linecap="round"/>`,
    // cab
    `<path d="M142 121 V68 C142 55 150 46 163 46 H185 C196 46 202 52 206 62 L215 86 V121 Z" fill="${CREAM}"/>`,
    snow ? `<path d="M151 47 C158 42 188 41 199 48 C186 46 162 46 151 50 Z" fill="${SNOW}"/>` : "",
    `<path d="M151 86 V69 C151 61 156 55 164 55 H184 C190 55 194 59 196 64 L204 86 Z" fill="${glass}"/>`,
    `<path d="M158 82 L170 58 H175 L163 82 Z" fill="#ffffff" opacity="0.16"/>`,
    `<path d="M147 90 H212 V119" stroke="${CREAM_DEEP}" stroke-width="1" fill="none" opacity="0.8"/>`,
    `<rect x="199" y="94" width="8" height="2.4" rx="1.2" fill="${CHROME}"/>`,
    // hood + chrome spear
    `<path d="M212 86 H260 C282 86 296 94 300 108 V121 H212 Z" fill="${CREAM}"/>`,
    `<path d="M216 97 H292" stroke="${CHROME}" stroke-width="1.6" stroke-linecap="round"/>`,
    // pinstripe through bed, door and hood
    `<path d="M22 101 H140 M146 101 H211 M214 101 H296" stroke="${PINSTRIPE}" stroke-width="0.9" opacity="0.85"/>`,
    // door script
    `<text x="179" y="113" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-style="italic" font-weight="700" font-size="8.4" fill="${SCRIPT}">Pick It Up E</text>`,
    // front fender + headlight
    `<path d="M212 122 C214 101 228 91 246 91 C267 91 284 102 291 122 Z" fill="${CREAM_SHADE}"/>`,
    `<path d="M218 112 C222 100 232 94 246 94" stroke="${CHROME_HI}" stroke-width="1.2" fill="none" opacity="0.55" stroke-linecap="round"/>`,
    `<circle cx="283" cy="100" r="6.8" fill="${CHROME}"/>`,
    `<circle cx="283.6" cy="100" r="4.6" fill="#ffe3a1"/>`,
    // grille
    `<rect x="297" y="99" width="8" height="21" rx="3.5" fill="${CHROME}"/>`,
    `<path d="M299.5 102 V117 M302.5 102 V117" stroke="#a9a397" stroke-width="0.9"/>`,
    // running board + bumpers
    `<rect x="106" y="119" width="108" height="5" rx="2.5" fill="#2a201a"/>`,
    `<rect x="290" y="119" width="24" height="6.5" rx="3.2" fill="${CHROME}"/>`,
    `<rect x="290" y="119" width="24" height="2" rx="1" fill="${CHROME_HI}" opacity="0.6"/>`,
    `<rect x="7" y="117" width="17" height="6.5" rx="3.2" fill="${CHROME}"/>`,
    wheel(78, wheelClass),
    wheel(246, wheelClass),
  ].join("\n");
}
