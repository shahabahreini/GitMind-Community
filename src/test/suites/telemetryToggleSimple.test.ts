import * as assert from 'assert';
import * as vscode from 'vscode';
import { FreeFeatureRenderer } from '../../webview/settings/components/renderers/FreeFeatureRenderer';

suite('Telemetry Toggle Simple Tests', () => {
    test('FreeFeatureRenderer should properly handle telemetry enabled state', () => {
        // Test with telemetry explicitly enabled
        const settingsEnabled = {
            telemetry: { enabled: true }
        };
        const rendererEnabled = new FreeFeatureRenderer(settingsEnabled as any);
        const htmlEnabled = rendererEnabled.render();
        
        // Should contain checked attribute when telemetry is enabled
        assert.ok(
            htmlEnabled.includes('id="telemetryEnabled" checked'), 
            'Telemetry toggle should be checked when telemetry.enabled is true'
        );

        // Test with telemetry explicitly disabled
        const settingsDisabled = {
            telemetry: { enabled: false }
        };
        const rendererDisabled = new FreeFeatureRenderer(settingsDisabled as any);
        const htmlDisabled = rendererDisabled.render();
        
        // Should NOT contain checked attribute when telemetry is disabled
        assert.ok(
            !htmlDisabled.includes('id="telemetryEnabled" checked'), 
            'Telemetry toggle should NOT be checked when telemetry.enabled is false'
        );

        // Test with telemetry undefined
        const settingsUndefined = {
            telemetry: { enabled: undefined }
        };
        const rendererUndefined = new FreeFeatureRenderer(settingsUndefined as any);
        const htmlUndefined = rendererUndefined.render();
        
        // Should NOT contain checked attribute when telemetry is undefined
        assert.ok(
            !htmlUndefined.includes('id="telemetryEnabled" checked'), 
            'Telemetry toggle should NOT be checked when telemetry.enabled is undefined'
        );

        // Test with telemetry null
        const settingsNull = {
            telemetry: { enabled: null }
        };
        const rendererNull = new FreeFeatureRenderer(settingsNull as any);
        const htmlNull = rendererNull.render();
        
        // Should NOT contain checked attribute when telemetry is null
        assert.ok(
            !htmlNull.includes('id="telemetryEnabled" checked'), 
            'Telemetry toggle should NOT be checked when telemetry.enabled is null'
        );
    });
});
