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
		/** members of this IdP group are instance admins (default "admins") */
		get adminGroup() {
			return env.OIDC_ADMIN_GROUP || 'admins';
		},
		get buttonLabel() {
			return env.OIDC_BUTTON_LABEL ?? 'Mit OIDC anmelden';
		},
		/** the provider's name for texts: OIDC_PROVIDER_NAME, else taken from the button ("Mit Pocket ID anmelden") */
		get providerName() {
			if (env.OIDC_PROVIDER_NAME) return env.OIDC_PROVIDER_NAME;
			const m = this.buttonLabel.match(/^(?:mit|über|via)\s+(.+?)(?:\s+(?:anmelden|einloggen|login))?$/i);
			return m && !/^(oidc|sso)$/i.test(m[1]) ? m[1] : 'Single Sign-on';
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
