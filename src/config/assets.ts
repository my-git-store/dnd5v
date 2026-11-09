const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const configuredAssetBase = (viteEnv.VITE_ASSET_BASE_URL ?? "").trim();

/** Resolve public assets for local Vite and a Pages sub-path without hardcoded localhost paths. */
export function assetUrl(path: string): string {
  if (/^https?:\/\//u.test(path)) return path;
  const base = (configuredAssetBase || viteEnv.BASE_URL || "/").replace(/\/+$/u, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}
