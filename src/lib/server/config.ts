import { env } from '$env/dynamic/private';

export const config = {
	get publicUrl() {
		return (env.PUBLIC_URL ?? env.ORIGIN ?? 'http://localhost:8347').replace(/\/$/, '');
	},
	get defaultCurrency() {
		return env.DEFAULT_CURRENCY ?? 'EUR';
	},
	oidc: {
		get issuer() {
			return env.OIDC_ISSUER;
		},
		get clientId() {
			return env.OIDC_CLIENT_ID;
		},
		get clientSecret() {
			return env.OIDC_CLIENT_SECRET;
		},
		get scopes() {
			return env.OIDC_SCOPES ?? 'openid profile email';
		},
		get adminGroup() {
			return env.OIDC_ADMIN_GROUP;
		},
		get buttonLabel() {
			return env.OIDC_BUTTON_LABEL ?? 'Mit OIDC anmelden';
		},
		get enabled() {
			return Boolean(env.OIDC_ISSUER && env.OIDC_CLIENT_ID);
		}
	},
	webauthn: {
		get rpName() {
			return env.WEBAUTHN_RP_NAME ?? 'Split';
		},
		get rpId() {
			return new URL(config.publicUrl).hostname;
		},
		get origin() {
			return new URL(config.publicUrl).origin;
		}
	},
	get secureCookies() {
		return config.publicUrl.startsWith('https://');
	},
	/** Only for local development: allows logging in as a demo OIDC user without an IdP. */
	get devLogin() {
		return env.DEV_LOGIN === 'true';
	}
};
