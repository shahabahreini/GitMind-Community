import { getDetailedStatusStyles } from '../styles/detailedStatus.css';
import { getEncryptionStatusStyles } from '../styles/encryptionStatus.css';
import { getToastStyles } from '../styles/toast.css';

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

export function getToastStylesScript(): string {
  return `
    function addToastStyles() {
      if (document.getElementById('toast-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = \`${getToastStyles()}\`;
      document.head.appendChild(style);
    }
    
    // Make function globally available
    window.addToastStyles = addToastStyles;
  `;
}

export function getToastScript(): string {
  return `
    function showToast(message, type = 'success', persistent = false) {
      // Ensure toast styles are loaded
      if (window.addToastStyles) {
        window.addToastStyles();
      }
      
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
        }, 3000);
      }
    }
  `;
}

export function getEncryptionStatusScript(): string {
  return `
    function addEncryptionStatusStyles() {
      if (document.getElementById('encryption-status-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'encryption-status-styles';
      style.textContent = \`${getEncryptionStatusStyles()}\`;
      document.head.appendChild(style);
    }
    
    // Make function globally available
    window.addEncryptionStatusStyles = addEncryptionStatusStyles;
  `;
}

export function getDetailedStatusStylesScript(): string {
  return `
    function addDetailedStatusStyles() {
      if (document.getElementById('detailed-status-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'detailed-status-styles';
      style.textContent = \`${getDetailedStatusStyles()}\`;
      document.head.appendChild(style);
    }
    
    // Make function globally available
    window.addDetailedStatusStyles = addDetailedStatusStyles;
  `;
}

export function getDetailedStatusScript(): string {
  return `
    function showDetailedStatus(title, content, isHtml = false) {
      // Ensure detailed status styles are loaded
      if (window.addDetailedStatusStyles) {
        window.addDetailedStatusStyles();
      }
      
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