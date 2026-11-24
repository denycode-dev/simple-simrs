import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { ServerErrorPage } from './ServerErrorPage';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Captured by RouteErrorBoundary:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ServerErrorPage
          error={this.state.error}
          resetErrorBoundary={this.resetError}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Functional Route Error Component for React Router data router errorElement
 */
export const RouteErrorElement: React.FC = () => {
  const error = useRouteError();
  return <ServerErrorPage error={error} />;
};
