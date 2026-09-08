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
      <span className="font-sans text-body-md font-medium text-on-surface">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30"
      />
      {hint && <span className="mt-1 block font-sans text-body-md text-outline">{hint}</span>}
    </label>
  );
}