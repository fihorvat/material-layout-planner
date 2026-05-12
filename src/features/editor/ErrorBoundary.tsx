import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Editor error boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
          <h2>Something went wrong</h2>
          <p>Your last autosave is intact in IndexedDB. You can reload the app safely.</p>
          {this.state.message ? <pre style={{ color: '#dc2626' }}>{this.state.message}</pre> : null}
          <button type="button" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
