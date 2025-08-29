// src/webview/settings/components/GitmojiCustomDialog.ts
import * as vscode from 'vscode';
import { GitmojiService } from '../../../services/gitmoji/GitmojiService';

export class GitmojiCustomDialog {
    private static instance: GitmojiCustomDialog;
    private gitmojiService: GitmojiService;

    private constructor() {
        this.gitmojiService = GitmojiService.getInstance();
    }

    public static getInstance(): GitmojiCustomDialog {
        if (!GitmojiCustomDialog.instance) {
            GitmojiCustomDialog.instance = new GitmojiCustomDialog();
        }
        return GitmojiCustomDialog.instance;
    }

    public async showCustomEmojiDialog(): Promise<void> {
        const availableEmojis = this.gitmojiService.getAvailableEmojiTypes();
        const currentCustomEmojis = this.gitmojiService.getCustomEmojis();

        // Create quick pick items
        const items: vscode.QuickPickItem[] = availableEmojis.map(emoji => ({
            label: `${emoji.emoji} ${emoji.type}`,
            description: emoji.description,
            detail: currentCustomEmojis[emoji.type] ? `Custom: ${currentCustomEmojis[emoji.type]}` : `Default: ${emoji.emoji}`
        }));

        const selectedItem = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a commit type to customize its emoji',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selectedItem) {
            const commitType = selectedItem.label.split(' ')[1]; // Extract type from "🎯 feat"
            await this.showEmojiInputDialog(commitType);
        }
    }

    private async showEmojiInputDialog(commitType: string): Promise<void> {
        const currentEmoji = this.gitmojiService.getEmojiForType(commitType);
        const customEmojis = this.gitmojiService.getCustomEmojis();
        const isCustom = Boolean(customEmojis[commitType]);

        const options: string[] = [
            'Enter custom emoji',
            'Reset to default',
            'Remove custom mapping'
        ];

        const action = await vscode.window.showQuickPick(options, {
            placeHolder: `Current emoji for "${commitType}": ${currentEmoji} ${isCustom ? '(custom)' : '(default)'}`
        });

        if (!action) {
            return;
        }

        switch (action) {
            case 'Enter custom emoji':
                await this.handleCustomEmojiInput(commitType);
                break;
            case 'Reset to default':
                await this.resetToDefault(commitType);
                break;
            case 'Remove custom mapping':
                await this.removeCustomMapping(commitType);
                break;
        }
    }

    private async handleCustomEmojiInput(commitType: string): Promise<void> {
        const currentEmoji = this.gitmojiService.getEmojiForType(commitType);
        
        const newEmoji = await vscode.window.showInputBox({
            prompt: `Enter custom emoji for "${commitType}"`,
            value: currentEmoji || '',
            validateInput: (value) => {
                if (!value.trim()) {
                    return 'Emoji cannot be empty';
                }
                // Basic emoji validation - check if it contains emoji-like characters
                const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
                if (!emojiRegex.test(value)) {
                    return 'Please enter a valid emoji';
                }
                return null;
            }
        });

        if (newEmoji) {
            await this.updateCustomEmoji(commitType, newEmoji.trim());
            vscode.window.showInformationMessage(`Custom emoji for "${commitType}" set to: ${newEmoji}`);
        }
    }

    private async resetToDefault(commitType: string): Promise<void> {
        const customEmojis = this.gitmojiService.getCustomEmojis();
        if (customEmojis[commitType]) {
            delete customEmojis[commitType];
            await this.saveCustomEmojis(customEmojis);
            
            const defaultEmoji = this.gitmojiService.getEmojiForType(commitType);
            vscode.window.showInformationMessage(`Reset "${commitType}" to default emoji: ${defaultEmoji}`);
        }
    }

    private async removeCustomMapping(commitType: string): Promise<void> {
        const customEmojis = this.gitmojiService.getCustomEmojis();
        if (customEmojis[commitType]) {
            delete customEmojis[commitType];
            await this.saveCustomEmojis(customEmojis);
            vscode.window.showInformationMessage(`Removed custom mapping for "${commitType}"`);
        } else {
            vscode.window.showWarningMessage(`No custom mapping found for "${commitType}"`);
        }
    }

    private async updateCustomEmoji(commitType: string, emoji: string): Promise<void> {
        const customEmojis = this.gitmojiService.getCustomEmojis();
        customEmojis[commitType] = emoji;
        await this.saveCustomEmojis(customEmojis);
    }

    private async saveCustomEmojis(customEmojis: { [key: string]: string }): Promise<void> {
        const config = vscode.workspace.getConfiguration('gitmind');
        await config.update('commitStyle.gitmoji.customEmojis', customEmojis, vscode.ConfigurationTarget.Global);
    }

    public async showEmojiReference(): Promise<void> {
        const availableEmojis = this.gitmojiService.getAvailableEmojiTypes();
        const customEmojis = this.gitmojiService.getCustomEmojis();

        // Create a webview to show the emoji reference
        const panel = vscode.window.createWebviewPanel(
            'gitmojiReference',
            'Gitmoji Reference',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getEmojiReferenceHtml(availableEmojis, customEmojis);
    }

    private getEmojiReferenceHtml(
        availableEmojis: Array<{ type: string; emoji: string; description: string }>,
        customEmojis: { [key: string]: string }
    ): string {
        const emojiRows = availableEmojis.map(emoji => {
            const isCustom = Boolean(customEmojis[emoji.type]);
            const displayEmoji = customEmojis[emoji.type] || emoji.emoji;
            
            return `
                <tr class="${isCustom ? 'custom-emoji' : ''}">
                    <td class="emoji-cell">${displayEmoji}</td>
                    <td class="type-cell"><code>${emoji.type}</code></td>
                    <td class="description-cell">${emoji.description}</td>
                    <td class="status-cell">${isCustom ? '<span class="custom-badge">Custom</span>' : '<span class="default-badge">Default</span>'}</td>
                </tr>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Gitmoji Reference</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        line-height: 1.6;
                    }
                    
                    h1 {
                        color: var(--vscode-textPreformat-foreground);
                        border-bottom: 2px solid var(--vscode-textSeparator-foreground);
                        padding-bottom: 10px;
                    }
                    
                    .intro {
                        background-color: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textBlockQuote-border);
                        padding: 15px;
                        margin: 20px 0;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid var(--vscode-textSeparator-foreground);
                    }
                    
                    th {
                        background-color: var(--vscode-textPreformat-background);
                        font-weight: bold;
                        position: sticky;
                        top: 0;
                    }
                    
                    .emoji-cell {
                        font-size: 1.5em;
                        text-align: center;
                        width: 60px;
                    }
                    
                    .type-cell {
                        font-family: var(--vscode-editor-font-family);
                        width: 120px;
                    }
                    
                    .description-cell {
                        width: auto;
                    }
                    
                    .status-cell {
                        width: 100px;
                        text-align: center;
                    }
                    
                    .custom-emoji {
                        background-color: var(--vscode-diffEditor-insertedTextBackground);
                    }
                    
                    .custom-badge {
                        background-color: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.8em;
                        font-weight: bold;
                    }
                    
                    .default-badge {
                        background-color: var(--vscode-textPreformat-background);
                        color: var(--vscode-textPreformat-foreground);
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.8em;
                    }
                    
                    code {
                        background-color: var(--vscode-textPreformat-background);
                        color: var(--vscode-textPreformat-foreground);
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: var(--vscode-editor-font-family);
                    }
                    
                    .search-container {
                        margin: 20px 0;
                    }
                    
                    .search-input {
                        width: 100%;
                        padding: 10px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    
                    .search-input:focus {
                        outline: none;
                        border-color: var(--vscode-focusBorder);
                    }
                </style>
            </head>
            <body>
                <h1>🎯 Gitmoji Reference</h1>
                
                <div class="intro">
                    <p><strong>Gitmoji</strong> adds visual context to your commit messages using emojis. This reference shows all available commit types and their corresponding emojis.</p>
                    <p>Custom emojis are highlighted and take precedence over default mappings.</p>
                </div>
                
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="Search commit types or descriptions...">
                </div>
                
                <table id="emojiTable">
                    <thead>
                        <tr>
                            <th>Emoji</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${emojiRows}
                    </tbody>
                </table>
                
                <script>
                    // Search functionality
                    const searchInput = document.getElementById('searchInput');
                    const table = document.getElementById('emojiTable');
                    const rows = table.querySelectorAll('tbody tr');
                    
                    searchInput.addEventListener('input', function() {
                        const searchTerm = this.value.toLowerCase();
                        
                        rows.forEach(row => {
                            const type = row.querySelector('.type-cell').textContent.toLowerCase();
                            const description = row.querySelector('.description-cell').textContent.toLowerCase();
                            
                            if (type.includes(searchTerm) || description.includes(searchTerm)) {
                                row.style.display = '';
                            } else {
                                row.style.display = 'none';
                            }
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }
}
