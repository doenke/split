import { W as noop } from './index.js-BT3kaB_g.js';
import './exports.js-B9Uzt4sy.js';
import './utils.js-BjQHIhHk.js';
import './root.js-CNKyZyh6.js';

const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
const placeholder_url = "a:";
if (is_legacy) {
  ({
    url: new URL(placeholder_url)
  });
} else {
  new class Page {
    data = {};
    form = null;
    error = null;
    params = {};
    route = { id: null };
    state = {};
    status = -1;
    url = new URL(placeholder_url);
  }();
}
//# sourceMappingURL=state.svelte.js-aCWhrotV.js.map
