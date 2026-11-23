import React from 'react';
import { Banner as AstryxBanner } from '@astryxdesign/core/Banner';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  children?: React.ReactNode;
  title?: string;
  variant?: AlertVariant;
  style?: React.CSSProperties;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  title,
  variant = 'info',
  style,
  className,
}) => {
  const status = variant === 'danger' ? 'error' : variant;
  const bannerTitle = title || (variant === 'danger' ? 'Peringatan' : 'Informasi');
  const descriptionText = typeof children === 'string' ? children : undefined;

  return (
    <div style={style} className={className}>
      <AstryxBanner
        status={status}
        title={bannerTitle}
        description={descriptionText}
        container="card"
      >
        {typeof children !== 'string' ? children : undefined}
      </AstryxBanner>
    </div>
  );
};
