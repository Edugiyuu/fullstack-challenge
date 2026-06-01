export function toCentsString(value: string) {
  const normalized = value.trim().replace(/\s/g, "");

  if (!normalized) {
    return "0";
  }

  const decimalSeparator = normalized.includes(",") ? "," : ".";
  const parts = normalized.split(decimalSeparator);
  const integerPart = parts[0].replace(/\D/g, "");
  const decimalPart = (parts[1] ?? "").replace(/\D/g, "").padEnd(2, "0").slice(0, 2);

  if (!integerPart) {
    return "0";
  }

  const cents = BigInt(integerPart) * 100n + BigInt(decimalPart || "0");
  return cents > 0n ? cents.toString() : "0";
}

export function calculatePayoutCents(amount: string, multiplier: number) {
  const amountCents = BigInt(toCentsString(amount));
  return ((amountCents * BigInt(multiplier)) / 100n).toString();
}
