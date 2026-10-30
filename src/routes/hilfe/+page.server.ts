import { config } from '$lib/server/config';
import { mcpToolNames } from '$lib/server/mcp';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	appUrl: config.publicUrl,
	mcpUrl: `${config.publicUrl}/mcp`,
	tools: mcpToolNames
});
