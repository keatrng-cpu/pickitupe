export function DoorHanger() {
  return (
    <article className="card-print relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.75rem] px-8 py-10 text-center">
      <div className="mx-auto mb-6 size-14 rounded-full bg-bg shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--color-paper)_35%,transparent)]" />
      <p className="font-display text-4xl leading-none tracking-wide text-paper">
        PICK IT UP E
      </p>
      <p className="kicker mt-3">Leaf Cleanup & Junk Removal</p>
      <p className="mt-3 text-sm italic text-paper/75">
        We rake, blow & haul it — you never touch a bag.
      </p>

      <div className="print-rule my-6" />

      <p className="kicker">Book early</p>
      <p className="mt-1 font-display text-6xl leading-none text-paper">20% OFF</p>
      <p className="mt-2 text-sm text-paper/70">up to $75 · lock the rate by Sept 20</p>

      <div className="print-rule my-6" />

      <p className="kicker">What we haul</p>
      <ul className="mt-3 space-y-1 text-sm text-paper/90">
        <li>Raking & full leaf cleanup</li>
        <li>Garage & basement cleanouts</li>
        <li>Furniture · Appliances</li>
        <li>Single-item pickups</li>
      </ul>

      <p className="mt-7 font-display text-3xl tracking-wide text-paper">
        218-779-2553
      </p>
      <p className="mt-1 text-sm text-paper/70">Call or text</p>
      <p className="mt-5 text-xs leading-relaxed text-paper/55">
        Grand Forks, ND
        <br />
        Hang on the knob — never the mailbox.
      </p>
    </article>
  );
}
