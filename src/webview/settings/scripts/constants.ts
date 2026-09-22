import { API_KEY_PROVIDER_IDS, getCuratedModels, getProviderDefaultModel, PROVIDER_CATALOG, PROVIDER_IDS } from '../../../config/providerCatalog';

export interface ProviderDefaults {
  [key: string]: {
    apiKey?: string;
    model: string;
    url?: string;
  };
}

/** Webview defaults, derived from the provider catalog. Local providers also carry an empty server URL. */
export const PROVIDER_DEFAULTS: ProviderDefaults = Object.fromEntries(PROVIDER_IDS.map(id => [
  id,
  PROVIDER_CATALOG[id].auth.kind === 'local'
    ? { model: getProviderDefaultModel(id), url: '' }
    : { model: getProviderDefaultModel(id) },
]));

/** Providers with a `<id>.apiKey` credential. */
export const API_KEY_PROVIDERS: string[] = [...API_KEY_PROVIDER_IDS];

/** Providers without a `<id>.apiKey` credential (keyless providers and the Custom API). */
export const NO_API_KEY_PROVIDERS: string[] = PROVIDER_IDS.filter(id => !(API_KEY_PROVIDER_IDS as readonly string[]).includes(id));

/** Bootstrap model lists shown before live discovery succeeds; live discovery is authoritative. */
export const DEFAULT_MODELS: Record<string, string[]> = Object.fromEntries(
  PROVIDER_IDS.map(id => [id, [...getCuratedModels(id)]])
);
