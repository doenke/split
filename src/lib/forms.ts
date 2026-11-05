import type { SubmitFunction } from '@sveltejs/kit';

/**
 * For tick boxes and radio buttons that save right away: if the server refuses the change
 * (e.g. the last manager), the box goes back to how it was.
 */
export const revertOnFailure: SubmitFunction = ({ formElement }) => {
	const box = formElement.querySelector('input:not([type=hidden])') as HTMLInputElement | null;
	const before = box ? !box.checked : false;
	return async ({ result, update }) => {
		if (result.type === 'failure' && box) box.checked = before;
		await update({ reset: false });
	};
};
