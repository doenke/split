/**
 * Marks that the user is in the middle of something a reload would destroy (e.g. the camera is open:
 * coming back from it fires visibilitychange). Update reloads wait until it is over.
 */
let busyUntil = 0;

export function markBusy(ms = 5 * 60_000) {
	busyUntil = Date.now() + ms;
}

export function clearBusy() {
	busyUntil = 0;
}

export const isBusy = () => Date.now() < busyUntil;
