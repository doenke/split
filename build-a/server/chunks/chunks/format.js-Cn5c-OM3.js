function formatDate(iso, opts = { day: "numeric", month: "short", year: "numeric" }) {
  return (/* @__PURE__ */ new Date(iso + (iso.length === 10 ? "T12:00:00" : ""))).toLocaleDateString("de-DE", opts);
}
function today() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export { formatDate as f, today as t };
//# sourceMappingURL=format.js-Cn5c-OM3.js.map
