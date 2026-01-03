import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackUI?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('🚨 Error Boundary Caught:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallbackUI) {
                return this.props.fallbackUI;
            }

            return (
                <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-[#11141a] border border-red-500/20 rounded-xl p-8 shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white text-center mb-2">
                            ¡Oops! Algo salió mal
                        </h1>
                        <p className="text-slate-400 text-center mb-6">
                            La aplicación encontró un error inesperado. No te preocupes, tus datos están seguros.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 bg-slate-900/50 border border-slate-700 rounded-lg p-4 max-h-60 overflow-auto">
                                <p className="text-xs font-mono text-red-400 mb-2">
                                    <strong>Error:</strong> {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw size={18} />
                                Recargar Página
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <Home size={18} />
                                Ir al Inicio
                            </button>

                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={this.handleReset}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Intentar Recuperar
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-slate-500 text-center mt-6">
                            Si el problema persiste, intenta limpiar el caché del navegador o contacta con soporte.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
