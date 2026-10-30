import { createHash, randomBytes } from 'node:crypto';

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function newId(length = 16) {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
function newToken() {
  return randomBytes(32).toString("base64url");
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("base64url");
}

export { newToken as a, hashToken as h, newId as n };
//# sourceMappingURL=ids.js-2U6-pnrm.js.map
