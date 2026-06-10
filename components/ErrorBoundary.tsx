'use client';

import { Component, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state agar next render menampilkan fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error ke monitoring service (Sentry, LogRocket, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error monitoring service
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ocean-deep px-4 py-8">
          <div className="glass rounded-3xl p-8 sm:p-12 max-w-2xl w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-400" />
            </div>

            {/* Heading */}
            <h1 className="font-serif text-3xl sm:text-4xl text-white mb-4">
              Oops! Ada yang tidak beres
            </h1>

            {/* Description */}
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-6">
              Mohon maaf, terjadi kesalahan yang tidak terduga. Tim kami telah
              mendapat notifikasi dan akan segera memperbaikinya.
            </p>

            {/* Error details (hanya di development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-red-400 text-sm font-mono mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="text-red-400/70 text-xs font-mono">
                    <summary className="cursor-pointer hover:text-red-400 mb-2">
                      Stack Trace
                    </summary>
                    <pre className="whitespace-pre-wrap break-words overflow-x-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-gold px-6 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              >
                <RefreshCw size={16} />
                Muat Ulang Halaman
              </button>
              
              <Link
                href="/"
                className="glass px-6 py-3 rounded-full text-sm font-light text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Home size={16} />
                Kembali ke Beranda
              </Link>
            </div>

            {/* Support info */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/40 text-sm">
                Butuh bantuan?{' '}
                <a
                  href="https://wa.me/6283161259104"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sand hover:text-sand-light transition-colors"
                >
                  Hubungi kami via WhatsApp
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
