import { Component, type ErrorInfo, type ReactNode } from 'react';
import apiFetch from '../api/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error: Error, info: ErrorInfo) {
    apiFetch('/api/v1/client-errors', {
      method: 'POST',
      body: {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {
      // best-effort; don't throw inside componentDidCatch
    });
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 p-8">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center shadow-xl">
            <h2 className="mb-2 text-2xl font-bold text-white">Something went wrong</h2>
            <p className="mb-6 text-gray-400">
              An unexpected error occurred. The error has been reported.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
