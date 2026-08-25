-- The block deal, finally stored instead of applied by hand on the invoice.
--
-- It shipped as marketing copy in six places and zero lines of pricing logic:
-- `estimate()` had no way to produce the $25 the site advertised, so the owner
-- subtracted it after the fact and walked straight through the $55 floor (a
-- small lot quoted $76 with the promo, minus $25 by hand = $51). Recording the
-- household count is what lets the estimate the customer accepted be
-- reconstructed later, and what lets /jobs group a street correctly.
--
-- `households` counts houses on the same street booked for the same day,
-- INCLUDING this one. 1 (or null, for rows written before this migration)
-- means no block deal.
alter table bookings add column if not exists households integer;

-- Which credit actually produced the quoted number: 'none' | 'promo' | 'block'.
-- Stored rather than recomputed because the promo is date-gated — re-running
-- estimate() against a booking taken in August would silently produce a
-- different answer once PROMO_DEADLINE passes.
alter table bookings add column if not exists applied_discount text;

-- Same reason: the dollar figure the customer was actually shown.
alter table bookings add column if not exists discount_amount integer;
