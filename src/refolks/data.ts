import translations from "./translations.json";
import { suppliedImage } from "./imageManifest";

export const locales = ["vi", "en", "ko", "ja", "zh-CN"] as const;
export type Lang = (typeof locales)[number];
export type Bilingual = Record<Lang, string>;
export const translate = (en: string, lang: Lang): string =>
  lang === "en" ? en : lang === "vi" ? en : (translations[lang] as Record<string, string>)[en] || en;
export const localize = <T,>(value: T, lang: Lang): T => {
  if (typeof value === "string") return translate(value, lang) as T;
  if (Array.isArray(value)) return value.map((item) => localize(item, lang)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, lang)])) as T;
  return value;
};
export const t = (vi: string, en: string): Bilingual => ({
  vi, en, ko: translate(en, "ko"), ja: translate(en, "ja"), "zh-CN": translate(en, "zh-CN"),
});
export const img = (name: string) => `/images/refolks/${name}.webp`;

// Round-two catalogue. Prices marked priceIsDemo await final customer approval.
export const products = [
  {
    id: "the-herald",
    name: t("The Herald", "The Herald"),
    subtitle: t("Người báo tin lành", "The Bearer of Good News"),
    meaning: t("Phom chữ nhật rộng, góc đáy bo tròn nhẹ và họa tiết dệt trên nền sáng.", "A wide rectangular silhouette, softly rounded base corners and a woven motif on a light ground."),
    short: t("Phom chữ nhật rộng với góc đáy bo tròn nhẹ. Nền sáng làm nổi bật họa tiết dệt tông nâu; phần đáy và quai phối cùng tông.", "A wide rectangular silhouette with softly rounded base corners. A light ground brings out the brown woven motif, paired with a matching base and handles."),
    price: 1790000,
    priceIsDemo: true,
    category: "work-shoulder-bag",
    gender: ["women"],
    material: ["brocade", "recycled", "canvas"],
    motifs: ["booc-khoay"],
    collection: "heritage-in-motion",
    stock: 8,
    colors: ["cream"],
    variants: [] as {key:string; label:Bilingual}[],
    images: [img("the-herald"), suppliedImage("heraldDetail")],
    lifestyle: img("the-herald"),
  },
  {
    id: "the-curator",
    name: t("The Curator", "The Curator"),
    subtitle: t("Người gìn giữ giá trị", "The Keeper of Values"),
    meaning: t("Phom túi bản rộng, nền nâu trầm và các dải dọc phối họa tiết dệt.", "A wide silhouette with a deep brown ground, vertical bands and a woven motif."),
    short: t("Phom vuông bản rộng trên nền nâu trầm, phối họa tiết dệt tương phản. Hai dải tông nâu chạy dọc thân và nối liền quai xách; khóa kim loại hoàn thiện thiết kế.", "A wide, square silhouette on a deep brown ground with a contrasting woven motif. Two brown-toned bands run down the body into the handles, finished with metal buckles."),
    price: 1890000,
    priceIsDemo: true,
    category: "work-shoulder-bag",
    gender: ["men"],
    material: ["brocade", "recycled", "canvas"],
    motifs: ["booc-khoay"],
    collection: "heritage-in-motion",
    stock: 8,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: [suppliedImage("curatorFront"), suppliedImage("curatorTop"), suppliedImage("curatorInside"), suppliedImage("curatorBack"), suppliedImage("curatorBottom")],
    lifestyle: suppliedImage("curatorFront"),
  },
  {
    id: "the-vanguard",
    name: t("The Vanguard", "The Vanguard"),
    subtitle: t("Người tiên phong", "The Pioneer"),
    meaning: t("Phom hình thang với nắp gập bo góc và điểm khóa vuông.", "A trapezoid silhouette with a rounded fold-over flap and square clasp."),
    short: t("Thân hình thang với nắp gập bo góc, điểm khóa vuông và họa tiết dệt. Phiên bản phối nữ có khăn họa tiết trên quai; phiên bản phối nam đi cùng cardholder.", "A trapezoid body with a rounded fold-over flap, square clasp and woven motif. The women's styling adds a patterned scarf to the handle; the men's styling pairs it with a cardholder."),
    price: 1890000,
    priceIsDemo: false,
    category: "work-shoulder-bag",
    gender: ["women", "men"],
    material: ["brocade", "recycled", "canvas"],
    motifs: ["booc-khoay"],
    collection: "heritage-in-motion",
    stock: 12,
    colors: ["brown", "cream"],
    variants: [{key:"women-scarf",label:t("Bản nữ – kèm khăn họa tiết","Women's – with patterned scarf")},{key:"men-cardholder",label:t("Bản nam – kèm cardholder","Men's – with cardholder")}],
    images: [suppliedImage("vanguardWomen"), suppliedImage("vanguardAngle"), suppliedImage("vanguardInside"), suppliedImage("vanguardBottom"), suppliedImage("vanguardBack"), suppliedImage("vanguardMen")],
    lifestyle: suppliedImage("vanguardWomen"),
  },
  {
    id: "the-navigator",
    name: t("The Navigator", "The Navigator"),
    subtitle: t("Người dẫn lối", "The Pathfinder"),
    meaning: t("Phom hình thang, miệng túi tạo góc chữ V nhẹ và dải họa tiết dệt ngang thân.", "A trapezoid silhouette with a gently V-shaped opening and a woven band across the body."),
    short: t("Túi tông nâu, phom hình thang với đường miệng tạo góc chữ V nhẹ. Dải họa tiết dệt trải ngang mặt trước. Quai xách ngắn kết hợp dây đeo dài.", "A brown trapezoid bag with a gently V-shaped opening and a woven band across the front. It has a short handle and a long strap."),
    price: 2190000,
    priceIsDemo: true,
    category: "work-shoulder-bag",
    gender: ["women", "men"],
    material: ["brocade"],
    motifs: ["con-huou", "canh-dua"],
    collection: "heritage-in-motion",
    stock: 6,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: [suppliedImage("navigatorFront"), suppliedImage("navigatorLeft"), suppliedImage("navigatorBottom"), suppliedImage("navigatorInside")],
    lifestyle: suppliedImage("navigatorFront"),
  },
  {
    id: "elephant-keychain",
    name: t("Móc khóa Voi", "Elephant Keychain"),
    subtitle: t("Phụ kiện & Quà tặng", "Accessories & Gifts"),
    meaning: t("Ảnh tham khảo đang dùng mẫu móc khóa rồng; ảnh thật của Móc khóa Voi đang chờ bổ sung.", "The reference photos show a dragon keychain; a photograph of the Elephant Keychain is still pending."),
    short: t("Móc khóa hình chú voi, phụ kiện nhỏ để treo túi.", "An elephant-shaped keychain, a small charm for your bag."),
    price: 190000,
    priceIsDemo: true,
    category: "accessory",
    gender: ["women", "men"],
    material: ["recycled"],
    motifs: [] as string[],
    collection: "accessories",
    stock: 6,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: [suppliedImage("dragonSoft"), suppliedImage("dragonSilver")],
    lifestyle: suppliedImage("dragonSoft"),
  },
  {
    id: "cardholder", name: t("Ví", "Wallet"), subtitle: t("Phụ kiện & Quà tặng", "Accessories & Gifts"),
    meaning: t("Ảnh sản phẩm đang cập nhật.", "Product photograph coming soon."),
    short: t("Ví phối cùng túi The Vanguard.", "A wallet to pair with The Vanguard."),
    price: 240000, priceIsDemo: false, category: "accessory", gender: ["women", "men"], material: [] as string[], motifs: [] as string[], collection: "accessories", stock: 0,
    colors: [] as string[], variants: [] as {key:string; label:Bilingual}[], images: [] as string[], lifestyle: "",
  },
  {
    id: "thai-motif-scarf", name: t("Khăn họa tiết", "Patterned scarf"), subtitle: t("Phụ kiện & Quà tặng", "Accessories & Gifts"),
    meaning: t("Khăn có họa tiết dệt, chụp cùng túi The Vanguard.", "A patterned scarf photographed with The Vanguard."),
    short: t("Khăn họa tiết dệt, có thể phối cùng túi.", "A patterned scarf that can be styled with a bag."),
    price: 190000, priceIsDemo: false, category: "accessory", gender: ["women", "men"], material: [] as string[], motifs: [] as string[], collection: "accessories", stock: 0,
    colors: [] as string[], variants: [] as {key:string; label:Bilingual}[], images: [suppliedImage("scarfReference")], lifestyle: suppliedImage("scarfReference"),
  },
  {
    id: "small-pouch", name: t("Túi nhỏ", "Small pouch"), subtitle: t("Phụ kiện & Quà tặng", "Accessories & Gifts"),
    meaning: t("Túi nhỏ phối cùng túi The Vanguard.", "A small pouch styled with The Vanguard."),
    short: t("Túi nhỏ có khóa kéo, chụp cùng túi The Vanguard.", "A small zipped pouch photographed with The Vanguard."),
    price: 140000, priceIsDemo: false, category: "accessory", gender: ["women", "men"], material: [] as string[], motifs: [] as string[], collection: "accessories", stock: 0,
    colors: [] as string[], variants: [] as {key:string; label:Bilingual}[], images: [suppliedImage("smallPouchReference")], lifestyle: suppliedImage("smallPouchReference"),
  },
] as const;
export type Product = (typeof products)[number];

export const colours: Record<string, { name: Bilingual; hex: string }> = {
  burgundy: { name: t("Đỏ đô", "Burgundy"), hex: "#7A1F1E" },
  brown: { name: t("Nâu", "Brown"), hex: "#75523C" },
  cream: { name: t("Kem", "Cream"), hex: "#D1B79C" },
};

export const copy = {
  vi: {
    nav: [
      "Về chúng tôi",
      "Túi nữ",
      "Túi nam",
      "Bộ sưu tập",
      "Phụ kiện & Quà tặng",
      "Cộng đồng",
    ],
    heroTitle: "HỌA TIẾT DỆT TRONG NHỊP SỐNG ĐƯƠNG ĐẠI",
    heroSub:
      "Túi công sở với phom dáng hiện đại, họa tiết dệt và phối chất liệu vải mới cùng vải tái chế.",
    heroCta: "Khám Phá Bộ Sưu Tập",
    aboutTitle: "Từ chất liệu đến chiếc túi",
    aboutStory: [
      "Refolks là bộ sưu tập túi công sở với nhiều phom dáng, màu sắc và họa tiết dệt.",
      "Thiết kế phối vải chuyên dụng mới với vải tái chế ở các chi tiết được chọn.",
      "Mỗi mẫu có cách sắp xếp họa tiết và chi tiết riêng.",
      "Các đường dệt, tông màu và phom túi tạo nên diện mạo của từng thiết kế.",
      "Khám phá ảnh sản phẩm để xem rõ họa tiết, phom dáng và các chi tiết của từng mẫu.",
    ],
    uspTitles: ["Họa tiết dệt", "Phối chất liệu", "Phom dáng"],
    usps: [
      "Mỗi mẫu có bố cục họa tiết dệt riêng trên thân túi.",
      "Các thiết kế sử dụng 70% vải chuyên dụng mới và 30% vải tái chế, tính theo khối lượng vải.",
      "Khám phá phom túi, quai xách và chi tiết hoàn thiện trong bộ ảnh sản phẩm.",
    ],
    shopTitle: "Heritage in Motion",
    shopIntro:
      "Di sản trong từng chuyển động. Khám phá bốn mẫu túi công sở đeo vai của Refolks.",
    communityTitle: "Cộng đồng Refolks",
    communitySub:
      "Thông tin về các hoạt động cộng đồng sẽ được cập nhật khi được xác nhận.",
    donationTitle: "Vải tái chế trong thiết kế",
    donationStory:
      "Túi sử dụng vải tái chế ở các chi tiết được chọn. Thông tin về hoạt động tiếp nhận quần áo sẽ được công bố khi lịch và địa điểm được xác nhận.",
  },
  en: {
    nav: ["About", "Women", "Men", "Collections", "Accessories & Gifts", "Community"],
    heroTitle: "WOVEN MOTIFS FOR CONTEMPORARY LIFE",
    heroSub:
      "Work bags with contemporary silhouettes, woven motifs, and a mix of new and recovered textile.",
    heroCta: "Explore the Collection",
    aboutTitle: "From textile to bag",
    aboutStory: [
      "Refolks is a collection of work bags in a range of silhouettes, colours and woven motifs.",
      "The designs pair new technical textile with recovered textile in selected details.",
      "Each style has its own arrangement of motifs and details.",
      "Woven lines, colours and bag silhouettes shape the look of each design.",
      "Explore the product photos to see each style's motifs, silhouette and details.",
    ],
    uspTitles: [
      "Woven motifs",
      "Textile mix",
      "Silhouettes",
    ],
    usps: [
      "Each style has its own woven motif layout across the bag body.",
      "The designs use 70% new technical textile and 30% recovered textile, by textile weight.",
      "Explore the product photos for each bag's silhouette, handles and finish details.",
    ],
    shopTitle: "Heritage in Motion",
    shopIntro:
      "Heritage in every movement. Explore four work shoulder bags by Refolks.",
    communityTitle: "The Refolks community",
    communitySub:
      "Information about community activities will be shared once confirmed.",
    donationTitle: "Recovered textile in the designs",
    donationStory:
      "Recovered textile is used in selected bag details. Information about clothing collection will be shared once dates and locations are confirmed.",
  },
} as const;

export const accordion = {
  vi: [
    [
      "Vật liệu minh bạch",
      "Túi sử dụng 70% vải chuyên dụng mới và 30% vải tái chế, tính theo khối lượng vải.",
    ],
    [
      "Không gian sử dụng",
      "Bố trí vật dụng cần thiết hằng ngày theo nhu cầu của bạn.",
    ],
    [
      "Họa tiết",
      "Họa tiết dệt là điểm nhấn của thiết kế.",
    ],
    [
      "Chăm sóc & Bảo quản",
      "Lau nhẹ bề mặt vải bằng khăn ẩm và tránh ngâm nước. Thông tin về dịch vụ chăm sóc và sửa chữa sẽ được cập nhật sau khi điều khoản được xác nhận.",
    ],
  ],
  en: [
    [
      "Transparent Materials",
      "The bag uses 70% new technical textile and 30% recovered textile, by textile weight.",
    ],
    [
      "Everyday Space",
      "Arrange the everyday items you carry to suit your needs.",
    ],
    [
      "Woven Motif",
      "A woven motif gives the design its distinctive detail.",
    ],
    [
      "Care & Maintenance",
      "Wipe textile surfaces gently with a damp cloth and avoid soaking. Details of care and repair services will be shared once their terms are confirmed.",
    ],
  ],
} as const;
