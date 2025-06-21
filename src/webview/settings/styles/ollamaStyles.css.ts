// src/webview/settings/styles/ollamaStyles.css.ts

export function getOllamaStyles(): string {
    return `
        .model-input-container {
            position: relative;
            width: 100%;
        }

        .searchable-dropdown {
            position: relative;
            display: flex;
            align-items: center;
        }

        .searchable-dropdown input {
            flex: 1;
            padding-right: 45px;
        }

        .load-models-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 3px;
            color: var(--vscode-foreground);
            transition: all 0.2s ease;
            z-index: 2;
        }

        .load-models-btn:hover {
            background: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-button-foreground);
        }

        .load-models-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .load-models-btn svg {
            animation: none;
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
            top: calc(100% + 2px);
            left: 0;
            right: 0;
            background: var(--vscode-dropdown-background);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 3px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
        }

        .dropdown-loading,
        .dropdown-error,
        .dropdown-empty {
            padding: 12px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }

        .dropdown-error {
            color: var(--vscode-errorForeground);
        }

        .model-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .model-list li {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-dropdown-border);
            transition: background-color 0.2s ease;
        }

        .model-list li:last-child {
            border-bottom: none;
        }

        .model-list li:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .model-list li.selected {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .model-list li.filtered-out {
            display: none;
        }

        .model-name {
            font-weight: 500;
        }

        .model-info {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }
    `;
}
