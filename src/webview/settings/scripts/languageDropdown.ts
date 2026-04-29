// src/webview/settings/scripts/languageDropdown.ts
export function getLanguageDropdownScript(): string {
  return `
    // Language Dropdown Handler - Isolated to prevent tab conflicts
    function initializeLanguageDropdown() {
      const searchInput = document.getElementById('commitTargetLanguageSearch');
      const select = document.getElementById('commitTargetLanguage');
      const hiddenInput = document.getElementById('commitTargetLanguageValue');
      const dropdownToggle = document.querySelector('.searchable-language-dropdown .dropdown-toggle');
      const container = document.querySelector('.searchable-language-dropdown');

      if (!searchInput || !select || !container) {
        console.log('Language dropdown elements not found, skipping initialization');
        return;
      }

      let isDropdownOpen = false;
      let highlightedIndex = -1;
      let allOptions = [];
      let filteredOptions = [];
      let dropdownList = null;

      // Collect all language options
      function collectOptions() {
        allOptions = Array.from(select.options).map(option => ({
          value: option.value,
          label: option.textContent,
          selected: option.selected
        }));
        filteredOptions = [...allOptions];
      }

      // Create dropdown list element
      function createDropdownList() {
        if (dropdownList) {
          dropdownList.remove();
        }

        dropdownList = document.createElement('div');
        dropdownList.className = 'language-dropdown-list';
        container.appendChild(dropdownList);
        return dropdownList;
      }

      // Render filtered options in dropdown
      function renderOptions() {
        if (!dropdownList) return;

        dropdownList.innerHTML = '';

        if (filteredOptions.length === 0) {
          const noResults = document.createElement('div');
          noResults.className = 'no-results';
          noResults.textContent = 'No languages found';
          dropdownList.appendChild(noResults);
          return;
        }

        filteredOptions.forEach((option, index) => {
          const optionEl = document.createElement('button');
          optionEl.type = 'button';
          optionEl.className = 'language-option';
          optionEl.textContent = option.label;
          optionEl.dataset.value = option.value;
          optionEl.dataset.index = index.toString();

          if (option.selected) {
            optionEl.classList.add('selected');
          }

          if (index === highlightedIndex) {
            optionEl.classList.add('highlighted');
          }

          optionEl.addEventListener('click', () => {
            selectOption(option);
            closeDropdown();
          });

          dropdownList.appendChild(optionEl);
        });
      }

      // Filter options based on search term
      function filterOptions(searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredOptions = allOptions.filter(option =>
          option.label.toLowerCase().includes(term) ||
          option.value.toLowerCase().includes(term)
        );
        highlightedIndex = -1;
      }

      // Select an option
      function selectOption(option) {
        // Update the visual elements
        searchInput.value = option.label;
        select.value = option.value;
        if (hiddenInput) {
          hiddenInput.value = option.value;
        }

        // Update selected state in options
        allOptions.forEach(opt => opt.selected = opt.value === option.value);

        // Trigger change event for settings system
        const changeEvent = new Event('change', { bubbles: true });
        select.dispatchEvent(changeEvent);

        // Also trigger input event to ensure settings are marked as unsaved
        const inputEvent = new Event('input', { bubbles: true });
        select.dispatchEvent(inputEvent);

        console.log('Language selected:', option.label, '(' + option.value + ')');
      }

      // Open dropdown
      function openDropdown() {
        if (isDropdownOpen || container.classList.contains('disabled')) return;

        createDropdownList();
        filterOptions(searchInput.value);
        renderOptions();
        
        dropdownList.classList.add('show');
        container.classList.add('open');
        isDropdownOpen = true;
        
        if (typeof window.setDropdownState === 'function') {
          window.setDropdownState(true);
        }
        
        // Prevent any parent event handlers from interfering
        document.addEventListener('click', handleOutsideClick, { capture: true });
      }

      // Close dropdown
      function closeDropdown() {
        if (!isDropdownOpen) return;

        if (dropdownList) {
          dropdownList.classList.remove('show');
          setTimeout(() => {
            if (dropdownList) {
              dropdownList.remove();
              dropdownList = null;
            }
          }, 150);
        }

        isDropdownOpen = false;
        container.classList.remove('open');
        highlightedIndex = -1;
        
        if (typeof window.setDropdownState === 'function') {
          window.setDropdownState(false);
        }
        
        document.removeEventListener('click', handleOutsideClick, { capture: true });
      }

      // Handle outside clicks
      function handleOutsideClick(e) {
        // Prevent event from bubbling to avoid interfering with tabs
        if (!container.contains(e.target)) {
          // Don't stop propagation for tab buttons
          if (!e.target.classList.contains('tab-button') && !e.target.closest('.tab-button')) {
            e.stopImmediatePropagation();
          }
          closeDropdown();
        }
      }

      // Handle keyboard navigation
      function handleKeyDown(e) {
        if (!isDropdownOpen) {
          if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openDropdown();
            return;
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
            renderOptions();
            break;

          case 'ArrowUp':
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, -1);
            renderOptions();
            break;

          case 'Enter':
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
              selectOption(filteredOptions[highlightedIndex]);
              closeDropdown();
            }
            break;

          case 'Escape':
            e.preventDefault();
            closeDropdown();
            searchInput.blur();
            break;
        }
      }

      // Initialize
      collectOptions();

      // Event listeners with careful scoping to avoid conflicts
      searchInput.addEventListener('input', (e) => {
        e.stopPropagation(); // Prevent interference with other input handlers
        filterOptions(searchInput.value);
        if (isDropdownOpen) {
          renderOptions();
        }
      });

      searchInput.addEventListener('focus', () => {
        openDropdown();
      });

      searchInput.addEventListener('keydown', handleKeyDown);

      dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDropdownOpen) {
          closeDropdown();
        } else {
          searchInput.focus();
          openDropdown();
        }
      });

      // Restore current selection on initialization
      const currentValue = select.value || hiddenInput?.value || 'english';
      const currentOption = allOptions.find(opt => opt.value === currentValue);
      if (currentOption) {
        searchInput.value = currentOption.label;
      }

      console.log('Language dropdown initialized successfully');
    }

    // Initialize the dropdown when ready
    function initializeLanguageDropdownWhenReady() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(initializeLanguageDropdown, 100);
        });
      } else {
        setTimeout(initializeLanguageDropdown, 100);
      }
    }

    // Re-initialize after settings updates
    function reinitializeLanguageDropdown() {
      setTimeout(() => {
        initializeLanguageDropdown();
      }, 200);
    }

    // Expose reinitialize function globally
    window.reinitializeLanguageDropdown = reinitializeLanguageDropdown;

    // Start initialization
    initializeLanguageDropdownWhenReady();

    console.log('Language dropdown script loaded');
  `;
}