import { Component } from 'react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="text-center max-w-md px-6">
            <div className="text-6xl mb-6">😵</div>
            <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
            <p className="text-slate-400 mb-2 text-sm">
              An unexpected error occurred. This is usually temporary — try refreshing.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-400/70 mb-6 font-mono bg-red-500/5 p-3 rounded-lg border border-red-500/10 break-words">
                {this.state.error.message || 'Unknown error'}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={this.handleRetry}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 cursor-pointer"
              >
                🔄 Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={() => (window.location.href = '/dashboard')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
