import { aa as head, a6 as escape_html } from '../../../../../../chunks/index.js-BT3kaB_g.js';
import { E as ExpenseForm } from '../../../../../../chunks/ExpenseForm.js-Cgu2iNdt.js';
import '../../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../../../chunks/state.svelte.js-aCWhrotV.js';
import '../../../../../../chunks/split.js-Diu3SqNm.js';
import '../../../../../../chunks/currency.js-B45uFFG3.js';
import '../../../../../../chunks/format.js-Cn5c-OM3.js';
import '../../../../../../chunks/Avatar.js-BAGJaOlv.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    head("9j2c64", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Neue Ausgabe · ${escape_html(data.group.name)}</title>`);
      });
    });
    $$renderer2.push(`<h2>Neue Ausgabe</h2> `);
    ExpenseForm($$renderer2, {
      groupId: data.group.id,
      baseCurrency: data.group.baseCurrency,
      members: data.members,
      categories: data.categories,
      profiles: data.profiles,
      groupPeriod: { from: data.group.startDate, to: data.group.endDate },
      receiptRecognition: data.receiptRecognition,
      initialAttachmentIds: data.shared,
      currencies: data.currencies,
      meId: data.user.id,
      error: form?.message
    });
    $$renderer2.push(`<!---->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-DRl5pdOd.js.map
