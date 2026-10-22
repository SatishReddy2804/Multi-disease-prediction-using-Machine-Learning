import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 p-6 shadow-soft text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-850 dark:text-slate-100">
              Interface Error Caught
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              An unexpected UI component rendering fault occurred. Your clinical data in state was preserved safely.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg text-left overflow-x-auto text-red-600 dark:text-red-400">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reload Clinical Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
