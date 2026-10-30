import { b as private_env } from './shared-server.js-D1aJpbsf.js';

const config = {
  get publicUrl() {
    return (private_env.PUBLIC_URL ?? private_env.ORIGIN ?? "http://localhost:8347").replace(/\/$/, "");
  },
  get defaultCurrency() {
    return private_env.DEFAULT_CURRENCY ?? "EUR";
  },
  oidc: {
    get issuer() {
      return private_env.OIDC_ISSUER;
    },
    get clientId() {
      return private_env.OIDC_CLIENT_ID;
    },
    get clientSecret() {
      return private_env.OIDC_CLIENT_SECRET;
    },
    get scopes() {
      return private_env.OIDC_SCOPES ?? "openid profile email";
    },
    /** members of this IdP group are instance admins (default "admins") */
    get adminGroup() {
      return private_env.OIDC_ADMIN_GROUP || "admins";
    },
    get buttonLabel() {
      return private_env.OIDC_BUTTON_LABEL ?? "Mit OIDC anmelden";
    },
    get enabled() {
      return Boolean(private_env.OIDC_ISSUER && private_env.OIDC_CLIENT_ID);
    }
  },
  webauthn: {
    get rpName() {
      return private_env.WEBAUTHN_RP_NAME ?? "Split";
    },
    get rpId() {
      return new URL(config.publicUrl).hostname;
    },
    get origin() {
      return new URL(config.publicUrl).origin;
    }
  },
  get secureCookies() {
    return config.publicUrl.startsWith("https://");
  },
  /** Only for local development: allows logging in as a demo OIDC user without an IdP. */
  get devLogin() {
    return private_env.DEV_LOGIN === "true";
  }
};

export { config as c };
//# sourceMappingURL=config.js-oO6Fsv50.js.map
