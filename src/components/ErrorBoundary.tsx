import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error Boundary caught error:', error, errorInfo);
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 mx-auto flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                Something went wrong
                            </h1>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>
                        </div>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left text-xs bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg max-h-48 overflow-auto">
                                <summary className="cursor-pointer font-semibold mb-2 text-neutral-900 dark:text-white">
                                    Error Details
                                </summary>
                                <pre className="whitespace-pre-wrap break-words text-red-600 dark:text-red-400">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRefresh}
                                type="button"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </button>

                            <button
                                onClick={this.handleReset}
                                type="button"
                                className="px-6 py-3 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-medium transition-colors text-neutral-900 dark:text-white"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
