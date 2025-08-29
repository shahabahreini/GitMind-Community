// src/webview/settings/components/managers/StyleManager.ts

import { getTabStyles } from '../../styles/tabs.css';
import { getCardStyles } from '../../styles/cards.css';
import { getFormStyles } from '../../styles/forms.css';
import { getToggleStyles } from '../../styles/toggle.css';
import { getButtonStyles } from '../../styles/buttons.css';
import { getStatusStyles } from '../../styles/status.css';
import { getActivationStyles } from '../../styles/activation.css';
import { getSubscriptionStyles } from '../../styles/subscription.css';
import { getDevModeStyles } from '../../styles/devMode.css';
import { getProFeatureStyles } from '../../styles/proFeature.css';
import { getTooltipStyles } from '../../styles/tooltip.css';
import { getOllamaStyles } from '../../styles/ollamaStyles.css';
import { getCustomApiStyles } from '../../styles/customApi.css';
import { getLargeDiffStyles } from '../../../settings/styles/largeDiffStyles.css';

export class StyleManager {
    public renderStyles(): string {
        return `
            <style>
                ${getCardStyles()}
                ${getFormStyles()}
                ${getToggleStyles()}
                ${getButtonStyles()}
                ${getStatusStyles()}
                ${getTabStyles()}
                ${getActivationStyles()}
                ${getSubscriptionStyles()}
                ${getDevModeStyles()}
                ${getProFeatureStyles()}
                ${getTooltipStyles()}
                ${getOllamaStyles()}
                ${getCustomApiStyles()}
                ${getLargeDiffStyles()}
            </style>
        `;
    }
}