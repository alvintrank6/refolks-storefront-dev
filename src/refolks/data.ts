import translations from "./translations.json";
import { productImages } from "./imageManifest";

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

// Product catalogue from the owner's November 27 product feedback.
export const products = [
  {
    id: "the-herald",
    name: t("The Herald", "The Herald"),
    subtitle: t("Người báo tin lành", "The Bearer of Good News"),
    meaning: t("Hoa văn Boọc khoáy gửi lời chúc bình an đến người bắt đầu một hành trình mới.", "The Boọc khoáy motif carries a wish for peace to someone beginning a new journey."),
    short: t("Phom chữ nhật rộng, góc đáy bo nhẹ. Hoa văn Boọc khoáy nâu trên nền kem; quai xách và đáy túi phối tông nâu.", "A wide rectangular silhouette with softly rounded base corners. Brown Boọc khoáy on a cream ground, with brown-toned handles and base."),
    price: 1590000,
    category: "work-shoulder-bag",
    gender: ["women"],
    material: ["brocade", "recycled", "canvas"],
    motifs: ["booc-khoay"],
    collection: "heritage-in-motion",
    stock: 8,
    colors: ["cream"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-herald"),
    lifestyle: productImages("the-herald")[0],
  },
  {
    id: "the-curator",
    name: t("The Curator", "The Curator"),
    subtitle: t("Người gìn giữ giá trị", "The Keeper of Values"),
    meaning: t("Hoa văn ẩn trong sắc nâu trầm gợi cách người gìn giữ nâng niu từng dấu vết thủ công.", "The motif against deep brown evokes care for every trace of handwork."),
    short: t("Phom vuông, bản rộng. Họa tiết Boọc khoáy đen trên nền nâu; hai dải nâu nối thân với quai xách, điểm khóa kim loại.", "A wide square silhouette. Black Boọc khoáy on a brown ground, with two brown bands joining the body to the handles and metal buckles."),
    price: 1590000,
    category: "work-shoulder-bag",
    gender: ["men"],
    material: ["brocade", "recycled", "canvas"],
    motifs: ["booc-khoay"],
    collection: "heritage-in-motion",
    stock: 8,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-curator"),
    lifestyle: productImages("the-curator")[0],
  },
  {
    id: "the-vanguard",
    name: t("The Vanguard", "The Vanguard"),
    subtitle: t("Người tiên phong", "The Pioneer"),
    meaning: t("Lời chúc may mắn trong hoa văn Boọc khoáy đồng hành cùng người dám đi trước.", "The Boọc khoáy motif offers a wish for good fortune to those bold enough to go first."),
    short: t("Túi unisex dáng thang, nắp bo góc và khóa vuông. Phối nâu, be với thân dệt Boọc khoáy. Bản nam kèm ví thẻ; bản nữ thêm khăn lụa họa tiết thắt quai.", "A unisex trapezoid bag with a rounded flap and square clasp. Brown and beige tones frame the woven Boọc khoáy body. The men's version comes with a cardholder; the women's version adds a patterned silk scarf to the handle."),
    price: 1890000,
    category: "work-shoulder-bag",
    gender: ["women", "men"],
    material: ["brocade", "recycled", "canvas"],
    motifs: ["booc-khoay"],
    collection: "heritage-in-motion",
    stock: 12,
    colors: ["brown", "cream"],
    variants: [{key:"women-scarf",label:t("Bản nữ – kèm khăn lụa họa tiết","Women's – with a patterned silk scarf")},{key:"men-cardholder",label:t("Bản nam – kèm ví thẻ","Men's – with a cardholder")}],
    images: productImages("the-vanguard"),
    lifestyle: productImages("the-vanguard")[0],
  },
  {
    id: "the-navigator",
    name: t("The Navigator", "The Navigator"),
    subtitle: t("Người dẫn lối", "The Guide"),
    meaning: t("Bước chân hươu gợi tự do khám phá, cành dừa gợi sức bền để đi đến cùng.", "The deer's step evokes freedom to explore; the palm branch, the resolve to keep going."),
    short: t("Thân nâu hình thang, miệng tạo góc chữ V nhẹ. Dải họa tiết hươu và cành dừa chạy ngang thân; quai ngắn xách tay đi cùng dây đeo dài.", "A brown trapezoid body with a gently V-shaped opening. Deer and palm motifs cross the body; a short handle is paired with a long shoulder strap."),
    price: 1590000,
    category: "work-shoulder-bag",
    gender: ["women", "men"],
    material: ["brocade"],
    motifs: ["con-huou", "canh-dua"],
    collection: "heritage-in-motion",
    stock: 6,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-navigator"),
    lifestyle: productImages("the-navigator")[0],
  },
  {
    id: "the-weaver",
    name: t("The Weaver", "The Weaver"),
    subtitle: t("Người dệt", "The Weaver"),
    meaning: t("Tên gọi tôn vinh đôi tay người phụ nữ Thái gửi bản sắc vào từng đường kim trên khăn Piêu.", "Its name honours the Thai women's hands that weave identity into each stitch of a Piêu textile."),
    short: t("Thân đen dáng thang, nắp tam giác viền đỏ mang họa tiết khăn Piêu đa sắc. Quai xách bằng dây bạc xà tích truyền thống của người Thái.", "A black trapezoid body with a red-edged triangular flap carrying a multicolour Piêu motif. The handle is a traditional Thai silver xà tích chain."),
    price: null,
    category: "small-handbag",
    gender: ["women"],
    material: ["brocade", "recycled"],
    motifs: ["khan-pieu"],
    collection: "small-bags",
    stock: 0,
    colors: ["black"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-weaver"),
    lifestyle: productImages("the-weaver")[0],
  },
  {
    id: "the-sower",
    name: t("The Sower", "The Sower"),
    subtitle: t("Người gieo mầm", "The Sower"),
    meaning: t("Bông lúa trĩu hạt gợi đức cần cù, nối nghề trồng lúa của người Thái với văn minh lúa nước Việt Nam.", "A full grain of rice evokes diligence, linking Thai rice-growing traditions with Vietnam's rice culture."),
    short: t("Thân kem bo tròn với quai vải lồng chéo. Họa tiết Boọc khoáy đồng màu làm nền cho bông lúa thêu chỉ bạc ánh kim.", "A rounded cream body with crossed textile handles. A tonal Boọc khoáy motif sets off the rice ear embroidered in metallic silver thread."),
    price: null,
    category: "small-handbag",
    gender: ["women"],
    material: ["brocade", "recycled"],
    motifs: ["booc-khoay", "lua"],
    collection: "small-bags",
    stock: 0,
    colors: ["cream"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-sower"),
    lifestyle: productImages("the-sower")[0],
  },
  {
    id: "the-trailblazer",
    name: t("The Trailblazer", "The Trailblazer"),
    subtitle: t("Người khai phóng", "The Pathfinder"),
    meaning: t("Đôi hươu gợi sự tự do và tinh thần dám tự mở đường.", "A pair of deer evokes freedom and the courage to make one's own way."),
    short: t("Ví gập ngang màu nâu, đôi hươu màu kem ở mặt trước. Có ngăn tiền dài, khe thẻ xếp tầng và lớp lót sọc nâu, cam, be.", "A brown horizontal-fold wallet with a cream deer motif. It has a long cash compartment, tiered card slots and a brown, orange and beige striped lining."),
    price: null,
    category: "accessory",
    gender: ["women", "men"],
    material: ["recycled"],
    motifs: ["con-huou"],
    collection: "accessories",
    stock: 0,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-trailblazer"),
    lifestyle: productImages("the-trailblazer")[0],
  },
  {
    id: "the-guardian",
    name: t("The Guardian", "The Guardian"),
    subtitle: t("Người bảo hộ", "The Guardian"),
    meaning: t("Boọc khoáy gửi lời chúc bình an trên chiếc ví giữ những vật nhỏ thân thuộc.", "Boọc khoáy carries a wish for peace on a wallet that keeps familiar small things close."),
    short: t("Ví khóa kéo thân nâu bo góc, họa tiết Boọc khoáy màu kem. Có móc cài kim loại và lớp lót sọc với ngăn phụ bên trong.", "A zip wallet with a rounded brown body and cream Boọc khoáy motif. It has a metal clip and a striped lining with an inner pocket."),
    price: null,
    category: "accessory",
    gender: ["women", "men"],
    material: ["recycled"],
    motifs: ["booc-khoay"],
    collection: "accessories",
    stock: 0,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-guardian"),
    lifestyle: productImages("the-guardian")[0],
  },
  {
    id: "the-pathfinder",
    name: t("The Pathfinder", "The Pathfinder"),
    subtitle: t("Người mở lối", "The Path Opener"),
    meaning: t("Những nhánh lá cọ hướng ra hai phía gợi những lối đi mở ra từ cùng một điểm khởi đầu.", "Palm branches reaching in two directions suggest paths opening from the same starting point."),
    short: t("Ví thẻ dáng ngang phối nâu và be, với ba dải lá cọ màu vàng nâu. Khe thẻ xếp tầng và góc bo tròn.", "A horizontal cardholder in brown and beige, with three golden-brown palm-leaf bands, tiered card slots and rounded corners."),
    price: null,
    category: "accessory",
    gender: ["women", "men"],
    material: ["recycled"],
    motifs: ["la-co"],
    collection: "accessories",
    stock: 0,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-pathfinder"),
    lifestyle: productImages("the-pathfinder")[0],
  },
  {
    id: "the-envoy",
    name: t("The Envoy", "The Envoy"),
    subtitle: t("Người đưa tin", "The Messenger"),
    meaning: t("Mô-típ Boọc khoáy nhỏ giữa mặt ví như lời chúc bình an mang theo đến mỗi cuộc gặp.", "A small Boọc khoáy motif at the centre carries a wish for peace to every meeting."),
    short: t("Ví thẻ mỏng với các lớp nâu chuyển sắc, Boọc khoáy màu kem ở giữa mặt trước, khe thẻ xếp tầng và đường chỉ may viền.", "A slim cardholder with layered brown tones, a cream Boọc khoáy at the centre, tiered card slots and stitched edges."),
    price: null,
    category: "accessory",
    gender: ["women", "men"],
    material: ["recycled"],
    motifs: ["booc-khoay"],
    collection: "accessories",
    stock: 0,
    colors: ["brown"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-envoy"),
    lifestyle: productImages("the-envoy")[0],
  },
  {
    id: "the-storyteller",
    name: t("The Storyteller", "The Storyteller"),
    subtitle: t("Móc khóa cá nhân hóa", "Personalised charm"),
    meaning: t("Mỗi người chọn một biểu tượng để kể câu chuyện của riêng mình trên chiếc túi.", "Each person chooses a symbol to tell their own story on a bag."),
    short: t("Charm tháo lắp để phối ở quai túi, làm từ kim loại màu bạc và vải tái chế nhồi bông thủ công. Có thể chọn họa tiết Boọc khoáy, hươu, hoa cọ hoặc bông lúa, phối màu nâu hoặc kem.", "A removable charm for a bag handle, made with silver-tone metal and hand-stuffed recovered textile. Choose Boọc khoáy, deer, palm flower or rice motifs in brown or cream."),
    price: null,
    category: "accessory",
    gender: ["women", "men"],
    material: ["recycled"],
    motifs: ["booc-khoay", "con-huou", "hoa-co", "lua"],
    collection: "accessories",
    stock: 0,
    colors: ["brown", "cream"],
    variants: [] as {key:string; label:Bilingual}[],
    images: productImages("the-storyteller"),
    lifestyle: productImages("the-storyteller")[0],
  },
] as const;
export type Product = (typeof products)[number];

export const colours: Record<string, { name: Bilingual; hex: string }> = {
  black: { name: t("Đen", "Black"), hex: "#211B17" },
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
      "Di sản trong từng chuyển động. Khám phá bốn mẫu túi chính và hai mẫu túi xách tay cỡ nhỏ của Refolks.",
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
      "Heritage in every movement. Explore Refolks' four main bags and two small handbags.",
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
