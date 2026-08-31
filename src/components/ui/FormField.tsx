interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
}

export function FormField({ label, name, type = 'text', required, hint, defaultValue }: FormFieldProps) {
  return (
    <label className="block" htmlFor={name}>
      <span className="text-small font-medium text-white/85">
        {label}
        {required && <span className="text-tertiary"> *</span>}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-control border border-glass-border bg-white/5 px-4 py-3 text-body text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/40"
      />
      {hint && <span className="mt-1 block text-small text-white/50">{hint}</span>}
    </label>
  );
}
