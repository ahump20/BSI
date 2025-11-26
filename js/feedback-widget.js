// User Feedback Widget for Blaze Sports Intel
// Non-intrusive feedback collection with rating and categorized feedback
// Usage: Automatically initializes on page load after 30-second delay

const FeedbackWidget = {
    isOpen: false,
    hasSubmitted: false,

    init() {
        // Don't show if user has already submitted feedback in this session
        if (sessionStorage.getItem('feedback_submitted')) {
            return;
        }

        // Wait 30 seconds before showing the feedback button
        setTimeout(() => {
            this.render();
        }, 30000);
    },

    render() {
        const widget = document.createElement('div');
        widget.id = 'feedback-widget';
        widget.innerHTML = this.getHTML();
        document.body.appendChild(widget);

        this.attachEventListeners();
    },

    getHTML() {
        return `
            <!-- Feedback Button (collapsed state) -->
            <button id="feedback-button" class="feedback-button" aria-label="Send Feedback" title="Send Feedback">
                <i class="fas fa-comment-alt"></i>
                <span class="feedback-button-text">Feedback</span>
            </button>

            <!-- Feedback Panel (expanded state) -->
            <div id="feedback-panel" class="feedback-panel" style="display: none;">
                <div class="feedback-header">
                    <h3 class="feedback-title">
                        <i class="fas fa-fire"></i>
                        Send Feedback
                    </h3>
                    <button id="feedback-close" class="feedback-close" aria-label="Close feedback">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="feedback-content">
                    <!-- Rating -->
                    <div class="feedback-section">
                        <label class="feedback-label">How satisfied are you with Blaze Sports Intel?</label>
                        <div class="feedback-rating">
                            ${[1, 2, 3, 4, 5].map(rating => `
                                <button
                                    class="rating-star"
                                    data-rating="${rating}"
                                    aria-label="${rating} star${rating !== 1 ? 's' : ''}"
                                >
                                    <i class="fas fa-star"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Category -->
                    <div class="feedback-section">
                        <label class="feedback-label" for="feedback-category">Feedback Type</label>
                        <select id="feedback-category" class="feedback-select">
                            <option value="">Select a category...</option>
                            <option value="bug">🐛 Bug Report</option>
                            <option value="feature">💡 Feature Request</option>
                            <option value="data">📊 Data Issue</option>
                            <option value="performance">⚡ Performance Issue</option>
                            <option value="ui">🎨 UI/UX Feedback</option>
                            <option value="general">💬 General Feedback</option>
                        </select>
                    </div>

                    <!-- Message -->
                    <div class="feedback-section">
                        <label class="feedback-label" for="feedback-message">Your Feedback</label>
                        <textarea
                            id="feedback-message"
                            class="feedback-textarea"
                            placeholder="Tell us what you think... (optional)"
                            rows="4"
                        ></textarea>
                    </div>

                    <!-- Email (optional) -->
                    <div class="feedback-section">
                        <label class="feedback-label" for="feedback-email">
                            Email (optional)
                            <span class="feedback-label-hint">For follow-up if needed</span>
                        </label>
                        <input
                            id="feedback-email"
                            type="email"
                            class="feedback-input"
                            placeholder="your@email.com"
                        />
                    </div>

                    <!-- Submit Button -->
                    <button id="feedback-submit" class="feedback-submit">
                        <i class="fas fa-paper-plane"></i>
                        Send Feedback
                    </button>
                </div>

                <!-- Success State -->
                <div id="feedback-success" class="feedback-success" style="display: none;">
                    <div class="feedback-success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="feedback-success-title">Thank You!</h3>
                    <p class="feedback-success-message">
                        Your feedback helps us improve Blaze Sports Intel. We appreciate you taking the time to share your thoughts.
                    </p>
                </div>
            </div>

            <style>
                /* Feedback Button */
                .feedback-button {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: linear-gradient(135deg, #BF5700, #FF8C00);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    padding: 1rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(191, 87, 0, 0.4);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    z-index: 9998;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .feedback-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 24px rgba(191, 87, 0, 0.5);
                }

                .feedback-button:active {
                    transform: translateY(0);
                }

                .feedback-button-text {
                    font-size: 0.9rem;
                }

                /* Feedback Panel */
                .feedback-panel {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 420px;
                    max-width: calc(100vw - 4rem);
                    max-height: calc(100vh - 4rem);
                    background: rgba(26, 26, 26, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                    overflow: hidden;
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .feedback-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .feedback-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.95);
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .feedback-title i {
                    color: #BF5700;
                }

                .feedback-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }

                .feedback-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                }

                .feedback-content {
                    padding: 1.5rem;
                    max-height: calc(100vh - 10rem);
                    overflow-y: auto;
                }

                .feedback-section {
                    margin-bottom: 1.5rem;
                }

                .feedback-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 0.5rem;
                }

                .feedback-label-hint {
                    font-size: 0.75rem;
                    font-weight: 400;
                    color: rgba(255, 255, 255, 0.5);
                    margin-left: 0.25rem;
                }

                /* Rating Stars */
                .feedback-rating {
                    display: flex;
                    gap: 0.5rem;
                }

                .rating-star {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 1.75rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    transition: all 0.2s ease;
                }

                .rating-star:hover,
                .rating-star.active {
                    color: #FFD700;
                    transform: scale(1.15);
                }

                /* Form Inputs */
                .feedback-select,
                .feedback-input,
                .feedback-textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 0.75rem;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.875rem;
                    font-family: inherit;
                    transition: all 0.2s ease;
                }

                .feedback-select:focus,
                .feedback-input:focus,
                .feedback-textarea:focus {
                    outline: none;
                    border-color: #BF5700;
                    background: rgba(255, 255, 255, 0.08);
                }

                .feedback-textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                /* Submit Button */
                .feedback-submit {
                    width: 100%;
                    background: linear-gradient(135deg, #BF5700, #FF8C00);
                    border: none;
                    border-radius: 8px;
                    padding: 0.875rem;
                    color: white;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .feedback-submit:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(191, 87, 0, 0.4);
                }

                .feedback-submit:active {
                    transform: translateY(0);
                }

                .feedback-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Success State */
                .feedback-success {
                    padding: 3rem 2rem;
                    text-align: center;
                }

                .feedback-success-icon {
                    font-size: 4rem;
                    color: #10b981;
                    margin-bottom: 1rem;
                }

                .feedback-success-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.95);
                    margin: 0 0 0.5rem 0;
                }

                .feedback-success-message {
                    font-size: 0.9375rem;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.6;
                    margin: 0;
                }

                /* Mobile Responsive */
                @media (max-width: 640px) {
                    .feedback-button {
                        bottom: 1rem;
                        right: 1rem;
                        padding: 0.875rem 1.25rem;
                    }

                    .feedback-button-text {
                        display: none;
                    }

                    .feedback-panel {
                        bottom: 1rem;
                        right: 1rem;
                        width: calc(100vw - 2rem);
                    }
                }

                /* Accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .feedback-button,
                    .feedback-panel,
                    .rating-star {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            </style>
        `;
    },

    attachEventListeners() {
        const button = document.getElementById('feedback-button');
        const panel = document.getElementById('feedback-panel');
        const closeBtn = document.getElementById('feedback-close');
        const submitBtn = document.getElementById('feedback-submit');
        const stars = document.querySelectorAll('.rating-star');

        // Open panel
        button?.addEventListener('click', () => {
            this.isOpen = true;
            button.style.display = 'none';
            panel.style.display = 'block';
        });

        // Close panel
        closeBtn?.addEventListener('click', () => {
            this.close();
        });

        // Rating stars
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });

            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.style.color = '#FFD700';
                    } else {
                        s.style.color = 'rgba(255, 255, 255, 0.3)';
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => {
                    if (!s.classList.contains('active')) {
                        s.style.color = 'rgba(255, 255, 255, 0.3)';
                    }
                });
            });
        });

        // Submit feedback
        submitBtn?.addEventListener('click', () => {
            this.submit();
        });
    },

    async submit() {
        const rating = document.querySelectorAll('.rating-star.active').length;
        const category = document.getElementById('feedback-category')?.value || '';
        const message = document.getElementById('feedback-message')?.value || '';
        const email = document.getElementById('feedback-email')?.value || '';
        const submitBtn = document.getElementById('feedback-submit');

        // Validation
        if (rating === 0 && !category && !message) {
            alert('Please provide at least a rating, category, or message.');
            return;
        }

        // Disable button during submission
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        // Map widget categories to API-valid categories
        const categoryMap = {
            'bug': 'bug',
            'feature': 'feature',
            'data': 'data-quality',
            'performance': 'performance',
            'ui': 'other',
            'general': 'other'
        };

        // Collect feedback data (API expects 'comment' not 'message')
        const feedbackData = {
            rating: rating || 3,  // Default to 3 if no rating
            category: categoryMap[category] || 'other',
            comment: message || 'No comment provided',  // API requires comment
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        };

        try {
            // Send to feedback API endpoint
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to submit feedback');
            }

            // Show success state
            this.showSuccess();

            // Mark as submitted in session
            sessionStorage.setItem('feedback_submitted', 'true');
        } catch (error) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Feedback';
            }
            alert('Failed to send feedback. Please try again or contact austin@blazesportsintel.com');
        }
    },

    showSuccess() {
        const content = document.querySelector('.feedback-content');
        const success = document.getElementById('feedback-success');

        if (content && success) {
            content.style.display = 'none';
            success.style.display = 'block';

            // Auto-close after 3 seconds
            setTimeout(() => {
                this.close();
            }, 3000);
        }
    },

    close() {
        const button = document.getElementById('feedback-button');
        const panel = document.getElementById('feedback-panel');

        if (button && panel) {
            this.isOpen = false;
            panel.style.display = 'none';
            button.style.display = 'flex';
        }
    }
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
    window.FeedbackWidget = FeedbackWidget;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FeedbackWidget.init());
    } else {
        FeedbackWidget.init();
    }
}
