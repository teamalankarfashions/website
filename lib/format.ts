export const inr = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
export const pctOff = (price: number, mrp?: number | null) => (mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0);
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtDay = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
export const PAY_LABEL: Record<string, string> = { pending: "Unpaid", paid: "Paid", failed: "Failed", refunded: "Refunded", cod: "COD" };
export const waLink = (num: string, text: string) => `https://wa.me/${num.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
export const INDIAN_STATES = ["Maharashtra","Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];
