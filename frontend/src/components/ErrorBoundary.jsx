import React from 'react';
import logger from '../lib/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-gray dark:bg-white flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <p className="text-xs uppercase tracking-widest text-white/60 dark:text-dark-gray/60 mb-4">Let's get you back to reading</p>
            <h1 className="text-4xl text-white dark:text-dark-gray mb-4">
              This page couldn't load.
            </h1>
            <p className="text-white/70 dark:text-dark-gray/70 mb-6">
              Check your connection and reload to try again. If the problem continues, return to the home page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white dark:bg-dark-gray text-dark-gray dark:text-white uppercase tracking-wider"
            >
              Refresh Page
            </button>
            <a href="/" className="block mt-5 text-white dark:text-dark-gray underline underline-offset-4">Return to home</a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
