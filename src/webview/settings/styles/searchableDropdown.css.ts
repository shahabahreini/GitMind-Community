// src/webview/settings/styles/searchableDropdown.css.ts
export function getSearchableDropdownStyles(): string {
    return `
    /* General Searchable Dropdown Styles */
    .searchable-select-container {
        position: relative;
        display: block;
        width: 100%;
        --gm-dropdown-control-border: var(--vscode-input-border, rgba(99, 99, 99, 0.22));
        --gm-dropdown-control-border-hover: var(--vscode-focusBorder, rgba(0, 95, 163, 0.55));
        --gm-dropdown-control-background: var(--vscode-input-background, var(--vscode-editor-background, #ffffff));
        --gm-dropdown-control-foreground: var(--vscode-input-foreground, var(--vscode-foreground, #1f2328));
        --gm-dropdown-icon-foreground: var(--vscode-icon-foreground, var(--vscode-input-foreground, var(--vscode-foreground, #3f454b)));
        --gm-dropdown-subtle-hover: var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.12));
        --gm-dropdown-list-shadow: 0 8px 22px rgba(0, 0, 0, 0.16);
    }

    .searchable-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        background: var(--gm-dropdown-control-background);
        border: 1px solid var(--gm-dropdown-control-border);
        border-radius: 6px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        height: 32px;
        box-sizing: border-box;
    }

    .searchable-select-container:hover .searchable-input-wrapper {
        border-color: var(--gm-dropdown-control-border-hover);
    }

    .searchable-select-container:focus-within .searchable-input-wrapper {
        outline: none;
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .searchable-select-container.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .searchable-input {
        flex: 1;
        background: transparent !important;
        border: none !important;
        outline: none !important;
        padding: 0 12px !important;
        color: var(--gm-dropdown-control-foreground);
        font-size: 13px;
        font-family: var(--vscode-font-family);
        line-height: 30px;
        cursor: text;
        height: 30px !important;
        width: 100%;
    }

    .searchable-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
        opacity: 0.7;
    }

    .dropdown-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        min-width: 30px;
        height: 30px;
        min-height: 30px;
        padding: 0;
        background: transparent !important;
        border: 0;
        cursor: pointer;
        color: var(--gm-dropdown-icon-foreground, var(--vscode-icon-foreground, var(--vscode-input-foreground, var(--vscode-foreground, #3f454b))));
        opacity: 0.8;
        transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
        flex-shrink: 0;
        margin-right: 1px;
        border-radius: 4px;
        box-shadow: none !important;
        transform: none !important;
        overflow: visible;
    }

    .dropdown-toggle:hover:not([disabled]),
    .dropdown-toggle:focus-visible {
        opacity: 1;
        color: var(--vscode-focusBorder, var(--gm-dropdown-icon-foreground, var(--vscode-icon-foreground, var(--vscode-input-foreground, var(--vscode-foreground, #3f454b))));
        background: var(--gm-dropdown-subtle-hover, var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.12))) !important;
        box-shadow: none !important;
        transform: none !important;
    }

    .dropdown-toggle:active:not([disabled]) {
        transform: none !important;
        box-shadow: none !important;
    }

    .dropdown-toggle:disabled {
        background: transparent !important;
        color: var(--vscode-disabledForeground, rgba(127, 127, 127, 0.65)) !important;
        opacity: 0.55;
    }

    .dropdown-chevron {
        display: block;
        width: 16px;
        height: 16px;
        pointer-events: none;
        transition: transform 0.15s ease;
    }

    .searchable-select-container.open .dropdown-toggle,
    .searchable-language-dropdown.open .dropdown-toggle {
        color: var(--vscode-focusBorder);
        opacity: 1;
    }

    .searchable-select-container.open .dropdown-chevron,
    .searchable-language-dropdown.open .dropdown-chevron {
        transform: rotate(180deg);
    }

    /* Dropdown List Styles */
    .searchable-dropdown-list {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        background: var(--vscode-dropdown-background, var(--vscode-editor-background, #ffffff));
        border: 1px solid var(--vscode-dropdown-border, var(--gm-dropdown-control-border));
        border-radius: 8px;
        max-height: 280px;
        overflow-y: auto;
        z-index: 10000;
        box-shadow: var(--gm-dropdown-list-shadow);
        display: none;
        padding: 6px;
        animation: dropdownFadeIn 0.2s cubic-bezier(0, 0, 0.2, 1);
    }

    /* Ensure dropdown is visible even in high-contrast themes */
    [data-vscode-theme-kind="vscode-high-contrast"] .searchable-dropdown-list,
    [data-vscode-theme-kind="vscode-high-contrast-light"] .searchable-dropdown-list {
        border: 2px solid var(--vscode-contrastBorder);
    }

    .searchable-dropdown-list.show {
        display: block;
    }

    @keyframes dropdownFadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .searchable-option {
        padding: 10px 12px;
        cursor: pointer;
        color: var(--vscode-dropdown-foreground);
        font-size: 13px;
        line-height: 1.4;
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;
        justify-content: space-between;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-radius: 6px;
        margin-bottom: 2px;
        transition: all 0.15s ease;
    }

    .searchable-option:last-child {
        margin-bottom: 0;
    }

    .searchable-option:hover {
        background: var(--vscode-list-hoverBackground);
        color: var(--vscode-list-hoverForeground);
    }

    .searchable-option.highlighted {
        background: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
    }

    .searchable-option.selected {
        background: var(--vscode-list-inactiveSelectionBackground, rgba(0, 122, 204, 0.1));
        color: var(--vscode-foreground);
        font-weight: 600;
    }

    /* Add a checkmark for selected item */
    .searchable-option.selected::after {
        content: '✓';
        font-weight: 700;
        margin-left: 8px;
        color: var(--vscode-focusBorder);
    }

    .searchable-no-results {
        padding: 20px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        font-size: 12px;
    }

    /* Scrollbar Styles for Dropdown */
    .searchable-dropdown-list::-webkit-scrollbar {
        width: 8px;
    }

    .searchable-dropdown-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .searchable-dropdown-list::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-background, rgba(128, 128, 128, 0.4));
        border-radius: 10px;
        border: 2px solid var(--vscode-dropdown-background);
    }

    .searchable-dropdown-list::-webkit-scrollbar-thumb:hover {
        background: var(--vscode-scrollbarSlider-hoverBackground, rgba(128, 128, 128, 0.6));
    }

    /* Pro Provider Indicator */
    .pro-provider-badge {
        font-size: 9px;
        background: linear-gradient(135deg, #00d2d3, #54a0ff);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 8px;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.5px;
        flex-shrink: 0;
    }
    
    /* Searchable Language Dropdown Styles (Backward Compatibility) */
    .searchable-language-dropdown {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        --gm-dropdown-control-border: var(--vscode-input-border, rgba(99, 99, 99, 0.22));
        --gm-dropdown-control-border-hover: var(--vscode-focusBorder, rgba(0, 95, 163, 0.55));
        --gm-dropdown-control-background: var(--vscode-input-background, var(--vscode-editor-background, #ffffff));
        --gm-dropdown-control-foreground: var(--vscode-input-foreground, var(--vscode-foreground, #1f2328));
        --gm-dropdown-icon-foreground: var(--vscode-icon-foreground, var(--vscode-input-foreground, var(--vscode-foreground, #3f454b)));
        --gm-dropdown-subtle-hover: var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.12));
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        transition: all 0.2s ease;
        height: 32px;
    }

    .searchable-language-dropdown:hover {
        border-color: var(--vscode-focusBorder);
    }

    .searchable-language-dropdown:focus-within {
        border-color: var(--vscode-focusBorder);
        outline: none;
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .language-dropdown-list {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--vscode-dropdown-background);
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 8px;
        max-height: 240px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: none;
        padding: 4px;
    }

    .language-dropdown-list.show {
        display: block;
    }

    .language-option {
        padding: 8px 12px;
        cursor: pointer;
        color: var(--vscode-dropdown-foreground);
        font-size: 13px;
        line-height: 1.4;
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        display: block;
        border-radius: 4px;
    }

    .language-option:hover {
        background: var(--vscode-list-hoverBackground);
    }
    `;
}
