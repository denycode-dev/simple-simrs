import React from 'react';
import { TextInput as AstryxTextInput } from '@astryxdesign/core/TextInput';

export interface InputProps {
  label?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'password' | 'email' | 'search' | 'tel' | 'url';
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  autoComplete?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
  label = 'Input',
  value = '',
  onChange,
  type = 'text',
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  id,
  autoComplete,
  className,
  style,
}) => {
  return (
    <div style={{ width: '100%', ...style }} className={className}>
      <AstryxTextInput
        label={label}
        value={String(value)}
        onChange={(_, e) => {
          if (onChange) {
            onChange(e);
          }
        }}
        type={type}
        placeholder={placeholder}
        description={helperText}
        status={error ? { type: 'error', message: error } : undefined}
        isDisabled={disabled}
        isRequired={required}
        htmlName={id}
        autoComplete={autoComplete}
        width="100%"
      />
    </div>
  );
};
