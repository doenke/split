/** Amounts are always integers in the minor unit of their currency (e.g. cents). */
export type Minor = number;

/** ISO date, `YYYY-MM-DD`. */
export type IsoDate = string;

export interface Member {
	personId: string;
	/** Default weight of the person in this group, e.g. 0.5 for a child. */
	factor: number;
	tags: string[];
	/** First day of participation (inclusive). Undefined = since the group started. */
	from?: IsoDate;
	/** Last day of participation (inclusive). Undefined = open end. */
	to?: IsoDate;
	/** The Kasse this person settles with in this group. */
	kasseId: string;
}

export interface FactorOverrides {
	persons?: Record<string, number>;
	tags?: Record<string, number>;
}

export interface TagFilter {
	/** Person must have all of these tags. */
	require?: string[];
	/** Person must have none of these tags. */
	exclude?: string[];
}

interface RuleBase {
	tagFilter?: TagFilter;
	factorOverrides?: FactorOverrides;
	/** Ignore all factors: everybody taking part counts 1 (times days/nights for stay-based splits). */
	equalWeights?: boolean;
	/** Fixed amounts per person (minor units of the expense's base amount); the rest is split by the rule. */
	fixed?: Record<string, Minor>;
}

export type SplitRule =
	| (RuleBase & { type: 'all' })
	| (RuleBase & { type: 'all_except'; excluded: string[] })
	| (RuleBase & { type: 'only'; included: string[] })
	| (RuleBase & {
			type: 'individual';
			/** shares: weights as given; percent: weights in percent; amounts: exact amounts in minor units */
			mode: 'shares' | 'percent' | 'amounts';
			values: Record<string, number>;
	  });

export interface Period {
	from: IsoDate;
	/** Inclusive for `days`; for `nights` the last night is the one before `to`. */
	to: IsoDate;
	unit: 'days' | 'nights';
}

export interface Expense {
	id: string;
	date: IsoDate;
	/** Amount in the group's base currency, after conversion. */
	baseAmount: Minor;
	/** Part of `baseAmount` that is private to the payers and not shared. */
	privateAmount?: Minor;
	/** Who paid, with weights (usually the amounts they paid in the original currency). */
	payers: { personId: string; amount: Minor }[];
	rule: SplitRule;
	period?: Period;
	/** Frozen shares (after a settlement was closed); used instead of recomputing. */
	frozenShares?: Record<string, Minor>;
}

export interface Settlement {
	fromKasseId: string;
	toKasseId: string;
	/** Amount in the group's base currency. */
	amount: Minor;
}

export interface Transfer {
	from: string;
	to: string;
	amount: Minor;
}
