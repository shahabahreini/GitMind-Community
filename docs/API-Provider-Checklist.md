# Provider Integration Checklist

Use this checklist when adding or changing an AI provider. A provider is complete only when generation, validation, persistence, model discovery, settings UI, secure storage, error handling, recovery behavior, and documentation agree.

Use a stable lowercase provider ID such as `newprovider` everywhere.

## 1. Provider Contract

- Add the provider ID to `ApiProvider` in `src/config/types.ts`.
- Add typed provider settings and a conservative default model.
- Decide whether the provider requires an API key, local URL, subscription, or custom credentials.
- Document the provider API, model-list endpoint, authentication method, and response format.

## 2. VS Code Configuration

Update `package.json`:

- Add the provider to `gitmind.apiProvider`.
- Add clear enum description and provider-specific settings.
- Add API key, model, URL, or endpoint properties as needed.
- Keep defaults aligned with `src/config/settings.ts` and the Settings webview.

## 3. Runtime Configuration

Update `src/config/settings.ts` and related settings models:

- Add the provider default.
- Build both async and sync API configurations.
- Load credentials from the correct storage path.
- Ensure the effective model resolves correctly.
- Include provider settings in migration and reset behavior.

## 4. API Implementation

Create `src/services/api/newprovider.ts` and wire it into `src/services/api/index.ts`.

- Use `loggedFetch` for requests.
- Add generation, validation, and model-discovery functions where supported.
- Parse responses defensively.
- Preserve cancellation and timeout behavior.
- Never log credentials or source content.

Map provider failures to actionable messages:

- `401/403`: invalid key or permission issue.
- `404`: missing model or endpoint.
- `429`: account quota or rate limit.
- `5xx`: temporary provider service failure.
- Timeout/network failure: connectivity or provider availability issue.

Errors must retain enough structured information for Automatic Recovery to decide whether retry or fallback is allowed. Never retry invalid credentials, permissions, or account-wide limits.

## 5. Model Discovery

- Add a model-list command in `src/commands/index.ts`.
- Return sorted, deduplicated model IDs.
- Provide a known-compatible fallback list only when appropriate.
- Ensure the selected model remains visible after a refresh.
- Verify model loading, empty results, invalid keys, provider errors, and timeouts.

## 6. Settings Webview

Update the provider registries and UI paths used by:

- `src/webview/settings/SettingsManager.ts`
- `src/webview/settings/components/config/ProviderConfig.ts`
- `src/webview/settings/components/ProviderIcon.ts`
- `src/webview/settings/components/StatusBanner.ts`
- `src/webview/settings/scripts/constants.ts`
- `src/webview/settings/scripts/settingsConstants.ts`
- `src/webview/settings/scripts/apiManager.ts`
- `src/webview/settings/scripts/messageHandlers.ts`
- `src/webview/settings/scripts/uiManager.ts`

Verify:

- Provider selection, searchable model selection, save, reload, and API validation.
- Loading, success, empty, and error states.
- Theme-aware icon coloring in light and dark themes.
- Status banner name, icon, model, and configured state.
- Automatic Recovery fallback selection is scoped to this provider.

## 7. Credentials And Migration

- Add API-key providers to secure storage and encryption helpers.
- Support plaintext-to-SecretStorage migration for Pro users.
- Clear or preserve credentials intentionally during reset and provider switching.
- Add the provider to settings migration and onboarding detection.
- Confirm credential placeholders never overwrite a valid stored secret.

## 8. Pro Feature Behavior

- Free users must see locked Pro controls where discoverability is intended.
- Locked controls must open the standard Pro purchase/activation flow.
- Automatic Recovery must make at most two generation calls total:
  - One retry for an eligible transient failure.
  - Or one configured fallback-model attempt for a model-specific limit.
- Show a clear notification for the original failure, recovery action, and final result.

## 9. Documentation And SEO

- Add the provider to `README.md` and onboarding walkthroughs.
- Add provider setup links and authentication requirements.
- Update provider counts, marketplace description, keywords, and badges.
- Add a changelog entry.
- Avoid fixed model-version claims when dynamic discovery is available.

## 10. Verification

Run:

```bash
npm run check-types
npm run lint
npm run compile-tests
npm run test:validate
npm run test:status
```

Also test manually:

1. Fresh install and provider selection.
2. Invalid and valid credential checks.
3. Model discovery and searchable selection.
4. Settings save and reload.
5. Successful generation.
6. Timeout, authentication, rate-limit, and temporary service failures.
7. Free and Pro feature-lock behavior.
8. Light and dark theme icons.

## Current Provider Inventory

GitMind currently exposes 18 provider options: 17 built-in providers plus the Pro Custom API provider.
