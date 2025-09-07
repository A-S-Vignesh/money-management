import { useProfileStore } from "@/store/useProfileStore";

export const formatCurrency = (amount: number) => {
  const profile = useProfileStore.getState().profile; // get profile from store

  const currency = profile?.currency || "INR";
  const locale = profile?.locale || "en-IN";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
