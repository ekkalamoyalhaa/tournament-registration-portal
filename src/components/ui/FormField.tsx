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
      <span className="font-display text-label-lg uppercase text-on-surface">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="glass-input mt-2 w-full rounded-lg px-4 py-3 font-sans text-body-md placeholder:text-sand/40"
      />
      {hint && <span className="mt-1 block font-sans text-body-sm text-outline">{hint}</span>}
    </label>
  );
}