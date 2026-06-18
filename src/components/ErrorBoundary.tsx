import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle size={40} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mb-8 max-w-xs text-gray-600">
            The application encountered an unexpected error. Please try reloading the page.
          </p>
          <Button
            onClick={this.handleReload}
            className="flex items-center gap-2 bg-[#0D7377] hover:bg-[#0D7377]/90"
          >
            <RefreshCw size={18} />
            Reload App
          </Button>
          {this.state.error && (
            <pre className="mt-8 max-w-full overflow-auto rounded bg-gray-100 p-4 text-left text-xs text-red-600">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
