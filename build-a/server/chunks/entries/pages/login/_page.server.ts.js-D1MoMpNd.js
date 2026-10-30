import { N as redirect } from '../../../chunks/utils.js-BjQHIhHk.js';
import { c as config } from '../../../chunks/config.js-oO6Fsv50.js';

const load = async ({ locals, url }) => {
  if (locals.user) redirect(303, url.searchParams.get("next") ?? "/");
  return {
    oidcEnabled: config.oidc.enabled,
    oidcLabel: config.oidc.buttonLabel,
    devLogin: config.devLogin,
    error: url.searchParams.get("error")
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-D1MoMpNd.js.map
