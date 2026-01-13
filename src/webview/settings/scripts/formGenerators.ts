import { PROVIDER_DEFAULTS, API_KEY_PROVIDERS } from './constants';

export function generateFormInitialization(): string {
  const formInits: string[] = [
    `try {`,
    `  const apiProviderEl = document.getElementById('apiProvider');`,
    `  if (apiProviderEl) apiProviderEl.value = currentSettings.apiProvider || 'huggingface';`,
    `} catch (e) { console.warn('Failed to set apiProvider:', e); }`,

    `try {`,
    `  const commitVerboseEl = document.getElementById('commitVerbose');`,
    `  if (commitVerboseEl) commitVerboseEl.checked = currentSettings.commit?.verbose ?? true;`,
    `} catch (e) { console.warn('Failed to set commitVerbose:', e); }`,

    `try {`,
    `  const commitCaptureAllChangesEl = document.getElementById('commitCaptureAllChanges');`,
    `  if (commitCaptureAllChangesEl) commitCaptureAllChangesEl.checked = currentSettings.commit?.captureAllChanges ?? false;`,
    `} catch (e) { console.warn('Failed to set commitCaptureAllChanges:', e); }`,

    `try {`,
    `  const commitTargetLanguageEl = document.getElementById('commitTargetLanguage');`,
    `  const commitTargetLanguageValueEl = document.getElementById('commitTargetLanguageValue');`,
    `  const targetLanguageValue = currentSettings.commit?.targetLanguage ?? 'english';`,
    `  if (commitTargetLanguageEl) commitTargetLanguageEl.value = targetLanguageValue;`,
    `  if (commitTargetLanguageValueEl) commitTargetLanguageValueEl.value = targetLanguageValue;`,
    `} catch (e) { console.warn('Failed to set commitTargetLanguage:', e); }`,

    `try {`,
    `  const showDiagnosticsEl = document.getElementById('showDiagnostics');`,
    `  if (showDiagnosticsEl) showDiagnosticsEl.checked = currentSettings.showDiagnostics ?? false;`,
    `} catch (e) { console.warn('Failed to set showDiagnostics:', e); }`,

    `try {`,
    `  const telemetryEnabledEl = document.getElementById('telemetryEnabled');`,
    `  if (telemetryEnabledEl) {`,
    `    const telemetryValue = currentSettings.telemetry?.enabled ?? false;`,
    `    console.log('Setting telemetry checkbox to:', telemetryValue, 'from settings:', currentSettings.telemetry);`,
    `    telemetryEnabledEl.checked = telemetryValue;`,
    `  }`,
    `} catch (e) { console.warn('Failed to set telemetryEnabled:', e); }`,

    `try {`,
    `  const promptCustomizationEnabledEl = document.getElementById('promptCustomizationEnabled');`,
    `  if (promptCustomizationEnabledEl) promptCustomizationEnabledEl.checked = currentSettings.promptCustomization?.enabled ?? false;`,
    `} catch (e) { console.warn('Failed to set promptCustomizationEnabled:', e); }`,

    `try {`,
    `  const saveLastPromptEl = document.getElementById('saveLastPrompt');`,
    `  if (saveLastPromptEl) saveLastPromptEl.checked = currentSettings.promptCustomization?.saveLastPrompt || false;`,
    `} catch (e) { console.warn('Failed to set saveLastPrompt:', e); }`,

    `try {`,
    `  const encryptionEnabledEl = document.getElementById('encryptionEnabled');`,
    `  if (encryptionEnabledEl) encryptionEnabledEl.checked = currentSettings.pro?.encryptionEnabled ?? false;`,
    `} catch (e) { console.warn('Failed to set encryptionEnabled:', e); }`,

    `try {`,
    `  const subscriptionEmailEl = document.getElementById('subscriptionEmail');`,
    `  if (subscriptionEmailEl) subscriptionEmailEl.value = currentSettings.subscription?.email || '';`,
    `} catch (e) { console.warn('Failed to set subscriptionEmail:', e); }`,

    `try {`,
    `  const commitBodyOptionsEnabledEl = document.getElementById('commitBodyOptionsEnabled');`,
    `  if (commitBodyOptionsEnabledEl) commitBodyOptionsEnabledEl.checked = currentSettings.pro?.commitBodyOptions?.enabled ?? false;`,
    `} catch (e) { console.warn('Failed to set commitBodyOptionsEnabled:', e); }`,

    `try {`,
    `  const commitBodyOptionsMaxLinesEl = document.getElementById('commitBodyOptionsMaxLines');`,
    `  if (commitBodyOptionsMaxLinesEl) commitBodyOptionsMaxLinesEl.value = currentSettings.pro?.commitBodyOptions?.maxLines ?? 5;`,
    `} catch (e) { console.warn('Failed to set commitBodyOptionsMaxLines:', e); }`,

    `try {`,
    `  const commitLengthOptionsEnabledEl = document.getElementById('commitLengthOptionsEnabled');`,
    `  if (commitLengthOptionsEnabledEl) commitLengthOptionsEnabledEl.checked = currentSettings.pro?.commitLengthOptions?.enabled ?? false;`,
    `} catch (e) { console.warn('Failed to set commitLengthOptionsEnabled:', e); }`,

    `try {`,
    `  const commitLengthOptionsMaxLengthEl = document.getElementById('commitLengthOptionsMaxLength');`,
    `  if (commitLengthOptionsMaxLengthEl) commitLengthOptionsMaxLengthEl.value = currentSettings.pro?.commitLengthOptions?.maxLength ?? 72;`,
    `} catch (e) { console.warn('Failed to set commitLengthOptionsMaxLength:', e); }`,

    `try {`,
    `  const learnFromCommitHistoryEnabledEl = document.getElementById('learnFromCommitHistoryEnabled');`,
    `  if (learnFromCommitHistoryEnabledEl) learnFromCommitHistoryEnabledEl.checked = currentSettings.pro?.learnFromCommitHistory?.enabled ?? true;`,
    `} catch (e) { console.warn('Failed to set learnFromCommitHistoryEnabled:', e); }`,

    `try {`,
    `  const learnFromCommitHistoryMaxCommitsEl = document.getElementById('learnFromCommitHistoryMaxCommits');`,
    `  if (learnFromCommitHistoryMaxCommitsEl) learnFromCommitHistoryMaxCommitsEl.value = currentSettings.pro?.learnFromCommitHistory?.maxCommits ?? 50;`,
    `} catch (e) { console.warn('Failed to set learnFromCommitHistoryMaxCommits:', e); }`,

    `try {`,
    `  const learnFromCommitHistoryIncludeAuthorInfoEl = document.getElementById('learnFromCommitHistoryIncludeAuthorInfo');`,
    `  if (learnFromCommitHistoryIncludeAuthorInfoEl) learnFromCommitHistoryIncludeAuthorInfoEl.checked = currentSettings.pro?.learnFromCommitHistory?.includeAuthorInfo ?? true;`,
    `} catch (e) { console.warn('Failed to set learnFromCommitHistoryIncludeAuthorInfo:', e); }`,

    `try {`,
    `  const changelogEnabledEl = document.getElementById('changelogEnabled');`,
    `  if (changelogEnabledEl) changelogEnabledEl.checked = currentSettings.pro?.changelog?.enabled ?? true;`,
    `} catch (e) { console.warn('Failed to set changelogEnabled:', e); }`,

    `try {`,
    `  const changelogMaxCommitsEnabledEl = document.getElementById('changelogMaxCommitsEnabled');`,
    `  if (changelogMaxCommitsEnabledEl) changelogMaxCommitsEnabledEl.checked = currentSettings.pro?.changelog?.maxCommitsEnabled ?? false;`,
    `} catch (e) { console.warn('Failed to set changelogMaxCommitsEnabled:', e); }`,

    `try {`,
    `  const changelogMaxCommitsEl = document.getElementById('changelogMaxCommits');`,
    `  if (changelogMaxCommitsEl) changelogMaxCommitsEl.value = currentSettings.pro?.changelog?.maxCommits ?? 100;`,
    `} catch (e) { console.warn('Failed to set changelogMaxCommits:', e); }`,

    `try {`,
    `  const changelogGroupByVersionEl = document.getElementById('changelogGroupByVersion');`,
    `  if (changelogGroupByVersionEl) changelogGroupByVersionEl.checked = currentSettings.pro?.changelog?.groupByVersion ?? true;`,
    `} catch (e) { console.warn('Failed to set changelogGroupByVersion:', e); }`,

    `try {`,
    `  const changelogMaxVersionsEl = document.getElementById('changelogMaxVersions');`,
    `  if (changelogMaxVersionsEl) changelogMaxVersionsEl.value = currentSettings.pro?.changelog?.maxVersions ?? 10;`,
    `} catch (e) { console.warn('Failed to set changelogMaxVersions:', e); }`,

    `try {`,
    `  const changelogVersionOrderEl = document.getElementById('changelogVersionOrder');`,
    `  if (changelogVersionOrderEl) changelogVersionOrderEl.value = currentSettings.pro?.changelog?.versionOrder ?? 'newest-first';`,
    `} catch (e) { console.warn('Failed to set changelogVersionOrder:', e); }`
  ];

  Object.entries(PROVIDER_DEFAULTS).forEach(([provider, _defaults]) => {
    if (API_KEY_PROVIDERS.includes(provider)) {
      formInits.push(
        `try {`,
        `  const ${provider}ApiKeyEl = document.getElementById('${provider}ApiKey');`,
        `  if (${provider}ApiKeyEl) ${provider}ApiKeyEl.value = currentSettings.${provider}?.apiKey || '';`,
        `} catch (e) { console.warn('Failed to set ${provider}ApiKey:', e); }`
      );
    }
    formInits.push(
      `try {`,
      `  const ${provider}ModelEl = document.getElementById('${provider}Model');`,
      `  if (${provider}ModelEl) ${provider}ModelEl.value = currentSettings.${provider}?.model || '${_defaults.model}';`,
      `} catch (e) { console.warn('Failed to set ${provider}Model:', e); }`
    );

    if (provider === 'ollama') {
      formInits.push(
        `try {`,
        `  const ${provider}UrlEl = document.getElementById('${provider}Url');`,
        `  if (${provider}UrlEl) ${provider}UrlEl.value = currentSettings.${provider}?.url || '';`,
        `} catch (e) { console.warn('Failed to set ${provider}Url:', e); }`
      );
    }

    if (provider === 'custom') {
      formInits.push(
        `try {`,
        `  const customBaseUrlEl = document.getElementById('customBaseUrl');`,
        `  if (customBaseUrlEl) customBaseUrlEl.value = currentSettings.custom?.baseUrl || '';`,
        `} catch (e) { console.warn('Failed to set customBaseUrl:', e); }`,
        `try {`,
        `  const customEnabledEl = document.getElementById('customEnabled');`,
        `  if (customEnabledEl) customEnabledEl.checked = currentSettings.custom?.enabled ?? false;`,
        `} catch (e) { console.warn('Failed to set customEnabled:', e); }`,
        `try {`,
        `  const customEndpointEl = document.getElementById('customEndpoint');`,
        `  if (customEndpointEl) customEndpointEl.value = currentSettings.custom?.endpoint || '';`,
        `} catch (e) { console.warn('Failed to set customEndpoint:', e); }`,
        `try {`,
        `  const customAuthTypeEl = document.getElementById('customAuthType');`,
        `  if (customAuthTypeEl) customAuthTypeEl.value = currentSettings.custom?.authType || 'bearer';`,
        `} catch (e) { console.warn('Failed to set customAuthType:', e); }`,
        `try {`,
        `  const customAuthTokenEl = document.getElementById('customAuthToken');`,
        `  if (customAuthTokenEl) customAuthTokenEl.value = currentSettings.custom?.authToken || '';`,
        `} catch (e) { console.warn('Failed to set customAuthToken:', e); }`,
        `try {`,
        `  const customHeaderKeyEl = document.getElementById('customHeaderKey');`,
        `  if (customHeaderKeyEl) customHeaderKeyEl.value = currentSettings.custom?.headerKey || '';`,
        `} catch (e) { console.warn('Failed to set customHeaderKey:', e); }`,
        `try {`,
        `  const customRequestFormatEl = document.getElementById('customRequestFormat');`,
        `  if (customRequestFormatEl) customRequestFormatEl.value = currentSettings.custom?.requestFormat || 'openai';`,
        `} catch (e) { console.warn('Failed to set customRequestFormat:', e); }`,
        `try {`,
        `  const customResponseFormatEl = document.getElementById('customResponseFormat');`,
        `  if (customResponseFormatEl) customResponseFormatEl.value = currentSettings.custom?.responseFormat || 'openai';`,
        `} catch (e) { console.warn('Failed to set customResponseFormat:', e); }`
      );
    }
  });

  return formInits.join('\n    ');
}

export function generateSettingsCollection(): string {
  const settingsObj: string[] = [
    `apiProvider: (document.getElementById('apiProvider')?.value || currentSettings.apiProvider || 'huggingface'),`,
    `debug: currentSettings.debug,`
  ];

  Object.keys(PROVIDER_DEFAULTS).forEach(provider => {
    const fields: string[] = [];

    if (provider === 'custom') {
      // Handle custom API with its special fields
      fields.push(`baseUrl: (document.getElementById('customBaseUrl')?.value || '')`);
      fields.push(`endpoint: (document.getElementById('customEndpoint')?.value || '')`);
      fields.push(`authType: (document.getElementById('customAuthType')?.value || 'bearer')`);
      fields.push(`authToken: (document.getElementById('customAuthToken')?.value || '')`);
      fields.push(`headerKey: (document.getElementById('customHeaderKey')?.value || '')`);
      fields.push(`requestFormat: (document.getElementById('customRequestFormat')?.value || 'openai')`);
      fields.push(`responseFormat: (document.getElementById('customResponseFormat')?.value || 'openai')`);
      fields.push(`model: (document.getElementById('customModel')?.value || '')`);
      fields.push(`enabled: (document.getElementById('customEnabled')?.checked ?? false)`);
    } else {
      if (API_KEY_PROVIDERS.includes(provider)) {
        fields.push(`apiKey: (document.getElementById('${provider}ApiKey')?.value || '')`);
      }
      // Use provider defaults as fallback for model to ensure copilot and other providers always have a valid model
      const defaultModel = PROVIDER_DEFAULTS[provider]?.model || '';
      fields.push(`model: (document.getElementById('${provider}Model')?.value || currentSettings.${provider}?.model || '${defaultModel}')`);

      if (provider === 'ollama') {
        fields.push(`url: (document.getElementById('${provider}Url')?.value || '')`);
      }
    }

    settingsObj.push(`${provider}: { ${fields.join(', ')} },`);
  });

  settingsObj.push(
    `promptCustomization: {
      enabled: (window.currentFormValues || currentFormValues).promptCustomizationEnabled,
      saveLastPrompt: (window.currentFormValues || currentFormValues).saveLastPrompt,
      lastPrompt: currentSettings.promptCustomization?.lastPrompt || '',
    },`,
    `commit: {
      verbose: (window.currentFormValues || currentFormValues).commitVerbose,
      captureAllChanges: (window.currentFormValues || currentFormValues).commitCaptureAllChanges,
      targetLanguage: (window.currentFormValues || currentFormValues).commitTargetLanguage,
    },`,
    `commitStyle: { style: (window.currentFormValues || currentFormValues).commitStyle },`,
    `showDiagnostics: (window.currentFormValues || currentFormValues).showDiagnostics,`,
    `telemetry: { enabled: (window.currentFormValues || currentFormValues).telemetryEnabled },`,
    `pro: { 
      encryptionEnabled: (window.currentFormValues || currentFormValues).encryptionEnabled,
      licenseKey: currentSettings.pro?.licenseKey || '',
      orderId: currentSettings.pro?.orderId || '',
      validationStatus: currentSettings.pro?.validationStatus || 'invalid',
      lastValidation: currentSettings.pro?.lastValidation || '',
      commitBodyOptions: {
        enabled: (window.currentFormValues || currentFormValues).commitBodyOptionsEnabled,
        maxLines: (window.currentFormValues || currentFormValues).commitBodyOptionsMaxLines
      },
      commitLengthOptions: {
        enabled: (window.currentFormValues || currentFormValues).commitLengthOptionsEnabled,
        maxLength: (window.currentFormValues || currentFormValues).commitLengthOptionsMaxLength
      },
      learnFromCommitHistory: {
        enabled: true,
        maxCommits: (window.currentFormValues || currentFormValues).learnFromCommitHistoryMaxCommits,
        includeAuthorInfo: (window.currentFormValues || currentFormValues).learnFromCommitHistoryIncludeAuthorInfo
      },
      changelog: {
        enabled: true,
        maxCommitsEnabled: (window.currentFormValues || currentFormValues).changelogMaxCommitsEnabled,
        maxCommits: (window.currentFormValues || currentFormValues).changelogMaxCommits,
        maxVersions: (window.currentFormValues || currentFormValues).changelogMaxVersions,
        groupByVersion: (window.currentFormValues || currentFormValues).changelogGroupByVersion,
        versionOrder: (window.currentFormValues || currentFormValues).changelogVersionOrder
      }
    },`,
    `subscription: {
      email: (document.getElementById('subscriptionEmail')?.value || ''),
      plan: currentSettings.subscription?.plan || 'free',
      status: currentSettings.subscription?.status || 'inactive',
      lastChecked: currentSettings.subscription?.lastChecked || ''
    }`
  );

  return `{ ${settingsObj.join('\n        ')} }`;
}

export function generateProviderForm(_provider: string, _settings: any, _defaults: any): string {
  const formInits: string[] = [
    `// Preserve current UI provider selection - don't reset to saved setting`,
    `const currentUIProvider = document.getElementById('apiProvider').value;`,
    `document.getElementById('apiProvider').value = currentUIProvider || currentSettings.apiProvider || 'huggingface';`,
    `document.getElementById('commitVerbose').checked = currentSettings.commit?.verbose ?? true;`,
    `document.getElementById('commitCaptureAllChanges').checked = currentSettings.commit?.captureAllChanges ?? false;`,
    `document.getElementById('commitTargetLanguage').value = currentSettings.commit?.targetLanguage ?? 'english';`,
    `if (document.getElementById('commitTargetLanguageValue')) document.getElementById('commitTargetLanguageValue').value = currentSettings.commit?.targetLanguage ?? 'english';`,
    `if (window.reinitializeLanguageDropdown) window.reinitializeLanguageDropdown();`,
    `document.getElementById('showDiagnostics').checked = currentSettings.showDiagnostics ?? false;`,
    `document.getElementById('telemetryEnabled').checked = currentSettings.telemetry?.enabled ?? false;`,
    `console.log('generateProviderForm: Set telemetry checkbox to:', currentSettings.telemetry?.enabled ?? false, 'from settings:', currentSettings.telemetry);`,
    `document.getElementById('promptCustomizationEnabled').checked = currentSettings.promptCustomization?.enabled ?? false;`,
    `document.getElementById('saveLastPrompt').checked = currentSettings.promptCustomization?.saveLastPrompt || false;`,
    `// Pro features: use the setting as determined by the backend`,
    `document.getElementById('encryptionEnabled').checked = currentSettings.pro?.encryptionEnabled ?? false;`,
    `// Update Pro feature UI state`,
    `updateProFeatureUI(currentSettings);`,
    `// Subscription fields`,
    `document.getElementById('subscriptionEmail').value = currentSettings.subscription?.email || '';`,
    `document.getElementById('commitBodyOptionsEnabled').checked = currentSettings.pro?.commitBodyOptions?.enabled ?? false;`,
    `document.getElementById('commitBodyOptionsMaxLines').value = currentSettings.pro?.commitBodyOptions?.maxLines ?? 5;`,
    `document.getElementById('commitLengthOptionsEnabled').checked = currentSettings.pro?.commitLengthOptions?.enabled ?? false;`,
    `document.getElementById('commitLengthOptionsMaxLength').value = currentSettings.pro?.commitLengthOptions?.maxLength ?? 72;`,
    `document.getElementById('learnFromCommitHistoryMaxCommits').value = currentSettings.pro?.learnFromCommitHistory?.maxCommits ?? 50;`,
    `document.getElementById('learnFromCommitHistoryIncludeAuthorInfo').checked = currentSettings.pro?.learnFromCommitHistory?.includeAuthorInfo ?? true;`,
    `document.getElementById('changelogMaxCommitsEnabled').checked = currentSettings.pro?.changelog?.maxCommitsEnabled ?? false;`,
    `document.getElementById('changelogMaxCommits').value = currentSettings.pro?.changelog?.maxCommits ?? 100;`,
    `document.getElementById('changelogMaxVersions').value = currentSettings.pro?.changelog?.maxVersions ?? 10;`,
    `document.getElementById('changelogGroupByVersion').checked = currentSettings.pro?.changelog?.groupByVersion ?? true;`,
    `document.getElementById('changelogVersionOrder').value = currentSettings.pro?.changelog?.versionOrder ?? 'newest-first';`
  ];

  // Update API keys but NOT model dropdowns to preserve dropdown state
  Object.entries(PROVIDER_DEFAULTS).forEach(([provider, _defaults]) => {
    formInits.push(`if (currentSettings.${provider}) {`);

    if (provider === 'custom') {
      formInits.push(`  document.getElementById('customBaseUrl').value = currentSettings.custom.baseUrl || '';`);
      formInits.push(`  document.getElementById('customEndpoint').value = currentSettings.custom.endpoint || '';`);
      formInits.push(`  document.getElementById('customAuthType').value = currentSettings.custom.authType || 'bearer';`);
      formInits.push(`  document.getElementById('customAuthToken').value = currentSettings.custom.authToken || '';`);
      formInits.push(`  document.getElementById('customHeaderKey').value = currentSettings.custom.headerKey || '';`);
      formInits.push(`  document.getElementById('customRequestFormat').value = currentSettings.custom.requestFormat || 'openai';`);
      formInits.push(`  document.getElementById('customResponseFormat').value = currentSettings.custom.responseFormat || 'openai';`);
      // Skip model dropdown for custom to preserve dropdown state
    } else {
      if (API_KEY_PROVIDERS.includes(provider)) {
        formInits.push(`  document.getElementById('${provider}ApiKey').value = currentSettings.${provider}.apiKey || '';`);
      }

      // Skip model dropdown updates to preserve open dropdowns
      // formInits.push(`  document.getElementById('${provider}Model').value = currentSettings.${provider}?.model || '${defaults.model}';`);

      if (provider === 'ollama') {
        formInits.push(`  document.getElementById('${provider}Url').value = currentSettings.${provider}.url || '';`);
      }
    }

    formInits.push(`}`);
  });

  // Add a call to update visible settings to ensure the correct provider panel is shown
  formInits.push(`// Update visible provider settings based on current selection`);
  formInits.push(`updateVisibleSettings();`);

  return formInits.join('\n          ');
}

export function generateUpdateSettingsCode(): string {
  const updates: string[] = [
    `// Preserve current UI provider selection - don't reset to saved setting`,
    `const currentUIProvider = document.getElementById('apiProvider').value;`,
    `document.getElementById('apiProvider').value = currentUIProvider || currentSettings.apiProvider || 'huggingface';`,
    `document.getElementById('commitVerbose').checked = currentSettings.commit?.verbose ?? true;`,
    `document.getElementById('commitCaptureAllChanges').checked = currentSettings.commit?.captureAllChanges ?? false;`,
    `document.getElementById('commitTargetLanguage').value = currentSettings.commit?.targetLanguage ?? 'english';`,
    `if (document.getElementById('commitTargetLanguageValue')) document.getElementById('commitTargetLanguageValue').value = currentSettings.commit?.targetLanguage ?? 'english';`,
    `if (window.reinitializeLanguageDropdown) window.reinitializeLanguageDropdown();`,
    `document.getElementById('showDiagnostics').checked = currentSettings.showDiagnostics ?? false;`,
    `document.getElementById('telemetryEnabled').checked = currentSettings.telemetry?.enabled ?? false;`,
    `console.log('generateUpdateSettingsCode: Set telemetry checkbox to:', currentSettings.telemetry?.enabled ?? false, 'from settings:', currentSettings.telemetry);`,
    `document.getElementById('promptCustomizationEnabled').checked = currentSettings.promptCustomization?.enabled ?? false;`,
    `document.getElementById('saveLastPrompt').checked = currentSettings.promptCustomization?.saveLastPrompt || false;`,
    `// Pro features: use the setting as determined by the backend`,
    `document.getElementById('encryptionEnabled').checked = currentSettings.pro?.encryptionEnabled ?? false;`,
    `// Update Pro feature UI state`,
    `updateProFeatureUI(currentSettings);`,
    `// Subscription fields`,
    `document.getElementById('subscriptionEmail').value = currentSettings.subscription?.email || '';`,
    `document.getElementById('commitBodyOptionsEnabled').checked = currentSettings.pro?.commitBodyOptions?.enabled ?? false;`,
    `document.getElementById('commitBodyOptionsMaxLines').value = currentSettings.pro?.commitBodyOptions?.maxLines ?? 5;`,
    `document.getElementById('commitLengthOptionsEnabled').checked = currentSettings.pro?.commitLengthOptions?.enabled ?? false;`,
    `document.getElementById('commitLengthOptionsMaxLength').value = currentSettings.pro?.commitLengthOptions?.maxLength ?? 72;`,
    `document.getElementById('learnFromCommitHistoryMaxCommits').value = currentSettings.pro?.learnFromCommitHistory?.maxCommits ?? 50;`,
    `document.getElementById('learnFromCommitHistoryIncludeAuthorInfo').checked = currentSettings.pro?.learnFromCommitHistory?.includeAuthorInfo ?? true;`,
    `document.getElementById('changelogMaxCommitsEnabled').checked = currentSettings.pro?.changelog?.maxCommitsEnabled ?? false;`,
    `document.getElementById('changelogMaxCommits').value = currentSettings.pro?.changelog?.maxCommits ?? 100;`,
    `document.getElementById('changelogMaxVersions').value = currentSettings.pro?.changelog?.maxVersions ?? 10;`,
    `document.getElementById('changelogGroupByVersion').checked = currentSettings.pro?.changelog?.groupByVersion ?? true;`,
    `document.getElementById('changelogVersionOrder').value = currentSettings.pro?.changelog?.versionOrder ?? 'newest-first';`
  ];

  Object.entries(PROVIDER_DEFAULTS).forEach(([provider, _defaults]) => {
    updates.push(`if (currentSettings.${provider}) {`);

    if (provider === 'custom') {
      updates.push(`  document.getElementById('customEnabled').checked = currentSettings.custom.enabled ?? false;`);
      updates.push(`  document.getElementById('customBaseUrl').value = currentSettings.custom.baseUrl || '';`);
      updates.push(`  document.getElementById('customEndpoint').value = currentSettings.custom.endpoint || '';`);
      updates.push(`  document.getElementById('customAuthType').value = currentSettings.custom.authType || 'bearer';`);
      updates.push(`  document.getElementById('customAuthToken').value = currentSettings.custom.authToken || '';`);
      updates.push(`  document.getElementById('customHeaderKey').value = currentSettings.custom.headerKey || '';`);
      updates.push(`  document.getElementById('customRequestFormat').value = currentSettings.custom.requestFormat || 'openai';`);
      updates.push(`  document.getElementById('customResponseFormat').value = currentSettings.custom.responseFormat || 'openai';`);
      updates.push(`  document.getElementById('customModel').value = currentSettings.custom.model || '';`);
    } else {
      if (API_KEY_PROVIDERS.includes(provider)) {
        updates.push(`  document.getElementById('${provider}ApiKey').value = currentSettings.${provider}.apiKey || '';`);
      }
      updates.push(`  document.getElementById('${provider}Model').value = currentSettings.${provider}?.model || '${_defaults.model}';`);

      if (provider === 'ollama') {
        updates.push(`  document.getElementById('${provider}Url').value = currentSettings.${provider}.url || '';`);
      }
    }

    updates.push(`}`);
  });

  // Add a call to update visible settings to ensure the correct provider panel is shown
  updates.push(`// Update visible provider settings based on current selection`);
  updates.push(`updateVisibleSettings();`);

  return updates.join('\n          ');
}

export function generateUpdateSettingsCodePreserveDropdowns(): string {
  const updates: string[] = [
    `// Preserve current UI provider selection - don't reset to saved setting`,
    `const currentUIProvider = document.getElementById('apiProvider').value;`,
    `document.getElementById('apiProvider').value = currentUIProvider || currentSettings.apiProvider || 'huggingface';`,
    `document.getElementById('commitVerbose').checked = currentSettings.commit?.verbose ?? true;`,
    `document.getElementById('showDiagnostics').checked = currentSettings.showDiagnostics ?? false;`,
    `document.getElementById('telemetryEnabled').checked = currentSettings.telemetry?.enabled ?? false;`,
    `console.log('generateUpdateSettingsCodePreserveDropdowns: Set telemetry checkbox to:', currentSettings.telemetry?.enabled ?? false, 'from settings:', currentSettings.telemetry);`,
    `document.getElementById('promptCustomizationEnabled').checked = currentSettings.promptCustomization?.enabled ?? false;`,
    `document.getElementById('saveLastPrompt').checked = currentSettings.promptCustomization?.saveLastPrompt || false;`,
    `// Pro features: use the setting as determined by the backend`,
    `document.getElementById('encryptionEnabled').checked = currentSettings.pro?.encryptionEnabled ?? false;`,
    `// Update Pro feature UI state`,
    `updateProFeatureUI(currentSettings);`,
    `// Subscription fields`,
    `document.getElementById('subscriptionEmail').value = currentSettings.subscription?.email || '';`,
    `document.getElementById('commitBodyOptionsEnabled').checked = currentSettings.pro?.commitBodyOptions?.enabled ?? false;`,
    `document.getElementById('commitBodyOptionsMaxLines').value = currentSettings.pro?.commitBodyOptions?.maxLines ?? 5;`,
    `document.getElementById('commitLengthOptionsEnabled').checked = currentSettings.pro?.commitLengthOptions?.enabled ?? false;`,
    `document.getElementById('commitLengthOptionsMaxLength').value = currentSettings.pro?.commitLengthOptions?.maxLength ?? 72;`,
    `document.getElementById('learnFromCommitHistoryMaxCommits').value = currentSettings.pro?.learnFromCommitHistory?.maxCommits ?? 50;`,
    `document.getElementById('learnFromCommitHistoryIncludeAuthorInfo').checked = currentSettings.pro?.learnFromCommitHistory?.includeAuthorInfo ?? true;`,
    `document.getElementById('changelogMaxCommitsEnabled').checked = currentSettings.pro?.changelog?.maxCommitsEnabled ?? false;`,
    `document.getElementById('changelogMaxCommits').value = currentSettings.pro?.changelog?.maxCommits ?? 100;`,
    `document.getElementById('changelogMaxVersions').value = currentSettings.pro?.changelog?.maxVersions ?? 10;`,
    `document.getElementById('changelogGroupByVersion').checked = currentSettings.pro?.changelog?.groupByVersion ?? true;`,
    `document.getElementById('changelogVersionOrder').value = currentSettings.pro?.changelog?.versionOrder ?? 'newest-first';`
  ];

  // Update API keys but NOT model dropdowns to preserve dropdown state
  Object.entries(PROVIDER_DEFAULTS).forEach(([provider, _defaults]) => {
    updates.push(`if (currentSettings.${provider}) {`);

    if (provider === 'custom') {
      updates.push(`  document.getElementById('customBaseUrl').value = currentSettings.custom.baseUrl || '';`);
      updates.push(`  document.getElementById('customEndpoint').value = currentSettings.custom.endpoint || '';`);
      updates.push(`  document.getElementById('customAuthType').value = currentSettings.custom.authType || 'bearer';`);
      updates.push(`  document.getElementById('customAuthToken').value = currentSettings.custom.authToken || '';`);
      updates.push(`  document.getElementById('customHeaderKey').value = currentSettings.custom.headerKey || '';`);
      updates.push(`  document.getElementById('customRequestFormat').value = currentSettings.custom.requestFormat || 'openai';`);
      updates.push(`  document.getElementById('customResponseFormat').value = currentSettings.custom.responseFormat || 'openai';`);
      // Skip model dropdown for custom to preserve dropdown state
    } else {
      if (API_KEY_PROVIDERS.includes(provider)) {
        updates.push(`  document.getElementById('${provider}ApiKey').value = currentSettings.${provider}.apiKey || '';`);
      }

      // Skip model dropdown updates to preserve open dropdowns
      // updates.push(`  document.getElementById('${provider}Model').value = currentSettings.${provider}?.model || '${defaults.model}';`);

      if (provider === 'ollama') {
        updates.push(`  document.getElementById('${provider}Url').value = currentSettings.${provider}.url || '';`);
      }
    }

    updates.push(`}`);
  });

  // Add a call to update visible settings to ensure the correct provider panel is shown
  updates.push(`// Update visible provider settings based on current selection`);
  updates.push(`updateVisibleSettings();`);

  return updates.join('\n          ');
}
