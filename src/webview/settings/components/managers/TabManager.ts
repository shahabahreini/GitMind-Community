// src/webview/settings/components/managers/TabManager.ts

interface Tab {
    id: string;
    label: string;
    content: string;
    tooltip?: string;
    className?: string;
}

export class TabManager {
    public renderTabContainer(tabs: Tab[]): string {
        return `
            <div class="tabs-container">
                ${this.renderTabHeader(tabs)}
                ${this.renderTabContent(tabs)}
            </div>
        `;
    }

    private renderTabHeader(tabs: Tab[]): string {
        const buttons = tabs.map((tab, index) => {
            const activeClass = index === 0 ? 'active' : '';
            const customClass = tab.className || '';
            const tooltip = tab.tooltip || `${tab.label} settings`;
            return `<button class="tab-button ${activeClass} ${customClass}" data-tab="${tab.id}" data-tooltip="${tooltip}">${tab.label}</button>`;
        }).join('');

        return `
            <div class="tabs-header">
                ${buttons}
            </div>
        `;
    }

    private renderTabContent(tabs: Tab[]): string {
        return tabs.map((tab, index) => {
            const activeClass = index === 0 ? 'active' : '';
            return `
                <div class="tab-content ${activeClass}" id="${tab.id}">
                    ${tab.content}
                </div>
            `;
        }).join('');
    }
}