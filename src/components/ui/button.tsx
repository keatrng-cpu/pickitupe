import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Three-tier ladder: cream = the ONE primary action per view · ghost =
// secondary · print = actions on paper/mahogany surfaces. The old `primary`
// variant (bg-sioux + a hard drop shadow) had zero call sites — every button
// in the app already passes cream or ghost explicitly — so it's gone rather
// than softened, taking the app's only hard shadow with it.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide btn-press disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        cream: "bg-fg text-ink hover:bg-gold",
        print: "bg-mahogany text-paper hover:bg-mahogany-deep",
        ghost: "border border-border bg-transparent text-fg hover:bg-fg/8",
      },
      size: {
        sm: "h-11 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "cream", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: Props) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
