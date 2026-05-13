// src/webview/settings/styles/ollamaStyles.css.ts

export function getOllamaStyles(): string {
    return `
        .model-input-container {
            position: relative;
            width: 100%;
            margin-bottom: 8px;
        }

        .searchable-dropdown {
            position: relative;
            display: flex;
            align-items: center;
            --gm-model-dropdown-border: var(--vscode-input-border, rgba(99, 99, 99, 0.22));
            --gm-model-dropdown-border-hover: var(--vscode-focusBorder, rgba(0, 95, 163, 0.55));
            --gm-model-dropdown-background: var(--vscode-input-background, var(--vscode-editor-background, #ffffff));
            --gm-model-dropdown-foreground: var(--vscode-input-foreground, var(--vscode-foreground, #1f2328));
            --gm-model-dropdown-icon: var(--vscode-icon-foreground, var(--vscode-input-foreground, var(--vscode-foreground, #3f454b)));
            --gm-model-dropdown-hover: var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.12));
            background: var(--gm-model-dropdown-background);
            border: 1px solid var(--gm-model-dropdown-border);
            border-radius: 6px;
            transition: all 0.2s ease;
            height: 34px;
            box-sizing: border-box;
        }
        
        .searchable-dropdown:hover {
            border-color: var(--gm-model-dropdown-border-hover);
        }
        
        .searchable-dropdown:focus-within {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .searchable-dropdown input {
            flex: 1;
            padding-right: 45px;
            background: transparent !important;
            border: none !important;
            outline: none !important;
            height: 30px !important;
            padding-left: 10px !important;
            color: var(--gm-model-dropdown-foreground);
            font-size: 13px;
        }

        .load-models-btn.loading svg {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .dropdown-content {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            background: var(--vscode-dropdown-background, var(--vscode-editor-background, #ffffff));
            border: 1px solid var(--vscode-dropdown-border, var(--gm-model-dropdown-border));
            border-radius: 8px;
            box-shadow: 0 8px 22px rgba(0, 0, 0, 0.16);
            max-height: 240px;
            overflow-y: auto;
            z-index: 5000;
            padding: 4px;
            animation: dropdownFadeIn 0.15s ease-out;
        }

        .dropdown-loading,
        .dropdown-error,
        .dropdown-empty {
            padding: 16px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            font-style: italic;
        }

        .dropdown-error {
            color: var(--vscode-errorForeground, #f14c4c);
        }

        .model-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .model-list li {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: none;
            transition: background-color 0.15s ease;
            border-radius: 6px;
            margin-bottom: 2px;
            display: flex;
            flex-direction: column;
        }

        .model-list li:last-child {
            margin-bottom: 0;
        }

        .model-list li:hover {
            background: var(--vscode-list-hoverBackground);
            color: var(--vscode-list-hoverForeground);
        }

        .model-list li.selected {
            background: rgba(0, 122, 204, 0.15);
            color: var(--vscode-foreground);
            font-weight: 600;
        }

        .model-list li.filtered-out {
            display: none;
        }

        .model-name {
            font-size: 13px;
        }

        .model-info {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 1px;
            opacity: 0.8;
            font-weight: normal;
        }
    `;
}
