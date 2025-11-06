// Enhanced Error Handling System for Blaze Sports Intel
// Provides user-friendly error messages with actionable recovery steps

const ErrorHandler = {
    // Error types with user-friendly messages
    errorTypes: {
        API_TIMEOUT: {
            title: 'Request Timed Out',
            message: 'The server took too long to respond. This might be due to high traffic or slow connection.',
            icon: '⏱️',
            severity: 'warning',
            actions: ['retry', 'checkStatus']
        },
        API_ERROR: {
            title: 'Service Temporarily Unavailable',
            message: 'We\'re having trouble connecting to our sports data providers. Our team has been notified.',
            icon: '🔌',
            severity: 'error',
            actions: ['retry', 'checkStatus', 'contact']
        },
        NETWORK_ERROR: {
            title: 'No Internet Connection',
            message: 'Please check your internet connection and try again.',
            icon: '📡',
            severity: 'error',
            actions: ['checkConnection']
        },
        DATA_VALIDATION_ERROR: {
            title: 'Data Format Error',
            message: 'The data received doesn\'t match expected format. Please try refreshing the page.',
            icon: '⚠️',
            severity: 'warning',
            actions: ['refresh']
        },
        RATE_LIMIT: {
            title: 'Rate Limit Exceeded',
            message: 'Too many requests in a short time. Please wait a moment before trying again.',
            icon: '🚦',
            severity: 'warning',
            actions: ['wait']
        },
        AUTHENTICATION_ERROR: {
            title: 'Authentication Required',
            message: 'This feature requires authentication. Please sign in to continue.',
            icon: '🔒',
            severity: 'info',
            actions: ['signin']
        },
        NOT_FOUND: {
            title: 'Content Not Found',
            message: 'The requested data could not be found. It may have been moved or removed.',
            icon: '🔍',
            severity: 'info',
            actions: ['goBack']
        },
        UNKNOWN: {
            title: 'Something Went Wrong',
            message: 'An unexpected error occurred. Please try again later.',
            icon: '❌',
            severity: 'error',
            actions: ['retry', 'contact']
        }
    },

    // Classify error from response or error object
    classifyError(error) {
        if (!navigator.onLine) {
            return 'NETWORK_ERROR';
        }

        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
            return 'API_TIMEOUT';
        }

        const status = error.response?.status || error.status;

        if (status === 429) return 'RATE_LIMIT';
        if (status === 401 || status === 403) return 'AUTHENTICATION_ERROR';
        if (status === 404) return 'NOT_FOUND';
        if (status === 400 || status === 422) return 'DATA_VALIDATION_ERROR';
        if (status >= 500) return 'API_ERROR';

        return 'UNKNOWN';
    },

    // Get error details
    getErrorDetails(error) {
        const errorType = this.classifyError(error);
        return {
            ...this.errorTypes[errorType],
            type: errorType,
            timestamp: new Date().toISOString(),
            originalError: error
        };
    },

    // Log error to analytics/monitoring
    logError(error, context = {}) {
        const errorDetails = this.getErrorDetails(error);

        // Send to analytics/monitoring service
        if (typeof window !== 'undefined') {
            // Send to Analytics Engine (if available)
            if (window.ANALYTICS_ENDPOINT) {
                fetch(window.ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'error',
                        ...errorDetails,
                        context,
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    })
                }).catch(() => {
                    // Silently fail if analytics reporting fails
                });
            }
        }

        return errorDetails;
    },

    // Get action button configuration
    getActionButtons(actions) {
        const actionConfig = {
            retry: {
                label: '🔄 Try Again',
                action: () => window.location.reload()
            },
            refresh: {
                label: '🔄 Refresh Page',
                action: () => window.location.reload()
            },
            checkStatus: {
                label: '📊 Check Status',
                action: () => window.open('/api-status', '_blank')
            },
            contact: {
                label: '📧 Contact Support',
                action: () => window.location.href = 'mailto:austin@blazesportsintel.com?subject=Error Report'
            },
            checkConnection: {
                label: '📡 Check Connection',
                action: () => alert('Please check your WiFi or cellular connection and try again.')
            },
            wait: {
                label: '⏳ Wait 30s',
                action: () => {
                    const btn = event.target;
                    btn.disabled = true;
                    btn.textContent = '⏳ Please wait...';
                    setTimeout(() => {
                        window.location.reload();
                    }, 30000);
                }
            },
            signin: {
                label: '🔐 Sign In',
                action: () => window.location.href = '/auth/signin'
            },
            goBack: {
                label: '← Go Back',
                action: () => window.history.back()
            }
        };

        return actions.map(key => actionConfig[key]).filter(Boolean);
    }
};

// React Component for Error Display
if (typeof window !== 'undefined' && window.React) {
    window.ErrorDisplay = ({ error, onDismiss }) => {
        const errorDetails = ErrorHandler.getErrorDetails(error);
        const actionButtons = ErrorHandler.getActionButtons(errorDetails.actions);

        const severityColors = {
            error: { bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.3)', text: '#ff6b6b' },
            warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#ffa500' },
            info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa' }
        };

        const colors = severityColors[errorDetails.severity];

        return React.createElement(
            'div',
            {
                style: {
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    maxWidth: '400px',
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10000,
                    animation: 'slideInRight 0.3s ease'
                }
            },
            React.createElement(
                'div',
                { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' } },
                React.createElement(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
                    React.createElement('span', { style: { fontSize: '2rem' } }, errorDetails.icon),
                    React.createElement(
                        'div',
                        {},
                        React.createElement('h3', { style: { margin: 0, fontSize: '1.125rem', fontWeight: 700, color: colors.text } }, errorDetails.title),
                        React.createElement('p', { style: { margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' } }, errorDetails.message)
                    )
                ),
                onDismiss && React.createElement(
                    'button',
                    {
                        onClick: onDismiss,
                        style: {
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1
                        }
                    },
                    '×'
                )
            ),
            actionButtons.length > 0 && React.createElement(
                'div',
                { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } },
                ...actionButtons.map((btn, idx) =>
                    React.createElement(
                        'button',
                        {
                            key: idx,
                            onClick: btn.action,
                            style: {
                                padding: '0.5rem 1rem',
                                background: 'var(--color-brand-orange, #BF5700)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            },
                            onMouseOver: (e) => e.target.style.opacity = '0.8',
                            onMouseOut: (e) => e.target.style.opacity = '1'
                        },
                        btn.label
                    )
                )
            )
        );
    };
}

// CSS Animation
if (typeof document !== 'undefined' && !document.getElementById('error-handler-styles')) {
    const style = document.createElement('style');
    style.id = 'error-handler-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for use
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}
