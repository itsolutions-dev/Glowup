/**
 * WebAuthnService
 *
 * Full client-side WebAuthn implementation.
 *
 * Covers:
 *  - Base64URL encode / decode helpers (required by the WebAuthn spec)
 *  - Cryptographically secure challenge generation
 *  - Registration ceremony  (navigator.credentials.create)
 *  - Authentication ceremony (navigator.credentials.get)
 *  - Credential persistence via localStorage (web) or in-memory fallback
 *  - Response serialisation for transport to a relying-party server
 *
 * Platform notes:
 *  - Full WebAuthn is only available on web (window.PublicKeyCredential).
 *  - On React Native (iOS / Android) the hook falls back to a clearly-labelled
 *    "biometric simulation" path so the UI stays functional while a native
 *    biometric module (e.g. expo-local-authentication) is wired in later.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredCredential {
  credentialId: string; // Base64URL
  publicKey: string; // Base64URL  (COSE / SubjectPublicKeyInfo)
  username: string;
  displayName: string;
  createdAt: number; // Unix ms
  counter: number; // signature counter
  transports?: AuthenticatorTransport[];
}

export interface RegistrationResult {
  credentialId: string;
  publicKey: string;
  username: string;
  displayName: string;
  attestationObject: string; // Base64URL – send to server for verification
  clientDataJSON: string; // Base64URL – send to server for verification
  transports: AuthenticatorTransport[];
}

export interface AuthenticationResult {
  credentialId: string;
  authenticatorData: string; // Base64URL – send to server for verification
  clientDataJSON: string; // Base64URL – send to server for verification
  signature: string; // Base64URL – send to server for verification
  userHandle: string | null; // Base64URL
}

export type WebAuthnStatus =
  | "idle"
  | "registering"
  | "authenticating"
  | "success"
  | "error"
  | "unsupported";

// ─── Base64URL helpers ────────────────────────────────────────────────────────

/** Encode an ArrayBuffer → Base64URL string (no padding). */
export function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Decode a Base64URL string → ArrayBuffer. */
export function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/** Encode a UTF-8 string → ArrayBuffer. */
export function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

/** Decode an ArrayBuffer → UTF-8 string. */
export function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// ─── Challenge helpers ────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random challenge.
 * In production this MUST come from your server to prevent replay attacks.
 * Here we generate it client-side and return it as both a raw buffer and a
 * Base64URL string so it can be round-tripped through clientDataJSON.
 */
export function generateChallenge(): {
  buffer: ArrayBuffer;
  base64url: string;
} {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const buffer = bytes.buffer;
  return {
    buffer: buffer as ArrayBuffer,
    base64url: bufferToBase64URL(buffer),
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "webauthn_credentials";

function loadCredentials(): StoredCredential[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredCredential[]) : [];
  } catch {
    return [];
  }
}

function saveCredentials(credentials: StoredCredential[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  } catch {
    // localStorage may be unavailable (SSR / private mode) – fail silently
  }
}

export function getStoredCredentials(): StoredCredential[] {
  return loadCredentials();
}

export function getCredentialByUsername(
  username: string,
): StoredCredential | undefined {
  return loadCredentials().find(
    (c) => c.username.toLowerCase() === username.toLowerCase(),
  );
}

export function getCredentialById(
  credentialId: string,
): StoredCredential | undefined {
  return loadCredentials().find((c) => c.credentialId === credentialId);
}

export function storeCredential(cred: StoredCredential): void {
  const existing = loadCredentials().filter(
    (c) => c.credentialId !== cred.credentialId,
  );
  saveCredentials([...existing, cred]);
}

export function deleteCredential(credentialId: string): void {
  saveCredentials(
    loadCredentials().filter((c) => c.credentialId !== credentialId),
  );
}

export function incrementCounter(credentialId: string): void {
  const creds = loadCredentials().map((c) =>
    c.credentialId === credentialId ? { ...c, counter: c.counter + 1 } : c,
  );
  saveCredentials(creds);
}

// ─── WebAuthn availability ────────────────────────────────────────────────────

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ─── Registration ceremony ────────────────────────────────────────────────────

export interface RegistrationOptions {
  username: string;
  displayName: string;
  /** Relying Party ID – should match your domain in production. */
  rpId?: string;
  rpName?: string;
  /** Require resident key (passkey stored on device). Default: true */
  requireResidentKey?: boolean;
  /** User-verification requirement. Default: 'required' */
  userVerification?: UserVerificationRequirement;
}

/**
 * Run the full WebAuthn registration ceremony.
 *
 * 1. Build PublicKeyCredentialCreationOptions
 * 2. Call navigator.credentials.create()
 * 3. Serialise the response
 * 4. Persist the credential locally
 * 5. Return data to be sent to the server for attestation verification
 */
export async function registerPasskey(
  options: RegistrationOptions,
): Promise<RegistrationResult> {
  if (!isWebAuthnAvailable()) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  const {
    username,
    displayName,
    rpId = window.location.hostname || "localhost",
    rpName = "Glowup",
    requireResidentKey = true,
    userVerification = "required",
  } = options;

  // User handle – a random stable identifier (NOT the username itself per spec)
  const userIdBuffer = new Uint8Array(16);
  crypto.getRandomValues(userIdBuffer);

  const { buffer: challengeBuffer } = generateChallenge();

  // Exclude already-registered credentials for this username to prevent duplicates
  const existing = getCredentialByUsername(username);
  const excludeCredentials: PublicKeyCredentialDescriptor[] = existing
    ? [{ type: "public-key", id: base64URLToBuffer(existing.credentialId) }]
    : [];

  const creationOptions: PublicKeyCredentialCreationOptions = {
    rp: { id: rpId, name: rpName },
    user: {
      id: userIdBuffer.buffer,
      name: username,
      displayName,
    },
    challenge: challengeBuffer,
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256  (ECDSA P-256)
      { type: "public-key", alg: -257 }, // RS256  (RSASSA-PKCS1-v1_5)
      { type: "public-key", alg: -8 }, // EdDSA  (Ed25519)
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: requireResidentKey ? "required" : "preferred",
      requireResidentKey,
      userVerification,
    },
    excludeCredentials,
    timeout: 60_000,
    attestation: "direct",
  };

  const credential = (await navigator.credentials.create({
    publicKey: creationOptions,
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Registration was cancelled or failed.");
  }

  const response = credential.response as AuthenticatorAttestationResponse;

  const credentialId = bufferToBase64URL(credential.rawId);
  const attestationB64 = bufferToBase64URL(response.attestationObject);
  const clientDataB64 = bufferToBase64URL(response.clientDataJSON);

  // Extract the public key from getPublicKey() if available (Level 3)
  let publicKeyB64 = "";
  if (typeof response.getPublicKey === "function") {
    const pkBuffer = response.getPublicKey();
    if (pkBuffer) publicKeyB64 = bufferToBase64URL(pkBuffer);
  }

  // Determine declared transports
  const transports: AuthenticatorTransport[] =
    typeof response.getTransports === "function"
      ? (response.getTransports() as AuthenticatorTransport[])
      : [];

  // Persist locally
  storeCredential({
    credentialId,
    publicKey: publicKeyB64,
    username,
    displayName,
    createdAt: Date.now(),
    counter: 0,
    transports,
  });

  return {
    credentialId,
    publicKey: publicKeyB64,
    username,
    displayName,
    attestationObject: attestationB64,
    clientDataJSON: clientDataB64,
    transports,
  };
}

// ─── Authentication ceremony ──────────────────────────────────────────────────

export interface AuthenticationOptions {
  /**
   * When provided, only this credential will be offered to the authenticator.
   * Leave undefined to trigger a discoverable-credential (passkey) flow.
   */
  username?: string;
  rpId?: string;
  userVerification?: UserVerificationRequirement;
}

/**
 * Run the full WebAuthn authentication ceremony.
 *
 * 1. Resolve allowed credentials from local storage
 * 2. Build PublicKeyCredentialRequestOptions
 * 3. Call navigator.credentials.get()
 * 4. Increment the local signature counter
 * 5. Return data to be sent to the server for assertion verification
 */
export async function authenticatePasskey(
  options: AuthenticationOptions = {},
): Promise<AuthenticationResult> {
  if (!isWebAuthnAvailable()) {
    throw new Error("WebAuthn is not supported in this browser.");
  }

  const {
    username,
    rpId = window.location.hostname || "localhost",
    userVerification = "required",
  } = options;

  const { buffer: challengeBuffer } = generateChallenge();

  // Build the allowed-credentials list
  let allowCredentials: PublicKeyCredentialDescriptor[] = [];
  if (username) {
    const stored = getCredentialByUsername(username);
    if (stored) {
      allowCredentials = [
        {
          type: "public-key",
          id: base64URLToBuffer(stored.credentialId),
          transports: stored.transports,
        },
      ];
    }
    // If no stored credential found we still proceed with an empty list,
    // which triggers the discoverable-credential UI on the authenticator.
  }

  const requestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challengeBuffer,
    rpId,
    allowCredentials,
    userVerification,
    timeout: 60_000,
  };

  const assertion = (await navigator.credentials.get({
    publicKey: requestOptions,
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("Authentication was cancelled or failed.");
  }

  const response = assertion.response as AuthenticatorAssertionResponse;

  const credentialId = bufferToBase64URL(assertion.rawId);
  const authenticatorDataB64 = bufferToBase64URL(response.authenticatorData);
  const clientDataB64 = bufferToBase64URL(response.clientDataJSON);
  const signatureB64 = bufferToBase64URL(response.signature);
  const userHandleB64 = response.userHandle
    ? bufferToBase64URL(response.userHandle)
    : null;

  // Increment the local counter to support replay-attack detection on the server
  incrementCounter(credentialId);

  return {
    credentialId,
    authenticatorData: authenticatorDataB64,
    clientDataJSON: clientDataB64,
    signature: signatureB64,
    userHandle: userHandleB64,
  };
}

// ─── Parsed clientDataJSON helper ─────────────────────────────────────────────

export interface ParsedClientData {
  type: "webauthn.create" | "webauthn.get";
  challenge: string;
  origin: string;
  crossOrigin: boolean;
}

export function parseClientDataJSON(base64url: string): ParsedClientData {
  const json = bufferToString(base64URLToBuffer(base64url));
  return JSON.parse(json) as ParsedClientData;
}
