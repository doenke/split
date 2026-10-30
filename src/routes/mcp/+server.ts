import { json, type RequestHandler } from '@sveltejs/kit';
import { userForApiToken } from '$lib/server/auth/apitokens';
import { handleMcpMessage } from '$lib/server/mcp';

// only API keys count here (never the browser's session cookie), so any origin may call it
const cors = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'POST, GET, DELETE, OPTIONS',
	'access-control-allow-headers': 'authorization, content-type, accept, mcp-session-id, mcp-protocol-version',
	'access-control-expose-headers': 'mcp-session-id'
};

/** The key comes as "Authorization: Bearer …" or – for clients that only take a URL – as ?key=… */
function keyOf(request: Request, url: URL) {
	const auth = request.headers.get('authorization') ?? '';
	const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim();
	return bearer || url.searchParams.get('key') || '';
}

export const POST: RequestHandler = async ({ request, url }) => {
	const user = await userForApiToken(keyOf(request, url));
	if (!user) {
		return json(
			{ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Kein gültiger Split-API-Schlüssel. Erzeuge einen unter Profil → KI-Assistenten.' } },
			{ status: 401, headers: cors }
		);
	}
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers: cors });
	}
	const messages = Array.isArray(body) ? body : [body];
	const answers = (await Promise.all(messages.map((m) => handleMcpMessage(m, user)))).filter((a) => a !== null);
	// only notifications or responses: nothing to answer
	if (!answers.length) return new Response(null, { status: 202, headers: cors });
	return json(Array.isArray(body) ? answers : answers[0], { headers: cors });
};

// no server-initiated messages: there is no event stream to open, and no session to end
const notAllowed: RequestHandler = () => new Response(null, { status: 405, headers: { ...cors, allow: 'POST, OPTIONS' } });
export const GET = notAllowed;
export const DELETE = notAllowed;

export const OPTIONS: RequestHandler = () => new Response(null, { status: 204, headers: cors });
