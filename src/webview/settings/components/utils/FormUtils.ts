// src/webview/settings/components/utils/FormUtils.ts

// Declare vscode API for webview communication
declare const vscode: {
    postMessage(message: any): void;
};

interface SelectOption {
    value: string;
    label: string;
    selected?: boolean;
    group?: string;
    className?: string;
}

interface Link {
    url: string;
    text: string;
}

export class FormUtils {
    public static createFormGroup(label: string, tooltip: string, content: string): string {
        return `
            <div class="form-group">
                <label data-tooltip="${tooltip}">${label}</label>
                ${content}
            </div>
        `;
    }

    public static createPasswordField(id: string, label: string, tooltip: string, value: string, link?: Link, showToggle: boolean = true): string {
        const linkHtml = link ? `
            <div class="description">
                <a href="${link.url}" target="_blank">${link.text}</a>
            </div>
        ` : '';

        const toggleButton = showToggle ? `
            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('${id}')" title="Show/Hide API Key">
                <svg class="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg class="eye-off-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            </button>
        ` : '';

        const copyButton = `
            <button type="button" class="copy-toggle pro-feature" onclick="copyAPIKey('${id}')" title="Copy API Key (Pro Feature)" data-pro-feature="copy-api-key">
                <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
            </button>
        `;

        const inputWrapper = `
            <div class="password-input-wrapper">
                <input type="password" id="${id}" value="${value}" data-encrypted="${value === '[ENCRYPTED]' ? 'true' : 'false'}" />
                ${copyButton}
                ${toggleButton}
            </div>
        `;

        return this.createFormGroup(
            label,
            tooltip,
            `${inputWrapper}${linkHtml}`
        );
    }

    public static createTextField(id: string, label: string, tooltip: string, value: string, placeholder?: string): string {
        const placeholderAttr = placeholder ? `placeholder="${placeholder}"` : '';

        return this.createFormGroup(
            label,
            tooltip,
            `<input type="text" id="${id}" value="${value}" ${placeholderAttr} />`
        );
    }

    public static createSelect(id: string, options: SelectOption[]): string {
        const groupedOptions = this.groupOptions(options);
        let selectHtml = `<select id="${id}">`;

        for (const [groupName, groupOptions] of groupedOptions) {
            if (groupName) {
                selectHtml += `<optgroup label="${groupName}">`;
            }

            for (const option of groupOptions) {
                const selected = option.selected ? 'selected' : '';
                const className = option.className ? ` class="${option.className}"` : '';
                selectHtml += `<option value="${option.value}" ${selected}${className}>${option.label}</option>`;
            }

            if (groupName) {
                selectHtml += '</optgroup>';
            }
        }

        selectHtml += '</select>';
        return selectHtml;
    }

    public static createSearchableSelect(id: string, options: SelectOption[], placeholder: string = 'Search...', disabled: boolean = false, tooltip: string = ''): string {
        const optionsHtml = options.map(option => {
            const selected = option.selected ? 'selected' : '';
            const className = option.className ? ` class="${option.className}"` : '';
            return `<option value="${option.value}" ${selected}${className}>${option.label}</option>`;
        }).join('');

        const selectedOption = options.find(o => o.selected) || options[0];
        const initialValue = selectedOption ? selectedOption.label : '';

        return `
            <div class="searchable-select-container ${disabled ? 'disabled' : ''}" id="container-${id}" data-tooltip="${tooltip}">
                <div class="searchable-input-wrapper">
                    <input type="text" 
                           class="searchable-input" 
                           id="search-${id}" 
                           placeholder="${placeholder}" 
                           value="${initialValue}"
                           autocomplete="off" 
                           ${disabled ? 'disabled' : ''} />
                    <button type="button" class="dropdown-toggle" tabindex="-1" aria-label="Open options" title="Open options" ${disabled ? 'disabled' : ''}>
                        <svg class="dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <select id="${id}" style="display: none;">
                    ${optionsHtml}
                </select>
                <div class="searchable-dropdown-list" id="list-${id}"></div>
            </div>
        `;
    }

    public static createToggle(id: string, label: string, tooltip: string, checked: boolean, setting?: string): string {
        const checkedAttr = checked ? 'checked' : '';
        const settingAttr = setting ? `data-setting="${setting}"` : '';

        return `
            <div class="toggle-item" data-tooltip="${tooltip}">
                <div class="switch-container">
                    <input class="switch-input" type="checkbox" id="${id}" ${checkedAttr} ${settingAttr} />
                    <div class="switch-button">
                        <div class="switch-slider"></div>
                    </div>
                </div>
                <div class="toggle-content">
                    <label class="toggle-label" for="${id}">${label}</label>
                </div>
            </div>
        `;
    }

    public static createButton(id: string, text: string, className: string = 'action-button', disabled: boolean = false, tooltip: string = ''): string {
        const disabledAttr = disabled ? 'disabled' : '';
        const tooltipAttr = tooltip ? `data-tooltip="${tooltip}"` : '';
        return `<button type="button" id="${id}" class="${className}" ${disabledAttr} ${tooltipAttr}>${text}</button>`;
    }

    public static createInfoField(content: string): string {
        return `
            <div class="form-group">
                <div class="description">
                    ${content}
                </div>
            </div>
        `;
    }

    private static groupOptions(options: SelectOption[]): Map<string | null, SelectOption[]> {
        const grouped = new Map<string | null, SelectOption[]>();

        for (const option of options) {
            const group = option.group || null;
            if (!grouped.has(group)) {
                grouped.set(group, []);
            }
            grouped.get(group)!.push(option);
        }

        return grouped;
    }

    /**
     * Toggle password field visibility between password and text type
     * This method handles encryption mode security by checking if the field contains encrypted data
     */
    public static togglePasswordVisibility(fieldId: string): void {
        const input = document.getElementById(fieldId) as HTMLInputElement;
        const wrapper = input?.closest('.password-input-wrapper');
        const eyeIcon = wrapper?.querySelector('.eye-icon') as HTMLElement;
        const eyeOffIcon = wrapper?.querySelector('.eye-off-icon') as HTMLElement;

        if (!input || !eyeIcon || !eyeOffIcon) {
            return;
        }

        // Security check: Don't reveal encrypted placeholders
        const isEncrypted = input.dataset.encrypted === 'true' || input.value === '[ENCRYPTED]';
        if (isEncrypted && input.type === 'password') {
            // Show warning for encrypted data
            vscode.postMessage({
                type: 'showMessage',
                level: 'warning',
                message: 'Cannot reveal encrypted data. Please disable encryption first to view API keys.'
            });
            return;
        }

        // Toggle input type
        if (input.type === 'password') {
            input.type = 'text';
            eyeIcon.style.display = 'none';
            eyeOffIcon.style.display = 'block';
        } else {
            input.type = 'password';
            eyeIcon.style.display = 'block';
            eyeOffIcon.style.display = 'none';
        }
    }

    /**
     * Update the encryption status of password fields
     * Call this when encryption settings change
     */
    public static updatePasswordFieldEncryptionStatus(fieldId: string, isEncrypted: boolean): void {
        const input = document.getElementById(fieldId) as HTMLInputElement;
        if (input) {
            input.dataset.encrypted = isEncrypted.toString();

            // If switching to encrypted and field is currently visible, hide it
            if (isEncrypted && input.type === 'text') {
                // Call the global function instead of the method
                (window as any).togglePasswordVisibility(fieldId);
            }

            // If switching away from encrypted (to plain text), clear any [ENCRYPTED] placeholder
            if (!isEncrypted && input.value === '[ENCRYPTED]') {
                // Force a refresh of the field value from the current settings
                if ((window as any).currentSettings) {
                    const provider = fieldId.replace('ApiKey', '').toLowerCase();
                    const currentValue = (window as any).currentSettings[provider]?.apiKey || '';
                    if (currentValue && currentValue !== '[ENCRYPTED]') {
                        input.value = currentValue;
                    }
                }
            }
        }
    }
}
