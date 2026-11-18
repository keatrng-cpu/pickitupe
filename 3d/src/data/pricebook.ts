/**
 * CANON — copied from the live pricebook at https://pickitupe.com (read 2026-11-14).
 * Every price on this site renders from this file. If the live pricebook changes, change it here, once.
 */
export const PHONE = '701-213-3969';
export const PHONE_TEL = 'tel:7012133969';
export const SMS_PHOTO = 'sms:7012133969?&body=Junk%20pickup%20quote.%20Photo%20of%20the%20pile%20attached.%20Address%3A%20';
export const HOURS = 'Mon–Fri 9:30–5:30 · Sat 12–4';
export const DEPOSIT = 50;
export const BOOK_BASE = 'https://pickitupe.com/call?service=junk-removal&size=';

export interface HaulSize { id: string; name: string; detail: string; min: number; max: number }

/** Index order is the slider order and the 3D pile states (0 → 5). */
export const sizes: HaulSize[] = [
  { id: 'bags', name: 'Bags', detail: 'Contractor bags or a small pile at the curb', min: 59, max: 95 },
  { id: 'single', name: 'One piece', detail: 'Couch, mattress, dresser, or one appliance', min: 59, max: 95 },
  { id: 'quarter', name: 'A few pieces', detail: 'Fridge, washer, or a corner of the bed', min: 85, max: 130 },
  { id: 'half', name: 'Half the truck', detail: 'Half the bed, heaped', min: 125, max: 195 },
  { id: 'full', name: 'Full truck', detail: 'Bed full and strapped', min: 175, max: 265 },
  { id: 'overflow', name: 'Two trips', detail: 'More than one pickup bed — we walk it if it’s a building', min: 245, max: 365 },
];

export const addOns = [
  { name: 'Stairs or basement carry', min: 30, max: 60 },
  { name: 'Long carry', min: 20, max: 40 },
  { name: 'Garage or basement cleanout', min: 50, max: 100 },
  { name: 'Fridge, freezer, or AC', min: 25, max: 45 },
];

export const estates = [
  { name: 'Room or apartment', min: 650, max: 950 },
  { name: 'House after the estate sale', min: 1400, max: 2400 },
  { name: 'Full house, packed basement or garage', min: 2800, max: 4500 },
];

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
export const range = (a: { min: number; max: number }) => `${usd(a.min)}–${usd(a.max)}`;
export const bookUrl = (id: string) => `${BOOK_BASE}${id}`;
