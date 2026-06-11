import { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white font-mono p-8">
          <div className="w-16 h-16 border-2 border-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-lg font-bold tracking-wider mb-2">SYSTEM_ERROR</h1>
          <p className="text-sm text-gray-400 mb-4 text-center max-w-md">
            An unexpected error occurred. The application may need to be reloaded.
          </p>
          <pre className="text-xs text-red-400/60 bg-white/5 p-4 rounded max-w-lg overflow-auto mb-6">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-white/20 rounded hover:bg-white/10 transition-colors text-sm cursor-pointer"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
