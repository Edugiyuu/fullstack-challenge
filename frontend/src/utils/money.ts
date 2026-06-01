export function toCentsString(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "0";
  }
  return Math.round(parsed * 100).toString();
}

export function calculatePayoutCents(amount: string, multiplier: number) {
  const amountCents = BigInt(toCentsString(amount));
  return ((amountCents * BigInt(multiplier)) / 100n).toString();
}
