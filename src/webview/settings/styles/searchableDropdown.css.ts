// src/webview/settings/styles/searchableDropdown.css.ts
export function getSearchableDropdownStyles(): string {
    return `
    /* Searchable Language Dropdown Styles */
    .searchable-language-dropdown {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    .searchable-language-dropdown:hover {
        border-color: var(--vscode-inputValidation-infoBorder);
    }

    .searchable-language-dropdown:focus-within {
        border-color: var(--vscode-focusBorder);
        outline: none;
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .searchable-language-dropdown.disabled {
        opacity: 0.5;
        pointer-events: none;
        background: var(--vscode-input-background);
    }

    .searchable-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        padding: 8px 12px;
        color: var(--vscode-input-foreground);
        font-size: 13px;
        font-family: var(--vscode-font-family);
        line-height: 1.2;
        cursor: text;
    }

    .searchable-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
        opacity: 1;
    }

    .searchable-input:focus {
        outline: none;
    }

    .searchable-select {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        pointer-events: none;
        z-index: -1;
    }

    .dropdown-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--vscode-foreground);
        opacity: 0.7;
        transition: opacity 0.2s ease;
        flex-shrink: 0;
    }

    .dropdown-toggle:hover {
        opacity: 1;
        background: var(--vscode-button-secondaryHoverBackground);
        border-radius: 3px;
    }

    .dropdown-toggle:disabled {
        cursor: not-allowed;
        opacity: 0.3;
    }

    /* Dropdown List Styles */
    .language-dropdown-list {
        position: absolute;
        top: calc(100% + 2px);
        left: 0;
        right: 0;
        background: var(--vscode-dropdown-background);
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: none;
    }

    .language-dropdown-list.show {
        display: block;
        animation: dropdownFadeIn 0.15s ease;
    }

    @keyframes dropdownFadeIn {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .language-option {
        padding: 8px 12px;
        cursor: pointer;
        color: var(--vscode-dropdown-foreground);
        font-size: 13px;
        line-height: 1.3;
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .language-option:hover {
        background: var(--vscode-list-hoverBackground);
        color: var(--vscode-list-hoverForeground);
    }

    .language-option.highlighted {
        background: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
    }

    .language-option.selected {
        background: var(--vscode-list-inactiveSelectionBackground);
        color: var(--vscode-list-inactiveSelectionForeground);
        font-weight: 500;
    }

    .no-results {
        padding: 12px;
        text-align: center;
        color: var(--vscode-input-placeholderForeground);
        font-style: italic;
        font-size: 12px;
    }

    /* Scrollbar Styles for Dropdown */
    .language-dropdown-list::-webkit-scrollbar {
        width: 8px;
    }

    .language-dropdown-list::-webkit-scrollbar-track {
        background: var(--vscode-scrollbarSlider-background);
        border-radius: 4px;
    }

    .language-dropdown-list::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-activeBackground);
        border-radius: 4px;
    }

    .language-dropdown-list::-webkit-scrollbar-thumb:hover {
        background: var(--vscode-scrollbarSlider-hoverBackground);
    }
    `;
}