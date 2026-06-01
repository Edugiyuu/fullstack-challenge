export function formatCurrency(cents: string) {
  const value = Number(cents) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatMultiplier(multiplier: number) {
  return `${(multiplier / 100).toFixed(2)}x`;
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    BETTING: "Aguardando apostas...",
    RUNNING: "Multiplicador subindo",
    CRASHED: "Crash!",
    SETTLED: "Rodada encerrada",
  };
  return labels[status] ?? status;
}

export function getHistoryClass(value: number) {
  if (value < 150) return "bg-red-700";
  if (value < 300) return "bg-neutral-800";
  return "bg-green-700";
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Algo deu errado.";
}
