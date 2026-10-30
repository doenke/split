const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["icon-192.png","icon-512.png","icon-maskable-512.png","icon.svg","manifest.webmanifest","service-worker.js"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"},
	_: {
		client: {start:"_app/immutable/entry/start.Do0rEV6M.js",app:"_app/immutable/entry/app.BqDr9v5Q.js",imports:["_app/immutable/entry/start.Do0rEV6M.js","_app/immutable/chunks/B89p35wF.js","_app/immutable/chunks/D_LDj6-r.js","_app/immutable/chunks/DsB6yB9i.js","_app/immutable/entry/app.BqDr9v5Q.js","_app/immutable/chunks/DsB6yB9i.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/D_LDj6-r.js","_app/immutable/chunks/Dt0C8Cjd.js","_app/immutable/chunks/JehXjfG_.js","_app/immutable/chunks/BOtEWax2.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js-DqFL2kDc.js')),
			__memo(() => import('./nodes/1.js-MhZg28BW.js')),
			__memo(() => import('./nodes/2.js-CXgbFVjk.js')),
			__memo(() => import('./nodes/3.js-Dv5ZvK8P.js')),
			__memo(() => import('./nodes/4.js-GNZ3yUcd.js')),
			__memo(() => import('./nodes/5.js-Bb55Cerq.js')),
			__memo(() => import('./nodes/6.js-DNfzYBhu.js')),
			__memo(() => import('./nodes/7.js-I_CMN4Mw.js')),
			__memo(() => import('./nodes/8.js-GNuFXSfz.js')),
			__memo(() => import('./nodes/9.js-CYP8QxSo.js')),
			__memo(() => import('./nodes/10.js-CZ1VHCHA.js')),
			__memo(() => import('./nodes/11.js-fF8GI7Fu.js')),
			__memo(() => import('./nodes/12.js-BFP84QMv.js')),
			__memo(() => import('./nodes/13.js-DOI3rqPG.js')),
			__memo(() => import('./nodes/14.js-MaIH7Odz.js')),
			__memo(() => import('./nodes/15.js-B6bqreGz.js')),
			__memo(() => import('./nodes/16.js-BRePXEsG.js')),
			__memo(() => import('./nodes/17.js-yq6TNFfL.js')),
			__memo(() => import('./nodes/18.js-Di-0P5dW.js')),
			__memo(() => import('./nodes/19.js-BTgntw0Y.js')),
			__memo(() => import('./nodes/20.js-de33UW0q.js')),
			__memo(() => import('./nodes/21.js-CJguDqAS.js')),
			__memo(() => import('./nodes/22.js-BROYbLIB.js')),
			__memo(() => import('./nodes/23.js-DXy-Tm37.js')),
			__memo(() => import('./nodes/24.js-Cxc3t5df.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/admin/personen",
				pattern: /^\/admin\/personen\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/_server.ts.js-Dg6lkXLL.js'))
			},
			{
				id: "/api/health/live",
				pattern: /^\/api\/health\/live\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/live/_server.ts.js-D8qQFUjn.js'))
			},
			{
				id: "/api/push",
				pattern: /^\/api\/push\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/push/_server.ts.js-DNIoWOjk.js'))
			},
			{
				id: "/auth/dev-login",
				pattern: /^\/auth\/dev-login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/auth/dev-login/_server.ts.js-DMnzvX5l.js'))
			},
			{
				id: "/auth/logout",
				pattern: /^\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/auth/logout/_server.ts.js-BIdfasbu.js'))
			},
			{
				id: "/auth/oidc/callback",
				pattern: /^\/auth\/oidc\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/auth/oidc/callback/_server.ts.js-BW_9KGo7.js'))
			},
			{
				id: "/auth/oidc/login",
				pattern: /^\/auth\/oidc\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/auth/oidc/login/_server.ts.js-By8dIhPO.js'))
			},
			{
				id: "/auth/passkey/login",
				pattern: /^\/auth\/passkey\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/auth/passkey/login/_server.ts.js-CPWMd8Tc.js'))
			},
			{
				id: "/auth/passkey/register",
				pattern: /^\/auth\/passkey\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/auth/passkey/register/_server.ts.js-CuumApvk.js'))
			},
			{
				id: "/belege/[aid]",
				pattern: /^\/belege\/([^/]+?)\/?$/,
				params: [{"name":"aid","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/belege/_aid_/_server.ts.js-D3KvgxWH.js'))
			},
			{
				id: "/belege/[aid]/erkennen",
				pattern: /^\/belege\/([^/]+?)\/erkennen\/?$/,
				params: [{"name":"aid","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/belege/_aid_/erkennen/_server.ts.js-DdYX4rIU.js'))
			},
			{
				id: "/gruppen/neu",
				pattern: /^\/gruppen\/neu\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]",
				pattern: /^\/gruppen\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/abrechnung",
				pattern: /^\/gruppen\/([^/]+?)\/abrechnung\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/ausgaben/neu",
				pattern: /^\/gruppen\/([^/]+?)\/ausgaben\/neu\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/ausgaben/sync",
				pattern: /^\/gruppen\/([^/]+?)\/ausgaben\/sync\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/gruppen/_id_/ausgaben/sync/_server.ts.js-CJZunqQC.js'))
			},
			{
				id: "/gruppen/[id]/ausgaben/vorbereiten",
				pattern: /^\/gruppen\/([^/]+?)\/ausgaben\/vorbereiten\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/gruppen/_id_/ausgaben/vorbereiten/_server.ts.js-Dj-iAhAB.js'))
			},
			{
				id: "/gruppen/[id]/ausgaben/[eid]",
				pattern: /^\/gruppen\/([^/]+?)\/ausgaben\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"eid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/belege",
				pattern: /^\/gruppen\/([^/]+?)\/belege\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/gruppen/_id_/belege/_server.ts.js-Dn0yGLnM.js'))
			},
			{
				id: "/gruppen/[id]/einstellungen",
				pattern: /^\/gruppen\/([^/]+?)\/einstellungen\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/export.csv",
				pattern: /^\/gruppen\/([^/]+?)\/export\.csv\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/gruppen/_id_/export.csv/_server.ts.js-CSVPA9-e.js'))
			},
			{
				id: "/gruppen/[id]/kosten",
				pattern: /^\/gruppen\/([^/]+?)\/kosten\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/kurs",
				pattern: /^\/gruppen\/([^/]+?)\/kurs\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/gruppen/_id_/kurs/_server.ts.js-BHPOId-M.js'))
			},
			{
				id: "/gruppen/[id]/mitglieder",
				pattern: /^\/gruppen\/([^/]+?)\/mitglieder\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/papierkorb",
				pattern: /^\/gruppen\/([^/]+?)\/papierkorb\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/profile",
				pattern: /^\/gruppen\/([^/]+?)\/profile\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/gruppen/[id]/salden",
				pattern: /^\/gruppen\/([^/]+?)\/salden\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/g/[token]",
				pattern: /^\/g\/([^/]+?)\/?$/,
				params: [{"name":"token","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/hilfe",
				pattern: /^\/hilfe\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/j/[token]",
				pattern: /^\/j\/([^/]+?)\/?$/,
				params: [{"name":"token","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/kassen",
				pattern: /^\/kassen\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/kassen/[id]",
				pattern: /^\/kassen\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/mcp",
				pattern: /^\/mcp\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/mcp/_server.ts.js-CPq1nY9I.js'))
			},
			{
				id: "/profil",
				pattern: /^\/profil\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/teilen",
				pattern: /^\/teilen\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/willkommen",
				pattern: /^\/willkommen\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 24 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export { manifest as m };
//# sourceMappingURL=manifest.js-B6x_6pux.js.map
