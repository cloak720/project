import React from "react";

/**
 * Catches rendering errors anywhere below it, so one broken component shows a friendly
 * recovery screen instead of a blank page. Wire `reportError` to an error-tracking service
 * (Sentry, etc.) when one is set up; see DEPLOYMENT_GUIDE.md.
 */
const reportError = (error, info) => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(error, info?.componentStack);
  }
};

class ErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    reportError(error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="container page" role="alert">
        <p className="kicker">Something went wrong</p>
        <h1 className="front__title">Sorry, this page tripped over.</h1>
        <p className="lede">Reloading usually fixes it. If it keeps happening, let us know through the contact page.</p>
        <div className="row" style={{ marginTop: 24 }}>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a className="btn" href="/">
            Go to the front page
          </a>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
