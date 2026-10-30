import { a9 as ensure_array_like, a4 as attr, a7 as stringify, a6 as escape_html } from './index.js-BT3kaB_g.js';

function KasseSwitchDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { switched = [] } = $$props;
    const list = (names) => names.length > 1 ? names.slice(0, -1).join(", ") + " und " + names.at(-1) : names[0];
    $$renderer2.push(`<dialog class="switch svelte-1i7yhy9" aria-labelledby="switch-title"><h2 id="switch-title" class="svelte-1i7yhy9">Abrechnung umgestellt</h2> <p>Wer in derselben Kasse ist, gleicht in einer Gruppe gemeinsam aus. Deshalb rechnen jetzt gemeinsam ab:</p> <ul class="svelte-1i7yhy9"><!--[-->`);
    const each_array = ensure_array_like(switched);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let s = each_array[$$index];
      $$renderer2.push(`<li class="svelte-1i7yhy9"><a${attr("href", `/gruppen/${stringify(s.groupId)}/salden`)}><strong>${escape_html(s.groupName)}</strong></a>: ${escape_html(list(s.names))}
				${escape_html(s.names.length > 1 ? "rechnen" : "rechnet")} jetzt über die Kasse <strong>${escape_html(s.kasseName)}</strong> ab</li>`);
    }
    $$renderer2.push(`<!--]--></ul> <p class="small muted">Abgeschlossene Gruppen bleiben unverändert. Unter „Mitglieder“ lässt sich das je Person wieder ändern.</p> <form method="dialog"><button class="primary full">OK</button></form></dialog>`);
  });
}

export { KasseSwitchDialog as K };
//# sourceMappingURL=KasseSwitchDialog.js-CcYeHW3P.js.map
