import { ProjectFolder } from './types';

// Admin verification constants
export const ADMIN_CONFIG = {
  mobile: '9747995961',
  secondaryMobile: '9567627277',
  thirdMobile: '7012383137',
  adminName: 'Deepak C (Chief Architect & Vasthu Consultant)',
  totpSecretBase32: 'KREVMVCPKBJFIUCU', // Base32 Secret for Google Authenticator / Microsoft Authenticator
  issuer: 'Vasthusilpy Palakkad',
  accountLabel: 'Deepak C (Chief Architect)'
};

// Generate standard OTPAuth URI for QR code scanner apps (Google Authenticator, Microsoft Authenticator, Authy)
export function getAdminOTPAuthURI(): string {
  const secret = ADMIN_CONFIG.totpSecretBase32;
  const issuer = encodeURIComponent(ADMIN_CONFIG.issuer);
  const label = encodeURIComponent(`${ADMIN_CONFIG.issuer}:${ADMIN_CONFIG.accountLabel}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// Standard SHA-1 implementation in TypeScript
function sha1(message: Uint8Array): Uint8Array {
  function rotl(n: number, s: number) { return (n << s) | (n >>> (32 - s)); }
  const len = message.length;
  const bitLen = len * 8;
  const words: number[] = [];
  for (let i = 0; i < len; i++) {
    words[i >> 2] |= message[i] << (24 - (i % 4) * 8);
  }
  words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  const wordCount = (((len + 8) >> 6) + 1) * 16;
  while (words.length < wordCount) words.push(0);
  words[wordCount - 1] = bitLen & 0xffffffff;
  words[wordCount - 2] = Math.floor(bitLen / 0x100000000);

  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;

  for (let i = 0; i < words.length; i += 16) {
    const w = new Int32Array(80);
    for (let j = 0; j < 16; j++) w[j] = words[i + j];
    for (let j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);

    let a = h0, b = h1, c = h2, d = h3, e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0, k = 0;
      if (j < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + w[j]) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const res = new Uint8Array(20);
  const outWords = [h0, h1, h2, h3, h4];
  for (let i = 0; i < 5; i++) {
    res[i * 4] = (outWords[i] >>> 24) & 0xff;
    res[i * 4 + 1] = (outWords[i] >>> 16) & 0xff;
    res[i * 4 + 2] = (outWords[i] >>> 8) & 0xff;
    res[i * 4 + 3] = outWords[i] & 0xff;
  }
  return res;
}

// Standard HMAC-SHA1
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let k = key;
  if (k.length > blockSize) {
    k = sha1(k);
  }
  if (k.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(k);
    k = padded;
  }
  const oPad = new Uint8Array(blockSize + 20);
  const iPad = new Uint8Array(blockSize + message.length);
  for (let i = 0; i < blockSize; i++) {
    oPad[i] = k[i] ^ 0x5c;
    iPad[i] = k[i] ^ 0x36;
  }
  iPad.set(message, blockSize);
  const innerHash = sha1(iPad);
  oPad.set(innerHash, blockSize);
  return sha1(oPad);
}

// Base32 Decoder
function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// Generate RFC 6238 TOTP 6-digit token
export function generateRFC6238TOTP(secretBase32: string = ADMIN_CONFIG.totpSecretBase32, timeOffsetSteps: number = 0): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const counter = Math.floor(epoch / timeStep) + timeOffsetSteps;
  
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const keyBytes = base32Decode(secretBase32);
  const hmac = hmacSha1(keyBytes, counterBytes);
  const offset = hmac[19] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

// Verify Admin Credentials with TOTP code or Master password
export function verifyAdminLogin(mobile: string, passwordOrTotp: string): { success: boolean; error?: string } {
  const cleanMobile = mobile.replace(/\D/g, '');
  const cleanPass = passwordOrTotp.trim();

  if (
    cleanMobile !== ADMIN_CONFIG.mobile && 
    cleanMobile !== ADMIN_CONFIG.secondaryMobile &&
    cleanMobile !== ADMIN_CONFIG.thirdMobile
  ) {
    return { 
      success: false, 
      error: `Invalid Admin Mobile Number. Only registered administrator (${ADMIN_CONFIG.mobile} / ${ADMIN_CONFIG.secondaryMobile} / ${ADMIN_CONFIG.thirdMobile}) can sign in.` 
    };
  }

  if (!cleanPass) {
    return {
      success: false,
      error: 'Please enter your 6-digit TOTP code from your Authenticator app.'
    };
  }

  // Calculate RFC 6238 standard TOTP codes for current, previous, and next windows (30s window drift tolerance)
  const currentTotp = generateRFC6238TOTP(ADMIN_CONFIG.totpSecretBase32, 0);
  const prevTotp = generateRFC6238TOTP(ADMIN_CONFIG.totpSecretBase32, -1);
  const nextTotp = generateRFC6238TOTP(ADMIN_CONFIG.totpSecretBase32, 1);

  // Allow master Admin PIN or TOTP
  if (
    cleanPass === '9747' ||
    cleanPass === '974799' ||
    cleanPass === 'vasthu@2026' ||
    cleanPass === currentTotp || 
    cleanPass === prevTotp || 
    cleanPass === nextTotp
  ) {
    return { success: true };
  }

  return {
    success: false,
    error: `Invalid TOTP Code. Please check Google Authenticator or Microsoft Authenticator and enter the current 6-digit code.`
  };
}

// Verify Client Login (Mobile Number + Customized Folder Password)
export function verifyClientLogin(
  mobile: string, 
  password: string, 
  folders: ProjectFolder[]
): { success: boolean; folder?: ProjectFolder; error?: string } {
  const cleanMobile = mobile.replace(/\D/g, '');
  const cleanPass = password.trim();

  if (!cleanMobile) {
    return { success: false, error: 'Please enter your registered mobile number.' };
  }

  if (!cleanPass) {
    return { success: false, error: 'Please enter your personal project vault password.' };
  }

  // Find folder matching clientMobile
  const matchedFolder = folders.find(
    (f) => f.clientMobile.replace(/\D/g, '') === cleanMobile
  );

  if (!matchedFolder) {
    return {
      success: false,
      error: `No project vault found for mobile ${cleanMobile}. Please verify your number or contact Chief Architect.`
    };
  }

  if (matchedFolder.customPassword.trim() !== cleanPass) {
    return {
      success: false,
      error: `Incorrect password for ${matchedFolder.clientName}. If you have forgotten your password, please contact Admin (${ADMIN_CONFIG.mobile}).`
    };
  }

  return {
    success: true,
    folder: matchedFolder
  };
}

