-- Alankar Fashions — starter content. Products tagged 'sample' can be bulk-deleted from the admin panel.
insert into public.admin_users(email, name, role) values
  ('team.alankarfashions@gmail.com','Alankar Team','owner'),
  ('hello@alankarfashions.com','Alankar Fashions','owner')
on conflict (email) do nothing;

with p as (
  insert into public.categories(slug,name,name_mr,description,image_url,sort,seo_title,seo_description) values
  ('traditionals','Traditionals','पारंपरिक','Kolhapuri Saj, Thushi, Jondhale Pot and Vajratik: traditional Maharashtrian jewellery, hand-finished in Kolhapur.','https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1200&q=80',1,'Traditional Maharashtrian Jewellery | Kolhapuri Saj, Thushi','Shop traditional Maharashtrian jewellery from Kolhapur: Kolhapuri Saj, Thushi, Jondhale Pot, Vajratik. COD across India.'),
  ('pearls','Pearls','मोती','Chinchpeti, Tanmani and pearl necklaces in the Maharashtrian style.','https://images.unsplash.com/photo-1654699991520-aaaf4dd2608b?auto=format&fit=crop&w=1200&q=80',2,'Pearl Jewellery | Chinchpeti, Tanmani, Pearl Necklace','Maharashtrian pearl jewellery: Chinchpeti chokers, Tanmani and pearl necklaces from Alankar Fashions, Kolhapur.'),
  ('necklace','Necklace','नेकलेस','Short and long necklace sets, Kundan and American Diamond (AD) designs.','https://images.unsplash.com/photo-1738754719555-05aca36707b1?auto=format&fit=crop&w=1200&q=80',3,'Necklace Sets | Kundan, AD, Short & Long Necklaces','Kundan, American Diamond, short and long necklace sets with matching earrings. Free shipping above ₹999.'),
  ('bangles','Bangles','बांगड्या','Golden and silver-tone bangles, kadas and bridal stacks.','https://images.unsplash.com/photo-1617191880362-aac615de3c26?auto=format&fit=crop&w=1200&q=80',4,'Bangles | Gold-tone & Silver-tone Bangles','Gold-tone and silver-tone bangles and kadas for weddings, festivals and daily wear.'),
  ('earrings','Earrings','कानातले','Jhumkas, drops and chandbalis to finish every look.','https://images.unsplash.com/photo-1648291531524-97afa1c2ac30?auto=format&fit=crop&w=1200&q=80',5,'Earrings | Jhumka, Drops & Chandbali','Traditional jhumkas, pearl drops and AD earrings from Kolhapur. COD available.')
  returning id, slug
)
insert into public.categories(parent_id,slug,name,name_mr,sort)
select p.id, c.slug, c.name, c.name_mr, c.sort from p join (values
  ('traditionals','kolhapuri-saj','Kolhapuri Saj','कोल्हापुरी साज',1),
  ('traditionals','thushi','Thushi','ठुशी',2),
  ('traditionals','jondhale-pot','Jondhale Pot','जोंधळे पोत',3),
  ('traditionals','vajratik','Vajratik','वज्रटीक',4),
  ('pearls','chinchpeti','Chinchpeti','चिंचपेटी',1),
  ('pearls','tanmani','Tanmani','तनमणी',2),
  ('pearls','pearl-necklace','Pearl Necklace','मोत्यांचा हार',3),
  ('necklace','short-necklace','Short Necklace','शॉर्ट नेकलेस',1),
  ('necklace','long-necklace','Long Necklace','लाँग नेकलेस',2),
  ('necklace','kundan','Kundan','कुंदन',3),
  ('necklace','short-ad-necklace','Short AD Necklace','शॉर्ट AD नेकलेस',4),
  ('bangles','golden','Golden','सोनेरी',1),
  ('bangles','silver','Silver','चांदी रंग',2)
) as c(parent, slug, name, name_mr, sort) on c.parent = p.slug;

-- sample products
insert into public.products(slug,name,name_mr,category_id,short_description,description,price,compare_at_price,sku,stock,images,tags,badge,is_featured,is_new,material,finish,care,sort)
select v.slug, v.name, v.name_mr, (select id from public.categories where slug = v.cat), v.short, v.descr, v.price, v.mrp, v.sku, v.stock,
  jsonb_build_array(jsonb_build_object('url','https://images.unsplash.com/photo-'||v.img||'?auto=format&fit=crop&w=1200&q=80','alt',v.name)) ||
  case when v.img2 is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('url','https://images.unsplash.com/photo-'||v.img2||'?auto=format&fit=crop&w=1200&q=80','alt',v.name||' styled')) end,
  array['sample']||v.tags, v.badge, v.featured, v.isnew,
  'Brass alloy with gold-tone plating','Gold-tone, antique polish','Keep away from water, perfume and sweat. Wipe with a soft dry cloth and store in the box provided.', v.sort
from (values
  ('kolhapuri-saj-21-pendant','Kolhapuri Saj, 21 Pendant','कोल्हापुरी साज','kolhapuri-saj','The classic Kolhapuri Saj with 21 symbolic pendants on a red thread.','A traditional Kolhapuri Saj strung with 21 small gold-tone pendants, each shaped after a symbol of prosperity, on the customary dark red thread. Sits close to the neck and pairs with a Nauvari or Paithani saree.',1850,2400,'ALK-SAJ-021',12,'1601121141461-9d6647bca1ed','1673413349218-ba4de23c2958',array['bridal','festive'],'Bestseller',true,false,1),
  ('thushi-choker-gold-tone','Gold-tone Thushi Choker','ठुशी','thushi','Dense gold-tone bead choker with an adjustable dori.','A traditional Maharashtrian Thushi made of tightly packed gold-tone beads, finished with an adjustable dori so it sits snugly at the base of the neck.',1250,1650,'ALK-THU-001',15,'1673413350047-ea5c0fd58c9e',null,array['bridal','festive'],'Bestseller',true,false,2),
  ('jondhale-pot-long-mala','Jondhale Pot Long Mala','जोंधळे पोत','jondhale-pot','Long gold-tone mala with jowar-grain beads.','Jondhale Pot is named after the jowar-grain shaped beads that make up this long traditional mala. Lightweight enough for all-day wear at weddings and pujas.',1450,1899,'ALK-JP-001',8,'1611107683227-e9060eccd846',null,array['festive'],null,false,true,3),
  ('vajratik-stone-choker','Vajratik Stone Choker','वज्रटीक','vajratik','Broad Vajratik choker with stone work, for brides.','A broad Vajratik choker with stone-set panels, worn high on the neck by Maharashtrian brides alongside the Thushi and Saj.',2250,2950,'ALK-VJT-001',6,'1787831398033-d70495c1e8a4',null,array['bridal'],'New',true,true,4),
  ('pearl-chinchpeti-choker','Pearl Chinchpeti Choker','चिंचपेटी','chinchpeti','Multi-row pearl Chinchpeti with gold-tone spacers.','A multi-row pearl Chinchpeti choker with gold-tone spacers and a small stone centre, the traditional companion to a Nauvari saree.',1499,1999,'ALK-CHP-001',10,'1654699991520-aaaf4dd2608b',null,array['bridal','festive'],null,true,false,5),
  ('tanmani-pearl-necklace','Tanmani Pearl Necklace','तनमणी','tanmani','Layered pearl Tanmani with a stone pendant.','Layered strands of pearls gathered into a stone-set pendant. A Tanmani adds length below the Chinchpeti for a complete bridal look.',1650,2199,'ALK-TAN-001',9,'1595345705177-ffe090eb0784',null,array['bridal'],'New',false,true,6),
  ('classic-pearl-mala-gift-box','Classic Pearl Mala with Gift Box','मोत्यांचा हार','pearl-necklace','Single-strand pearl mala in a gift box.','A single strand of evenly matched faux pearls with a gold-tone clasp, packed in a gift box. Easy to wear daily and easy to gift.',799,1099,'ALK-PRL-001',20,'1515562141207-7a88fb7ce338',null,array['gifting','daily'],null,false,false,7),
  ('kundan-short-necklace-set','Kundan Short Necklace Set','कुंदन सेट','short-necklace','Colourful kundan short necklace with matching earrings.','A short kundan necklace with pink, green and white stones and matching earrings. Works with silk sarees and lehengas alike.',2450,3200,'ALK-KSN-001',7,'1738754719555-05aca36707b1',null,array['wedding','festive'],'Bestseller',true,false,8),
  ('long-kundan-rani-haar','Long Kundan Rani Haar','राणी हार','long-necklace','Long silver-tone kundan haar with jhumkas.','A long Rani Haar in silver-tone kundan with colourful drops and matching jhumkas. A statement piece for receptions and sangeet.',2850,3600,'ALK-LKH-001',5,'1738754712726-d126c15e206b',null,array['wedding'],'New',true,true,9),
  ('kundan-mannequin-set-emerald','Kundan Necklace Set, Emerald Drop','कुंदन नेकलेस','kundan','Kundan necklace with emerald-tone drop and earrings.','A kundan necklace with a pendant drop and matching earrings, finished in an antique gold tone with emerald-coloured accents.',1950,2600,'ALK-KUN-001',8,'1722410180687-b05b50922362',null,array['wedding','festive'],null,true,false,10),
  ('ad-pearl-short-necklace','AD & Pearl Short Necklace','शॉर्ट AD नेकलेस','short-ad-necklace','American Diamond short necklace with pearl border.','A short American Diamond (AD) necklace with a pearl border and a centre stone. Sparkles under evening light without feeling heavy.',1699,2299,'ALK-ADS-001',10,'1640083239745-9bbd77a2097f',null,array['party','gifting'],null,false,true,11),
  ('ruby-stone-gold-bangles-set','Ruby-stone Gold-tone Bangles, Set of 4','सोनेरी बांगड्या','golden','Four gold-tone bangles with ruby-red stones.','A set of four gold-tone bangles with ruby-red stones set in a repeating floral pattern. Available in sizes 2.4, 2.6 and 2.8.',899,1199,'ALK-BNG-001',18,'1617191880362-aac615de3c26',null,array['festive','gifting'],'Bestseller',true,false,12),
  ('antique-gold-bangle-stack','Antique Gold-tone Bangle Stack','पाटल्या','golden','Antique-finish bangle stack for brides.','An antique-finish stack of gold-tone bangles with fine textured work, designed to be worn together as a bridal stack.',1299,1699,'ALK-BNG-002',12,'1758995116383-f51775896add',null,array['bridal'],null,false,false,13),
  ('textured-gold-kada-pair','Textured Gold-tone Kada Pair','कडे','golden','A pair of broad textured kadas.','A pair of broad kadas with a hand-textured gold-tone surface. Wear alone or with glass bangles.',749,999,'ALK-KDA-001',14,'1728381031272-ba3f537feadd',null,array['daily','festive'],null,false,true,14),
  ('ad-stone-bracelet-bangle','AD Stone Bracelet Bangle','AD कडा','silver','Openable bangle set with American Diamonds.','An openable bracelet-style bangle set with American Diamonds in a scalloped pattern. Fits most wrists.',699,949,'ALK-ADB-001',16,'1611591437281-460bfbe1220a',null,array['party','gifting'],null,false,false,15),
  ('oxidised-pearl-jhumka','Oxidised Pearl Jhumka','झुमके','earrings','Two-tone jhumkas with pearl hangings.','Two-tone oxidised jhumkas with a gold-tone dome and a fringe of small pearls. Lightweight for all-day wear.',549,749,'ALK-JHU-001',25,'1714733831162-0a6e849141be',null,array['daily','gifting'],'Bestseller',true,false,16),
  ('pearl-chandbali-hoops','Pearl Chandbali Hoops','चांदबाली','earrings','Gold-tone hoops with pearl and mini-jhumka drops.','Gold-tone chandbali hoops with pearl detailing and small jhumka drops. Pairs well with a Paithani or a plain silk saree.',649,899,'ALK-CHB-001',20,'1648291531524-97afa1c2ac30',null,array['festive','gifting'],'New',false,true,17)
) as v(slug,name,name_mr,cat,short,descr,price,mrp,sku,stock,img,img2,tags,badge,featured,isnew,sort);

-- settings
insert into public.settings(key,value) values
('store', jsonb_build_object(
  'name','Alankar Fashions','tagline','स्त्रीचे सौंदर्य खुलवणारे',
  'phone','+91 96570 93006','whatsapp','919657093006','email','hello@alankarfashions.com',
  'address','Shop No 1, 1354 B Ward, near Khari Corner, Mangalwar Peth, Kolhapur, Maharashtra 416012',
  'map_url','https://share.google/kRzsRLyqmPIpjdMni','hours','',
  'instagram','https://www.instagram.com/alankar_fashions_kop/','facebook','https://www.facebook.com/AlankarFashion/')),
('announcements', '["Free shipping across India on orders above ₹999","Cash on Delivery available on every order","WhatsApp us for custom & bridal orders"]'::jsonb),
('commerce', jsonb_build_object('free_shipping_above',999,'shipping_fee',79,'cod_enabled',true,'cod_fee',0,'cod_max_order',15000,'online_enabled',true,'order_notify_email','hello@alankarfashions.com','low_stock_alert',3)),
('home', jsonb_build_object(
  'hero', jsonb_build_object('tag','स्त्रीचे सौंदर्य खुलवणारे','title','Traditional Kolhapuri jewellery, delivered across India.','subtitle','Saj, Thushi, Chinchpeti, Kundan and bridal sets from our shop in Mangalwar Peth, Kolhapur. Pay on delivery, or online.','image','https://images.unsplash.com/photo-1673413521612-46ecc8a3daf0?auto=format&fit=crop&w=1800&q=80','cta1_label','Shop Traditionals','cta1_href','/collections/traditionals','cta2_label','The Bridal Edit','cta2_href','/collections/traditionals?tag=bridal'),
  'heritage', jsonb_build_object('title','What is a Kolhapuri Saj?','text','A Kolhapuri Saj is a Maharashtrian necklace strung with small gold-tone pendants, traditionally 21, each shaped after a symbol of prosperity. It is worn by brides and at every festival that matters, and it is the piece Kolhapur is known for across India.'||chr(10)||chr(10)||'Our Traditionals collection keeps these forms true to how they are worn in Kolhapur: the proportions, the bead counts and the dark red thread.','image','https://images.unsplash.com/photo-1673413349218-ba4de23c2958?auto=format&fit=crop&w=1200&q=80'),
  'bridal', jsonb_build_object('tag','लग्नसराई','title','The Bridal Edit','text','Saj, Thushi, nath, bangles and Vajratik, put together as one set so every piece matches. Send us your saree colour on WhatsApp and we''ll help you choose.','image','https://images.unsplash.com/photo-1781187009755-0cbc0c4cd2b3?auto=format&fit=crop&w=2000&q=80','href','/collections/traditionals?tag=bridal'),
  'video', jsonb_build_object('vimeo_id','1209327159','title','From our shop in Mangalwar Peth','text','Every piece leaves our shop checked by hand, packed in a gift box, and ready to wear the day it arrives.','poster','https://images.unsplash.com/photo-1751606615009-30f61ff1a510?auto=format&fit=crop&w=1800&q=80'),
  'gift', jsonb_build_object('tag','For weddings, Diwali & birthdays','title','Gifting','text','Every order ships in a gift box. Add a note at checkout and we''ll write it by hand.','image','https://images.unsplash.com/photo-1707149974686-0c198fdebd51?auto=format&fit=crop&w=1400&q=80','points', '["Gift box free on every order","Price-free invoice on request","Easy exchange after the occasion"]'::jsonb,'href','/collections/all?tag=gifting'),
  'instagram', '["https://images.unsplash.com/photo-1673413349218-ba4de23c2958?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1763017795729-e8560384df27?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1628532730171-5428e3e0f0f5?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1787831398033-d70495c1e8a4?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1673413350047-ea5c0fd58c9e?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1763578590148-fbac0711f3b2?auto=format&fit=crop&w=600&q=80"]'::jsonb,
  'sections', jsonb_build_object('trust',true,'categories',true,'marquee',true,'heritage',true,'bestsellers',true,'bridal',true,'occasions',true,'video',true,'gift',true,'instagram',true,'visit',true,'faq',true,'newsletter',true))),
('seo', jsonb_build_object('title','Alankar Fashions | Kolhapuri Saj, Thushi & Traditional Jewellery, Kolhapur','description','Alankar Fashions, Mangalwar Peth, Kolhapur. Handcrafted artificial jewellery: Kolhapuri Saj, Thushi, Chinchpeti, Tanmani, Kundan, AD necklaces, bangles and earrings. COD and free shipping across India.'))
on conflict (key) do nothing;

-- content pages (simple markdown: ## heading, - list, paragraphs)
insert into public.pages(slug,title,body,seo_description) values
('about','About Alankar Fashions',
'Alankar Fashions is a jewellery shop in Mangalwar Peth, Kolhapur. Our name means ornament, and our line स्त्रीचे सौंदर्य खुलवणारे says what we do: jewellery that brings out a woman''s beauty.

## What we make
We sell artificial (imitation) jewellery in traditional Maharashtrian and contemporary designs: Kolhapuri Saj, Thushi, Jondhale Pot, Vajratik, Chinchpeti, Tanmani, Kundan and American Diamond sets, bangles and earrings.

## Visit us
Shop No 1, 1354 B Ward, near Khari Corner, Mangalwar Peth, Kolhapur, Maharashtra 416012. Call or WhatsApp +91 96570 93006.','About Alankar Fashions, a traditional jewellery shop in Mangalwar Peth, Kolhapur.'),
('faq','Frequently asked questions',
'## Is Cash on Delivery available?
Yes. Every order across India can be paid by Cash on Delivery. You can also pay online with UPI, cards or net banking through Razorpay.

## Is this real gold?
No. Alankar makes artificial (imitation) jewellery with a gold-tone or silver-tone finish, designed to look like traditional gold pieces at a fraction of the price.

## How long does delivery take?
Orders are packed within 1–2 working days. Delivery in Maharashtra usually takes 2–4 days and 4–7 days for the rest of India.

## Can I order a custom or bridal set?
Yes. Message us on WhatsApp with your saree colour, budget and date, and we''ll put together a matching set.

## How do I care for my jewellery?
Keep it away from water, perfume and sweat. Wipe it with a soft dry cloth after wearing and store it in the box provided.

## Can I return or exchange an order?
Yes, unused items in original packaging can be exchanged or returned. See our Returns policy for details.','Answers about COD, delivery time, returns, care and custom orders at Alankar Fashions.'),
('shipping-policy','Shipping policy',
'## Where we ship
We ship across India.

## Charges
Shipping is free on orders above ₹999. A flat shipping fee applies below that, shown at checkout.

## Dispatch and delivery
Orders are packed within 1–2 working days. Delivery usually takes 2–4 days within Maharashtra and 4–7 days elsewhere in India. You will receive a tracking link by email once your order ships.','Shipping charges, dispatch time and delivery estimates for Alankar Fashions orders.'),
('return-policy','Returns & exchange policy',
'## Eligibility
You can request a return or exchange within 7 days of delivery for items that are unused, undamaged and in their original packaging.

## Not eligible
Earrings (for hygiene reasons) and custom-made pieces cannot be returned unless they arrive damaged.

## How to request
WhatsApp us on +91 96570 93006 or email hello@alankarfashions.com with your order number and photos of the item.','Return and exchange rules for Alankar Fashions orders.'),
('refund-policy','Refund policy',
'## Online payments
Approved refunds are sent to the original payment method within 5–7 working days.

## Cash on Delivery orders
Refunds for COD orders are sent by UPI or bank transfer after the returned item is received and checked.','How refunds work for online and Cash on Delivery orders at Alankar Fashions.'),
('privacy-policy','Privacy policy',
'## What we collect
Your name, phone number, email and delivery address when you place an order, and your email if you subscribe to updates.

## How we use it
To deliver your order, send order updates, and, if you agree, tell you about new designs. We never sell your data.

## Payments
Online payments are processed by Razorpay. We do not store your card or UPI details.

## Contact
Email hello@alankarfashions.com to view or delete your data.','How Alankar Fashions collects and uses your personal information.'),
('terms-and-conditions','Terms & conditions',
'## Products
All Alankar jewellery is artificial (imitation) jewellery. Colours may vary slightly from photos due to lighting and screens.

## Prices
Prices are in Indian Rupees and include applicable taxes unless stated otherwise.

## Orders
We may cancel an order if an item is out of stock or if payment cannot be verified; any amount paid will be refunded.

## Jurisdiction
These terms are governed by the laws of India, with courts in Kolhapur, Maharashtra.','Terms and conditions for shopping at Alankar Fashions.')
on conflict (slug) do nothing;

insert into public.coupons(code,kind,value,min_order) values ('WELCOME10','percent',10,999) on conflict do nothing;
