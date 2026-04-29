// src/webview/settings/styles/commitStyle.css.ts
export function getCommitStyleStyles(): string {
    return `
        /* Theme-adaptive CSS variables for better dark/light mode support */
        .gm-commit-style-section {
            --gm-hover-bg: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.08));
            --gm-border-color: var(--vscode-panel-border, rgba(128, 128, 128, 0.15));
            --gm-accent-color: var(--vscode-button-background, #007acc);
            --gm-accent-hover: var(--vscode-button-hoverBackground, #0062a3);
            --gm-text-primary: var(--vscode-foreground);
            --gm-text-secondary: var(--vscode-descriptionForeground);
            --gm-card-bg: var(--vscode-editor-background);
            --gm-selected-bg: var(--vscode-list-activeSelectionBackground, rgba(0, 122, 204, 0.1));
            --gm-selected-border: var(--vscode-focusBorder, #007acc);
            --gm-pro-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            --gm-success-color: #10b981;
            --gm-warning-color: #f59e0b;
            --gm-error-color: #ef4444;
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
            background: transparent;
            border: none;
            border-radius: 0;
            overflow: visible;
        }

        .gm-tab-navigation {
            display: flex;
            background: transparent;
            border-bottom: none;
            margin: 0 0 1rem 0;
            padding: 0;
            gap: 8px;
            justify-content: flex-start;
        }

        .gm-tab-btn {
            background: transparent;
            color: var(--vscode-descriptionForeground);
            border: 1px solid rgba(128, 128, 128, 0.12);
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 13px;
            font-weight: 500;
            flex: 0 1 auto;
            text-align: center;
            outline: none;
            position: relative;
            white-space: nowrap;
            opacity: 0.7;
        }

        .gm-tab-btn:hover:not(.gm-tab-btn-active) {
            background: var(--vscode-button-secondaryBackground);
            border-color: var(--vscode-button-background);
            color: var(--vscode-foreground);
            opacity: 0.9;
        }

        .gm-tab-btn:focus {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }

        .gm-tab-btn-active {
            background: var(--vscode-button-background) !important;
            color: var(--vscode-button-foreground) !important;
            border-color: var(--vscode-button-background) !important;
            font-weight: 600;
            opacity: 1 !important;
        }

        .gm-tab-container {
            position: relative;
            min-height: 400px;
            background: transparent;
        }

        .gm-tab-content {
            display: none;
            padding: 0;
            width: 100%;
            box-sizing: border-box;
        }

        .gm-tab-content-active {
            display: block;
        }

        .gm-style-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
            margin-bottom: 24px;
        }

        .gm-style-option {
            border: 1px solid var(--gm-border-color);
            border-radius: 12px;
            padding: 16px 20px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            background: var(--gm-card-bg);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
            display: flex;
            flex-direction: column;
            gap: 6px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .gm-style-option:hover:not(.gm-style-disabled) {
            border-color: var(--gm-accent-color);
            background: var(--gm-hover-bg);
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            z-index: 2;
        }

        .gm-style-option-selected {
            border-color: var(--gm-accent-color) !important;
            background: var(--gm-selected-bg) !important;
            box-shadow: 0 0 0 1px var(--gm-accent-color) inset, 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }

        .gm-style-option-selected .gm-style-name {
            color: var(--gm-accent-color) !important;
        }

        .gm-style-option-selected .gm-style-description {
            opacity: 1 !important;
        }

        .gm-style-option-selected::after {
            content: "✓";
            position: absolute;
            top: 14px;
            right: 14px;
            width: 20px;
            height: 20px;
            background: var(--gm-accent-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            animation: gm-pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes gm-pop-in {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
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
            background: var(--gm-pro-gradient);
            color: white;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
        }

        .gm-pro-badge-small {
            background: var(--gm-pro-gradient);
            color: white;
            font-size: 8px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
            text-transform: uppercase;
            margin-left: 6px;
            display: inline-flex;
            align-items: center;
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
            background: var(--gm-card-bg);
            border: 1px solid var(--gm-border-color);
            border-radius: 12px;
            margin-bottom: 24px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .gm-style-card:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .gm-style-card-header {
            background: var(--vscode-textCodeBlock-background);
            padding: 18px 24px;
            border-bottom: 1px solid var(--gm-border-color);
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
            border: 1px solid var(--gm-border-color);
            border-radius: 8px;
            padding: 16px;
            margin: 12px 0;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            color: var(--vscode-editor-foreground);
            white-space: pre-wrap;
            overflow-x: auto;
            line-height: 1.5;
            position: relative;
        }

        .gm-code-block::after {
            content: "EXAMPLE";
            position: absolute;
            top: 0;
            right: 0;
            font-size: 9px;
            font-weight: 700;
            padding: 4px 8px;
            background: var(--gm-border-color);
            color: var(--gm-text-secondary);
            border-radius: 0 7px 0 8px;
            opacity: 0.6;
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
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .gm-status-formal { 
            background: #10b981; 
            color: white; 
        }
        
        .gm-status-informal { 
            background: #64748b; 
            color: white; 
        }
        
        .gm-status-community { 
            background: #f59e0b; 
            color: white; 
        }

        .gm-pro-upgrade-section {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05));
            border: 1px dashed var(--gm-accent-color);
            border-radius: 12px;
            padding: 32px 24px;
            text-align: center;
            margin-top: 32px;
            position: relative;
            overflow: hidden;
        }

        .gm-pro-upgrade-section::before {
            content: "✨";
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--gm-card-bg);
            padding: 0 12px;
            font-size: 20px;
        }

        .gm-upgrade-title {
            font-weight: 700;
            margin: 0 0 12px 0;
            color: var(--gm-text-primary);
            font-size: 18px;
            letter-spacing: -0.02em;
        }

        .gm-upgrade-description {
            color: var(--gm-text-secondary);
            margin: 0 0 24px 0;
            line-height: 1.6;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
            font-size: 14px;
        }

        .gm-upgrade-button {
            background: var(--gm-pro-gradient);
            color: white;
            border: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .gm-upgrade-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
            opacity: 0.95;
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
            background: var(--gm-accent-color);
            color: var(--vscode-button-foreground, white);
            border-color: var(--gm-accent-color);
            opacity: 1;
        }

        .gm-examples-toggle.gm-examples-toggle-active {
            background: var(--gm-accent-color);
            color: var(--vscode-button-foreground, white);
            border-color: var(--gm-accent-color);
            opacity: 1;
        }

        .gm-examples-toggle.gm-examples-toggle-active:hover {
            background: var(--gm-accent-hover);
            border-color: var(--gm-accent-hover);
        }

        .gm-examples-toggle:focus {
            outline: 1px solid var(--gm-accent-color);
            outline-offset: -1px;
        }

        .gm-toggle-icon {
            font-size: 8px;
            transition: transform 0.2s ease;
            color: currentColor;
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
            padding-left: 14px;
            transform: translateX(2px);
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

        /* Gitmoji and Emoji Reference Styles */
        .gm-emoji-enhancement-container {
            padding: 4px;
        }

        .gm-emoji-header {
            margin-bottom: 24px;
        }

        .gm-emoji-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: var(--gm-text-primary);
        }

        .gm-emoji-description {
            font-size: 14px;
            color: var(--gm-text-secondary);
            margin: 0;
            line-height: 1.5;
        }

        .gm-emoji-controls {
            margin-top: 24px;
        }

        .gm-emoji-toggle-section {
            margin-bottom: 20px;
            padding: 16px;
            background: var(--gm-hover-bg);
            border-radius: 8px;
            border: 1px solid var(--gm-border-color);
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
            cursor: pointer;
        }

        .gm-emoji-options {
            display: none;
            margin-top: 24px;
            animation: fadeIn 0.3s ease-out;
        }

        .gm-emoji-options-visible {
            display: block;
        }

        .gm-placement-section {
            margin-bottom: 24px;
        }

        .gm-placement-title {
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: var(--gm-text-primary);
        }

        .gm-placement-options {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .gm-placement-item {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 8px 16px;
            background: var(--gm-card-bg);
            border: 1px solid var(--gm-border-color);
            border-radius: 6px;
            transition: all 0.2s ease;
        }

        .gm-placement-item:hover {
            border-color: var(--gm-accent-color);
            background: var(--gm-hover-bg);
        }

        .gm-placement-item input[type="radio"]:checked + .gm-placement-text {
            color: var(--gm-accent-color);
            font-weight: 600;
        }

        .gm-emoji-reference {
            margin-top: 32px;
            padding: 24px;
            background: var(--gm-card-bg);
            border: 1px solid var(--gm-border-color);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .gm-reference-table-container {
            margin-top: 16px;
            border-radius: 8px;
            border: 1px solid var(--gm-border-color);
            overflow: hidden;
        }

        .gm-reference-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        .gm-reference-table th {
            background: var(--vscode-textCodeBlock-background);
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 1px solid var(--gm-border-color);
        }

        .gm-emoji-row {
            border-bottom: 1px solid var(--gm-border-color);
            transition: background 0.2s ease;
        }

        .gm-emoji-row:hover {
            background: var(--gm-hover-bg);
        }

        .gm-emoji-cell {
            padding: 12px;
            font-size: 18px;
            text-align: center;
            width: 60px;
        }

        .gm-type-cell {
            padding: 12px;
            font-family: var(--vscode-editor-font-family);
        }

        .gm-type-cell code {
            background: var(--gm-hover-bg);
            color: var(--gm-accent-color);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }

        .gm-description-cell {
            padding: 12px;
            color: var(--gm-text-secondary);
        }

        .gm-reference-note {
            margin-top: 20px;
            padding: 12px 16px;
            background: rgba(100, 150, 255, 0.05);
            border-left: 4px solid var(--gm-accent-color);
            border-radius: 0 8px 8px 0;
            font-size: 13px;
        }
    `;
}
