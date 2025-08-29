export function getTabManagerScript(): string {
  return `
    // Tab Management with state persistence
    let activeTabId = 'model-tab'; // Default tab
    
    function initializeTabs() {
      console.log('Initializing tabs...');
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');
      
      console.log('Found', tabButtons.length, 'tab buttons and', tabContents.length, 'tab contents');

      if (tabButtons.length === 0) {
        console.warn('No tab buttons found');
        return;
      }

      // Restore previously active tab or use default
      const savedActiveTab = sessionStorage.getItem('gitmind_active_tab') || activeTabId;
      activeTabId = savedActiveTab;
      console.log('Restoring active tab:', activeTabId);

      // Add click event listeners to tab buttons
      tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const targetTab = this.getAttribute('data-tab');
          console.log('Tab clicked:', targetTab);
          switchToTab(targetTab);
        });
      });

      // Restore the active tab state
      switchToTab(activeTabId);
    }

    function switchToTab(targetTab) {
      if (!targetTab) {
        console.warn('No target tab specified');
        return;
      }
      
      console.log('Switching to tab:', targetTab);
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Find and activate the target button
      const targetButton = document.querySelector('.tab-button[data-tab="' + targetTab + '"]');
      if (targetButton) {
        targetButton.classList.add('active');
        console.log('Activated tab button:', targetTab);
      } else {
        console.warn('Tab button not found for:', targetTab);
      }
      
      // Show corresponding tab content
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
        console.log('Activated tab content:', targetTab);
      } else {
        console.warn('Tab content not found for:', targetTab);
      }
      
      // Save the active tab state
      activeTabId = targetTab;
      sessionStorage.setItem('gitmind_active_tab', targetTab);
    }

    // Initialize tabs when DOM is ready
    function initializeTabsWhenReady() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          console.log('DOM loaded, initializing tabs...');
          setTimeout(initializeTabs, 100);
        });
      } else {
        // DOM is already loaded
        console.log('DOM already loaded, initializing tabs immediately...');
        setTimeout(initializeTabs, 100);
      }
    }

    // Call initialization immediately
    initializeTabsWhenReady();

    // Re-initialize tabs after settings updates (in case DOM was recreated)
    function reinitializeTabs() {
      console.log('Reinitializing tabs...');
      setTimeout(() => {
        initializeTabs();
      }, 200);
    }

    // Expose functions globally for use by other scripts
    window.switchToTab = switchToTab;
    window.reinitializeTabs = reinitializeTabs;
    window.initializeTabs = initializeTabs;
    
    console.log('Tab manager script loaded');
  `;
}
