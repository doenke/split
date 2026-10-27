/** Set at build time (see vite.config.ts). */
export const version = __APP_VERSION__;
export const commit = __APP_COMMIT__;
export const buildDate = __BUILD_DATE__;

/** e.g. "0.5.0 (a1b2c3d)" */
export const versionLabel = commit ? `${version} (${commit.slice(0, 7)})` : version;
