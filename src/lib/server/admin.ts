import { error, redirect } from '@sveltejs/kit';

/** Pages and actions only for instance admins (members of the admin group of the login provider). */
export function requireInstanceAdmin(user: App.Locals['user']) {
	if (!user) redirect(303, '/login');
	if (!user.isInstanceAdmin) error(403, 'Nur für Instanz-Admins.');
	return user;
}
