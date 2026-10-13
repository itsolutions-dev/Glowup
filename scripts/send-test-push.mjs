#!/usr/bin/env node
// Sends a test Web Push to one browser subscription, for checking the
// @its/glowup-notifications web path end to end (the /notifications page shows
// the subscription under "Push token").
//
//   npm run push:test -- subscription.json
//   npm run push:test -- '{"endpoint":"…","keys":{"p256dh":"…","auth":"…"}}' --title "Hi"
//
// Options: --title, --body, --url, --data '<json>', --action id:Title (repeatable),
//          --id, --ttl <seconds>.
// In Git Bash, prefix MSYS_NO_PATHCONV=1 when --url starts with "/": MSYS
// rewrites it into a Windows path otherwise.
//
// The VAPID pair comes from .env.vapid.local at the repo root (VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT), or from environment variables of the same
// names, which win. The private key is never printed.
//
// No dependency: VAPID (RFC 8292) and the aes128gcm content encoding (RFC 8291)
// are done with node:crypto, and the request with fetch.
import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_FILE = fileURLToPath(new URL("../.env.vapid.local", import.meta.url));
const RECORD_SIZE = 4096;

const b64url = (buffer) => Buffer.from(buffer).toString("base64url");
const fromB64url = (value) => Buffer.from(value, "base64url");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
const fail = (message) => {
  console.error(`send-test-push: ${message}`);
  process.exit(1);
};

function parseArgs(argv) {
  const options = { actions: [] };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const value = argv[++i];
    if (value === undefined) fail(`${arg} needs a value`);
    const name = arg.slice(2);
    if (name === "action") {
      const [id, ...title] = value.split(":");
      options.actions.push({ action: id, title: title.join(":") || id });
    } else if (["title", "body", "url", "data", "id", "ttl"].includes(name)) {
      options[name] = value;
    } else {
      fail(`unknown option ${arg}`);
    }
  }
  return { subscriptionArg: positional[0], options };
}

function readVapid() {
  const fromFile = {};
  if (existsSync(ENV_FILE)) {
    for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
      const match = /^\s*(VAPID_[A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (match) fromFile[match[1]] = match[2];
    }
  }
  const read = (name) => process.env[name] || fromFile[name];
  const vapid = {
    publicKey: read("VAPID_PUBLIC_KEY"),
    privateKey: read("VAPID_PRIVATE_KEY"),
    subject: read("VAPID_SUBJECT"),
  };
  if (!vapid.publicKey || !vapid.privateKey) {
    fail(
      "no VAPID pair: create .env.vapid.local (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT) or set those variables.",
    );
  }
  if (!vapid.subject || !/^(mailto:|https:)/.test(vapid.subject)) {
    fail("VAPID_SUBJECT must be a mailto: or https: contact.");
  }
  return vapid;
}

function readSubscription(arg) {
  if (!arg) fail("pass the subscription JSON, or a file containing it.");
  const text = arg.trim().startsWith("{") ? arg : readFileSync(arg, "utf8");
  let subscription;
  try {
    subscription = JSON.parse(text);
  } catch {
    fail("the subscription is not valid JSON.");
  }
  if (
    !subscription?.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    fail("the subscription needs endpoint, keys.p256dh and keys.auth.");
  }
  return subscription;
}

/** VAPID: an ES256 JWT for the push service's origin, signed with the private key. */
function vapidAuthorization(endpoint, vapid) {
  const publicKey = fromB64url(vapid.publicKey);
  if (publicKey.length !== 65)
    fail("VAPID_PUBLIC_KEY is not a 65-byte P-256 key.");
  const key = createPrivateKey({
    format: "jwk",
    key: {
      kty: "EC",
      crv: "P-256",
      d: vapid.privateKey,
      x: b64url(publicKey.subarray(1, 33)),
      y: b64url(publicKey.subarray(33, 65)),
    },
  });
  const header = b64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = b64url(
    JSON.stringify({
      aud: new URL(endpoint).origin,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: vapid.subject,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signature = sign("sha256", Buffer.from(unsigned), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `vapid t=${unsigned}.${b64url(signature)}, k=${vapid.publicKey}`;
}

/** RFC 8291: encrypts the payload for the subscription's keys, in one aes128gcm record. */
export function encrypt(
  payload,
  subscription,
  { salt = randomBytes(16), ecdh } = {},
) {
  const clientPublic = fromB64url(subscription.keys.p256dh);
  const authSecret = fromB64url(subscription.keys.auth);
  const server = ecdh ?? createECDH("prime256v1");
  if (!ecdh) server.generateKeys();
  const serverPublic = server.getPublicKey();
  const shared = server.computeSecret(clientPublic);

  const ikm = hmac(
    hmac(authSecret, shared),
    Buffer.concat([
      Buffer.from("WebPush: info\0"),
      clientPublic,
      serverPublic,
      Buffer.from([1]),
    ]),
  );
  const prk = hmac(salt, ikm);
  const cek = hmac(
    prk,
    Buffer.from("Content-Encoding: aes128gcm\0\x01"),
  ).subarray(0, 16);
  const nonce = hmac(
    prk,
    Buffer.from("Content-Encoding: nonce\0\x01"),
  ).subarray(0, 12);

  // 0x02 marks the last (and only) record; no extra padding.
  const plaintext = Buffer.concat([Buffer.from(payload), Buffer.from([2])]);
  if (plaintext.length + 16 > RECORD_SIZE - 86)
    fail("payload too large for one record.");
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(RECORD_SIZE, 16);
  header.writeUInt8(serverPublic.length, 20);
  return Buffer.concat([header, serverPublic, body]);
}

function buildPayload(options) {
  let data = { source: "send-test-push" };
  if (options.data) {
    try {
      data = JSON.parse(options.data);
    } catch {
      fail("--data must be JSON.");
    }
  }
  return JSON.stringify({
    id: options.id ?? `test-${Date.now()}`,
    title: options.title ?? "Test push",
    body:
      options.body ??
      `Sent by scripts/send-test-push.mjs at ${new Date().toLocaleTimeString()}.`,
    data,
    ...(options.url && { url: options.url }),
    ...(options.actions.length > 0 && { actions: options.actions }),
  });
}

async function main() {
  const { subscriptionArg, options } = parseArgs(process.argv.slice(2));
  const subscription = readSubscription(subscriptionArg);
  const vapid = readVapid();
  const payload = buildPayload(options);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuthorization(subscription.endpoint, vapid),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(options.ttl ?? 600),
      Urgency: "normal",
    },
    body: encrypt(payload, subscription),
  });

  const service = new URL(subscription.endpoint).host;
  if (response.ok) {
    console.log(`Sent to ${service} (HTTP ${response.status}).`);
    console.log(`Payload: ${payload}`);
    return;
  }
  const detail = (await response.text()).trim().slice(0, 500);
  // 404 / 410: the browser dropped this subscription; fetch a new one from the page.
  fail(
    `${service} answered HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
  );
}

// Run as a script, not when imported (the encryption is reused by a check).
const invokedPath = process.argv[1]
  ? resolve(process.argv[1]).toLowerCase()
  : "";
if (invokedPath === fileURLToPath(import.meta.url).toLowerCase()) {
  // fetch reports every network problem as "fetch failed"; the cause says which.
  main().catch((error) =>
    fail(
      error.cause
        ? `${error.message} (${error.cause.code ?? error.cause.message})`
        : error.message,
    ),
  );
}
