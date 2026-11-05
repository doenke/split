/**
 * The phase of a group, derived from what happened – archiving can also be done by hand.
 * planned → soon (expenses before the start date) → active (start date, or first expense without one) → ended (end date passed) → settled (everyone reported done,
 * the final statement stands) → square (all paid back) → archived (30 days after square, or by hand at any time).
 */
export type Phase = 'planned' | 'soon' | 'active' | 'ended' | 'settled' | 'square' | 'archived';

export interface PhaseInput {
	/** stored: 'settled' once the final statement stands */
	status: string;
	archivedAt: Date | string | null;
	startDate: string | null;
	endDate: string | null;
	expenseCount: number;
	/** open transfers of the statement */
	openTransfers: number;
}

export function groupPhase(g: PhaseInput, today: string): Phase {
	if (g.archivedAt) return 'archived';
	if (g.status === 'settled') return g.openTransfers === 0 ? 'square' : 'settled';
	if (g.endDate && g.endDate < today) return 'ended';
	if (g.startDate && g.startDate <= today) return 'active';
	// expenses before the start date: it starts soon (without a start date the first expense makes it active)
	if (g.expenseCount > 0) return g.startDate ? 'soon' : 'active';
	return 'planned';
}

/** All phases in their order (archived comes last). */
export const phaseOrder: Phase[] = ['planned', 'soon', 'active', 'ended', 'settled', 'square', 'archived'];

export const phaseLabels: Record<Phase, string> = {
	planned: 'geplant',
	soon: 'es geht bald los',
	active: 'aktiv',
	ended: 'wieder zuhause',
	settled: 'Abrechnung fertig',
	square: 'quitt',
	archived: 'archiviert'
};

/** Sections of the group overview, in this order. */
export const phaseSections: { title: string; phases: Phase[]; folded?: boolean }[] = [
	{ title: 'Laufend', phases: ['active', 'ended'] },
	{ title: 'Geplant', phases: ['soon', 'planned'] },
	{ title: 'Abrechnung fertig', phases: ['settled'] },
	{ title: 'Quitt', phases: ['square'] },
	{ title: 'Archiviert', phases: ['archived'], folded: true }
];

/** What to do in each phase – shown on the group page and next to the status. */
export const phaseHints: Record<Phase, string> = {
	planned: 'Bald geht’s los! Füge schon mal alle hinzu – Anzahlungen kannst du jetzt schon als Ausgabe eintragen.',
	soon: 'Es geht bald los! Anzahlungen und Vorab-Käufe kannst du schon eintragen – abgerechnet wird erst am Ende.',
	active: 'Viel Spaß! Trag Ausgaben am besten gleich ein – mit + oder direkt den Beleg mit 📷.',
	ended: 'Willkommen zurück! Sobald du alle deine Ausgaben eingetragen hast, klicke auf „Abschließen“.',
	settled: 'Die Endabrechnung steht. Jetzt nur noch ausgleichen – unter Salden steht, wer wem was zahlt.',
	square: 'Alles ausgeglichen – ihr seid quitt! 🎉 Nach 30 Tagen kommt die Gruppe von selbst ins Archiv.',
	archived: 'Diese Gruppe ist archiviert – von Hand oder von selbst 30 Tage, nachdem alle quitt waren.'
};
