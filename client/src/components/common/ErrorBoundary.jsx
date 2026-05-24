import { Component } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '../ui/button.jsx';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    Sentry.captureException(error, { extra: info });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center p-6">
          <div className="max-w-md rounded-lg border bg-card p-6 text-center">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-1 text-sm text-muted-foreground">{this.state.error.message}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
