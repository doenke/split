import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { b as private_env } from './shared-server.js-D1aJpbsf.js';
import { pgTable, timestamp, text, boolean, integer, jsonb, index, date, doublePrecision, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

const id = () => text("id").primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const persons = pgTable("persons", {
  id: id(),
  name: text("name").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  color: text("color").notNull(),
  /** Instance admin (from the OIDC admin group). */
  isAdmin: boolean("is_admin").notNull().default(false),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  /** Set when this person was merged into another one. */
  mergedInto: text("merged_into"),
  /** Deactivated by an instance admin: no longer offered when picking known people. */
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true })
});
const credentials = pgTable(
  "credentials",
  {
    id: id(),
    personId: text("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["oidc", "passkey", "device"] }).notNull(),
    /** oidc: `sub`; passkey: credential id (base64url); device: sha256 of the token */
    subject: text("subject").notNull(),
    publicKey: text("public_key"),
    counter: integer("counter"),
    transports: text("transports"),
    label: text("label"),
    createdAt: createdAt(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
  },
  (t) => [uniqueIndex("credentials_type_subject").on(t.type, t.subject)]
);
const sessions = pgTable("sessions", {
  /** sha256 of the session token */
  id: id(),
  personId: text("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  isOidc: boolean("is_oidc").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt()
});
const apiTokens = pgTable("api_tokens", {
  /** sha256 of the key */
  id: id(),
  personId: text("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  createdAt: createdAt(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true })
});
const inviteTokens = pgTable("invite_tokens", {
  /** sha256 of the token */
  id: id(),
  type: text("type", { enum: ["personal", "group", "pairing"] }).notNull(),
  /** Only for group links (meant to be shared openly): the token itself, so admins can show it again. */
  token: text("token"),
  personId: text("person_id").references(() => persons.id, { onDelete: "cascade" }),
  groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
  createdBy: text("created_by"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt()
});
const kassen = pgTable("kassen", {
  id: id(),
  name: text("name").notNull(),
  /** The implicit single-person Kasse of a person. */
  personalOf: text("personal_of").references(() => persons.id, { onDelete: "cascade" }),
  /** Whose payment details are shown for transfers to this Kasse. */
  receiverPersonId: text("receiver_person_id").references(() => persons.id, { onDelete: "set null" }),
  createdBy: text("created_by"),
  createdAt: createdAt()
});
const kasseMembers = pgTable(
  "kasse_members",
  {
    kasseId: text("kasse_id").notNull().references(() => kassen.id, { onDelete: "cascade" }),
    personId: text("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
    isManager: boolean("is_manager").notNull().default(false),
    isPreferred: boolean("is_preferred").notNull().default(false)
  },
  (t) => [primaryKey({ columns: [t.kasseId, t.personId] })]
);
const groups = pgTable("groups", {
  id: id(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🧳"),
  description: text("description"),
  baseCurrency: text("base_currency").notNull().default("EUR"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status", { enum: ["active", "settled", "archived"] }).notNull().default("active"),
  /** Expenses up to this date are frozen (their shares no longer change). */
  closedUntil: date("closed_until"),
  settings: jsonb("settings").$type().notNull(),
  templateOf: text("template_of"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});
const memberships = pgTable(
  "memberships",
  {
    groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    personId: text("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
    factor: doublePrecision("factor").notNull().default(1),
    tags: text("tags").array().notNull().default([]),
    participationFrom: date("participation_from"),
    participationTo: date("participation_to"),
    kasseId: text("kasse_id").notNull().references(() => kassen.id),
    /** no push notifications for this group */
    muted: boolean("muted").notNull().default(false),
    /** "I have entered all my expenses" – set by the person or someone of their Kasse */
    doneAt: timestamp("done_at", { withTimezone: true }),
    doneBy: text("done_by"),
    joinedAt: createdAt()
  },
  (t) => [primaryKey({ columns: [t.groupId, t.personId] }), index("memberships_person").on(t.personId)]
);
const categories = pgTable("categories", {
  id: id(),
  /** null = built-in default category */
  groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  sort: integer("sort").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false)
});
const profiles = pgTable("profiles", {
  id: id(),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🏷️"),
  rule: jsonb("rule").$type().notNull(),
  defaultCategoryId: text("default_category_id"),
  sort: integer("sort").notNull().default(0)
});
const expenses = pgTable(
  "expenses",
  {
    id: id(),
    groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    /** draft = photographed receipt, not processed yet (no amount, not part of any balance) */
    status: text("status", { enum: ["draft", "final"] }).notNull().default("final"),
    /** foreign currency: the amount charged in base currency (credit card statement) is still to be entered */
    awaitingCharge: boolean("awaiting_charge").notNull().default(false),
    title: text("title").notNull(),
    date: date("date").notNull(),
    /** in minor units of `currency` */
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    /** base currency units per 1 unit of `currency` */
    rate: doublePrecision("rate").notNull().default(1),
    rateSource: text("rate_source", { enum: ["none", "ecb", "manual", "charged"] }).notNull().default("none"),
    rateProvisional: boolean("rate_provisional").notNull().default(false),
    /** in minor units of the group's base currency */
    baseAmount: integer("base_amount").notNull(),
    /** private part, in base currency minor units */
    privateAmount: integer("private_amount").notNull().default(0),
    categoryId: text("category_id"),
    profileId: text("profile_id"),
    /** null = use the profile's rule */
    rule: jsonb("rule").$type(),
    periodFrom: date("period_from"),
    periodTo: date("period_to"),
    periodUnit: text("period_unit", { enum: ["days", "nights"] }),
    notes: text("notes"),
    frozenShares: jsonb("frozen_shares").$type(),
    createdBy: text("created_by").notNull(),
    /** id generated by the client – makes offline sync and double submits idempotent */
    clientId: text("client_id").unique(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (t) => [index("expenses_group").on(t.groupId, t.date)]
);
const expensePayers = pgTable(
  "expense_payers",
  {
    expenseId: text("expense_id").notNull().references(() => expenses.id, { onDelete: "cascade" }),
    personId: text("person_id").notNull().references(() => persons.id),
    /** in minor units of the expense's currency */
    amount: integer("amount").notNull()
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.personId] })]
);
const settlements = pgTable("settlements", {
  id: id(),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  fromKasseId: text("from_kasse_id").notNull().references(() => kassen.id),
  toKasseId: text("to_kasse_id").notNull().references(() => kassen.id),
  /** base currency minor units */
  amount: integer("amount").notNull(),
  method: text("method", { enum: ["cash", "transfer", "paypal", "wero", "other"] }).notNull().default("other"),
  status: text("status", { enum: ["pending", "confirmed"] }).notNull().default("pending"),
  /** Settlements created together by netting across groups share this id. */
  linkId: text("link_id"),
  date: date("date").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});
const exchangeRates = pgTable(
  "exchange_rates",
  {
    date: date("date").notNull(),
    currency: text("currency").notNull(),
    /** units of `currency` per 1 EUR (ECB convention) */
    perEur: doublePrecision("per_eur").notNull()
  },
  (t) => [primaryKey({ columns: [t.date, t.currency] })]
);
const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
    personId: text("person_id"),
    action: text("action").notNull(),
    entityId: text("entity_id"),
    data: jsonb("data"),
    createdAt: createdAt()
  },
  (t) => [index("audit_group").on(t.groupId, t.createdAt)]
);
const paymentDetails = pgTable("payment_details", {
  personId: text("person_id").primaryKey().references(() => persons.id, { onDelete: "cascade" }),
  /** e-mail address or phone number registered with Wero */
  weroContact: text("wero_contact"),
  iban: text("iban"),
  accountHolder: text("account_holder"),
  paypalMe: text("paypal_me"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
const attachments = pgTable(
  "attachments",
  {
    id: id(),
    groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    /** null until the expense is saved */
    expenseId: text("expense_id").references(() => expenses.id, { onDelete: "set null" }),
    fileName: text("file_name").notNull(),
    originalName: text("original_name"),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    /** result of the automatic receipt recognition */
    ocrStatus: text("ocr_status", { enum: ["done", "failed", "skipped"] }),
    ocrResult: jsonb("ocr_result").$type(),
    createdAt: createdAt()
  },
  (t) => [index("attachments_expense").on(t.expenseId)]
);
const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull()
});
const pushSubscriptions = pgTable("push_subscriptions", {
  id: id(),
  personId: text("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  label: text("label"),
  createdAt: createdAt()
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  apiTokens,
  appSettings,
  attachments,
  auditLog,
  categories,
  credentials,
  exchangeRates,
  expensePayers,
  expenses,
  groups,
  inviteTokens,
  kasseMembers,
  kassen,
  memberships,
  paymentDetails,
  persons,
  profiles,
  pushSubscriptions,
  sessions,
  settlements
}, Symbol.toStringTag, { value: "Module" }));
const url = private_env.DATABASE_URL ?? "postgres://split:split@localhost:5432/split";
const client = postgres(url, { max: 10, onnotice: () => {
} });
const db = drizzle(client, { schema });
async function runMigrations() {
  await migrate(db, { migrationsFolder: private_env.MIGRATIONS_DIR ?? "drizzle" });
}

export { attachments as a, expenses as b, categories as c, db as d, exchangeRates as e, sessions as f, groups as g, credentials as h, profiles as i, expensePayers as j, kassen as k, auditLog as l, memberships as m, kasseMembers as n, pushSubscriptions as o, persons as p, appSettings as q, runMigrations as r, settlements as s, inviteTokens as t, paymentDetails as u, apiTokens as v, client as w };
//# sourceMappingURL=index3.js-LeA4cvVT.js.map
