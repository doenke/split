import {
	boolean,
	date,
	doublePrecision,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import type { SplitRule } from '../../core/types';
import { DEFAULT_TAG } from '../../core/tags';

const id = () => text('id').primaryKey();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

/** A human. Global across groups; may or may not be able to log in. */
export const persons = pgTable('persons', {
	id: id(),
	name: text('name').notNull(),
	email: text('email'),
	avatarUrl: text('avatar_url'),
	color: text('color').notNull(),
	/** Instance admin (from the OIDC admin group). */
	isAdmin: boolean('is_admin').notNull().default(false),
	createdBy: text('created_by'),
	createdAt: createdAt(),
	/** Set when this person was merged into another one. */
	mergedInto: text('merged_into')
});

/** Ways to log in as a person. */
export const credentials = pgTable(
	'credentials',
	{
		id: id(),
		personId: text('person_id')
			.notNull()
			.references(() => persons.id, { onDelete: 'cascade' }),
		type: text('type', { enum: ['oidc', 'passkey', 'device'] }).notNull(),
		/** oidc: `sub`; passkey: credential id (base64url); device: sha256 of the token */
		subject: text('subject').notNull(),
		publicKey: text('public_key'),
		counter: integer('counter'),
		transports: text('transports'),
		label: text('label'),
		createdAt: createdAt(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true })
	},
	(t) => [uniqueIndex('credentials_type_subject').on(t.type, t.subject)]
);

export const sessions = pgTable('sessions', {
	/** sha256 of the session token */
	id: id(),
	personId: text('person_id')
		.notNull()
		.references(() => persons.id, { onDelete: 'cascade' }),
	isOidc: boolean('is_oidc').notNull().default(false),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: createdAt()
});

export const inviteTokens = pgTable('invite_tokens', {
	/** sha256 of the token */
	id: id(),
	type: text('type', { enum: ['personal', 'group', 'pairing'] }).notNull(),
	/** Only for group links (meant to be shared openly): the token itself, so admins can show it again. */
	token: text('token'),
	personId: text('person_id').references(() => persons.id, { onDelete: 'cascade' }),
	groupId: text('group_id').references(() => groups.id, { onDelete: 'cascade' }),
	createdBy: text('created_by'),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	usedAt: timestamp('used_at', { withTimezone: true }),
	createdAt: createdAt()
});

/** A settlement unit (family, couple …). Global across groups. */
export const kassen = pgTable('kassen', {
	id: id(),
	name: text('name').notNull(),
	/** The implicit single-person Kasse of a person. */
	personalOf: text('personal_of').references(() => persons.id, { onDelete: 'cascade' }),
	/** Whose payment details are shown for transfers to this Kasse. */
	receiverPersonId: text('receiver_person_id').references(() => persons.id, { onDelete: 'set null' }),
	createdBy: text('created_by'),
	createdAt: createdAt()
});

export const kasseMembers = pgTable(
	'kasse_members',
	{
		kasseId: text('kasse_id')
			.notNull()
			.references(() => kassen.id, { onDelete: 'cascade' }),
		personId: text('person_id')
			.notNull()
			.references(() => persons.id, { onDelete: 'cascade' }),
		isManager: boolean('is_manager').notNull().default(false),
		isPreferred: boolean('is_preferred').notNull().default(false)
	},
	(t) => [primaryKey({ columns: [t.kasseId, t.personId] })]
);

export interface GroupSettings {
	/** false = everyone pays back the actual payers directly */
	simplifyDebts: boolean;
	/** who may edit expenses created by others */
	editOthers: 'all' | 'admins';
	/** whether non-admins may add people */
	membersCanAddPeople: boolean;
}

export const groups = pgTable('groups', {
	id: id(),
	name: text('name').notNull(),
	emoji: text('emoji').notNull().default('🧳'),
	description: text('description'),
	baseCurrency: text('base_currency').notNull().default('EUR'),
	startDate: date('start_date'),
	endDate: date('end_date'),
	status: text('status', { enum: ['active', 'settled', 'archived'] }).notNull().default('active'),
	/** Expenses up to this date are frozen (their shares no longer change). */
	closedUntil: date('closed_until'),
	settings: jsonb('settings').$type<GroupSettings>().notNull(),
	templateOf: text('template_of'),
	createdBy: text('created_by').notNull(),
	createdAt: createdAt(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const memberships = pgTable(
	'memberships',
	{
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id, { onDelete: 'cascade' }),
		personId: text('person_id')
			.notNull()
			.references(() => persons.id, { onDelete: 'cascade' }),
		role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
		factor: doublePrecision('factor').notNull().default(1),
		/** every member starts with the tag "alle" (can be removed per person) */
		tags: text('tags').array().notNull().default([DEFAULT_TAG]),
		participationFrom: date('participation_from'),
		participationTo: date('participation_to'),
		kasseId: text('kasse_id')
			.notNull()
			.references(() => kassen.id),
		/** no push notifications for this group */
		muted: boolean('muted').notNull().default(false),
		/** "I have entered all my expenses" – set by the person or someone of their Kasse */
		doneAt: timestamp('done_at', { withTimezone: true }),
		doneBy: text('done_by'),
		joinedAt: createdAt()
	},
	(t) => [primaryKey({ columns: [t.groupId, t.personId] }), index('memberships_person').on(t.personId)]
);

export const categories = pgTable('categories', {
	id: id(),
	/** null = built-in default category */
	groupId: text('group_id').references(() => groups.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	icon: text('icon').notNull(),
	color: text('color').notNull(),
	sort: integer('sort').notNull().default(0),
	hidden: boolean('hidden').notNull().default(false)
});

export const profiles = pgTable('profiles', {
	id: id(),
	groupId: text('group_id')
		.notNull()
		.references(() => groups.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	icon: text('icon').notNull().default('🏷️'),
	rule: jsonb('rule').$type<SplitRule>().notNull(),
	defaultCategoryId: text('default_category_id'),
	sort: integer('sort').notNull().default(0)
});

export const expenses = pgTable(
	'expenses',
	{
		id: id(),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id, { onDelete: 'cascade' }),
		type: text('type', { enum: ['expense', 'income'] }).notNull().default('expense'),
		title: text('title').notNull(),
		date: date('date').notNull(),
		/** in minor units of `currency` */
		amount: integer('amount').notNull(),
		currency: text('currency').notNull(),
		/** base currency units per 1 unit of `currency` */
		rate: doublePrecision('rate').notNull().default(1),
		rateSource: text('rate_source', { enum: ['none', 'ecb', 'manual', 'charged'] })
			.notNull()
			.default('none'),
		rateProvisional: boolean('rate_provisional').notNull().default(false),
		/** in minor units of the group's base currency */
		baseAmount: integer('base_amount').notNull(),
		/** private part, in base currency minor units */
		privateAmount: integer('private_amount').notNull().default(0),
		categoryId: text('category_id'),
		profileId: text('profile_id'),
		/** null = use the profile's rule */
		rule: jsonb('rule').$type<SplitRule>(),
		periodFrom: date('period_from'),
		periodTo: date('period_to'),
		periodUnit: text('period_unit', { enum: ['days', 'nights'] }),
		notes: text('notes'),
		frozenShares: jsonb('frozen_shares').$type<Record<string, number>>(),
		createdBy: text('created_by').notNull(),
		/** id generated by the client – makes offline sync and double submits idempotent */
		clientId: text('client_id').unique(),
		createdAt: createdAt(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		deletedAt: timestamp('deleted_at', { withTimezone: true })
	},
	(t) => [index('expenses_group').on(t.groupId, t.date)]
);

export const expensePayers = pgTable(
	'expense_payers',
	{
		expenseId: text('expense_id')
			.notNull()
			.references(() => expenses.id, { onDelete: 'cascade' }),
		personId: text('person_id')
			.notNull()
			.references(() => persons.id),
		/** in minor units of the expense's currency */
		amount: integer('amount').notNull()
	},
	(t) => [primaryKey({ columns: [t.expenseId, t.personId] })]
);

export const settlements = pgTable('settlements', {
	id: id(),
	groupId: text('group_id')
		.notNull()
		.references(() => groups.id, { onDelete: 'cascade' }),
	fromKasseId: text('from_kasse_id')
		.notNull()
		.references(() => kassen.id),
	toKasseId: text('to_kasse_id')
		.notNull()
		.references(() => kassen.id),
	/** base currency minor units */
	amount: integer('amount').notNull(),
	method: text('method', { enum: ['cash', 'transfer', 'paypal', 'wero', 'other'] })
		.notNull()
		.default('other'),
	status: text('status', { enum: ['pending', 'confirmed'] }).notNull().default('pending'),
	/** Settlements created together by netting across groups share this id. */
	linkId: text('link_id'),
	date: date('date').notNull(),
	createdBy: text('created_by').notNull(),
	createdAt: createdAt(),
	confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export const exchangeRates = pgTable(
	'exchange_rates',
	{
		date: date('date').notNull(),
		currency: text('currency').notNull(),
		/** units of `currency` per 1 EUR (ECB convention) */
		perEur: doublePrecision('per_eur').notNull()
	},
	(t) => [primaryKey({ columns: [t.date, t.currency] })]
);

export const auditLog = pgTable(
	'audit_log',
	{
		id: id(),
		groupId: text('group_id').references(() => groups.id, { onDelete: 'cascade' }),
		personId: text('person_id'),
		action: text('action').notNull(),
		entityId: text('entity_id'),
		data: jsonb('data'),
		createdAt: createdAt()
	},
	(t) => [index('audit_group').on(t.groupId, t.createdAt)]
);

/** How a person wants to receive money. Visible to people sharing a group with them. */
export const paymentDetails = pgTable('payment_details', {
	personId: text('person_id')
		.primaryKey()
		.references(() => persons.id, { onDelete: 'cascade' }),
	/** e-mail address or phone number registered with Wero */
	weroContact: text('wero_contact'),
	/** open payment link created in the banking app */
	weroLink: text('wero_link'),
	iban: text('iban'),
	accountHolder: text('account_holder'),
	paypalMe: text('paypal_me'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/** Receipt photos and PDFs. Files live in UPLOAD_DIR, named after the id. */
export const attachments = pgTable(
	'attachments',
	{
		id: id(),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id, { onDelete: 'cascade' }),
		/** null until the expense is saved */
		expenseId: text('expense_id').references(() => expenses.id, { onDelete: 'set null' }),
		fileName: text('file_name').notNull(),
		originalName: text('original_name'),
		mime: text('mime').notNull(),
		size: integer('size').notNull(),
		uploadedBy: text('uploaded_by').notNull(),
		createdAt: createdAt()
	},
	(t) => [index('attachments_expense').on(t.expenseId)]
);

/** Instance-wide settings generated at runtime (e.g. VAPID keys). */
export const appSettings = pgTable('app_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

export const pushSubscriptions = pgTable('push_subscriptions', {
	id: id(),
	personId: text('person_id')
		.notNull()
		.references(() => persons.id, { onDelete: 'cascade' }),
	endpoint: text('endpoint').notNull().unique(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	label: text('label'),
	createdAt: createdAt()
});
