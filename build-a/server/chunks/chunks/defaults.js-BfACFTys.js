import { d as db, c as categories } from './index3.js-LeA4cvVT.js';

const defaultCategories = [
  { id: "food", name: "Essen & Trinken", icon: "🍽️", color: "#e76f51" },
  { id: "groceries", name: "Lebensmittel", icon: "🛒", color: "#2a9d8f" },
  { id: "accommodation", name: "Unterkunft", icon: "🏠", color: "#264653" },
  { id: "transport", name: "Transport", icon: "🚆", color: "#00798c" },
  { id: "fuel", name: "Sprit", icon: "⛽", color: "#edae49" },
  { id: "activities", name: "Aktivitäten", icon: "🎯", color: "#8e7dbe" },
  { id: "tickets", name: "Eintritt", icon: "🎟️", color: "#d1495b" },
  { id: "shopping", name: "Einkauf", icon: "🛍️", color: "#f4a261" },
  { id: "other", name: "Sonstiges", icon: "📦", color: "#6c757d" }
];
async function seedDefaults() {
  await db.insert(categories).values(defaultCategories.map((c, i) => ({ ...c, groupId: null, sort: i }))).onConflictDoNothing();
}

export { defaultCategories as d, seedDefaults as s };
//# sourceMappingURL=defaults.js-BfACFTys.js.map
