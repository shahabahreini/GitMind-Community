// src/webview/settings/styles/commitStyle.css.ts
export function getCommitStyleStyles(): string {
    return `
        /* Theme-adaptive CSS variables for better dark/light mode support */
        .gm-commit-style-section {
            --gm-hover-bg: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.1));
            --gm-border-color: var(--vscode-panel-border, var(--vscode-widget-border));
            --gm-accent-color: var(--vscode-textLink-foreground, #0066cc);
            --gm-accent-hover: var(--vscode-textLink-activeForeground, #004499);
            --gm-text-primary: var(--vscode-editor-foreground, var(--vscode-foreground));
            --gm-text-secondary: var(--vscode-descriptionForeground);
            --gm-selected-bg: var(--vscode-list-activeSelectionBackground, rgba(14, 99, 156, 0.1));
            --gm-selected-border: var(--vscode-list-activeSelectionForeground, var(--vscode-focusBorder));
            --gm-selected-text: var(--vscode-list-activeSelectionForeground, var(--vscode-foreground));
            --gm-selected-shadow: var(--vscode-widget-shadow, rgba(0, 0, 0, 0.16));
        }

        /* Commit Style Section Styles */
        .gm-commit-style-section {
            margin-bottom: 24px;
            font-family: var(--vscode-font-family);
        }

        .gm-section-header {
            margin-bottom: 20px;
        }

        .gm-section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--vscode-foreground);
        }

        .gm-section-icon {
            font-size: 18px;
        }

        .gm-section-description {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
            line-height: 1.4;
        }

        .gm-content-wrapper {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            overflow: hidden;
        }

        .gm-tab-navigation {
            display: flex;
            background: var(--vscode-tab-inactiveBackground);
            border-bottom: 1px solid var(--vscode-widget-border);
            margin: 0;
            padding: 0;
        }

        .gm-tab-btn {
            background: transparent;
            border: none;
            padding: 14px 20px;
            color: var(--vscode-tab-inactiveForeground);
            cursor: pointer;
            transition: all 0.2s ease;
            border-bottom: 3px solid transparent;
            font-size: 14px;
            font-weight: 500;
            flex: 1;
            text-align: center;
            outline: none;
        }

        .gm-tab-btn:hover {
            background: var(--vscode-tab-hoverBackground);
            color: var(--vscode-tab-activeForeground);
        }

        .gm-tab-btn:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .gm-tab-btn-active {
            background: var(--vscode-tab-activeBackground) !important;
            color: var(--vscode-tab-activeForeground) !important;
            border-bottom-color: var(--vscode-focusBorder) !important;
        }

        .gm-tab-container {
            position: relative;
            min-height: 400px;
            background: var(--vscode-editor-background);
        }

        .gm-tab-content {
            display: none;
            padding: 20px;
            width: 100%;
            box-sizing: border-box;
        }

        .gm-tab-content-active {
            display: block;
        }

        .gm-style-grid {
            display: grid;
            gap: 8px;
            margin-bottom: 16px;
        }

        .gm-style-option {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            background: var(--vscode-editor-background);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .gm-style-option:hover:not(.gm-style-disabled) {
            border-color: var(--gm-accent-color);
            background: var(--gm-hover-bg);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .gm-style-option-selected {
            border-color: var(--gm-selected-border) !important;
            background: var(--gm-selected-bg) !important;
            box-shadow: 0 0 0 2px var(--gm-accent-color), 0 2px 8px var(--gm-selected-shadow) !important;
            position: relative;
            transform: translateY(-1px) !important;
        }

        .gm-style-option-selected .gm-style-name {
            color: var(--gm-selected-text) !important;
            font-weight: 600 !important;
        }

        .gm-style-option-selected .gm-style-description {
            color: var(--gm-selected-text) !important;
            opacity: 0.9 !important;
        }

        .gm-style-option-selected::before {
            content: "✓";
            position: absolute;
            top: 12px;
            right: 12px;
            width: 18px;
            height: 18px;
            background: var(--gm-accent-color);
            color: var(--vscode-button-foreground, white);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
        }

        .gm-style-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }

        .gm-style-disabled:hover {
            border-color: var(--vscode-widget-border) !important;
            background: var(--vscode-editor-background) !important;
            transform: none !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        }

        .gm-style-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .gm-style-name {
            font-weight: 600;
            font-size: 14px;
            color: var(--gm-text-primary);
            display: flex;
            align-items: center;
            gap: 6px;
            transition: color 0.2s ease;
        }

        .gm-style-name::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--gm-text-secondary);
            opacity: 0.6;
            transition: all 0.2s ease;
        }

        .gm-style-option-selected .gm-style-name::before {
            background: var(--gm-accent-color);
            opacity: 1;
        }

        .gm-pro-badge {
            background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
            color: white;
            font-size: 8px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .gm-style-description {
            color: var(--gm-text-secondary);
            font-size: 13px;
            line-height: 1.4;
            margin: 0;
            font-weight: 400;
            transition: color 0.2s ease;
        }

        .gm-radio-input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        .gm-examples-section {
            margin-top: 20px;
            padding: 16px;
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
        }

        .gm-examples-title {
            font-weight: 600;
            margin: 0 0 12px 0;
            color: var(--vscode-foreground);
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .gm-examples-title::before {
            content: "📝";
            font-size: 14px;
        }

        .gm-examples-container {
            display: grid;
            gap: 10px;
            width: 100%;
        }

        .gm-example-item {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            overflow: hidden;
        }

        .gm-example-label {
            font-size: 10px;
            font-weight: 600;
            color: var(--vscode-tab-activeForeground);
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 6px 10px;
            background: var(--vscode-tab-activeBackground);
            border-bottom: 1px solid var(--vscode-widget-border);
            margin: 0;
            display: block;
        }

        .gm-example-content {
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            color: var(--vscode-editor-foreground);
            line-height: 1.4;
            white-space: pre-wrap;
            padding: 10px;
            margin: 0;
        }

        .gm-reference-container {
            max-height: 600px;
            overflow-y: auto;
            padding-right: 8px;
        }

        .gm-reference-container::-webkit-scrollbar {
            width: 8px;
        }

        .gm-reference-container::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 4px;
        }

        .gm-reference-container::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-hoverBackground);
            border-radius: 4px;
        }

        .gm-reference-title {
            margin: 0 0 24px 0;
            color: var(--vscode-foreground);
            font-size: 20px;
            font-weight: 600;
        }

        .gm-style-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }

        .gm-style-card-header {
            background: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }

        .gm-style-card-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .gm-style-card-subtitle {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
            margin: 0;
        }

        .gm-style-card-content {
            padding: 16px;
        }

        .gm-info-section {
            margin-bottom: 16px;
        }

        .gm-info-section:last-child {
            margin-bottom: 0;
        }

        .gm-info-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin: 0 0 8px 0;
        }

        .gm-info-content {
            color: var(--vscode-descriptionForeground);
            line-height: 1.5;
            font-size: 13px;
        }

        .gm-info-list {
            margin: 8px 0;
            padding-left: 16px;
        }

        .gm-info-list li {
            margin-bottom: 4px;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
        }

        .gm-code-block {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 12px;
            margin: 8px 0;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            color: var(--vscode-editor-foreground);
            white-space: pre-wrap;
            overflow-x: auto;
        }

        .gm-comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 12px;
        }

        .gm-comparison-table th,
        .gm-comparison-table td {
            border: 1px solid var(--vscode-widget-border);
            padding: 8px;
            text-align: left;
        }

        .gm-comparison-table th {
            background: var(--vscode-textCodeBlock-background);
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .gm-comparison-table td {
            color: var(--vscode-descriptionForeground);
        }

        .gm-status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .gm-status-formal { 
            background: #4ecdc4; 
            color: white; 
        }
        
        .gm-status-informal { 
            background: #95a5a6; 
            color: white; 
        }
        
        .gm-status-community { 
            background: #f39c12; 
            color: white; 
        }

        .gm-pro-upgrade-section {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(78, 205, 196, 0.1));
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }

        .gm-upgrade-title {
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--vscode-foreground);
            font-size: 16px;
        }

        .gm-upgrade-description {
            color: var(--vscode-descriptionForeground);
            margin: 0 0 16px 0;
            line-height: 1.4;
        }

        .gm-upgrade-button {
            background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s ease;
            font-size: 14px;
        }

        .gm-upgrade-button:hover {
            opacity: 0.9;
        }

        .gm-upgrade-button:focus {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }

        /* Inline Examples Styles */
        .gm-style-main {
            cursor: pointer;
        }

        .gm-examples-toggle {
            background: transparent;
            border: 1px solid var(--gm-border-color);
            color: var(--gm-accent-color);
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            margin-top: 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s ease;
            outline: none;
            width: fit-content;
            opacity: 0.8;
        }

        .gm-examples-toggle:hover {
            background: var(--gm-hover-bg);
            border-color: var(--gm-accent-color);
            opacity: 1;
            color: var(--gm-accent-hover);
        }

        .gm-examples-toggle:focus {
            outline: 1px solid var(--gm-accent-color);
            outline-offset: -1px;
        }

        .gm-toggle-icon {
            font-size: 8px;
            transition: transform 0.2s ease;
            color: var(--gm-accent-color);
        }

        .gm-inline-examples {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), 
                        opacity 0.2s ease,
                        padding 0.3s ease;
            opacity: 0;
            padding: 0;
            margin-top: 0;
            border-top: 1px solid transparent;
        }

        .gm-inline-examples.gm-examples-expanded {
            max-height: 300px;
            opacity: 1;
            padding: 12px 0 0 0;
            margin-top: 8px;
            border-top: 1px solid var(--gm-border-color);
        }

        .gm-examples-content {
            background: transparent;
            border: none;
            padding: 12px 0 0 0;
        }

        .gm-inline-examples-title {
            font-size: 12px;
            font-weight: 500;
            margin: 0 0 8px 0;
            color: var(--gm-accent-color);
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0.9;
        }

        .gm-inline-examples-title::before {
            content: "✨";
            font-size: 12px;
            opacity: 0.8;
        }

        .gm-examples-list .gm-example-item {
            background: transparent;
            border: none;
            padding: 8px 0;
            margin-bottom: 12px;
            border-left: 2px solid transparent;
            padding-left: 12px;
            transition: all 0.2s ease;
            border-radius: 0 4px 4px 0;
        }

        .gm-examples-list .gm-example-item:hover {
            border-left-color: var(--gm-accent-color);
            background: var(--gm-hover-bg);
            padding-left: 16px;
        }

        .gm-examples-list .gm-example-item:last-child {
            margin-bottom: 0;
        }

        .gm-examples-list .gm-example-label {
            font-size: 10px;
            font-weight: 500;
            color: var(--gm-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            opacity: 0.8;
        }

        .gm-examples-list .gm-example-content {
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            line-height: 1.4;
            color: var(--gm-text-primary);
            white-space: pre-line;
            background: transparent;
            padding: 0;
            border: none;
            opacity: 0.95;
        }

        /* Enhanced animations */
        .gm-style-option {
            transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .gm-style-option:hover .gm-examples-toggle {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .gm-style-option-selected .gm-examples-toggle {
            border-color: var(--gm-accent-color);
            background: var(--gm-accent-color);
            color: var(--vscode-button-foreground, white);
        }

        .gm-style-option-selected .gm-examples-toggle:hover {
            background: var(--gm-accent-hover);
            border-color: var(--gm-accent-hover);
        }

        /* Table of Contents Styles */
        .gm-table-of-contents {
            background: var(--vscode-editor-background);
            border: 1px solid var(--gm-border-color);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 32px;
        }

        .gm-toc-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: var(--gm-text-primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .gm-toc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .gm-toc-column {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .gm-toc-section {
            background: transparent;
        }

        .gm-toc-section-title {
            font-size: 13px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--gm-accent-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .gm-toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .gm-toc-list li {
            margin-bottom: 4px;
        }

        .gm-toc-link {
            color: var(--gm-text-primary);
            text-decoration: none;
            font-size: 13px;
            padding: 4px 8px;
            border-radius: 4px;
            display: block;
            transition: all 0.2s ease;
            border-left: 2px solid transparent;
            opacity: 0.8;
        }

        .gm-toc-link:hover {
            background: var(--gm-hover-bg);
            border-left-color: var(--gm-accent-color);
            color: var(--gm-accent-color);
            opacity: 1;
            text-decoration: none;
            padding-left: 12px;
        }

        .gm-toc-link:focus {
            outline: 1px solid var(--gm-accent-color);
            outline-offset: -1px;
        }

        /* Smooth scrolling for anchor links */
        html {
            scroll-behavior: smooth;
        }

        /* Style reference section */
        .gm-styles-reference {
            margin-top: 24px;
        }
    `;
}
