// UI loading states and error handling

export class DataLoader {
  private container: HTMLElement;
  private errorContainer: HTMLElement | null = null;

  constructor(container: HTMLElement | string) {
    this.container = typeof container === 'string' ? document.querySelector(container)! : container;
  }

  showLoading(message = 'Loading...'): void {
    const loader = document.createElement('div');
    loader.className = 'data-loader glass';
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="loader-text">${message}</div>
    `;
    this.container.appendChild(loader);
  }

  hideLoading(): void {
    const loader = this.container.querySelector('.data-loader');
    if (loader) loader.remove();
  }

  showError(error: Error | string, retry?: () => void): void {
    this.hideLoading();

    if (!this.errorContainer) {
      this.errorContainer = document.createElement('div');
      this.errorContainer.className = 'data-error glass';
      this.container.appendChild(this.errorContainer);
    }

    const message = error instanceof Error ? error.message : error;

    this.errorContainer.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
      ${retry ? '<button class="error-retry glass-button">Retry</button>' : ''}
    `;

    if (retry) {
      this.errorContainer.querySelector('.error-retry')?.addEventListener('click', () => {
        this.clearError();
        retry();
      });
    }
  }

  clearError(): void {
    if (this.errorContainer) {
      this.errorContainer.remove();
      this.errorContainer = null;
    }
  }

  async load<T>(
    fetcher: () => Promise<T>,
    options: {
      onSuccess: (data: T) => void;
      onError?: (error: Error) => void;
      loadingMessage?: string;
      retry?: boolean;
    }
  ): Promise<void> {
    this.clearError();
    this.showLoading(options.loadingMessage);

    try {
      const data = await fetcher();
      this.hideLoading();
      options.onSuccess(data);
    } catch (error) {
      this.hideLoading();

      const err = error as Error;
      if (options.onError) {
        options.onError(err);
      } else {
        this.showError(err, options.retry ? () => this.load(fetcher, options) : undefined);
      }
    }
  }
}

// Styles to add to your CSS
export const loaderStyles = `
.data-loader {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin: 1rem 0;
}

.loader-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 107, 53, 0.3);
  border-top-color: var(--bsi-accent, #ff6b35);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loader-text {
  color: #b0b0b0;
}

.data-error {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.error-icon {
  font-size: 1.5rem;
}

.error-message {
  flex: 1;
  color: #ffd6d6;
}

.error-retry {
  padding: 0.5rem 1rem;
  background: rgba(255, 107, 53, 0.2);
  border: 1px solid var(--bsi-accent, #ff6b35);
  color: var(--bsi-accent, #ff6b35);
  cursor: pointer;
  transition: all 0.3s;
}

.error-retry:hover {
  background: rgba(255, 107, 53, 0.3);
}
`;
