import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "quiet" | "ghost" | "confirm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  quiet: "bg-white text-ink border border-paper-rule hover:border-ink-mute",
  ghost: "text-pen hover:bg-pen-soft px-2",
  confirm: "bg-ok text-white hover:brightness-110",
};

export default function Button({ variant = "primary", full, className = "", ...rest }: ButtonProps) {
  const width = full ? "w-full" : "";
  return <button className={`${base} ${variants[variant]} ${width} ${className}`} {...rest} />;
}
