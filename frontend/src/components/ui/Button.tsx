import React from 'react';
import { Button as AstryxButton } from '@astryxdesign/core/Button';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

function resolveAstryxVariant(variant: ButtonVariant): 'primary' | 'secondary' | 'ghost' | 'destructive' {
  if (variant === 'primary') return 'primary';
  if (variant === 'destructive' || variant === 'danger') return 'destructive';
  if (variant === 'ghost' || variant === 'outline') return 'ghost';
  return 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  label,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
  style,
  'aria-label': ariaLabel,
}) => {
  const astryxVariant = resolveAstryxVariant(variant);
  const buttonLabel = label || (typeof children === 'string' ? children : ariaLabel || 'Tombol');
  const isFullWidth = style?.width === '100%';

  return (
    <div
      style={{
        display: isFullWidth ? 'block' : 'inline-block',
        width: isFullWidth ? '100%' : 'auto',
        ...style,
      }}
      className={className}
    >
      <AstryxButton
        label={buttonLabel}
        variant={astryxVariant}
        size={size}
        isLoading={isLoading}
        isDisabled={disabled}
        type={type}
        width={isFullWidth ? '100%' : undefined}
        onClick={onClick}
      >
        {children}
      </AstryxButton>
    </div>
  );
};
