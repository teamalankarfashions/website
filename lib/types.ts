export type Img = { url: string; alt?: string };
export type Category = {
  id: string; parent_id: string | null; slug: string; name: string; name_mr: string | null;
  description: string | null; image_url: string | null; seo_title: string | null; seo_description: string | null;
  sort: number; active: boolean;
};
export type Product = {
  id: string; slug: string; name: string; name_mr: string | null; category_id: string | null;
  short_description: string | null; description: string | null; price: number; compare_at_price: number | null;
  sku: string | null; stock: number; track_stock: boolean; images: Img[]; tags: string[]; badge: string | null;
  is_featured: boolean; is_new: boolean; material: string | null; finish: string | null; care: string | null;
  seo_title: string | null; seo_description: string | null; sort: number; active: boolean; created_at: string; updated_at: string;
};
export type Store = {
  name: string; tagline: string; phone: string; whatsapp: string; email: string; address: string;
  map_url: string; hours: string; instagram: string; facebook: string;
};
export type Commerce = {
  free_shipping_above: number; shipping_fee: number; cod_enabled: boolean; cod_fee: number; cod_max_order: number;
  online_enabled: boolean; order_notify_email: string; low_stock_alert: number;
};
export type Home = {
  hero: { tag: string; title: string; subtitle: string; image: string; cta1_label: string; cta1_href: string; cta2_label: string; cta2_href: string };
  heritage: { title: string; text: string; image: string };
  bridal: { tag: string; title: string; text: string; image: string; href: string };
  video: { vimeo_id: string; title: string; text: string; poster: string };
  gift: { tag: string; title: string; text: string; image: string; points: string[]; href: string };
  instagram: string[];
  sections: Record<string, boolean>;
};
export type Settings = { store: Store; commerce: Commerce; home: Home; announcements: string[]; seo: { title: string; description: string } };
export type CartLine = { id: string; slug: string; name: string; price: number; image: string | null; qty: number; stock?: number };
export type Order = {
  id: string; order_no: string; user_id: string | null; email: string; phone: string; name: string;
  address: { line1: string; line2?: string; city: string; state: string; pincode: string };
  items: { id: string; name: string; slug: string; sku?: string; price: number; qty: number; image: string | null }[];
  subtotal: number; discount: number; shipping: number; cod_fee: number; total: number; coupon_code: string | null;
  payment_method: "cod" | "razorpay"; payment_status: string; status: string;
  razorpay_order_id: string | null; razorpay_payment_id: string | null; courier: string | null; tracking_number: string | null;
  tracking_url: string | null; notes: string | null; admin_notes: string | null; created_at: string; updated_at: string;
};
