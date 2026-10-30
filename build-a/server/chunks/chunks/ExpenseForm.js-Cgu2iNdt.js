import { a4 as attr, a6 as escape_html, a8 as attr_class, a9 as ensure_array_like, a7 as stringify, _ as derived, ab as bind_props } from './index.js-BT3kaB_g.js';
import './exports.js-B9Uzt4sy.js';
import './utils2.js-ejsMtG81.js';
import './utils.js-BjQHIhHk.js';
import './root.js-CNKyZyh6.js';
import './state.svelte.js-aCWhrotV.js';
import { a as computeShares, e as effectiveFactor, p as presentUnits } from './split.js-Diu3SqNm.js';
import { b as amountToInput, f as formatAmount, p as parseAmount, a as convert, c as currencyDigits } from './currency.js-B45uFFG3.js';
import { t as today } from './format.js-Cn5c-OM3.js';
import { A as Avatar } from './Avatar.js-BAGJaOlv.js';

async function uploadErrorMessage(res) {
  const data = await res.json().catch(() => null);
  if (data?.message && data.message !== "Internal Error") return String(data.message);
  if (res.status === 413) return "Das Foto ist zu groß für den Server (Upload-Limit, z.B. im Reverse-Proxy).";
  return `Speichern fehlgeschlagen (Fehler ${res.status}). Details stehen im Server-Log.`;
}
async function shrinkImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 2e3 / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 15e5) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.82));
}
function ReceiptPicker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      groupId,
      existing = [],
      ids = [],
      reading = null,
      onuploaded
      /** id of the receipt that is being read right now */
    } = $$props;
    let files = [...existing];
    let busy = false;
    let message = null;
    async function upload(file) {
      busy = true;
      message = null;
      try {
        const blob = await shrinkImage(file);
        const body = new FormData();
        const name = blob === file ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg";
        body.append("file", new File([blob], name, { type: blob.type || file.type }));
        const res = await fetch(`/gruppen/${groupId}/belege`, { method: "POST", body });
        if (!res.ok) throw new Error(await uploadErrorMessage(res));
        const data = await res.json();
        files.push({
          id: data.id,
          mime: data.mime,
          preview: blob.type.startsWith("image/") ? URL.createObjectURL(blob) : void 0
        });
        onuploaded?.({ id: data.id, mime: data.mime });
      } catch (e) {
        message = e.message;
      } finally {
        busy = false;
      }
    }
    $$renderer2.push(`<div class="receipts svelte-1elt2ru"><!--[-->`);
    const each_array = ensure_array_like(files);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let f = each_array[$$index];
      $$renderer2.push(`<div class="thumb svelte-1elt2ru">`);
      if (f.mime.startsWith("image/")) {
        $$renderer2.push(`<!--[0--><a${attr("href", `/belege/${stringify(f.id)}`)} target="_blank" rel="noopener"><img${attr("src", f.preview ?? `/belege/${f.id}`)} alt="Beleg" class="svelte-1elt2ru"/></a>`);
      } else {
        $$renderer2.push(`<!--[-1--><a${attr("href", `/belege/${stringify(f.id)}`)} target="_blank" rel="noopener" class="pdf svelte-1elt2ru">📄 PDF</a>`);
      }
      $$renderer2.push(`<!--]--> <button type="button" class="remove svelte-1elt2ru" aria-label="Beleg entfernen">✕</button> `);
      if (reading === f.id) {
        $$renderer2.push(`<!--[0--><span class="reading svelte-1elt2ru">liest …</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> <label${attr_class("add svelte-1elt2ru", void 0, { "busy": busy })}><input type="file" accept="image/*,application/pdf" multiple=""${attr("disabled", busy, true)} class="svelte-1elt2ru"/> <span>${escape_html(busy ? "…" : "📷")}</span> <span class="small svelte-1elt2ru">${escape_html(busy ? "Lädt" : "Beleg")}</span></label></div> `);
    if (message) {
      $$renderer2.push(`<!--[0--><p class="error small">${escape_html(message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ids, upload });
  });
}
function receiptDifference(r) {
  if (r.total === null) return 0;
  return r.total - r.items.reduce((s, i) => s + i.amount, 0);
}
function ExpenseForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      groupId,
      baseCurrency,
      members,
      categories,
      currencies,
      meId,
      profiles = [],
      attachments = [],
      initialAttachmentIds = [],
      groupPeriod = null,
      receiptRecognition = false,
      draft = false,
      initial = null,
      error = null
      /** a prepared expense (photo only): treated like a new one when filling from the receipt */
      /** whether uploaded receipts are read automatically */
      /** travel dates of the group, used as default stay period */
      /** receipts uploaded before the form opened (e.g. shared from another app) */
    } = $$props;
    const init = initial;
    let type = init?.type ?? "expense";
    let title = draft ? "" : init?.title ?? "";
    let currency = init?.currency ?? baseCurrency;
    let amountText = init && !draft ? amountToInput(init.amount, init.currency) : "";
    let date = init?.date ?? today();
    let categoryId = init?.categoryId ?? null;
    let notes = init?.notes ?? "";
    let attachmentIds = [];
    let receipt = null;
    let reading = null;
    let readMessage = null;
    const DIFF = -1;
    function applyReceipt(attachmentId, r, fillForm) {
      if (r.error) {
        readMessage = r.error;
        return;
      }
      readMessage = null;
      {
        if (!title.trim() && r.merchant) title = r.merchant;
        if (!amountText.trim() && r.total !== null) {
          if (r.currency) currency = r.currency;
          amountText = amountToInput(r.total, r.currency ?? currency);
        }
        if (r.date && (!init || draft)) date = r.date;
        if (r.categoryId && !categoryId) categoryId = r.categoryId;
      }
      if (r.items.length) receipt = { attachmentId, result: r, deselected: r.deselected ?? [] };
    }
    async function recognize(file) {
      if (!receiptRecognition || !navigator.onLine) return;
      if (!/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mime)) return;
      reading = file.id;
      readMessage = null;
      try {
        const res = await fetch(`/belege/${file.id}/erkennen`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Der Bon konnte nicht gelesen werden.");
        applyReceipt(file.id, data, true);
      } catch (e) {
        readMessage = e.message;
      } finally {
        reading = null;
      }
    }
    const receiptRows = derived(() => receipt ? [
      ...receipt.result.items.map((it, i) => ({ index: i, description: it.description, amount: it.amount })),
      ...receiptDifference(receipt.result) !== 0 ? [
        {
          index: DIFF,
          description: "Differenz / nicht erkannt (z.B. Pfand, Rundung)",
          amount: receiptDifference(receipt.result)
        }
      ] : []
    ] : []);
    const clientId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    let multiPayer = (init?.payers.length ?? 1) > 1;
    let payer = init?.payers[0]?.personId ?? meId;
    let payerAmounts = Object.fromEntries((init?.payers ?? []).map((p) => [p.personId, amountToInput(p.amount, init.currency)]));
    const initRule = init?.rule;
    let mode = initRule?.type ?? "all";
    let profileId = init?.profileId ?? null;
    let equalWeights = init?.equalWeights ?? initRule?.equalWeights ?? false;
    const legacyFilter = !init?.profileId && initRule && initRule.type !== "individual" ? initRule.tagFilter ?? null : null;
    let keepFilter = Boolean(legacyFilter?.require?.length || legacyFilter?.exclude?.length);
    const profile = derived(() => profiles.find((p) => p.id === profileId) ?? null);
    const factorOf = (m) => equalWeights && mode !== "individual" ? 1 : effectiveFactor(
      {
        personId: m.personId,
        factor: m.factor,
        tags: m.tags,
        kasseId: m.kasseId
      },
      rule().factorOverrides
    );
    function factorSource(m) {
      if (equalWeights) return "alle gleich gewichtet";
      const o = rule().factorOverrides;
      const where = profile() ? `Profil „${profile().name}“` : "diese Ausgabe";
      if (o?.persons?.[m.personId] !== void 0) return `festgelegt in ${where}`;
      const tag = m.tags.find((t) => o?.tags?.[t] !== void 0);
      if (tag) return `Merkmal „${tag}“ in ${where}`;
      return m.factor === 1 ? "Standard" : `Standardfaktor von ${m.name} (Mitglieder)`;
    }
    let factorOpen = null;
    let selected = Object.fromEntries(members.map((m) => [
      m.personId,
      initRule?.type === "all_except" ? initRule.excluded.includes(m.personId) : initRule?.type === "only" ? initRule.included.includes(m.personId) : false
    ]));
    let indivMode = initRule?.type === "individual" ? initRule.mode : "shares";
    let indivValues = Object.fromEntries(members.map((m) => {
      if (initRule?.type !== "individual") return [m.personId, ""];
      const v = initRule.values[m.personId];
      if (v === void 0) return [m.personId, ""];
      return [
        m.personId,
        initRule.mode === "amounts" ? amountToInput(v, init.currency) : String(v).replace(".", ",")
      ];
    }));
    let showPrivate = (init?.privateAmount ?? 0) > 0;
    let privateText = init?.privateAmount ? amountToInput(init.privateAmount, init.currency) : "";
    let showPeriod = Boolean(init?.period);
    let periodFrom = init?.period?.from ?? groupPeriod?.from ?? date;
    let periodTo = init?.period?.to ?? groupPeriod?.to ?? date;
    Boolean(init?.period);
    let periodUnit = init?.period?.unit ?? "nights";
    const unitsOf = (m) => presentUnits(
      {
        personId: m.personId,
        factor: m.factor,
        tags: m.tags,
        kasseId: m.kasseId,
        from: m.participationFrom ?? void 0,
        to: m.participationTo ?? void 0
      },
      { from: periodFrom, to: periodTo, unit: periodUnit }
    );
    const unitLabel = (n) => periodUnit === "nights" ? n === 1 ? "1 Nacht" : `${n} Nächte` : n === 1 ? "1 Tag" : `${n} Tage`;
    const periodTotal = derived(() => presentUnits({}, { from: periodFrom, to: periodTo, unit: periodUnit }));
    let awaitingCharge = init?.awaitingCharge ?? false;
    let rateSource = init?.rate.source ?? "auto";
    let manualRate = init?.rate.value ? String(init.rate.value).replace(".", ",") : "";
    let chargedText = init?.rate.charged ? amountToInput(init.rate.charged, baseCurrency) : "";
    const amount = derived(() => parseAmount(amountText, currency) ?? 0);
    const privateAmount = derived(() => showPrivate ? parseAmount(privateText, currency) ?? 0 : 0);
    const parseNum = (s) => {
      const n = parseFloat(s.replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };
    const rate = derived(() => {
      if (currency === baseCurrency) return 1;
      if (rateSource === "manual") return parseNum(manualRate) || null;
      if (rateSource === "charged") {
        const charged = parseAmount(chargedText, baseCurrency);
        if (!charged || !amount()) return null;
        return charged / 10 ** currencyDigits(baseCurrency) / (amount() / 10 ** currencyDigits(currency));
      }
      return null;
    });
    const baseAmount = derived(() => rate() ? convert(amount(), currency, baseCurrency, rate()) : null);
    const payerSum = derived(() => Object.values(payerAmounts).reduce((s, v) => s + (parseAmount(v, currency) ?? 0), 0));
    const rule = derived(() => {
      const r = baseRule();
      return equalWeights && r.type !== "individual" ? { ...r, equalWeights: true } : r;
    });
    function baseRule() {
      if (profile()) return profile().rule;
      if (keepFilter && legacyFilter && mode === initRule?.type && initRule.type !== "individual") return initRule;
      const ids = Object.keys(selected).filter((id) => selected[id]);
      switch (mode) {
        case "all":
          return { type: "all" };
        case "all_except":
          return { type: "all_except", excluded: ids };
        case "only":
          return { type: "only", included: ids };
        case "individual": {
          const values = {};
          for (const [id, v] of Object.entries(indivValues)) {
            const n = indivMode === "amounts" ? parseAmount(v, currency) ?? 0 : parseNum(v);
            if (n > 0) values[id] = n;
          }
          return { type: "individual", mode: indivMode, values };
        }
      }
    }
    const coreMembers = derived(() => members.map((m) => ({
      personId: m.personId,
      factor: m.factor,
      tags: m.tags,
      from: m.participationFrom ?? void 0,
      to: m.participationTo ?? void 0,
      kasseId: m.kasseId
    })));
    const indivSum = derived(() => Object.values(indivValues).reduce((s, v) => s + (indivMode === "amounts" ? parseAmount(v, currency) ?? 0 : parseNum(v)), 0));
    const preview = derived(() => {
      if (!amount()) return null;
      try {
        const sharedOriginal = amount() - privateAmount();
        const r = rule().type === "individual" && rule().mode === "amounts" ? { ...rule(), mode: "shares" } : rule();
        const shares = computeShares(
          {
            id: "preview",
            date,
            baseAmount: amount(),
            privateAmount: privateAmount(),
            payers: [{ personId: payer, amount: amount() }],
            rule: r,
            period: showPeriod ? { from: periodFrom, to: periodTo, unit: periodUnit } : void 0
          },
          coreMembers()
        );
        if (rule().type === "individual" && rule().mode === "amounts" && indivSum() !== sharedOriginal) {
          return {
            error: `Noch ${formatAmount(sharedOriginal - indivSum(), currency)} zu verteilen.`
          };
        }
        if (rule().type === "individual" && rule().mode === "percent" && Math.abs(indivSum() - 100) > 0.01) {
          return {
            error: `Summe: ${indivSum().toLocaleString("de-DE")} % (muss 100 % sein)`
          };
        }
        return { shares };
      } catch (e) {
        return { error: e.message };
      }
    });
    const payload = derived(() => JSON.stringify({
      type,
      title,
      amount: amount(),
      currency,
      date,
      payers: multiPayer ? Object.entries(payerAmounts).map(([personId, v]) => ({ personId, amount: parseAmount(v, currency) ?? 0 })).filter((p) => p.amount > 0) : [{ personId: payer, amount: amount() }],
      categoryId,
      profileId,
      rule: rule(),
      privateAmount: privateAmount(),
      rate: {
        source: rateSource,
        value: rateSource === "manual" ? parseNum(manualRate) : void 0,
        charged: rateSource === "charged" ? parseAmount(chargedText, baseCurrency) ?? void 0 : void 0
      },
      period: showPeriod ? { from: periodFrom, to: periodTo, unit: periodUnit } : null,
      notes,
      clientId: init ? void 0 : clientId,
      equalWeights: equalWeights && rule().type !== "individual",
      awaitingCharge: currency !== baseCurrency && rateSource === "auto" && awaitingCharge,
      receiptSelection: receipt ? {
        attachmentId: receipt.attachmentId,
        deselected: receipt.deselected
      } : void 0,
      attachmentIds: [
        .../* @__PURE__ */ new Set([...attachmentIds, ...initialAttachmentIds.map((a) => a.id)])
      ]
    }));
    const modeLabels = {
      all: "Alle",
      all_except: "Alle außer …",
      only: "Nur …",
      individual: "Individuell"
    };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<form method="POST" action="?/save"><input type="hidden" name="payload"${attr("value", payload())}/> `);
      if (error) {
        $$renderer3.push(`<!--[0--><p class="error">${escape_html(error)}</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="card"><div class="segmented" style="margin-bottom: 0.9rem"><button type="button"${attr_class("", void 0, { "active": type === "expense" })}>Ausgabe</button> <button type="button"${attr_class("", void 0, { "active": type === "income" })}>Einnahme / Erstattung</button></div> <div class="field"><label for="title">Wofür?</label> <input id="title"${attr("value", title)}${attr("placeholder", type === "income" ? "z.B. Pfand zurück" : "z.B. Abendessen")} required="" autocomplete="off"/></div> <div class="row"><div class="field grow"><label for="amount">Betrag</label> <input id="amount"${attr("value", amountText)} inputmode="decimal" placeholder="0,00" required="" autocomplete="off"/></div> <div class="field" style="width: 7rem"><label for="currency">Währung</label> `);
      $$renderer3.select({ id: "currency", value: currency }, ($$renderer4) => {
        $$renderer4.push(`<!--[-->`);
        const each_array = ensure_array_like(currencies);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let c = each_array[$$index];
          $$renderer4.option({ value: c }, ($$renderer5) => {
            $$renderer5.push(`${escape_html(c)}`);
          });
        }
        $$renderer4.push(`<!--]-->`);
      });
      $$renderer3.push(`</div></div> `);
      if (currency !== baseCurrency) {
        $$renderer3.push(`<!--[0--><div class="field fx svelte-1gdlsiu"><div class="segmented small-seg svelte-1gdlsiu"><button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": rateSource === "auto" })}>Tageskurs</button> <button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": rateSource === "charged" })}>Abgebucht</button> <button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": rateSource === "manual" })}>Kurs</button></div> `);
        if (rateSource === "auto") {
          $$renderer3.push("<!--[0-->");
          {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <label class="check small"><input type="checkbox"${attr("checked", awaitingCharge, true)} class="svelte-1gdlsiu"/> Abgebuchten ${escape_html(baseCurrency)}-Betrag später nachtragen (z.B. aus der Kreditkartenabrechnung)</label>`);
        } else if (rateSource === "charged") {
          $$renderer3.push(`<!--[1--><input${attr("value", chargedText)} inputmode="decimal"${attr("placeholder", `Tatsächlich abgebucht in ${stringify(baseCurrency)}`)} class="svelte-1gdlsiu"/> <p class="hint">Am fairsten: der Betrag laut Kontoauszug, inklusive Gebühren.</p>`);
        } else {
          $$renderer3.push(`<!--[-1--><input${attr("value", manualRate)} inputmode="decimal"${attr("placeholder", `1 ${stringify(currency)} = ? ${stringify(baseCurrency)}`)} class="svelte-1gdlsiu"/>`);
        }
        $$renderer3.push(`<!--]--> `);
        if (baseAmount() !== null && amount()) {
          $$renderer3.push(`<!--[0--><p class="hint">≈ <strong>${escape_html(formatAmount(baseAmount(), baseCurrency))}</strong></p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="field">`);
      ReceiptPicker($$renderer3, {
        groupId,
        existing: [...attachments, ...initialAttachmentIds],
        reading,
        onuploaded: (f) => recognize(f),
        get ids() {
          return attachmentIds;
        },
        set ids($$value) {
          attachmentIds = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (reading) {
        $$renderer3.push(`<!--[0--><p class="hint">📷 Bon wird gelesen …</p>`);
      } else if (readMessage) {
        $$renderer3.push(`<!--[1--><p class="hint error">${escape_html(readMessage)}</p>`);
      } else if (receiptRecognition) {
        $$renderer3.push(`<!--[2--><p class="hint">Fotografierte Bons werden automatisch ausgelesen (über Claude von Anthropic).</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div> `);
      if (receipt && receiptRows().length) {
        $$renderer3.push(`<!--[0--><div class="field receipt-items svelte-1gdlsiu"><span class="label svelte-1gdlsiu">Positionen auf dem Bon</span> <p class="hint" style="margin-top: 0">Abgewählte Positionen werden nicht geteilt – sie trägt ${escape_html(type === "income" ? "der Empfänger" : "der Zahler")} selbst.</p> <!--[-->`);
        const each_array_1 = ensure_array_like(receiptRows());
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let r = each_array_1[$$index_1];
          $$renderer3.push(`<label${attr_class("check item svelte-1gdlsiu", void 0, { "off": receipt.deselected.includes(r.index) })}><input type="checkbox"${attr("checked", !receipt.deselected.includes(r.index), true)}/> <span class="grow svelte-1gdlsiu">${escape_html(r.description)}</span> <span class="amount svelte-1gdlsiu">${escape_html(formatAmount(r.amount, receipt.result.currency ?? currency))}</span></label>`);
        }
        $$renderer3.push(`<!--]--> `);
        if (receipt.deselected.length) {
          $$renderer3.push(`<!--[0--><p class="hint"><strong>Gemeinsam: ${escape_html(formatAmount(amount() - privateAmount(), currency))}</strong> von ${escape_html(formatAmount(amount(), currency))}</p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="row"><div class="field grow"><label for="date">Datum</label> <input id="date" type="date"${attr("value", date)} required=""/></div> <div class="field grow"><label for="category">Kategorie</label> `);
      $$renderer3.select({ id: "category", value: categoryId }, ($$renderer4) => {
        $$renderer4.option({ value: null }, ($$renderer5) => {
          $$renderer5.push(`–`);
        });
        $$renderer4.push(`<!--[-->`);
        const each_array_2 = ensure_array_like(categories.filter((c) => !c.hidden || c.id === categoryId));
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let c = each_array_2[$$index_2];
          $$renderer4.option({ value: c.id }, ($$renderer5) => {
            $$renderer5.push(`${escape_html(c.icon)} ${escape_html(c.name)}`);
          });
        }
        $$renderer4.push(`<!--]-->`);
      });
      $$renderer3.push(`</div></div></div> <div class="card"><div class="row" style="justify-content: space-between"><h2>${escape_html(type === "income" ? "Erhalten von" : "Bezahlt von")}</h2> <label class="check small"><input type="checkbox"${attr("checked", multiPayer, true)}/> mehrere</label></div> `);
      if (!multiPayer) {
        $$renderer3.push(`<!--[0--><div class="chips svelte-1gdlsiu"><!--[-->`);
        const each_array_3 = ensure_array_like(members);
        for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
          let m = each_array_3[$$index_3];
          $$renderer3.push(`<button type="button"${attr_class("chip svelte-1gdlsiu", void 0, { "active": payer === m.personId })}>`);
          Avatar($$renderer3, { name: m.name, color: m.color, url: m.avatarUrl, size: 24 });
          $$renderer3.push(`<!----> ${escape_html(m.name)}</button>`);
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push(`<!--[-1--><!--[-->`);
        const each_array_4 = ensure_array_like(members);
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          let m = each_array_4[$$index_4];
          $$renderer3.push(`<div class="person-row svelte-1gdlsiu">`);
          Avatar($$renderer3, { name: m.name, color: m.color, url: m.avatarUrl, size: 28 });
          $$renderer3.push(`<!----> <span class="grow">${escape_html(m.name)}</span> <input class="num svelte-1gdlsiu" inputmode="decimal" placeholder="0,00"${attr("value", payerAmounts[m.personId])}/></div>`);
        }
        $$renderer3.push(`<!--]--> <p${attr_class("hint", void 0, { "error": payerSum() !== amount() })}>Summe ${escape_html(formatAmount(payerSum(), currency))} von ${escape_html(formatAmount(amount(), currency))}</p>`);
      }
      $$renderer3.push(`<!--]--></div> <div class="card"><h2>${escape_html(type === "income" ? "Gutgeschrieben für" : "Aufgeteilt auf")}</h2> `);
      if (showPrivate && privateAmount() > 0 && amount() > privateAmount()) {
        $$renderer3.push(`<!--[0--><p class="hint" style="margin-top: -0.3rem">Geteilt werden ${escape_html(formatAmount(amount() - privateAmount(), currency))} (ohne die ${escape_html(formatAmount(privateAmount(), currency))} privaten Anteil).</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (profiles.length) {
        $$renderer3.push(`<!--[0--><div class="chips svelte-1gdlsiu" style="margin-bottom: 0.6rem"><!--[-->`);
        const each_array_5 = ensure_array_like(profiles);
        for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
          let p = each_array_5[$$index_5];
          $$renderer3.push(`<button type="button"${attr_class("chip profile svelte-1gdlsiu", void 0, { "active": profileId === p.id })}>${escape_html(p.icon)} ${escape_html(p.name)}</button>`);
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="segmented" style="margin-bottom: 0.6rem"><!--[-->`);
      const each_array_6 = ensure_array_like(Object.entries(modeLabels));
      for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
        let [k, label] = each_array_6[$$index_6];
        $$renderer3.push(`<button type="button"${attr_class("", void 0, { "active": !profile() && mode === k })}>${escape_html(label)}</button>`);
      }
      $$renderer3.push(`<!--]--></div> `);
      if (keepFilter && legacyFilter) {
        $$renderer3.push(`<!--[0--><p class="hint" style="margin-top: -0.3rem">Diese Ausgabe ist nach Merkmalen aufgeteilt${escape_html(legacyFilter.require?.length ? ` (nur „${legacyFilter.require.join("“, „")}“)` : "")}${escape_html(legacyFilter.exclude?.length ? ` (ohne „${legacyFilter.exclude.join("“, „")}“)` : "")}. <button type="button" class="link small">Filter entfernen</button></p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (profile() || mode !== "individual") {
        $$renderer3.push(`<!--[0--><label class="check small weighting svelte-1gdlsiu"><input type="checkbox"${attr("checked", equalWeights, true)}/> Alle gleich gewichten (Faktoren ignorieren)</label>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (profile()) {
        $$renderer3.push(`<!--[0--><p class="hint" style="margin-top: -0.4rem">Profil „${escape_html(profile().name)}“: Ändert sich das Profil oder kommen Personen dazu, wird die Ausgabe automatisch neu aufgeteilt.</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (!profile() && mode === "individual") {
        $$renderer3.push(`<!--[0--><div class="segmented small-seg svelte-1gdlsiu" style="margin-bottom: 0.5rem"><button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": indivMode === "shares" })}>Anteile</button> <button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": indivMode === "percent" })}>Prozent</button> <button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": indivMode === "amounts" })}>Beträge</button></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <!--[-->`);
      const each_array_7 = ensure_array_like(members);
      for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
        let m = each_array_7[$$index_7];
        const share = preview() && "shares" in preview() ? preview().shares?.get(m.personId) : void 0;
        $$renderer3.push(`<div${attr_class("person-row svelte-1gdlsiu", void 0, { "dim": !share })}>`);
        if (!profile() && (mode === "all_except" || mode === "only")) {
          $$renderer3.push(`<!--[0--><input type="checkbox"${attr("checked", selected[m.personId], true)}${attr("aria-label", m.name)}/>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        Avatar($$renderer3, { name: m.name, color: m.color, url: m.avatarUrl, size: 28 });
        $$renderer3.push(`<!----> <span class="grow svelte-1gdlsiu">${escape_html(m.name)} `);
        if (share && (profile() || mode !== "individual")) {
          $$renderer3.push(`<!--[0--><button type="button"${attr_class("badge factor svelte-1gdlsiu", void 0, { "std": factorOf(m) === 1 })}${attr("title", `Faktor ${stringify(String(factorOf(m)).replace(".", ","))}: ${stringify(factorSource(m))}`)}>×${escape_html(String(factorOf(m)).replace(".", ","))}</button>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (mode === "all_except" && selected[m.personId]) {
          $$renderer3.push(`<!--[0--><span class="badge">ausgenommen</span>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></span> `);
        if (!profile() && mode === "individual") {
          $$renderer3.push(`<!--[0--><input class="num svelte-1gdlsiu" inputmode="decimal"${attr("placeholder", indivMode === "shares" ? "0" : indivMode === "percent" ? "0 %" : "0,00")}${attr("value", indivValues[m.personId])}/>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (showPeriod) {
          $$renderer3.push(`<!--[0--><span class="badge">${escape_html(unitLabel(unitsOf(m)))}</span>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <span class="amount share svelte-1gdlsiu">${escape_html(share ? formatAmount(share, currency) : "–")}</span></div> `);
        if (factorOpen === m.personId && share) {
          $$renderer3.push(`<!--[0--><p class="hint factor-info svelte-1gdlsiu">Faktor ${escape_html(String(factorOf(m)).replace(".", ","))} – ${escape_html(factorSource(m))}`);
          if (showPeriod) {
            $$renderer3.push(`<!--[0-->${escape_html(` × ${unitLabel(unitsOf(m))}`)}`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->. `);
          if (!equalWeights) {
            $$renderer3.push(`<!--[0-->Mit „Alle gleich“ zählt jede Person 1.`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--> `);
      if ((profile() || mode !== "individual") && preview() && "shares" in preview()) {
        $$renderer3.push(`<!--[0--><p class="hint">Tippe auf ×-Faktor einer Person, um zu sehen, woher er kommt.</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (preview() && "error" in preview()) {
        $$renderer3.push(`<!--[0--><p class="hint error">${escape_html(preview().error)}</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (mode === "all" || mode === "all_except") {
        $$renderer3.push(`<!--[0--><p class="hint">Personen, die später dazukommen, werden automatisch beteiligt (je nach Teilnahmezeitraum).</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div> <div class="card"><label class="check"><input type="checkbox"${attr("checked", showPrivate, true)}/> Privater Anteil (z.B. eigener Einkauf auf dem Bon)</label> `);
      if (showPrivate) {
        $$renderer3.push(`<!--[0--><input${attr("value", privateText)} inputmode="decimal" placeholder="0,00" aria-label="Privater Anteil"/> `);
        if (privateAmount() > 0 && amount() > 0) {
          $$renderer3.push(`<!--[0--><div class="private-calc svelte-1gdlsiu"><div class="row"><span class="grow">Betrag (ganzer Bon)</span><span class="amount">${escape_html(formatAmount(amount(), currency))}</span></div> <div class="row"><span class="grow">− privat, wird abgezogen</span><span class="amount">${escape_html(formatAmount(privateAmount(), currency))}</span></div> <div class="row total svelte-1gdlsiu"><span class="grow">= wird geteilt</span><span class="amount">${escape_html(formatAmount(amount() - privateAmount(), currency))}</span></div></div> <p class="hint">Oben bleibt der volle Betrag stehen. Den privaten Teil trägt ${escape_html(type === "income" ? "der Empfänger" : "der Zahler")} allein.</p>`);
        } else {
          $$renderer3.push(`<!--[-1--><p class="hint">Trage oben den <strong>vollen Betrag</strong> ein und hier nur den privaten Teil – er wird vom Betrag abgezogen und
					nicht geteilt.</p>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <label class="check"><input type="checkbox"${attr("checked", showPeriod, true)}/> Nach Aufenthaltsdauer aufteilen (z.B. Unterkunft)</label> `);
      if (showPeriod) {
        $$renderer3.push(`<!--[0--><div class="row"><div class="field grow"><label for="pf">Von</label><input id="pf" type="date"${attr("value", periodFrom)}/></div> <div class="field grow"><label for="pt">Bis</label><input id="pt" type="date"${attr("value", periodTo)}/></div></div> <div class="segmented small-seg svelte-1gdlsiu"><button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": periodUnit === "nights" })}>Nächte zählen</button> <button type="button"${attr_class("svelte-1gdlsiu", void 0, { "active": periodUnit === "days" })}>Tage zählen</button></div> <p class="hint">`);
        if (periodUnit === "nights") {
          $$renderer3.push(`<!--[0--><strong>Nächte</strong> (z.B. Unterkunft): ${escape_html(unitLabel(periodTotal()))} im Zeitraum. Der Abreisetag zählt nicht – wer vom 1. bis 5. da ist, zahlt 4 Nächte.`);
        } else {
          $$renderer3.push(`<!--[-1--><strong>Tage</strong> (z.B. Mietwagen, Skipass): ${escape_html(unitLabel(periodTotal()))} im Zeitraum. An- und Abreisetag zählen beide – wer vom 1. bis 5. da ist, zahlt 5 Tage.`);
        }
        $$renderer3.push(`<!--]--> Jeder zahlt Faktor × eigene ${escape_html(periodUnit === "nights" ? "Nächte" : "Tage")}; die An- und Abreise stehen bei den Mitgliedern unter „Dabei ab/bis“.</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="field" style="margin-top: 0.75rem"><label for="notes">Notiz</label> <textarea id="notes" rows="2">`);
      const $$body = escape_html(notes);
      if ($$body) {
        $$renderer3.push(`${$$body}`);
      }
      $$renderer3.push(`</textarea></div></div> <button class="primary full"${attr("disabled", !title || !amount() || preview() !== null && "error" in preview(), true)}>Speichern</button></form>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { ExpenseForm as E };
//# sourceMappingURL=ExpenseForm.js-Cgu2iNdt.js.map
