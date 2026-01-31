// Loading Skeleton Components for Blaze Sports Intel
// Provides shimmer animations and placeholder content while data loads
// Usage: <LoadingSkeleton type="card" /> or <LoadingSkeleton type="table" rows={5} />

const LoadingSkeleton = ({ type = 'card', rows = 3, columns = 4, height = 200 }) => {
    // Card skeleton for dashboard cards
    const CardSkeleton = () => {
        return React.createElement(
            'div',
            {
                className: 'skeleton-card',
                style: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    height: `${height}px`,
                    position: 'relative',
                    overflow: 'hidden'
                }
            },
            // Header
            React.createElement('div', {
                className: 'skeleton-shimmer',
                style: {
                    width: '60%',
                    height: '24px',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                }
            }),
            // Content lines
            React.createElement(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
                ...Array(3).fill(null).map((_, i) =>
                    React.createElement('div', {
                        key: i,
                        className: 'skeleton-shimmer',
                        style: {
                            width: `${90 - (i * 10)}%`,
                            height: '16px',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            animationDelay: `${i * 0.1}s`
                        }
                    })
                )
            )
        );
    };

    // Table skeleton for standings and statistics
    const TableSkeleton = () => {
        return React.createElement(
            'div',
            {
                className: 'skeleton-table',
                style: {
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }
            },
            // Header row
            React.createElement(
                'div',
                {
                    style: {
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: '1rem',
                        padding: '1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }
                },
                ...Array(columns).fill(null).map((_, i) =>
                    React.createElement('div', {
                        key: `header-${i}`,
                        className: 'skeleton-shimmer',
                        style: {
                            height: '20px',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite'
                        }
                    })
                )
            ),
            // Data rows
            ...Array(rows).fill(null).map((_, rowIndex) =>
                React.createElement(
                    'div',
                    {
                        key: `row-${rowIndex}`,
                        style: {
                            display: 'grid',
                            gridTemplateColumns: `repeat(${columns}, 1fr)`,
                            gap: '1rem',
                            padding: '1rem',
                            borderBottom: rowIndex < rows - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                        }
                    },
                    ...Array(columns).fill(null).map((_, colIndex) =>
                        React.createElement('div', {
                            key: `cell-${rowIndex}-${colIndex}`,
                            className: 'skeleton-shimmer',
                            style: {
                                height: '16px',
                                borderRadius: '4px',
                                width: colIndex === 0 ? '80%' : '60%',
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite',
                                animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`
                            }
                        })
                    )
                )
            )
        );
    };

    // Chart skeleton for data visualizations
    const ChartSkeleton = () => {
        return React.createElement(
            'div',
            {
                className: 'skeleton-chart',
                style: {
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    height: `${height}px`,
                    position: 'relative',
                    overflow: 'hidden'
                }
            },
            // Chart title
            React.createElement('div', {
                className: 'skeleton-shimmer',
                style: {
                    width: '50%',
                    height: '20px',
                    borderRadius: '4px',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                }
            }),
            // Chart bars
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        height: 'calc(100% - 60px)',
                        gap: '1rem'
                    }
                },
                ...Array(8).fill(null).map((_, i) => {
                    const randomHeight = 40 + Math.random() * 60;
                    return React.createElement('div', {
                        key: i,
                        className: 'skeleton-shimmer',
                        style: {
                            flex: 1,
                            height: `${randomHeight}%`,
                            borderRadius: '4px 4px 0 0',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            animationDelay: `${i * 0.1}s`
                        }
                    });
                })
            )
        );
    };

    // List skeleton for player rosters and lineups
    const ListSkeleton = () => {
        return React.createElement(
            'div',
            {
                className: 'skeleton-list',
                style: {
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }
            },
            ...Array(rows).fill(null).map((_, i) =>
                React.createElement(
                    'div',
                    {
                        key: i,
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderBottom: i < rows - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                        }
                    },
                    // Avatar/Icon
                    React.createElement('div', {
                        className: 'skeleton-shimmer',
                        style: {
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite'
                        }
                    }),
                    // Content
                    React.createElement(
                        'div',
                        { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
                        React.createElement('div', {
                            className: 'skeleton-shimmer',
                            style: {
                                width: '70%',
                                height: '16px',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite',
                                animationDelay: `${i * 0.1}s`
                            }
                        }),
                        React.createElement('div', {
                            className: 'skeleton-shimmer',
                            style: {
                                width: '50%',
                                height: '14px',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite',
                                animationDelay: `${i * 0.1 + 0.05}s`
                            }
                        })
                    )
                )
            )
        );
    };

    // 3D Scene skeleton for Babylon.js/Three.js loading
    const SceneSkeleton = () => {
        return React.createElement(
            'div',
            {
                className: 'skeleton-scene',
                style: {
                    background: 'radial-gradient(circle at center, rgba(191, 87, 0, 0.1), rgba(0, 0, 0, 0.5))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    height: `${height}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }
            },
            // Loading spinner
            React.createElement(
                'div',
                {
                    style: {
                        width: '60px',
                        height: '60px',
                        border: '4px solid rgba(191, 87, 0, 0.2)',
                        borderTop: '4px solid rgba(191, 87, 0, 1)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }
                }
            ),
            // Loading text
            React.createElement(
                'div',
                {
                    style: {
                        position: 'absolute',
                        bottom: '2rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.875rem',
                        fontWeight: 500
                    }
                },
                'Loading 3D Visualization...'
            )
        );
    };

    // Select skeleton type
    switch (type) {
        case 'card':
            return CardSkeleton();
        case 'table':
            return TableSkeleton();
        case 'chart':
            return ChartSkeleton();
        case 'list':
            return ListSkeleton();
        case 'scene':
            return SceneSkeleton();
        default:
            return CardSkeleton();
    }
};

// Grid of skeleton cards for dashboard layout
const SkeletonGrid = ({ count = 6, columns = 3 }) => {
    return React.createElement(
        'div',
        {
            style: {
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '1.5rem',
                padding: '1.5rem'
            }
        },
        ...Array(count).fill(null).map((_, i) =>
            React.createElement(LoadingSkeleton, {
                key: i,
                type: 'card',
                height: 200
            })
        )
    );
};

// CSS Animations (auto-inject if not present)
const skeletonStyles = `
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.skeleton-shimmer {
    will-change: background-position;
}

@media (prefers-reduced-motion: reduce) {
    .skeleton-shimmer {
        animation: none !important;
        background: rgba(255, 255, 255, 0.05) !important;
    }
}
`;

// Auto-inject styles if not present
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'skeleton-styles';
    styleElement.textContent = skeletonStyles;
    document.head.appendChild(styleElement);
}

// Export for use in other components
if (typeof window !== 'undefined') {
    window.LoadingSkeleton = LoadingSkeleton;
    window.SkeletonGrid = SkeletonGrid;
}
