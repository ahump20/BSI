// Blaze Sports Intel Chat Widget
class BlazeAssistant {
  constructor() {
    this.isOpen = false;
    this.conversationHistory = [];
    this.apiEndpoint = '/api/chat';
    this.storageKey = 'blaze_chat_history';
    this.prefsKey = 'blaze_chat_prefs';

    // Load saved state
    this.loadState();

    this.init();
  }

  init() {
    // Inject CSS
    this.injectStyles();

    // Create widget elements
    this.createWidget();

    // Attach event listeners
    this.attachEventListeners();

    // Restore conversation if exists
    this.restoreConversation();
  }

  loadState() {
    try {
      // Load conversation history from localStorage
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        // Only load if less than 24 hours old
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          this.conversationHistory = data.messages || [];
        }
      }

      // Load preferences
      const prefs = localStorage.getItem(this.prefsKey);
      if (prefs) {
        const { hasInteracted } = JSON.parse(prefs);
        this.hasInteracted = hasInteracted;
      }
    } catch (e) {
      console.error('Failed to load chat state:', e);
    }
  }

  saveState() {
    try {
      // Save conversation history
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          messages: this.conversationHistory,
          timestamp: Date.now(),
        })
      );

      // Save preferences
      localStorage.setItem(
        this.prefsKey,
        JSON.stringify({
          hasInteracted: true,
        })
      );
    } catch (e) {
      console.error('Failed to save chat state:', e);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    localStorage.removeItem(this.storageKey);
    const messagesContainer = document.getElementById('blazeChatMessages');
    messagesContainer.innerHTML = `
            <div class="blaze-message assistant">
                Hey! I'm the Blaze Sports Intel assistant. I can help you navigate the platform, explain our analytics, or answer questions about features. What can I help with?
            </div>
        `;
  }

  restoreConversation() {
    if (this.conversationHistory.length > 0) {
      const messagesContainer = document.getElementById('blazeChatMessages');
      messagesContainer.innerHTML = '';

      // Add welcome message
      const welcomeEl = document.createElement('div');
      welcomeEl.className = 'blaze-message assistant';
      welcomeEl.textContent = "Welcome back! Here's our previous conversation.";
      messagesContainer.appendChild(welcomeEl);

      // Restore messages
      this.conversationHistory.forEach((msg) => {
        const messageEl = document.createElement('div');
        messageEl.className = `blaze-message ${msg.role === 'user' ? 'user' : 'assistant'}`;
        messageEl.innerHTML =
          msg.role === 'assistant' ? this.formatMessage(msg.content) : msg.content;
        messagesContainer.appendChild(messageEl);
      });

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
            .blaze-chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }

            .blaze-chat-button {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #bf5700 0%, #cc6600 50%, #d97b38 100%);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(191, 87, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0.9;
            }

            .blaze-chat-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 24px rgba(191, 87, 0, 0.4);
                opacity: 1;
            }

            .blaze-chat-button i {
                font-size: 20px;
                color: white;
            }

            .blaze-chat-button.active {
                background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%);
            }

            .blaze-chat-window {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 360px;
                height: 500px;
                background: rgba(26, 26, 26, 0.97);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(217, 123, 56, 0.3);
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                display: none;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.95);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .blaze-chat-window.open {
                display: flex;
                transform: scale(1);
                opacity: 1;
            }

            .blaze-chat-header {
                padding: 16px;
                background: linear-gradient(135deg, rgba(191, 87, 0, 0.15), rgba(139, 0, 0, 0.12));
                border-bottom: 1px solid rgba(217, 123, 56, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .blaze-chat-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #ffffff;
                background: linear-gradient(135deg, #d97b38, #cc6600, #dc143c);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .blaze-chat-header p {
                margin: 4px 0 0 0;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
            }

            .blaze-clear-btn {
                background: none;
                border: 1px solid rgba(217, 123, 56, 0.3);
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
            }

            .blaze-clear-btn i {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.5);
            }

            .blaze-clear-btn:hover {
                background: rgba(220, 20, 60, 0.1);
                border-color: #dc143c;
            }

            .blaze-clear-btn:hover i {
                color: #dc143c;
            }

            .blaze-chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .blaze-chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            .blaze-chat-messages::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }

            .blaze-chat-messages::-webkit-scrollbar-thumb {
                background: rgba(217, 123, 56, 0.5);
                border-radius: 3px;
            }

            .blaze-message {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 12px;
                font-size: 14px;
                line-height: 1.5;
                animation: messageSlideIn 0.3s ease-out;
            }

            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .blaze-message.user {
                align-self: flex-end;
                background: linear-gradient(135deg, #bf5700, #cc6600);
                color: white;
            }

            .blaze-message.assistant {
                align-self: flex-start;
                background: rgba(217, 123, 56, 0.1);
                border: 1px solid rgba(217, 123, 56, 0.3);
                color: rgba(255, 255, 255, 0.9);
            }

            .blaze-message.assistant a {
                color: #d97b38;
                text-decoration: underline;
            }

            .blaze-message.assistant a:hover {
                color: #cc6600;
            }

            .blaze-typing {
                align-self: flex-start;
                padding: 12px 16px;
                background: rgba(217, 123, 56, 0.1);
                border: 1px solid rgba(217, 123, 56, 0.3);
                border-radius: 12px;
                display: none;
            }

            .blaze-typing.active {
                display: block;
            }

            .blaze-typing-dots {
                display: flex;
                gap: 4px;
            }

            .blaze-typing-dots span {
                width: 8px;
                height: 8px;
                background: #d97b38;
                border-radius: 50%;
                animation: typingBounce 1.4s infinite ease-in-out;
            }

            .blaze-typing-dots span:nth-child(1) {
                animation-delay: -0.32s;
            }

            .blaze-typing-dots span:nth-child(2) {
                animation-delay: -0.16s;
            }

            @keyframes typingBounce {
                0%, 80%, 100% {
                    transform: scale(0);
                }
                40% {
                    transform: scale(1);
                }
            }

            .blaze-chat-input-wrapper {
                padding: 20px;
                border-top: 1px solid rgba(217, 123, 56, 0.3);
                background: rgba(26, 26, 26, 0.8);
            }

            .blaze-chat-input-form {
                display: flex;
                gap: 10px;
            }

            .blaze-chat-input {
                flex: 1;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(217, 123, 56, 0.3);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-family: inherit;
                resize: none;
                outline: none;
                transition: all 0.3s;
            }

            .blaze-chat-input:focus {
                border-color: #d97b38;
                box-shadow: 0 0 0 3px rgba(217, 123, 56, 0.1);
            }

            .blaze-chat-submit {
                padding: 12px 16px;
                background: linear-gradient(135deg, #bf5700, #cc6600);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }

            .blaze-chat-submit:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(191, 87, 0, 0.4);
            }

            .blaze-chat-submit:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            @media (max-width: 640px) {
                .blaze-chat-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 140px);
                    right: 20px;
                }
            }
        `;
    document.head.appendChild(style);
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.className = 'blaze-chat-widget';
    widget.innerHTML = `
            <button class="blaze-chat-button" id="blazeChatToggle" aria-label="Toggle chat assistant">
                <i class="fas fa-comments"></i>
            </button>
            <div class="blaze-chat-window" id="blazeChatWindow">
                <div class="blaze-chat-header">
                    <div>
                        <h3>Blaze Assistant</h3>
                        <p>Ask about analytics, features, or navigation</p>
                    </div>
                    <button class="blaze-clear-btn" id="blazeClearChat" title="Clear conversation">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="blaze-chat-messages" id="blazeChatMessages">
                    <div class="blaze-message assistant">
                        Hey! I'm the Blaze Sports Intel assistant. I can help you navigate the platform, explain our analytics, or answer questions about features. What can I help with?
                    </div>
                </div>
                <div class="blaze-typing" id="blazeTyping">
                    <div class="blaze-typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div class="blaze-chat-input-wrapper">
                    <form class="blaze-chat-input-form" id="blazeChatForm">
                        <textarea
                            class="blaze-chat-input"
                            id="blazeChatInput"
                            placeholder="Ask anything..."
                            rows="1"
                        ></textarea>
                        <button type="submit" class="blaze-chat-submit">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;
    document.body.appendChild(widget);
  }

  attachEventListeners() {
    const toggleBtn = document.getElementById('blazeChatToggle');
    const chatWindow = document.getElementById('blazeChatWindow');
    const chatForm = document.getElementById('blazeChatForm');
    const chatInput = document.getElementById('blazeChatInput');

    // Toggle chat window
    toggleBtn.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      chatWindow.classList.toggle('open');
      toggleBtn.classList.toggle('active');

      if (this.isOpen) {
        chatInput.focus();
      }
    });

    // Clear chat history
    const clearBtn = document.getElementById('blazeClearChat');
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear conversation history?')) {
        this.clearHistory();
      }
    });

    // Handle form submission
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (message) {
        this.sendMessage(message);
        chatInput.value = '';
        chatInput.style.height = 'auto';
      }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    // Enter to send, Shift+Enter for new line
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  async sendMessage(message) {
    const messagesContainer = document.getElementById('blazeChatMessages');
    const typingIndicator = document.getElementById('blazeTyping');
    const submitButton = document.querySelector('.blaze-chat-submit');

    // Add user message to UI
    const userMessageEl = document.createElement('div');
    userMessageEl.className = 'blaze-message user';
    userMessageEl.textContent = message;
    messagesContainer.appendChild(userMessageEl);

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message,
    });

    // Show typing indicator
    typingIndicator.classList.add('active');
    submitButton.disabled = true;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Hide typing indicator
      typingIndicator.classList.remove('active');
      submitButton.disabled = false;

      // Add assistant response to UI
      const assistantMessageEl = document.createElement('div');
      assistantMessageEl.className = 'blaze-message assistant';
      assistantMessageEl.innerHTML = this.formatMessage(data.message);
      messagesContainer.appendChild(assistantMessageEl);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: data.message,
      });

      // Save conversation to localStorage
      this.saveState();

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
      console.error('Chat error:', error);
      typingIndicator.classList.remove('active');
      submitButton.disabled = false;

      // Show error message
      const errorMessageEl = document.createElement('div');
      errorMessageEl.className = 'blaze-message assistant';
      errorMessageEl.textContent =
        'Sorry, I encountered an error. Please try again or contact us directly at Austin@blazesportsintel.com';
      messagesContainer.appendChild(errorMessageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  formatMessage(text) {
    // Convert URLs to links
    return text
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BlazeAssistant();
  });
} else {
  new BlazeAssistant();
}
