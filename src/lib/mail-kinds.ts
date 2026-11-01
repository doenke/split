/** The kinds of e-mails and who gets them by default (as few as possible). */
export const mailKinds = [
	{ key: 'payment_request', label: 'Zahlungsaufforderung: was du nach der Endabrechnung zahlen musst', default: true },
	{ key: 'payment_reminder', label: 'Zahlungserinnerung, wenn dich jemand an eine offene Zahlung erinnert', default: true },
	{ key: 'group_added', label: 'Jemand hat dich zu einer Gruppe hinzugefügt', default: false },
	{ key: 'new_expense', label: 'Neue Ausgabe in einer deiner Gruppen', default: false },
	{ key: 'payment_to_confirm', label: 'Jemand hat eine Zahlung an dich eingetragen – bitte bestätigen', default: false },
	{ key: 'completion_reminder', label: 'Erinnerung, deine Ausgaben einzutragen und abzuschließen', default: false },
	{ key: 'final_statement', label: 'Die Endabrechnung einer Gruppe steht', default: false },
	{ key: 'open_payments', label: 'Wöchentliche Erinnerung an Zahlungen, die du noch leisten musst', default: false }
] as const;

export type MailKind = (typeof mailKinds)[number]['key'];

/** Effective preferences: stored choices over the defaults; "all: false" switches every kind off. */
export function effectivePrefs(stored: Record<string, boolean>) {
	return Object.fromEntries(mailKinds.map((k) => [k.key, stored.all !== false && (stored[k.key] ?? k.default)])) as Record<MailKind, boolean>;
}
