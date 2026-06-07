// src/webview/settings/scripts/searchableSelect.ts
export function getSearchableSelectScript(): string {
  return `
    /**
     * Universal Searchable Select Handler
     * Manages all dropdowns with the .searchable-select-container class
     */
    function initializeSearchableSelects() {
      const containers = document.querySelectorAll('.searchable-select-container');
      
      containers.forEach(container => {
        // Skip if already initialized or has specific handler (like language)
        if (container.dataset.initialized === 'true' || container.classList.contains('searchable-language-dropdown')) {
          return;
        }

        const input = container.querySelector('.searchable-input');
        const select = container.querySelector('select');
        const toggle = container.querySelector('.dropdown-toggle');
        const list = container.querySelector('.searchable-dropdown-list');
        
        if (!input || !select || !list || !toggle) return;

        let isDropdownOpen = false;
        let highlightedIndex = -1;
        let allOptions = [];
        let filteredOptions = [];

        // Collect all options from the hidden select
        function collectOptions() {
          allOptions = Array.from(select.options).map(option => ({
            value: option.value,
            label: option.textContent,
            selected: option.selected,
            className: option.className
          }));
          filteredOptions = [...allOptions];
        }

        // Render options into the dropdown list
        function renderOptions() {
          list.innerHTML = '';

          if (filteredOptions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'searchable-no-results';
            noResults.textContent = 'No matching options found';
            list.appendChild(noResults);
            return;
          }

          filteredOptions.forEach((option, index) => {
            const optionEl = document.createElement('button');
            optionEl.type = 'button';
            optionEl.className = 'searchable-option';
            
            const labelContainer = document.createElement('div');
            labelContainer.style.display = 'flex';
            labelContainer.style.alignItems = 'center';
            labelContainer.style.overflow = 'hidden';
            labelContainer.style.textOverflow = 'ellipsis';
            
            // Handle Pro provider badge
            if (option.className && option.className.includes('pro-provider')) {
                const labelSpan = document.createElement('span');
                labelSpan.textContent = option.label;
                labelContainer.appendChild(labelSpan);
                
                const badge = document.createElement('span');
                const isProUserVal = typeof isProUser === 'function' ? isProUser() : false;
                if (isProUserVal) {
                    badge.className = 'pro-provider-badge';
                    badge.textContent = 'Pro';
                } else {
                    badge.className = 'pro-provider-badge locked';
                    badge.innerHTML = '<svg class="gm-lock-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px; vertical-align: middle; display: inline-block;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Pro';
                }
                labelContainer.appendChild(badge);
            } else {
                labelContainer.textContent = option.label;
            }
            
            optionEl.appendChild(labelContainer);
            optionEl.dataset.value = option.value;

            if (option.selected) {
              optionEl.classList.add('selected');
            }

            if (index === highlightedIndex) {
              optionEl.classList.add('highlighted');
              optionEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }

            optionEl.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              selectOption(option);
              closeDropdown();
            });

            list.appendChild(optionEl);
          });
        }

        function filterOptions(searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredOptions = allOptions.filter(option =>
            option.label.toLowerCase().includes(term)
          );
          
          // If we're filtering, reset highlighted index unless it's a match
          if (searchTerm) {
            highlightedIndex = filteredOptions.length > 0 ? 0 : -1;
          } else {
            // If empty search, highlight the selected item
            const selectedIdx = filteredOptions.findIndex(opt => opt.selected);
            highlightedIndex = selectedIdx !== -1 ? selectedIdx : -1;
          }
          
          renderOptions();
        }

        function selectOption(option) {
          input.value = option.label;
          select.value = option.value;
          
          // Update selected state in our local array
          allOptions.forEach(opt => opt.selected = opt.value === option.value);
          
          // Trigger change and input events for the underlying select
          const changeEvent = new Event('change', { bubbles: true });
          select.dispatchEvent(changeEvent);
          
          const inputEvent = new Event('input', { bubbles: true });
          select.dispatchEvent(inputEvent);
        }

        function openDropdown() {
          if (isDropdownOpen || container.classList.contains('disabled')) return;
          
          collectOptions();
          
          // Before rendering, find the selected item to highlight it
          const selectedIdx = allOptions.findIndex(opt => opt.selected);
          highlightedIndex = selectedIdx !== -1 ? selectedIdx : -1;
          
          filteredOptions = [...allOptions];
          renderOptions();
          
          list.classList.add('show');
          container.classList.add('open');
          isDropdownOpen = true;
          
          // Scroll the selected item into view immediately after opening
          if (highlightedIndex !== -1) {
            setTimeout(() => {
                const selectedEl = list.querySelectorAll('.searchable-option')[highlightedIndex];
                if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
            }, 50);
          }
          
          document.addEventListener('click', handleOutsideClick, { capture: true });
        }

        function closeDropdown() {
          if (!isDropdownOpen) return;
          
          list.classList.remove('show');
          container.classList.remove('open');
          isDropdownOpen = false;
          highlightedIndex = -1;
          
          // Sync input text with currently selected option in select
          const currentOption = allOptions.find(opt => opt.value === select.value);
          if (currentOption) {
            input.value = currentOption.label;
          }
          
          document.removeEventListener('click', handleOutsideClick, { capture: true });
        }

        function handleOutsideClick(e) {
          if (!container.contains(e.target)) {
            closeDropdown();
          }
        }

        function handleKeyDown(e) {
          if (!isDropdownOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ') {
              e.preventDefault();
              openDropdown();
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
              highlightedIndex = Math.max(highlightedIndex - 1, 0);
              renderOptions();
              break;
            case 'Enter':
              e.preventDefault();
              if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                selectOption(filteredOptions[highlightedIndex]);
                closeDropdown();
              } else if (filteredOptions.length > 0) {
                selectOption(filteredOptions[0]);
                closeDropdown();
              }
              break;
            case 'Escape':
              e.preventDefault();
              closeDropdown();
              input.blur();
              break;
            case 'Tab':
              closeDropdown();
              break;
          }
        }

        // Event Listeners
        input.addEventListener('focus', () => openDropdown());
        
        input.addEventListener('input', () => {
          if (!isDropdownOpen) openDropdown();
          filterOptions(input.value);
        });
        
        input.addEventListener('keydown', handleKeyDown);
        
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isDropdownOpen) {
            closeDropdown();
          } else {
            input.focus();
            openDropdown();
          }
        });

        // Handle dynamic updates to the hidden select (e.g., from model loaders)
        const observer = new MutationObserver(() => {
          const oldVal = select.value;
          collectOptions();
          
          if (isDropdownOpen) {
            filterOptions(input.value);
          } else {
            // Sync input with new selection if any
            const currentOption = allOptions.find(opt => opt.value === select.value);
            if (currentOption) {
              input.value = currentOption.label;
            }
          }
        });
        
        observer.observe(select, { childList: true, subtree: true, attributes: true });

        // Mark as initialized
        container.dataset.initialized = 'true';
      });
    }

    // Initialize on ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSearchableSelects);
    } else {
      initializeSearchableSelects();
    }

    // Expose for re-initialization after dynamic content updates
    window.initializeSearchableSelects = initializeSearchableSelects;
  `;
}

