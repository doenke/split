import './state.svelte.js-aCWhrotV.js';
import './exports.js-B9Uzt4sy.js';
import './utils2.js-ejsMtG81.js';
import './utils.js-BjQHIhHk.js';
import './root.js-CNKyZyh6.js';
import { a3 as getContext } from './index.js-BT3kaB_g.js';

function context() {
  return getContext("__request__");
}
const page$1 = {
  get error() {
    return context().page.error;
  },
  get params() {
    return context().page.params;
  },
  get status() {
    return context().page.status;
  },
  get url() {
    return context().page.url;
  }
};
const page = page$1;

export { page as p };
//# sourceMappingURL=index2.js-OgeU73zK.js.map
