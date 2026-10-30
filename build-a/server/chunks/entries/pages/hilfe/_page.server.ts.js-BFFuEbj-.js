import { c as config } from '../../../chunks/config.js-oO6Fsv50.js';
import { m as mcpToolNames } from '../../../chunks/mcp.js-CNjp7RDo.js';

const load = async () => ({
  appUrl: config.publicUrl,
  mcpUrl: `${config.publicUrl}/mcp`,
  tools: mcpToolNames
});

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-BFFuEbj-.js.map
