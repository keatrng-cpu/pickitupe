export function DoorHanger() {
  return (
    <article className="float-card relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-surface px-7 py-10 text-center text-fg shadow-[0_30px_70px_-30px_rgba(0,0,0,0.55)] ring-1 ring-gold/35">
      <div className="mx-auto mb-5 size-12 rounded-full border-2 border-dashed border-gold/50" />
      <p className="font-display text-4xl leading-none tracking-wide">
        PICK IT UP E
      </p>
      <p className="mt-3 text-sm uppercase tracking-[0.22em] text-gold">
        Leaf Cleanup & Junk Removal
      </p>
      <p className="mt-3 text-sm italic text-muted">
        We rake, blow & haul it — you never touch a bag.
      </p>

      <div className="my-6 h-px bg-gold/40" />

      <p className="text-xs tracking-[0.28em] text-gold">EARLY BIRD</p>
      <p className="mt-1 font-display text-6xl leading-none">$50 OFF</p>
      <p className="mt-2 text-sm text-muted">
        first cleanup · first 25 bookings only
      </p>

      <div className="my-6 h-px bg-gold/40" />

      <p className="text-xs tracking-[0.22em] text-gold">WHAT WE DO</p>
      <ul className="mt-3 space-y-1 text-sm text-fg/90">
        <li>Raking & full leaf cleanup</li>
        <li>Garage & basement cleanouts</li>
        <li>Furniture · Appliances</li>
        <li>Single-item pickups</li>
      </ul>

      <p className="mt-7 font-display text-3xl tracking-wide">218-779-2553</p>
      <p className="mt-1 text-sm text-muted">Call or Text — Free Estimate</p>
      <p className="mt-5 text-xs text-muted">
        Serving Grand Forks, ND
        <br />
        $50 deposit holds your date · applied to your bill
      </p>
    </article>
  );
}
