// Error Boundary Component for crash protection
// Catches JavaScript errors in child component tree

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AlertTriangle, RefreshCw, Home } from "lucide-react-native";

// ============================================================================
// Types
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    this.setState({ errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertTriangle size={64} color="#EF4444" />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We apologize for the inconvenience. The app encountered an
              unexpected error.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Screen-Level Error Boundary
// ============================================================================

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({
  children,
  screenName,
}: ScreenErrorBoundaryProps): React.ReactElement {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you could send this to an error tracking service
    console.error(`Error in screen ${screenName || "unknown"}:`, error);
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// Query Error Fallback Component
// ============================================================================

interface QueryErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
  message?: string;
}

export function QueryErrorFallback({
  error,
  onRetry,
  message = "Failed to load data",
}: QueryErrorFallbackProps): React.ReactElement {
  return (
    <View style={styles.queryErrorContainer}>
      <AlertTriangle size={32} color="#EF4444" />
      <Text style={styles.queryErrorMessage}>{message}</Text>
      {__DEV__ && error && (
        <Text style={styles.queryErrorDetails}>{error.message}</Text>
      )}
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <RefreshCw size={16} color="#2563EB" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Safe Component Wrapper
// ============================================================================

interface SafeComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SafeComponent({
  children,
  fallback,
}: SafeComponentProps): React.ReactElement {
  return (
    <ErrorBoundary fallback={fallback || <View />}>
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F8FAFC",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  errorContainer: {
    maxHeight: 200,
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#F8FAFC",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  stackText: {
    fontSize: 10,
    color: "#64748B",
    fontFamily: "monospace",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
  },
  // Query Error Styles
  queryErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  queryErrorMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  queryErrorDetails: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
    gap: 6,
  },
  retryButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ErrorBoundary;
