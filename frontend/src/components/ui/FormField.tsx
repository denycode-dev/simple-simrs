import React from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: React.ReactElement<any>;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
}) => {
  const hasError = Boolean(error);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Clone child input to attach accessibility attributes and error styles
  const clonedChild = React.cloneElement(children, {
    id: children.props.id || id,
    'aria-invalid': hasError ? 'true' : 'false',
    'aria-describedby': hasError ? errorId : hint ? hintId : undefined,
    className: `${children.props.className || ''} ${
      hasError ? '!border-red-500 !focus:ring-red-500' : ''
    }`.trim(),
  });

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-semibold text-text-main">
        {label} {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
      </label>

      {clonedChild}

      {hint && !hasError && (
        <p id={hintId} className="text-xs text-text-muted mt-1">
          {hint}
        </p>
      )}

      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-fade-in"
        >
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
