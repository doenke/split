import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import nodemailer, { type Transporter } from 'nodemailer';
import { and, eq, gt, inArray, isNull, count } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { config } from './config';
import { db, schema } from './db';
import { newId } from './ids';

/**
 * E-mails via SMTP (configured with SMTP_* variables). They only go to confirmed addresses, only for the
 * kinds a person wants (very few by default), and never about background ("quiet") groups.
 */

export { effectivePrefs, mailKinds, type MailKind } from '$lib/mail-kinds';
import { effectivePrefs, mailKinds, type MailKind } from '$lib/mail-kinds';

export function smtpConfigured() {
	return Boolean(env.SMTP_HOST);
}

let transporter: Transporter | null = null;
function transport() {
	if (!transporter) {
		const port = Number(env.SMTP_PORT || (env.SMTP_SECURE === 'true' ? 465 : 587));
		transporter = nodemailer.createTransport({
			host: env.SMTP_HOST,
			port,
			// true: TLS from the start (port 465); otherwise STARTTLS when the server offers it
			secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
			auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } : undefined
		});
	}
	return transporter;
}

const from = () => env.SMTP_FROM || `Split <split@${new URL(config.publicUrl).hostname}>`;

// ---- signed links (confirm address, unsubscribe) ----

let secret: Buffer | null = null;
async function mailSecret() {
	if (secret) return secret;
	const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'mail_secret'));
	if (row) return (secret = Buffer.from(row.value, 'base64'));
	await db.insert(schema.appSettings).values({ key: 'mail_secret', value: randomBytes(32).toString('base64') }).onConflictDoNothing();
	const [stored] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'mail_secret'));
	return (secret = Buffer.from(stored.value, 'base64'));
}

export async function signToken(parts: string[]) {
	const payload = Buffer.from(JSON.stringify(parts)).toString('base64url');
	const sig = createHmac('sha256', await mailSecret()).update(payload).digest('base64url');
	return `${payload}.${sig}`;
}

export async function verifyToken(token: string): Promise<string[] | null> {
	const [payload, sig] = token.split('.');
	if (!payload || !sig) return null;
	const expected = createHmac('sha256', await mailSecret()).update(payload).digest();
	const given = Buffer.from(sig, 'base64url');
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
	try {
		const parts = JSON.parse(Buffer.from(payload, 'base64url').toString());
		return Array.isArray(parts) ? parts.map(String) : null;
	} catch {
		return null;
	}
}

// ---- building and sending ----

export interface Mail {
	subject: string;
	/** paragraphs of plain text */
	lines: string[];
	action?: { label: string; url: string };
	/** a second, less prominent button */
	secondary?: { label: string; url: string };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (url: string) => (url.startsWith('http') ? url : config.publicUrl + url);

function render(mail: Mail, footer: string[]) {
	const links = [mail.action, mail.secondary].filter((a) => a !== undefined).map((a) => `${a.label}: ${abs(a.url)}`);
	const text = [...mail.lines, ...links, '', '–', ...footer].join('\n\n');
	const html = `<!doctype html><html lang="de"><body style="margin:0;padding:24px;background:#f4f6f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2b27">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:24px;border:1px solid #dfe5e2">
<div style="font-weight:700;font-size:18px;color:#2a6f5f;margin-bottom:16px">Split</div>
${mail.lines.map((l) => `<p style="margin:0 0 12px;line-height:1.5">${esc(l).replace(/\n/g, '<br>')}</p>`).join('\n')}
${mail.action || mail.secondary ? `<p style="margin:20px 0">${mail.action ? `<a href="${esc(abs(mail.action.url))}" style="display:inline-block;background:#2a6f5f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;margin:0 8px 8px 0">${esc(mail.action.label)}</a>` : ''}${mail.secondary ? `<a href="${esc(abs(mail.secondary.url))}" style="display:inline-block;border:1px solid #2a6f5f;color:#2a6f5f;text-decoration:none;padding:9px 17px;border-radius:10px;font-weight:600">${esc(mail.secondary.label)}</a>` : ''}</p>` : ''}
</div>
<div style="max-width:520px;margin:12px auto 0;font-size:12px;color:#6b7a75;line-height:1.5">${footer.map((f) => esc(f).replace(/(https?:\/\/\S+)/g, '<a href="$1" style="color:#6b7a75">$1</a>')).join('<br>')}</div>
</body></html>`;
	return { text, html };
}

/** Sends one e-mail; errors are logged, not thrown (a broken mail server must not break the app). */
export async function sendMail(to: string, mail: Mail, opts: { footer?: string[]; unsubscribe?: string } = {}) {
	if (!smtpConfigured()) return false;
	const footer = opts.footer ?? [`Gesendet von Split – ${config.publicUrl}`];
	const { text, html } = render(mail, footer);
	try {
		await transport().sendMail({
			from: from(),
			to,
			subject: mail.subject,
			text,
			html,
			// a link to a page with a button (no one-click POST: it would have to bypass the CSRF protection)
			headers: opts.unsubscribe ? { 'List-Unsubscribe': `<${opts.unsubscribe}>` } : undefined
		});
		return true;
	} catch (e) {
		console.warn('E-Mail an', to, 'fehlgeschlagen:', (e as Error).message);
		return false;
	}
}

interface Recipient {
	id: string;
	name: string;
	email: string;
}

/**
 * Sends a kind of notification to people – only to those with a confirmed address who want this kind,
 * not about quiet groups, and (with `everyDays`) not again within that time for the same `ref`.
 */
export async function mailPeople(
	personIds: string[],
	kind: MailKind,
	build: (p: Recipient) => Mail | null | Promise<Mail | null>,
	opts: { groupId?: string; ref?: string; everyDays?: number; maxTimes?: number } = {}
) {
	if (!smtpConfigured() || !personIds.length) return 0;
	if (opts.groupId) {
		const [g] = await db.select({ settings: schema.groups.settings }).from(schema.groups).where(eq(schema.groups.id, opts.groupId));
		if (!g || g.settings.quiet) return 0;
	}
	const people = await db
		.select({ id: schema.persons.id, name: schema.persons.name, email: schema.persons.email, prefs: schema.persons.mailPrefs })
		.from(schema.persons)
		.where(
			and(
				inArray(schema.persons.id, [...new Set(personIds)]),
				eq(schema.persons.emailVerified, true),
				isNull(schema.persons.deactivatedAt),
				isNull(schema.persons.mergedInto)
			)
		);
	const ref = opts.ref ?? opts.groupId ?? null;
	let sent = 0;
	for (const p of people) {
		if (!p.email || !effectivePrefs(p.prefs)[kind]) continue;
		if (opts.everyDays || opts.maxTimes) {
			const where = [eq(schema.mailLog.personId, p.id), eq(schema.mailLog.kind, kind), ref ? eq(schema.mailLog.ref, ref) : isNull(schema.mailLog.ref)];
			if (opts.everyDays) {
				const [recent] = await db
					.select({ n: count() })
					.from(schema.mailLog)
					.where(and(...where, gt(schema.mailLog.sentAt, new Date(Date.now() - opts.everyDays * 86_400_000))));
				if (recent.n > 0) continue;
			}
			if (opts.maxTimes) {
				const [all] = await db.select({ n: count() }).from(schema.mailLog).where(and(...where));
				if (all.n >= opts.maxTimes) continue;
			}
		}
		const mail = await build({ id: p.id, name: p.name, email: p.email });
		if (!mail) continue;
		const unsubscribe = `${config.publicUrl}/mail/abmelden?t=${encodeURIComponent(await signToken(['unsub', p.id, kind]))}`;
		const label = mailKinds.find((k) => k.key === kind)!.label;
		const footer = [
			`Du bekommst diese E-Mail, weil du „${label}“ eingeschaltet hast.`,
			`Abbestellen: ${unsubscribe}`,
			`Alle E-Mail-Einstellungen: ${config.publicUrl}/profil#mail`
		];
		if (await sendMail(p.email, mail, { footer, unsubscribe })) {
			await db.insert(schema.mailLog).values({ id: newId(), personId: p.id, kind, ref });
			sent++;
		}
	}
	return sent;
}

/** Mail with a link to confirm an address (valid for 3 days). */
export async function sendConfirmation(personId: string, name: string, email: string) {
	const expires = String(Date.now() + 3 * 86_400_000);
	const token = await signToken(['confirm', personId, email, expires]);
	return sendMail(email, {
		subject: 'Bitte bestätige deine E-Mail-Adresse für Split',
		lines: [
			`Hallo ${name},`,
			'du hast diese Adresse in Split hinterlegt. Bitte bestätige sie, damit Split dir E-Mails schicken darf.',
			'Warst du das nicht? Dann ignoriere diese E-Mail einfach.'
		],
		action: { label: 'Adresse bestätigen', url: `/mail/bestaetigen?t=${encodeURIComponent(token)}` }
	});
}
