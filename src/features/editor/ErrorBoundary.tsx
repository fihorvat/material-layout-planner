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

  private handleRetry = () => {
    this.setState({ hasError: false, message: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
          <h2 style={{ marginTop: 0 }}>The editor hit an unexpected error</h2>
          <p>
            Your project is autosaved to this browser&apos;s IndexedDB every second, so the
            last persisted edits are safe. You can try to recover the current view, or
            reload the app if it stays broken.
          </p>
          {this.state.message ? (
            <details style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Show error details</summary>
              <pre
                style={{
                  color: '#dc2626',
                  whiteSpace: 'pre-wrap',
                  background: '#fef2f2',
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 8,
                }}
              >
                {this.state.message}
              </pre>
            </details>
          ) : null}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={this.handleRetry}>Try to continue</button>
            <button type="button" onClick={this.handleReload}>Reload app</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
