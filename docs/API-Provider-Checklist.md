
## Provider Integration Checklist (Full “Add a New Provider” Checkpoints)

Use this as a **complete** checklist for adding a new provider so it behaves consistently across:
- **Settings UI**
- **Config persistence**
- **Encrypted/secure API key storage**
- **Model listing + model dropdown**
- **Runtime API calls + error handling**
- **Validation/connection tests + UX messages**

I’ll assume the provider id is `newprovider` (lowercase key used everywhere).

---

# 1) Canonical identifiers
- **[Provider id]** Choose a stable id: `newprovider`  
  Must match:
  - settings keys: `gitmind.newprovider.*`
  - runtime provider name: `provider: "newprovider"`
  - UI element ids: `newproviderApiKey`, `newproviderModel`, etc.
- **[Display name]** Decide `displayName` / docs URL used in UI.

---

# 2) VS Code configuration schema (package.json)
File: [package.json](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/package.json:0:0-0:0) (`contributes.configuration.properties`)
- **[Add provider option]**
  - Add `newprovider` to `gitmind.apiProvider.enum`
  - Add description in `enumDescriptions`
- **[Add provider settings keys]**
  - If API key required: `gitmind.newprovider.apiKey`
  - Always (usually): `gitmind.newprovider.model`
  - If base URL needed: `gitmind.newprovider.url` (or similar)
- **[Defaults & enums]**
  - Set reasonable `default` model, and optionally `enum` list.

---

# 2.5) Runtime config builder (getApiConfig/getConfiguration)
File: [src/config/settings.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/config/settings.ts:0:0-0:0)
- **[Provider defaults]** Add `newprovider` to the local `PROVIDER_DEFAULTS` map.
- **[ProviderConfig presence]** Verify `getConfiguration()` builds `(result as any)[newprovider]`.
- **[ApiConfig mapping]** Verify `getApiConfig()` and `getApiConfigSync()` can resolve:
  - `providerConfig = (config as any)[provider]`
  - `baseConfig.type` and `baseConfig.model`
  - `baseConfig.apiKey` for API-key providers

**Common pitfall:** forgetting `src/config/settings.ts` causes `Unsupported provider: <provider>` at generation time even if Settings UI and `src/services/api/index.ts` were updated.

---

# 3) Extension-side persistence + secure key handling (authoritative)
File: [src/webview/settings/SettingsManager.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/SettingsManager.ts:0:0-0:0)
- **[Provider defaults]** Add `newprovider` to `PROVIDER_DEFAULTS`
  - Include a valid default `model`
- **[API key classification]**
  - If API key required: add to `API_KEY_PROVIDERS`
  - If no API key required: add to `NO_API_KEY_PROVIDERS`
- **[Settings build/save]** Confirm the provider participates in:
  - [buildSettingsFromConfig()](cci:1://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/SettingsManager.ts:66:4-186:5) loop
  - [updateConfigurationSettings()](cci:1://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/SettingsManager.ts:395:4-488:5) loop
  - [handleApiKeyStorage()](cci:1://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/SettingsManager.ts:273:4-393:5) (only relevant for API-key providers)

**Common pitfall:** provider exists in UI config but missing here → settings won’t persist and/or secure key won’t store.

---

# 4) Runtime provider registry (used by API / validation / docs links)
File: [src/services/api/index.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/services/api/index.ts:0:0-0:0)
- **[Provider metadata]** Add entry under the provider map:
  - `name`, `displayName`
  - `settingPath` (e.g. `"newprovider.apiKey"`)
  - `docsUrl`
  - `requiresApiKey`
  - `defaultModel`
  - `getProviderClass: async () => loadProviderModule('newprovider')`

---

# 5) Provider implementation (runtime API calls)
File: typically `src/services/api/newprovider.ts`
- **[Provider class]** Implement `class NewProvider extends BaseAIProvider`
  - Implement `generateResponse(prompt, options)`
  - Add `getModels()` (if supported)
  - Add `validateApiKey()` or equivalent minimal call
- **[Error handling parity]**
  - Parse provider error payload when possible
  - Map HTTP codes (401/403/429/5xx) to **user-friendly** messages
  - Preserve Abort/cancel behavior (`AbortError` → “Request was cancelled”)
- **[Request logging parity]**
  - Use `loggedFetch(...)` consistently
  - Include `{ provider: "newprovider", operation: "..." }`

---

# 6) Add “fetch models” hook used by the extension command
- **[Export helper]** `export async function fetchNewProviderModels(apiKey: string): Promise<string[]>`
  - or if no API key required: accept empty string or no args (match existing patterns)
- **[Wire in extension]** File: [src/extension.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/extension.ts:0:0-0:0)
  - Import: `fetchNewProviderModels`
  - Register command: `gitmind.loadNewProviderModels`
  - Ensure model loading dispatch returns command suffix like `newproviderModelsLoaded`

---

# 7) Settings UI: Provider form definition
File: [src/webview/settings/components/config/ProviderConfig.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/components/config/ProviderConfig.ts:0:0-0:0)
- **[Add provider section]** Add a config block with `id: 'newprovider'`
- **[Fields]**
  - API-key provider:
    - `newproviderApiKey` (type `password`)
    - `newproviderModel` (type `select` or `model-with-load`)
  - No-API-key provider:
    - omit api key field
    - keep model field if relevant
  - Add `loadCommand: 'gitmind.loadNewProviderModels'` if model listing supported

---

# 8) Settings UI scripts: the provider registries (these drive initialization + collection)
These files must be consistent or the UI will “work” but not save reliably.

- **[Form init + collect]** [src/webview/settings/scripts/constants.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/constants.ts:0:0-0:0)
  - Add to `PROVIDER_DEFAULTS`
  - Add to `API_KEY_PROVIDERS` or `NO_API_KEY_PROVIDERS`
  - Add model list to `DEFAULT_MODELS` if needed

- **[Additional UI constants]** [src/webview/settings/scripts/settingsConstants.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/settingsConstants.ts:0:0-0:0)
  - Same updates as above (this repo has both registries)

**Common pitfall:** Updating only one of these constants files.

---

# 9) Settings UI: API setup checks + required fields validation
File: [src/webview/settings/scripts/apiManager.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/apiManager.ts:0:0-0:0)
- **[Provider configs]** Add to `PROVIDER_CONFIGS`:
  - `apiKey: true/false`
  - `model: true/false`
  - `url: true/false` if needed
  - `displayName`
This drives:
- “Missing required fields …”
- connection / rate limit checks

---

# 10) Settings UI: message routing for model loading + display names
File: [src/webview/settings/scripts/messageHandlers.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/messageHandlers.ts:0:0-0:0)
- **[Models loaded handler]**
  - Add `newproviderModelsLoaded` → `handleModelsLoaded('newprovider', message, DEFAULT_MODELS.newprovider)`
- **[Provider display name]**
  - Add `newprovider: 'Your Provider Name'` to `getProviderDisplayName()` mapping

---

# 11) Settings UI: status banner / configured indicator
File: [src/webview/settings/scripts/uiManager.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/uiManager.ts:0:0-0:0)
- **[Provider display config]** Add to `PROVIDER_DISPLAY_CONFIG`
  - `displayName`
  - default `model`
  - [apiConfigured](cci:1://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/uiManager.ts:13:4-13:44) function:
    - API-key provider: `!!s.newprovider?.apiKey`
    - no-key provider: `() => true` or based on url/endpoint config
- **[Status banner provider configs]** Add to the local `PROVIDER_CONFIGS` inside `StatusBanner` (this repo has two maps)

---

# 11.5) Provider logo/icon integration (Settings UI banners)
Icons are rendered from a centralized path map and used by *two* banner implementations.

File: [src/webview/settings/components/ProviderIcon.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/components/ProviderIcon.ts:0:0-0:0)
- **[Add icon path]** Add `newprovider: "<svg path d>"` to `ProviderIcon.icons`.
- **[Key must match]** The key must match `settings.apiProvider` exactly (e.g. `zai`, not `Z.ai` or `z.ai`).

File (legacy banner): [src/webview/settings/scripts/uiManager.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/uiManager.ts:0:0-0:0)
- **[Legacy icon injection]** `window.ProviderIcon.icons` is built from `ProviderIcon['icons']`.
- **[Legacy render call]** The icon is rendered via `window.ProviderIcon.renderIcon(provider, size)`.

File (compact banner): [src/webview/settings/components/StatusBanner.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/components/StatusBanner.ts:0:0-0:0)
- **[Compact banner config]** Add `newprovider` to `StatusBanner.PROVIDER_CONFIGS`.
- **[Compact render call]** The icon is rendered via `ProviderIcon.renderIcon(provider, size)`.

**Common pitfalls:**
- **Provider key mismatch** between `apiProvider` value and `ProviderIcon.icons` key causes the gray placeholder.
- **Only updating one banner path** (legacy vs compact) leads to inconsistent UI.
- **Webview caching**: after icon changes, reload the window (`Developer: Reload Window`) to force the webview to rehydrate updated scripts.

---

# 12) Encryption & placeholders (API key providers)
If API key is required, verify:
- **[SecureKeyManager integration]** Works automatically if provider is in `SettingsManager.API_KEY_PROVIDERS`
- **[Plaintext clearing]** When encryption enabled, `config.update('newprovider.apiKey', "", Global)` or `undefined` pattern is consistent
- **[UI behavior]** API key shows placeholder (if used) the same way other providers do (depends on SecureKeyManager behavior)

---

# 13) Validation / connection test behavior (UX parity)
- **[checkApiSetup]** (UI) should block tests with missing key/model if required
- **[Extension validate]** (runtime) should produce consistent error messages:
  - Authentication failures
  - Rate limits / quotas
  - Network / service down
  - Invalid model selection

---

# 14) Final verification steps
- **[Settings persistence]**
  - Change API key/model → Save → reopen settings → values persist
- **[Model load]**
  - Click “Load Available Models” → dropdown updated → no auto-save loops
- **[Generation]**
  - Generate commit → verify provider actually used
- **[Tooling]**
  - Run `npm run check-types`
  - Run `npm run lint`
  - Run tests if applicable: `npm test`

---

## Quick decision table (API key required vs not required)

### API key required
- Must update:
  - [package.json](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/package.json:0:0-0:0) (`gitmind.<provider>.apiKey`, `.model`, `apiProvider enum`)
  - [SettingsManager](cci:2://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/SettingsManager.ts:17:0-634:1) (`API_KEY_PROVIDERS`, `PROVIDER_DEFAULTS`)
  - UI scripts constants (`API_KEY_PROVIDERS`, `PROVIDER_DEFAULTS`)
  - [apiManager.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/apiManager.ts:0:0-0:0) (required fields)
  - secure key flow should be automatically applied

### No API key required
- Must update:
  - [package.json](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/package.json:0:0-0:0) (no `.apiKey` key; maybe `.model` and/or `.url`)
  - [SettingsManager](cci:2://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/SettingsManager.ts:17:0-634:1) (`NO_API_KEY_PROVIDERS`, `PROVIDER_DEFAULTS`)
  - UI scripts constants (`NO_API_KEY_PROVIDERS`, defaults)
  - [apiManager.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/apiManager.ts:0:0-0:0) should not require apiKey
  - [uiManager.ts](cci:7://file:///Users/shahabbahreinijangjoo/Documents/Programming%20Projects/GitMind-Pro/src/webview/settings/scripts/uiManager.ts:0:0-0:0) should mark configured appropriately (often always configured)

---

## Status
Checklist provided for future reference; it covers both API-key and no-key providers, including full AI model integration and all repo-specific registries.