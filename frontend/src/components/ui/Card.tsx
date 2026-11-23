import React from 'react';
import { Card as AstryxCard } from '@astryxdesign/core/Card';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'none' | 'low' | 'med' | 'high';
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  variant?: 'default' | 'transparent' | 'muted' | 'gray' | 'teal';
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'low',
  padding = 4,
  variant = 'default',
  style,
  className,
  ...props
}) => (
  <div style={style} className={className} {...props}>
    <AstryxCard elevation={elevation} padding={padding} variant={variant}>
      {children}
    </AstryxCard>
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, style, ...props }) => (
  <div
    style={{
      paddingBottom: '0.75rem',
      marginBottom: '0.75rem',
      borderBottom: '1px solid var(--color-border, #e2e8f0)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, style, ...props }) => (
  <h3
    style={{
      fontSize: '1.125rem',
      fontWeight: 600,
      color: 'var(--color-text-main, #0f172a)',
      margin: 0,
      ...style,
    }}
    {...props}
  >
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, style, ...props }) => (
  <div style={{ flex: 1, ...style }} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, style, ...props }) => (
  <div
    style={{
      paddingTop: '0.75rem',
      marginTop: '0.75rem',
      borderTop: '1px solid var(--color-border, #e2e8f0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '0.5rem',
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);
