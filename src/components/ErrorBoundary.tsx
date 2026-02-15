import * as React from 'react';
import { Button } from '@/components/ui/button';
import DD75Logo from '@/assets/dd75-logo.svg';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep this minimal: no network calls here.
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.assign('/dashboard');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message =
      this.state.error?.message?.trim() ||
      'A rendering error occurred.';

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-6 rounded-2xl border border-border/50 bg-card/40 px-6 py-5">
            <img src={DD75Logo} alt="Drop Dead 75" className="mx-auto h-10 w-auto opacity-90" />
          </div>

          <h1 className="font-display text-lg tracking-[0.16em] uppercase">
            Something broke
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {message}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={this.handleReload}>Reload</Button>
            <Button variant="outline" onClick={this.handleGoHome}>
              Go Home
            </Button>
          </div>

          {import.meta.env.DEV && this.state.error?.stack && (
            <pre className="mt-10 w-full overflow-auto rounded-xl border border-border/50 bg-muted/30 p-4 text-left text-xs text-muted-foreground">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

