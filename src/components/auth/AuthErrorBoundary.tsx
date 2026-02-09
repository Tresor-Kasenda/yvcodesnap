import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught error:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-800 bg-white/90 dark:bg-white/5 backdrop-blur-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Authentication Error
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Something went wrong with authentication. Please refresh the page or try again later.
              </p>
            </div>
            <button
              onClick={this.handleRefresh}
              type="button"
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
