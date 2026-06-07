// src/webview/settings/styles/emojiEnhancement.css.ts
export function getEmojiEnhancementStyles(): string {
    return `
        .gm-emoji-enhancement-container {
            padding: 20px 0;
        }
        
        .gm-emoji-header {
            margin-bottom: 24px;
        }
        
        .gm-emoji-title {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .gm-emoji-description {
            margin: 0;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.5;
        }
        
        .gm-emoji-toggle-section {
            margin-bottom: 20px;
            padding: 16px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }
        
        .gm-emoji-toggle-label {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        
        .gm-emoji-checkbox {
            width: 18px;
            height: 18px;
            margin: 0;
        }
        
        .gm-emoji-options {
            display: none;
            margin-top: 20px;
            padding: 20px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .gm-emoji-options-visible {
            display: block;
            opacity: 1;
        }
        
        .gm-placement-section {
            margin-bottom: 24px;
        }
        
        .gm-placement-title {
            margin: 0 0 12px 0;
            font-size: 15px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .gm-placement-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
        }
        
        .gm-placement-item {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            padding: 10px 14px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            transition: all 0.2s ease;
            font-size: 14px;
        }
        
        .gm-placement-item:hover {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-list-hoverBackground);
        }
        
        .gm-placement-item input[type="radio"] {
            margin: 0;
            width: 16px;
            height: 16px;
        }
        
        .gm-placement-text {
            color: var(--vscode-foreground);
            font-weight: 400;
        }
        
        .gm-emoji-examples {
            margin-bottom: 24px;
        }
        
        /*
         * Example styles are scoped to the emoji tab (.gm-emoji-examples) so they
         * no longer collide with the inline style-selection examples, which use
         * the same bare class names but a different layout (see commitStyle.css.ts).
         */
        .gm-emoji-examples .gm-examples-title {
            margin: 0 0 12px 0;
            font-size: 15px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .gm-emoji-examples .gm-examples-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        @media (max-width: 768px) {
            .gm-emoji-examples .gm-examples-grid {
                grid-template-columns: 1fr;
            }
        }

        .gm-emoji-examples .gm-example-item {
            padding: 16px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }

        .gm-emoji-examples .gm-example-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .gm-emoji-examples .gm-example-label::before {
            content: '💡';
            font-size: 14px;
        }

        .gm-emoji-examples .gm-example-content {
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            color: var(--vscode-foreground);
            white-space: pre-line;
            line-height: 1.5;
            background: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 4px;
            border-left: 3px solid var(--vscode-focusBorder);
        }
        
        .gm-emoji-reference {
            margin-top: 24px;
            padding: 20px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }
        
        .gm-reference-title {
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .gm-reference-description {
            margin: 0 0 20px 0;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.5;
        }
        
        .gm-reference-table-container {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        
        .gm-reference-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        .gm-reference-table th {
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            font-weight: 600;
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
            position: sticky;
            top: 0;
        }
        
        .gm-emoji-row {
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .gm-emoji-row:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .gm-emoji-cell {
            padding: 8px 12px;
            font-size: 16px;
            text-align: center;
            width: 50px;
        }
        
        .gm-type-cell {
            padding: 8px 12px;
            width: 80px;
        }
        
        .gm-type-cell code {
            background: var(--vscode-textPreformat-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
        }
        
        .gm-description-cell {
            padding: 8px 12px;
            color: var(--vscode-foreground);
        }
        
        .gm-reference-note {
            margin-top: 16px;
            padding: 12px;
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            border-radius: 0 4px 4px 0;
        }
        
        .gm-reference-note p {
            margin: 0;
            font-size: 13px;
            color: var(--vscode-foreground);
        }
        
        .gm-reference-note code {
            background: var(--vscode-textPreformat-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
        }
    `;
}
