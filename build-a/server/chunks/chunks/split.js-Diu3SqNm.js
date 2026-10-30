class SplitError extends Error {
}
function allocate(total, weights) {
  const result = /* @__PURE__ */ new Map();
  const entries = [...weights.entries()].filter(([, w]) => w > 0);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  for (const id of weights.keys()) result.set(id, 0);
  if (total === 0) return result;
  if (sum <= 0) throw new SplitError("Niemand ist an dieser Ausgabe beteiligt.");
  const sign = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  let distributed = 0;
  const remainders = [];
  entries.forEach(([id, w], idx) => {
    const exact = abs * w / sum;
    const floor = Math.floor(exact + 1e-9);
    result.set(id, floor);
    distributed += floor;
    remainders.push({ id, rem: exact - floor, idx });
  });
  remainders.sort((a, b) => b.rem - a.rem || a.idx - b.idx);
  for (let i = 0; i < abs - distributed; i++) {
    const r = remainders[i % remainders.length];
    result.set(r.id, result.get(r.id) + 1);
  }
  if (sign < 0) for (const [id, v] of result) result.set(id, -v);
  return result;
}
function dayNumber(d) {
  return Math.round(Date.parse(d + "T00:00:00Z") / 864e5);
}
function isActiveOn(member, date) {
  if (member.from && date < member.from) return false;
  if (member.to && date > member.to) return false;
  return true;
}
function presentUnits(member, period) {
  const pStart = dayNumber(period.from);
  const pEnd = dayNumber(period.to) - (period.unit === "nights" ? 1 : 0);
  const mStart = member.from ? dayNumber(member.from) : -Infinity;
  const mEnd = member.to ? dayNumber(member.to) - (period.unit === "nights" ? 1 : 0) : Infinity;
  const start = Math.max(pStart, mStart);
  const end = Math.min(pEnd, mEnd);
  return Math.max(0, end - start + 1);
}
function matchesTagFilter(member, rule) {
  const f = rule.tagFilter;
  if (!f) return true;
  if (f.require?.some((t) => !member.tags.includes(t))) return false;
  if (f.exclude?.some((t) => member.tags.includes(t))) return false;
  return true;
}
function effectiveFactor(member, overrides) {
  const p = overrides?.persons?.[member.personId];
  if (p !== void 0) return p;
  const tagValues = member.tags.map((t) => overrides?.tags?.[t]).filter((v) => v !== void 0);
  if (tagValues.length) return Math.min(...tagValues);
  return member.factor;
}
function participants(members, rule, date, period) {
  const active = (m) => period ? presentUnits(m, period) > 0 : isActiveOn(m, date);
  switch (rule.type) {
    case "all":
      return members.filter((m) => active(m) && matchesTagFilter(m, rule));
    case "all_except":
      return members.filter(
        (m) => active(m) && matchesTagFilter(m, rule) && !rule.excluded.includes(m.personId)
      );
    case "only":
      return members.filter((m) => rule.included.includes(m.personId) && matchesTagFilter(m, rule));
    case "individual":
      return members.filter((m) => (rule.values[m.personId] ?? 0) > 0);
  }
}
function computeShares(expense, members) {
  if (expense.frozenShares) return new Map(Object.entries(expense.frozenShares));
  const rule = expense.rule;
  const shared = expense.baseAmount - (expense.privateAmount ?? 0);
  const shares = /* @__PURE__ */ new Map();
  if (rule.type === "individual" && rule.mode === "amounts") {
    let sum = 0;
    for (const [id, v] of Object.entries(rule.values)) {
      if (v === 0) continue;
      shares.set(id, v);
      sum += v;
    }
    if (sum !== shared) {
      throw new SplitError(
        `Die Einzelbeträge (${sum}) ergeben nicht den Gesamtbetrag (${shared}).`
      );
    }
    return shares;
  }
  let rest = shared;
  for (const [id, v] of Object.entries(rule.fixed ?? {})) {
    shares.set(id, (shares.get(id) ?? 0) + v);
    rest -= v;
  }
  if (rest === 0) return shares;
  const weights = /* @__PURE__ */ new Map();
  for (const m of participants(members, rule, expense.date, expense.period)) {
    let w;
    if (rule.type === "individual") {
      w = rule.values[m.personId] ?? 0;
    } else {
      w = rule.equalWeights ? 1 : effectiveFactor(m, rule.factorOverrides);
      if (expense.period) w *= presentUnits(m, expense.period);
    }
    if (w > 0) weights.set(m.personId, w);
  }
  for (const [id, v] of allocate(rest, weights)) shares.set(id, (shares.get(id) ?? 0) + v);
  return shares;
}
function computePaid(expense) {
  const shared = expense.baseAmount - (expense.privateAmount ?? 0);
  const weights = /* @__PURE__ */ new Map();
  for (const p of expense.payers) weights.set(p.personId, (weights.get(p.personId) ?? 0) + p.amount);
  return allocate(shared, weights);
}

export { SplitError as S, computeShares as a, computePaid as c, effectiveFactor as e, presentUnits as p };
//# sourceMappingURL=split.js-Diu3SqNm.js.map
