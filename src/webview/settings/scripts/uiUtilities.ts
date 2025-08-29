export function getTooltipInitializationScript(): string {
  return `
    // Enhanced tooltip functionality for all elements with tooltips
    function initializeTooltips() {
      // Handle compact toggle rows with title attribute
      const toggleRows = document.querySelectorAll('.compact-toggle-row[title]');
      toggleRows.forEach(row => {
        const originalTitle = row.getAttribute('title');
        row.removeAttribute('title');
        row.setAttribute('data-tooltip', originalTitle);
        
        let hoverTimeout;
        
        row.addEventListener('mouseenter', () => {
          hoverTimeout = setTimeout(() => {
            row.setAttribute('title', row.getAttribute('data-tooltip'));
          }, 300);
        });
        
        row.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimeout);
          row.removeAttribute('title');
        });
      });
      
      // Handle toggle items with data-tooltip attribute
      const toggleItems = document.querySelectorAll('.toggle-item[data-tooltip]');
      toggleItems.forEach(item => {
        let hoverTimeout;
        const tooltipText = item.getAttribute('data-tooltip');
        const label = item.querySelector('.toggle-label');
        
        // Add tooltip behavior to the toggle item container
        item.addEventListener('mouseenter', () => {
          hoverTimeout = setTimeout(() => {
            item.setAttribute('title', tooltipText);
          }, 300);
        });
        
        item.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimeout);
          item.removeAttribute('title');
        });
        
        // Add tooltip behavior to the label if it exists
        if (label) {
          label.addEventListener('mouseenter', () => {
            hoverTimeout = setTimeout(() => {
              label.setAttribute('title', tooltipText);
            }, 300);
          });
          
          label.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            label.removeAttribute('title');
          });
        }
      });
      
      // Handle copy buttons with title attribute (Pro feature tooltips)
      const copyButtons = document.querySelectorAll('.copy-toggle[title]');
      copyButtons.forEach(button => {
        const originalTitle = button.getAttribute('title');
        let hoverTimeout;
        
        // Use the title attribute directly for hover tooltips
        button.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimeout);
          // Small delay to ensure it's not just passing over
          hoverTimeout = setTimeout(() => {
            // Re-apply title for native tooltip
            button.setAttribute('title', originalTitle);
          }, 100);
        });
        
        button.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimeout);
        });
      });
    }
    
    // Make initializeTooltips available globally for re-initialization
    window.initializeTooltips = initializeTooltips;
    
    // Initialize tooltips
    document.addEventListener('DOMContentLoaded', initializeTooltips);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeTooltips);
    } else {
      initializeTooltips();
    }
  `;
}

export function getToastScript(): string {
  return `
    function showToast(message, type = 'success', persistent = false) {
      // Minimalistic notification system that stays at the top of settings
      const container = document.body;
      
      // Remove existing toasts if too many (keep max 3)
      const existingToasts = container.querySelectorAll('.notification-toast');
      if (existingToasts.length >= 3) {
        existingToasts[0].remove();
      }
      
      const toast = document.createElement('div');
      toast.className = \`notification-toast toast-\${type}\`;
      
      toast.innerHTML = \`
        <div class="toast-content">
          <span class="toast-message">\${message}</span>
          \${persistent ? '<button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>' : ''}
        </div>
      \`;
      
      // Minimalistic styling with subtle colors
      toast.style.cssText = \`
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--vscode-notifications-background, #1e1e1e);
        color: var(--vscode-notifications-foreground, #cccccc);
        border-left: 3px solid \${type === 'success' ? 'var(--vscode-charts-green, #4CAF50)' : 
                                  type === 'error' ? 'var(--vscode-charts-red, #f44336)' : 
                                  type === 'warning' ? 'var(--vscode-charts-orange, #ff9800)' : 
                                  'var(--vscode-charts-blue, #2196F3)'};
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 20000;
        min-width: 250px;
        max-width: 500px;
        font-size: 13px;
        font-weight: 400;
        animation: slideInFromTop 0.3s ease-out;
        margin-bottom: 8px;
        border: 1px solid var(--vscode-notifications-border, #454545);
      \`;
      
      // Add styles if not already present
      if (!document.getElementById('enhanced-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-toast-styles';
        style.textContent = \`
          @keyframes slideInFromTop {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          
          @keyframes slideOutToTop {
            from {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
            to {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
          }
          
          .toast-content {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .toast-message {
            flex: 1;
            line-height: 1.3;
          }
          
          .toast-close {
            background: none;
            border: none;
            color: var(--vscode-notifications-foreground, #cccccc);
            font-size: 16px;
            font-weight: normal;
            cursor: pointer;
            padding: 2px;
            margin-left: 8px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 2px;
            flex-shrink: 0;
            opacity: 0.7;
            transition: all 0.2s;
          }
          
          .toast-close:hover {
            opacity: 1;
            background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
          }
        \`;
        document.head.appendChild(style);
      }
      
      container.appendChild(toast);
      
      // Auto-remove after 3 seconds (unless persistent)
      if (!persistent) {
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.animation = 'slideOutToTop 0.3s ease-in';
            setTimeout(() => {
              if (toast.parentNode) {
                toast.remove();
              }
            }, 300);
          }
        }, 3000); // Changed to 3 seconds
      }
    }
  `;
}

export function getDetailedStatusScript(): string {
  return `
    function showDetailedStatus(title, content, isHtml = false) {
      // Create a modal-style overlay for detailed status
      const existingModal = document.querySelector('.status-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      const modal = document.createElement('div');
      modal.className = 'status-modal';
      modal.innerHTML = \`
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>\${title}</h3>
              <button class="modal-close" onclick="this.closest('.status-modal').remove()">×</button>
            </div>
            <div class="modal-body">
              \${isHtml ? \`<div class="status-html-content">\${content}</div>\` : \`<pre class="status-details">\${content}</pre>\`}
            </div>
            <div class="modal-footer">
              <button class="secondary-button" onclick="this.closest('.status-modal').remove()">Close</button>
            </div>
          </div>
        </div>
      \`;
      
      // Add styles for modal components that aren't already in statusBanner.css.ts
      const style = document.createElement('style');
      style.textContent = \`
        /* Modal specific styles not covered by statusBanner.css.ts */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--vscode-editor-background);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: modalFadeIn 0.2s ease-out;
          margin: 0 auto;
        }
        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--vscode-widget-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          color: var(--vscode-foreground);
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--vscode-foreground);
          padding: 0;
          width: 30px;
          height: 30px;
          border-radius: 4px;
        }
        .modal-close:hover {
          background: var(--vscode-toolbar-hoverBackground);
        }
        .modal-body {
          padding: 24px;
          max-height: 500px;
          overflow-y: auto;
        }
        .status-details {
          font-family: var(--vscode-editor-font-family);
          font-size: 13px;
          line-height: 1.4;
          margin: 0;
          color: var(--vscode-foreground);
          white-space: pre-wrap;
          background: var(--vscode-textCodeBlock-background);
          padding: 12px;
          border-radius: 4px;
        }
        .status-html-content {
          font-family: var(--vscode-font-family);
          font-size: 13px;
          line-height: 1.4;
          color: var(--vscode-foreground);
        }
        .encryption-status-report {
          width: 100%;
        }
        .status-header {
          margin-bottom: 20px;
        }
        .status-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 4px;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--vscode-widget-border);
        }
        .status-indicator.status-active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
        }
        .status-indicator.status-inactive {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .status-icon {
          font-size: 24px;
        }
        .status-text {
          flex: 1;
        }
        .status-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .status-subtitle {
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Status item value variants */
        .status-item .label {
          font-weight: 500;
          opacity: 0.8;
        }
        .status-item .value {
          font-weight: 600;
        }
        .status-item .value.success {
          color: var(--vscode-charts-green);
        }
        .status-item .value.warning {
          color: var(--vscode-charts-orange);
        }
        .status-item .value.error {
          color: var(--vscode-charts-red);
        }
        
        /* Section styling */
        .status-section {
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--vscode-foreground);
        }
        .reason-text {
          font-size: 13px;
          color: var(--vscode-descriptionForeground);
          background: var(--vscode-textCodeBlock-background);
          padding: 8px 12px;
          border-radius: 4px;
          border-left: 3px solid var(--vscode-activityBarBadge-background);
        }
        
        /* Provider tags */
        .provider-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .provider-tag {
          padding: 5px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
        }
        .provider-tag.encrypted {
          background: rgba(16, 185, 129, 0.1);
          color: var(--vscode-charts-green);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .provider-tag.plain-text {
          background: rgba(255, 193, 7, 0.1);
          color: var(--vscode-charts-orange);
          border: 1px solid rgba(255, 193, 7, 0.3);
        }
        .empty-state {
          font-size: 13px;
          color: var(--vscode-descriptionForeground);
          font-style: italic;
          text-align: center;
          padding: 16px;
          background: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 6px;
          margin: 8px 0;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      \`;
      
      modal.appendChild(style);
      document.body.appendChild(modal);
      
      // Close on ESC key
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          modal.remove();
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
      
      // Close on overlay click
      modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          modal.remove();
          document.removeEventListener('keydown', handleEsc);
        }
      });
    }
  `;
}