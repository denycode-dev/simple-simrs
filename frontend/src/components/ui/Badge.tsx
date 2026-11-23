import React from 'react';
import { Badge as AstryxBadge } from '@astryxdesign/core/Badge';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'teal' | 'primary' | 'danger';

export interface BadgeProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  label,
  variant = 'neutral',
  className,
  style,
}) => {
  let astryxVariant: 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'teal' = 'neutral';
  if (variant === 'primary') astryxVariant = 'teal';
  else if (variant === 'danger') astryxVariant = 'error';
  else if (variant === 'info' || variant === 'success' || variant === 'warning' || variant === 'error') {
    astryxVariant = variant;
  }

  const badgeContent = label !== undefined ? label : children !== undefined ? children : '';

  return (
    <span style={{ display: 'inline-flex', verticalAlign: 'middle', ...style }} className={className}>
      <AstryxBadge label={badgeContent} variant={astryxVariant} />
    </span>
  );
};
