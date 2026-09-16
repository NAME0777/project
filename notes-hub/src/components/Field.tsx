import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

const control =
  "w-full rounded border border-paper-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-mute/70 focus:border-pen";

export function Field({ label, hint, className = "", ...rest }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-soft">
        {label}
      </label>
      <input id={id} className={`${control} ${className}`} {...rest} />
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, className = "", ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-soft">
        {label}
      </label>
      <textarea id={id} className={`${control} leading-relaxed ${className}`} {...rest} />
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}
