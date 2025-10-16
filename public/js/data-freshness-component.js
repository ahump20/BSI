// Data Freshness Indicator Component
// Displays how fresh the data is with color-coded visual indicators
// Usage: <DataFreshnessIndicator timestamp={lastFetchTime} label="MLB Standings" />

const DataFreshnessIndicator = ({ timestamp, label, inline = false }) => {
    const [relativeTime, setRelativeTime] = React.useState('');
    const [freshnessStatus, setFreshnessStatus] = React.useState('fresh');

    React.useEffect(() => {
        const updateFreshness = () => {
            if (!timestamp) {
                setRelativeTime('Never updated');
                setFreshnessStatus('unknown');
                return;
            }

            const now = Date.now();
            const diff = now - timestamp;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            // Calculate relative time string
            let timeString;
            if (seconds < 60) {
                timeString = 'Just now';
            } else if (minutes < 60) {
                timeString = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            } else if (hours < 24) {
                timeString = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            } else {
                timeString = `${days} day${days !== 1 ? 's' : ''} ago`;
            }

            setRelativeTime(timeString);

            // Determine freshness status with color coding
            // Fresh (green): < 5 minutes
            // Moderate (yellow): 5-30 minutes
            // Stale (orange): 30 minutes - 2 hours
            // Very Stale (red): > 2 hours
            if (seconds < 300) { // < 5 minutes
                setFreshnessStatus('fresh');
            } else if (seconds < 1800) { // < 30 minutes
                setFreshnessStatus('moderate');
            } else if (seconds < 7200) { // < 2 hours
                setFreshnessStatus('stale');
            } else {
                setFreshnessStatus('very-stale');
            }
        };

        updateFreshness();
        const interval = setInterval(updateFreshness, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [timestamp]);

    const statusColors = {
        fresh: {
            dot: '#10b981',
            text: 'rgba(16, 185, 129, 0.9)',
            bg: 'rgba(16, 185, 129, 0.1)',
            border: 'rgba(16, 185, 129, 0.3)',
            icon: '🟢'
        },
        moderate: {
            dot: '#f59e0b',
            text: 'rgba(245, 158, 11, 0.9)',
            bg: 'rgba(245, 158, 11, 0.1)',
            border: 'rgba(245, 158, 11, 0.3)',
            icon: '🟡'
        },
        stale: {
            dot: '#f97316',
            text: 'rgba(249, 115, 22, 0.9)',
            bg: 'rgba(249, 115, 22, 0.1)',
            border: 'rgba(249, 115, 22, 0.3)',
            icon: '🟠'
        },
        'very-stale': {
            dot: '#ef4444',
            text: 'rgba(239, 68, 68, 0.9)',
            bg: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.3)',
            icon: '🔴'
        },
        unknown: {
            dot: '#6b7280',
            text: 'rgba(107, 114, 128, 0.9)',
            bg: 'rgba(107, 114, 128, 0.1)',
            border: 'rgba(107, 114, 128, 0.3)',
            icon: '⚪'
        }
    };

    const colors = statusColors[freshnessStatus];

    if (inline) {
        return React.createElement(
            'span',
            {
                style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: colors.text,
                    fontWeight: 500
                },
                title: timestamp ? new Date(timestamp).toLocaleString('en-US', {
                    timeZone: 'America/Chicago',
                    dateStyle: 'short',
                    timeStyle: 'medium'
                }) : 'No data'
            },
            React.createElement(
                'span',
                {
                    style: {
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: colors.dot,
                        boxShadow: `0 0 8px ${colors.dot}`,
                        animation: freshnessStatus === 'fresh' ? 'pulse 2s ease-in-out infinite' : 'none'
                    }
                }
            ),
            React.createElement('span', null, relativeTime)
        );
    }

    return React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginTop: '1rem'
            },
            title: timestamp ? new Date(timestamp).toLocaleString('en-US', {
                timeZone: 'America/Chicago',
                dateStyle: 'full',
                timeStyle: 'long'
            }) : 'No data available'
        },
        React.createElement(
            'span',
            { style: { fontSize: '1.25rem' } },
            colors.icon
        ),
        React.createElement(
            'div',
            { style: { flex: 1 } },
            React.createElement(
                'div',
                {
                    style: {
                        fontWeight: 600,
                        color: colors.text,
                        marginBottom: '0.125rem'
                    }
                },
                label || 'Data Freshness'
            ),
            React.createElement(
                'div',
                {
                    style: {
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.6)'
                    }
                },
                `Updated ${relativeTime}`
            )
        ),
        freshnessStatus !== 'fresh' && freshnessStatus !== 'unknown' && React.createElement(
            'button',
            {
                onClick: () => window.location.reload(),
                style: {
                    padding: '0.5rem 1rem',
                    background: 'var(--color-brand-orange, #BF5700)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                },
                onMouseOver: (e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(191, 87, 0, 0.3)';
                },
                onMouseOut: (e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                }
            },
            '🔄 Refresh'
        )
    );
};

// CSS Animation (add to page if not already present)
const freshnessStyles = `
@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.2);
    }
}
`;

// Auto-inject styles if not present
if (typeof document !== 'undefined' && !document.getElementById('freshness-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'freshness-styles';
    styleElement.textContent = freshnessStyles;
    document.head.appendChild(styleElement);
}

// Export for use in other components
if (typeof window !== 'undefined') {
    window.DataFreshnessIndicator = DataFreshnessIndicator;
}
