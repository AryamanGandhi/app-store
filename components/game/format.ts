// Shared money and percent formatters for the gameplay UI.
// These are pure display helpers: they take already-computed numbers and
// return localized strings. No game rules live here.

export function formatMoney(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercentChange(value: number, amountSpent: number): string {
  if (amountSpent === 0) {
    return "+0.0%";
  }
  const change = ((value - amountSpent) / amountSpent) * 100;
  const sign = change >= 0 ? "+" : "-";
  const formatted = Math.abs(change).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${sign}${formatted}%`;
}
