import { r as root } from './root.js-CNKyZyh6.js';

let read_implementation = null;
function set_read_implementation(fn) {
  read_implementation = fn;
}
const error = ({ status, message }) => '<!doctype html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<title>' + message + `</title>

		<style>
			body {
				--bg: white;
				--fg: #222;
				--divider: #ccc;
				background: var(--bg);
				color: var(--fg);
				font-family:
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					Oxygen,
					Ubuntu,
					Cantarell,
					'Open Sans',
					'Helvetica Neue',
					sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
			}

			.error {
				display: flex;
				align-items: center;
				max-width: 32rem;
				margin: 0 1rem;
			}

			.status {
				font-weight: 200;
				font-size: 3rem;
				line-height: 1;
				position: relative;
				top: -0.05rem;
			}

			.message {
				border-left: 1px solid var(--divider);
				padding: 0 0 0 1rem;
				margin: 0 0 0 1rem;
				min-height: 2.5rem;
				display: flex;
				align-items: center;
			}

			.message h1 {
				font-weight: 400;
				font-size: 1em;
				margin: 0;
			}

			@media (prefers-color-scheme: dark) {
				body {
					--bg: #222;
					--fg: #ddd;
					--divider: #666;
				}
			}
		</style>
	</head>
	<body>
		<div class="error">
			<span class="status">` + status + '</span>\n			<div class="message">\n				<h1>' + message + "</h1>\n			</div>\n		</div>\n	</body>\n</html>\n";
const options = {
  app_template_contains_nonce: false,
  async: false,
  csp: { "mode": "auto", "directives": { "upgrade-insecure-requests": false, "block-all-mixed-content": false }, "reportOnly": { "upgrade-insecure-requests": false, "block-all-mixed-content": false } },
  csrf_check_origin: true,
  csrf_trusted_origins: [],
  embedded: false,
  env_public_prefix: "PUBLIC_",
  env_private_prefix: "",
  hash_routing: false,
  hooks: null,
  // added lazily, via `get_hooks`
  preload_strategy: "modulepreload",
  root,
  service_worker: true,
  service_worker_options: void 0,
  server_error_boundaries: false,
  templates: {
    app: ({ head, body, assets, nonce, env }) => '<!doctype html>\n<html lang="de">\n	<head>\n		<meta charset="utf-8" />\n		<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n		<meta name="theme-color" content="#2a6f5f" />\n		<link rel="manifest" href="' + assets + '/manifest.webmanifest" />\n		<link rel="icon" href="' + assets + '/icon.svg" type="image/svg+xml" />\n		<link rel="apple-touch-icon" href="' + assets + '/icon-192.png" />\n		<meta name="apple-mobile-web-app-capable" content="yes" />\n		' + head + `
		<script>
			// the install prompt can fire before the app is hydrated: keep it for the install button
			addEventListener('beforeinstallprompt', function (e) {
				e.preventDefault();
				window.__installPrompt = e;
				dispatchEvent(new Event('split:installable'));
			});
			addEventListener('appinstalled', function () {
				window.__installPrompt = null;
				dispatchEvent(new Event('split:installable'));
			});
		<\/script>
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">` + body + "</div>\n	</body>\n</html>\n",
    error
  },
  version_hash: "11w46kd"
};
async function get_hooks() {
  let handle;
  let handleFetch;
  let handleError;
  let handleValidationError;
  let init;
  ({ handle, handleFetch, handleError, handleValidationError, init } = await import('../entries/hooks.server.js-DQTS0GGs.js'));
  let reroute;
  let transport;
  return {
    handle,
    handleFetch,
    handleError,
    handleValidationError,
    init,
    reroute,
    transport
  };
}

export { get_hooks as g, options as o, read_implementation as r, set_read_implementation as s };
//# sourceMappingURL=internal.js-CR5ZP3jT.js.map
