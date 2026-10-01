const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const preciseFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 });
const moneyFormat = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 });
export const formatNumber = (value: number, precise = false) => (precise ? preciseFormat : numberFormat).format(value);
export const formatMoney = (value: number) => moneyFormat.format(value);
export const formatMetric = (value: number | null, suffix = "") => value === null ? "—" : `${formatNumber(value)}${suffix}`;
export const formatDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};
