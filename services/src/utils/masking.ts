/**
 * Data masking utilities compliant with UU No. 27 Tahun 2022 (UU PDP)
 * and SIMRS Privacy by Default specification.
 */

export function maskNik(nik: string | null | undefined): string | null {
  if (!nik) return null;
  if (nik.length <= 6) return "*".repeat(nik.length);
  return nik.slice(0, 6) + "*".repeat(nik.length - 6);
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  if (phone.length <= 8) return "*".repeat(Math.max(phone.length - 2, 0)) + phone.slice(-2);
  const visibleStart = 4;
  const visibleEnd = 4;
  const maskedLen = phone.length - visibleStart - visibleEnd;
  return phone.slice(0, visibleStart) + "*".repeat(maskedLen) + phone.slice(-visibleEnd);
}

export function maskBpjsNumber(bpjs: string | null | undefined): string | null {
  if (!bpjs) return null;
  if (bpjs.length <= 8) return "*".repeat(bpjs.length);
  return bpjs.slice(0, 4) + "*".repeat(bpjs.length - 8) + bpjs.slice(-4);
}

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const atIdx = email.indexOf("@");
  if (atIdx <= 0) return "***";
  return `${email[0]}***${email.slice(atIdx)}`;
}

export function maskAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const trimmed = address.trim();
  if (trimmed.length <= 10) return `${trimmed.slice(0, 3)}***`;

  // Per SPECIFICATION.md Section 6.2: "Jl. Pajajaran No. 45 RT 02/05" -> "Jl. Pajajaran No. **"
  const houseNoMatch = trimmed.match(/^(.*?\bNo\.?\s*)\d+.*$/i);
  if (houseNoMatch) {
    return `${houseNoMatch[1]}**`;
  }

  const rtMatch = trimmed.match(/^(.*?\bRT\.?\s*)\d+.*$/i);
  if (rtMatch) {
    return `${rtMatch[1]}**`;
  }

  return `${trimmed.slice(0, Math.min(15, trimmed.length))} ***`;
}
