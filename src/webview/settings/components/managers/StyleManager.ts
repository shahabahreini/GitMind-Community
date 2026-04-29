// src/webview/settings/components/managers/StyleManager.ts

import { getMainStyles } from '../../styles/main.css';

export class StyleManager {
    public renderStyles(): string {
        return getMainStyles();
    }
}
