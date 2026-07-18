import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrandMark } from './BrandMark';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crash', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-cellar-radial px-6 text-center">
          <BrandMark size="md" tagline="Something went wrong" />
          <p className="mt-4 max-w-md text-sm text-parchment-200/70">
            The vault UI hit an unexpected error. Reload to continue — your data is safe on the
            server.
          </p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() => window.location.assign('/dashboard')}
          >
            Reload vault
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
