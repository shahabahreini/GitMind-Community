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
            padding: 6px;
            border-radius: 6px;
            color: var(--vscode-foreground);
            transition: all 0.2s ease;
            z-index: 2;
        }

        .load-models-btn:hover {
            background: rgba(128, 128, 128, 0.1);
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
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            background: var(--vscode-dropdown-background);
            border: none;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            max-height: 200px;
            overflow-y: auto;
            z-index: 5000;
        }

        .dropdown-loading,
        .dropdown-error,
        .dropdown-empty {
            padding: 16px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }

        .dropdown-error {
            color: rgba(239, 68, 68, 1);
        }

        .model-list {
            list-style: none;
            margin: 0;
            padding: 4px;
        }

        .model-list li {
            padding: 10px 12px;
            cursor: pointer;
            border-bottom: none;
            transition: background-color 0.2s ease;
            border-radius: 6px;
            margin-bottom: 2px;
        }

        .model-list li:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .model-list li:hover {
            background: rgba(128, 128, 128, 0.1);
        }

        .model-list li.selected {
            background: rgba(0, 122, 204, 0.15);
            color: var(--vscode-foreground);
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
            opacity: 0.8;
        }
    `;
}
