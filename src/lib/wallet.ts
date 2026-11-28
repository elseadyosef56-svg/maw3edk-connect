export const WALLET_TOPUP_PREFIX = "[WALLET TOPUP]";
export const isWalletTopup = (reference: string | null | undefined) => reference?.startsWith(WALLET_TOPUP_PREFIX) === true;
export const validTopupAmount = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 10 && Math.round(amount * 100) === amount * 100;
};
export const walletTopupReference = (amount: number, reference: string) => `${WALLET_TOPUP_PREFIX} طلب شحن محفظة بقيمة ${amount} د.ل${reference.trim() ? ` • مرجع التحويل: ${reference.trim()}` : ""}`;