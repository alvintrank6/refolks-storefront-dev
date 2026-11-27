"use client";
/* eslint-disable @next/next/no-img-element -- Images are locally optimized WebP assets with CSS aspect ratios. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Mail,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  X,
  MessageCircle,
  MapPin,
  Camera,
  Gem,
  RefreshCw,
  Laptop,
} from "lucide-react";
import { MemberBenefits, StylingGuide, CareGuide } from "./RoundTwoSections";
import { answerChat, chatCopy, type ChatStage } from "../services/chatService";
import { AdminPanel, statusLabel } from "./AdminPanel";
import type { Role } from "../lib/auth/roles";
import {
  accordion,
  colours,
  copy,
  img,
  localize,
  locales,
  products,
  translate,
  type Lang,
  type Product,
} from "../refolks/data";
import "./refolks.css";
import "./refolks-round-two.css";

type CartItem = { id: string; qty: number; color: string; personal: boolean; variant?: string };
type Account = { name: string; email: string; role: Role };
type Order = { number: string; createdAt: string; status: string; total: number; items: unknown[] };
type Route = { page: string; id?: string };
type ChatMessage = {role:"user"|"bot"; text:string; href?:string};
const base = (lang: Lang) => `/${lang}`;
const persistLocale = (lang: Lang) => {
  document.documentElement.setAttribute("lang", lang);
  document.cookie = `refolks-lang=${lang};path=/;max-age=31536000;SameSite=Lax`;
};
const currency = (n: number | null) =>
  n === null ? "Coming soon" : `${new Intl.NumberFormat("vi-VN").format(n)}₫`;
const productPhotoAlt = (p: Product, lang: Lang) => {
  if (p.id === "the-storyteller") return lang === "vi" ? "Charm rồng và charm hoa cọ bạc của The Storyteller" : "The Storyteller dragon and silver palm-flower charms";
  return p.name[lang];
};
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};
const ui = {
  vi: {
    search: "Tìm kiếm",
    account: "Tài khoản",
    bag: "Giỏ hàng",
    close: "Đóng",
    shop: "Cửa hàng",
    all: "Tất cả sản phẩm",
    featured: "Sản phẩm nổi bật",
    explore: "Khám phá",
    readMore: "Đọc thêm",
    readLess: "Thu gọn",
    about: "Câu chuyện Refolks",
    heritage: "Chất liệu & thiết kế",
    new: "Mới",
    news: "Câu chuyện thiết kế",
    viewAll: "Xem tất cả",
    community: "Hành trình tuần hoàn & sứ mệnh cộng đồng",
    discover: "Tìm hiểu thêm",
    filter: "Bộ lọc",
    sort: "Sắp xếp",
    shown: "sản phẩm",
    availability: "Tình trạng",
    inStock: "Còn hàng",
    colour: "Màu sắc",
    material: "Chất liệu",
    personalisation: "Cá nhân hóa",
    clear: "Xóa tất cả",
    apply: "Áp dụng",
    lowHigh: "Giá thấp đến cao",
    highLow: "Giá cao đến thấp",
    newest: "Mới nhất",
    recommended: "Nổi bật",
    priceSoon: "Coming soon",
    details: "Xem chi tiết",
    add: "Thêm vào giỏ",
    quantity: "Số lượng",
    size: "Kích thước & công năng",
    recommendation: "Có thể bạn cũng thích",
    subtotal: "Tạm tính",
    checkout: "Thanh toán ngay",
    viewBag: "Xem giỏ hàng",
    empty: "Giỏ hàng của bạn đang trống",
    keepShopping: "Tiếp tục mua sắm",
    remove: "Xóa",
    freeship: "Phí giao hàng: Hà Nội 30.000₫ · tỉnh khác 40.000₫",
    code: "Mã giảm giá",
    codePlaceholder: "Nhập mã",
    mockPay: "Thanh toán nhanh chỉ là bản demo.",
    signIn: "Đăng nhập",
    signUp: "Tạo tài khoản",
    signOut: "Đăng xuất",
    signPrompt: "Đăng nhập hoặc tạo tài khoản",
    email: "Email",
    password: "Mật khẩu",
    name: "Họ và tên",
    newsletter: "Nhận tin tức và ưu đãi",
    orders: "Đơn hàng",
    profile: "Hồ sơ",
    vouchers: "Kho voucher cho bạn",
    copied: "Đã sao chép mã",
    copyFailed: "Không sao chép được mã. Vui lòng thử lại.",
    phone: "Số điện thoại",
    address: "Địa chỉ",
    note: "Ghi chú",
    submit: "Gửi thông tin",
    chat: "Chat",
    chatHello: "Xin chào! Refolks có thể giúp gì cho bạn?",
    chatIdeas: ["Chọn túi", "Chăm sóc", "Vận chuyển", "Đổi trả", "Chất liệu"],
    chatReplies: [
      "Bạn có thể xem phom dáng, màu sắc và ảnh chi tiết trên trang từng sản phẩm.",
      "Lau nhẹ bề mặt vải bằng khăn ẩm và tránh ngâm nước. Thông tin dịch vụ chăm sóc sẽ được cập nhật sau khi điều khoản được xác nhận.",
      "Phí giao hàng đề xuất là 30.000₫ tại Hà Nội và 40.000₫ ở tỉnh thành khác.",
      "Vui lòng xem trang chính sách để biết thông tin hiện có về đổi trả.",
      "Túi sử dụng 70% vải chuyên dụng mới và 30% vải tái chế, tính theo khối lượng vải.",
    ],
    chatAnswer:
      "Bạn có thể xem thông tin sản phẩm và chính sách hiện có trên website. Thông tin đang chờ xác nhận sẽ được cập nhật sau.",
    contact: "Liên hệ",
    policies: "Chính sách",
    information: "Thông tin",
    newsletterTitle: "Bản tin",
    newsletterDesc: "Nhận câu chuyện mới từ Refolks.",
    footerThanks: "Di sản sống cùng nhịp phố.",
    map: "Thông tin địa điểm studio sẽ được cập nhật khi xác nhận.",
    demoContact: "Thông tin liên hệ sẽ được cập nhật.",
    continue: "Tiếp tục",
    shipping: "Phí giao hàng",
    total: "Tổng cộng",
    placed: "Đơn hàng đã được ghi nhận. Email xác nhận đã được gửi.",
    orderFailed: "Chưa đặt được đơn. Vui lòng kiểm tra thông tin và thử lại.",
    outOfStock: "Một sản phẩm trong giỏ đã hết hàng.",
    demoNotice:
      "Đây là bản demo. Không thu tiền và không gửi đơn hàng tới Refolks.",
    authCredentials: "Email hoặc mật khẩu không đúng.",
    authExists: "Email này đã có tài khoản. Hãy đăng nhập.",
    authLocked: "Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.",
    authPassword: "Mật khẩu cần ít nhất 8 ký tự.",
    authFailed: "Chưa xử lý được. Vui lòng thử lại.",
    google: "Tiếp tục với Google",
    forgot: "Quên mật khẩu?",
    otpCode: "Mã 6 chữ số",
    verifyTitle: "Kiểm tra email của bạn",
    verifyIntro: "Chúng tôi đã gửi mã 6 chữ số tới",
    verifyButton: "Xác minh",
    resend: "Gửi lại mã",
    resent: "Mã mới đang được gửi.",
    forgotTitle: "Đặt lại mật khẩu",
    forgotIntro: "Nhập email tài khoản, chúng tôi sẽ gửi mã cho bạn.",
    sendCode: "Gửi mã",
    newPassword: "Mật khẩu mới",
    resetButton: "Lưu mật khẩu mới",
    backToSignIn: "Quay lại đăng nhập",
    authCode: "Mã không đúng hoặc đã hết hạn.",
    authCooldown: "Vui lòng đợi một phút trước khi yêu cầu mã mới.",
    authGoogleFailed: "Đăng nhập Google chưa hoàn tất. Vui lòng thử lại.",
    emailUnavailable: "Hiện chưa gửi được mã qua email.",
    admin: "Quản trị",
    region: "Khu vực giao hàng",
    hanoi: "Hà Nội · 30.000₫",
    otherRegion: "Tỉnh thành khác · 40.000₫",
    newsletterDone: "Cảm ơn bạn đã đăng ký nhận tin.",
    requestFailed: "Chưa gửi được. Vui lòng thử lại sau.",
    signInFirst: "Đăng nhập để xem tài khoản.",
    customize: "Cá nhân hóa",
    zoom: "Phóng to ảnh",
    view360: "Xem các góc túi",
    lookbook: "Lookbook",
    care: "Chăm sóc sản phẩm",
    menu: "Mở menu",
    home: "Trang chủ",
    aboutUs: "Về chúng tôi",
    comingSoon: "Đang cập nhật",
  },
  en: {
    search: "Search",
    account: "Account",
    bag: "Bag",
    close: "Close",
    shop: "Shop",
    all: "All products",
    featured: "Featured pieces",
    explore: "Explore",
    readMore: "Read more",
    readLess: "Read less",
    about: "The Refolks story",
    heritage: "Textiles & design",
    new: "New",
    news: "Design stories",
    viewAll: "View all",
    community: "A circular journey & community mission",
    discover: "Discover more",
    filter: "Filter",
    sort: "Sort by",
    shown: "products",
    availability: "Availability",
    inStock: "In stock",
    colour: "Colour",
    material: "Material",
    personalisation: "Personalisation",
    clear: "Clear all",
    apply: "Apply",
    lowHigh: "Price: low to high",
    highLow: "Price: high to low",
    newest: "Newest",
    recommended: "Featured",
    priceSoon: "Coming soon",
    details: "View details",
    add: "Add to bag",
    quantity: "Quantity",
    size: "Size & function",
    recommendation: "You may also like",
    subtotal: "Subtotal",
    checkout: "Checkout now",
    viewBag: "View bag",
    empty: "Your bag is empty",
    keepShopping: "Continue shopping",
    remove: "Remove",
    freeship: "Shipping: Hanoi 30,000₫ · other provinces 40,000₫",
    code: "Discount code",
    codePlaceholder: "Enter code",
    mockPay: "Express payment is a demo.",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    signPrompt: "Sign in or create an account",
    email: "Email",
    password: "Password",
    name: "Full name",
    newsletter: "Receive news and offers",
    orders: "Orders",
    profile: "Profile",
    vouchers: "Your vouchers",
    copied: "Code copied",
    copyFailed: "Couldn't copy the code. Please try again.",
    phone: "Phone",
    address: "Address",
    note: "Notes",
    submit: "Submit",
    chat: "Chat",
    chatHello: "Hello! How can Refolks help?",
    chatIdeas: ["Choose a bag", "Care", "Shipping", "Returns", "Materials"],
    chatReplies: [
      "Explore the silhouette, colour and detail photos on each product page.",
      "Wipe textile surfaces gently with a damp cloth and avoid soaking. Details of care services will be shared once their terms are confirmed.",
      "Proposed shipping is 30,000₫ in Hanoi and 40,000₫ elsewhere.",
      "Please review the policies page for the available returns information.",
      "The bags use 70% new technical textile and 30% recovered textile, by textile weight.",
    ],
    chatAnswer:
      "Explore the product and policy information currently available on this website. Details awaiting confirmation will be updated later.",
    contact: "Contact",
    policies: "Policies",
    information: "Information",
    newsletterTitle: "Newsletter",
    newsletterDesc: "A new story from Refolks, in your inbox.",
    footerThanks: "Heritage woven into city life.",
    map: "Studio location details will be shared once confirmed.",
    demoContact: "Contact details coming soon.",
    continue: "Continue",
    shipping: "Shipping",
    total: "Total",
    placed: "Your order has been recorded. A confirmation email is on its way.",
    orderFailed: "We couldn't place the order. Please check your details and try again.",
    outOfStock: "An item in your bag is out of stock.",
    demoNotice:
      "This is a demo. No payment is collected and no order is sent to Refolks.",
    authCredentials: "Incorrect email or password.",
    authExists: "This email already has an account. Please sign in.",
    authLocked: "Too many failed sign-ins. Try again in 15 minutes.",
    authPassword: "Password must be at least 8 characters.",
    authFailed: "Something went wrong. Please try again.",
    google: "Continue with Google",
    forgot: "Forgot password?",
    otpCode: "6-digit code",
    verifyTitle: "Check your email",
    verifyIntro: "We sent a 6-digit code to",
    verifyButton: "Verify",
    resend: "Send a new code",
    resent: "A new code is on its way.",
    forgotTitle: "Reset your password",
    forgotIntro: "Enter your account email and we will send you a code.",
    sendCode: "Send code",
    newPassword: "New password",
    resetButton: "Save new password",
    backToSignIn: "Back to sign in",
    authCode: "The code is wrong or has expired.",
    authCooldown: "Please wait a minute before asking for another code.",
    authGoogleFailed: "Google sign-in did not complete. Please try again.",
    emailUnavailable: "Email codes are not available right now.",
    admin: "Admin",
    region: "Shipping region",
    hanoi: "Hanoi · 30,000₫",
    otherRegion: "Other provinces · 40,000₫",
    newsletterDone: "Thank you for subscribing.",
    requestFailed: "We couldn't send that. Please try again later.",
    signInFirst: "Sign in to see your account.",
    customize: "Personalise",
    zoom: "Zoom image",
    view360: "See every angle",
    lookbook: "Lookbook",
    care: "Product care",
    menu: "Open menu",
    home: "Home",
    aboutUs: "About us",
    comingSoon: "Coming soon",
  },
} as const;

function routeFromPath(path: string): Route {
  const parts = path.split("/").filter(Boolean).slice(1);
  const first = parts[0] || "";
  if (!first) return { page: "home" };
  if (["shop", "cua-hang", "women", "men", "gifts"].includes(first)) return { page: "shop" };
  if (first === "accessories") return { page: "shop", id: "accessories" };
  if (first === "collections") return parts[1] === "heritage-in-motion" ? { page: "shop", id: "collection" } : { page: "not-found" };
  if (["products", "san-pham"].includes(first))
    return products.some((p) => p.id === parts[1]) ? { page: "product", id: parts[1] } : { page: "not-found" };
  if (
    ["community", "cong-dong", "donation-event", "su-kien-quyen-gop"].includes(
      first,
    )
  )
    return { page: "community" };
  if (["about", "ve-chung-toi", "craft", "thu-cong"].includes(first))
    return { page: "about" };
  if (["journal", "news", "tin-tuc"].includes(first))
    return { page: "journal", id: parts[1] };
  if (["account", "tai-khoan", "orders", "don-hang"].includes(first))
    return { page: "account" };
  if (["admin", "quan-tri"].includes(first)) return { page: "admin" };
  if (["cart", "gio-hang"].includes(first)) return { page: "cart" };
  if (["checkout", "thanh-toan"].includes(first)) return { page: "checkout" };
  if (["huong-dan-phoi-do", "styling-guide"].includes(first)) return { page: "styling" };
  if (["huong-dan-bao-quan", "care-guide"].includes(first)) return { page: "care" };
  if (["contact", "lien-he"].includes(first)) return { page: "contact" };
  return { page: "not-found" };
}

export function RefolksExperience({
  initialLocale,
  initialPath,
  initialQuery,
}: {
  initialLocale: Lang;
  initialPath: string;
  initialQuery: string;
}) {
  const [lang, setLang] = useState<Lang>(initialLocale);
  const [route, setRoute] = useState<Route>(() => routeFromPath(initialPath));
  const [queryString, setQueryString] = useState(initialQuery);
  const [menu, setMenu] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [solid, setSolid] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [chatStage, setChatStage] = useState<ChatStage>("idle");
  const [chatGender, setChatGender] = useState<"women"|"men"|undefined>();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<"zoom" | "care" | null>(null);
  const [zoomImage, setZoomImage] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [didHydrate, setDidHydrate] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "verify" | "forgot" | "reset">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authFeatures, setAuthFeatures] = useState({ google: false, email: false });
  const [activeImage, setActiveImage] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedColor, setColor] = useState(() => products.find((piece) => piece.id === route.id)?.colors[0] || "brown");
  const [selectedVariant, setVariant] = useState("women-scarf");
  const color = selectedColor;
  const variant = selectedVariant;
  const [personal, setPersonal] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [availability, setAvailability] = useState(false);
  const [material, setMaterial] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [filterGender, setFilterGender] = useState("");
  const [filterMotifs, setFilterMotifs] = useState<string[]>([]);
  const [filterPersonal, setFilterPersonal] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [toast, setToast] = useState("");
  const [pending, setPending] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [shippingRegion, setShippingRegion] = useState<"hanoi" | "other">(
    "hanoi",
  );
  const [scrollY, setScrollY] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const c = lang === "vi" ? copy.vi : lang === "en" ? copy.en : localize(copy.en, lang);
  const u = lang === "vi" ? ui.vi : lang === "en" ? ui.en : localize(ui.en, lang);
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (products.find((p) => p.id === item.id)?.price || 0) * item.qty,
    0,
  );
  const shippingFee = shippingRegion === "hanoi" ? 30000 : 40000;
  const product = products.find((p) => p.id === route.id) || products[0];
  const galleryImages = product.images;
  // Journal entries only use currently confirmed brand information.
  const journalItems = [
    {
      id: "ban-lac",
      tag: "CRAFT",
      image: "weaving-loom",
      title: c.aboutTitle,
      body: c.aboutStory,
    },
    {
      id: "community",
      tag: "COMMUNITY",
      image: "weaving-market",
      title: c.communityTitle,
      body: [c.communitySub, c.donationStory],
    },
  ];

  // Google sign-in returns with ?auth=google_failed when it did not complete; show it once.
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("auth") !== "google_failed") return;
    query.delete("auth");
    history.replaceState(history.state, "", location.pathname + (query.size ? `?${query}` : ""));
    const frame = requestAnimationFrame(() => setToast(u.authGoogleFailed));
    return () => cancelAnimationFrame(frame);
  }, [u.authGoogleFailed]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCart(readStorage<CartItem[]>("refolks-cart", []).filter((item) => products.some((p) => p.id === item.id)));
      type Me = { user: Account | null; features?: { google: boolean; email: boolean } };
      fetch("/api/auth/me")
        .then((res) => (res.ok ? (res.json() as Promise<Me>) : { user: null }))
        .then((data: Me) => {
          setAccount(data.user);
          if (data.features) setAuthFeatures(data.features);
        }, () => setAccount(null));
      requestAnimationFrame(() => {
        setDidHydrate(true);
        document.querySelector(".rf-site")?.setAttribute("data-ready", "true");
      });
    });
    const onPop = (event: PopStateEvent) => {
      const nextRoute = routeFromPath(location.pathname);
      setRoute(nextRoute);
      setColor(products.find((piece) => piece.id === nextRoute.id)?.colors[0] || "brown");
      setQueryString(location.search);
      const pathLocale = location.pathname.split("/")[1];
      setLang(locales.includes(pathLocale as Lang) ? pathLocale as Lang : "en");
      requestAnimationFrame(() => setTimeout(() => {
        if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
        else window.scrollTo(0, event.state?.scrollY ?? 0);
      }, 40));
    };
    const onScroll = () => {
      setScrollY(window.scrollY);
      setSolid(window.scrollY > 48);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  useEffect(() => {
    if (didHydrate) localStorage.setItem("refolks-cart", JSON.stringify(cart));
  }, [cart, didHydrate]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setChatMessages(JSON.parse(sessionStorage.getItem(`refolks-chat-${lang}`)||"[]")); } catch { setChatMessages([]); }
    });
    return () => cancelAnimationFrame(frame);
  }, [lang]);
  useEffect(() => { if (didHydrate) sessionStorage.setItem(`refolks-chat-${lang}`,JSON.stringify(chatMessages)); },[chatMessages,lang,didHydrate]);
  useEffect(() => { if(chatOpen) chatEndRef.current?.scrollIntoView({behavior:"smooth",block:"end"}); },[chatMessages,chatOpen,chatTyping]);
  useEffect(() => {
    if (route.page !== "account" && route.page !== "community") return;
    if (!account) return;
    fetch("/api/account/orders")
      .then((res) => (res.ok ? (res.json() as Promise<{ orders: Order[] }>) : { orders: [] }))
      .then((data: { orders: Order[] }) => setOrders(data.orders), () => setOrders([]));
  }, [route.page, account]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setMobile(false);
        setFilterOpen(false);
        setBagOpen(false);
        setAccountOpen(false);
        setChatOpen(false);
        setModal(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [modal]);
  useEffect(() => {
    if (route.page !== "product" || galleryImages.length < 2 || modal) return;
    const cycleGallery = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (event.key === "ArrowRight") setActiveImage((index) => (index + 1) % galleryImages.length);
      if (event.key === "ArrowLeft") setActiveImage((index) => (index - 1 + galleryImages.length) % galleryImages.length);
    };
    window.addEventListener("keydown", cycleGallery);
    return () => window.removeEventListener("keydown", cycleGallery);
  }, [route.page, route.id, galleryImages.length, modal]);
  useEffect(() => {
    if (!modal && !bagOpen && !filterOpen && !mobile) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable =
      dialogRef.current?.querySelector<HTMLElement>("button, input, a");
    focusable?.focus();
    return () => {
      document.body.style.overflow = old;
    };
  }, [modal, bagOpen, filterOpen, mobile]);
  useEffect(() => {
    if (!modal && !bagOpen && !filterOpen && !mobile && !accountOpen) return;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const elements = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], summary",
        ),
      ].filter((el) => el.getClientRects().length > 0);
      if (!elements.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [modal, bagOpen, filterOpen, mobile, accountOpen]);
  useEffect(() => {
    const id = toast ? window.setTimeout(() => setToast(""), 4000) : undefined;
    return () => {
      if (id) window.clearTimeout(id);
    };
  }, [toast]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % 4), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const closeModal = () => {
    setModal(null);
  };
  const navigate = (path: string) => {
    const next = new URL(path, location.origin);
    const nextRoute = routeFromPath(next.pathname);
    history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, "", location.href);
    history.pushState({}, "", next.pathname + next.search + next.hash);
    setRoute(nextRoute);
    setColor(products.find((piece) => piece.id === nextRoute.id)?.colors[0] || "brown");
    setQueryString(next.search);
    setMenu(null);
    setMobile(false);
    setFilterOpen(false);
    setBagOpen(false);
    setAccountOpen(false);
    setActiveImage(0);
    setQty(1);
    setReadMore(false);
    if (next.hash) setTimeout(() => document.getElementById(decodeURIComponent(next.hash.slice(1)))?.scrollIntoView({ behavior: "smooth" }), 50);
    else window.scrollTo({ top: 0, behavior: "instant" });
  };
  const switchLang = (next: Lang) => {
    if (next === lang) return;
    const path = location.pathname.replace(/^\/(en|vi|ko|ja|zh-CN)/, `/${next}`);
    persistLocale(next);
    localStorage.setItem("refolks-lang", next);
    location.assign(path + location.search + location.hash);
  };
  const showProduct = (p: Product) =>
    navigate(`${base(lang)}/products/${p.id}`);
  const showShop = (query = "") => navigate(`${base(lang)}/shop${query}`);
  const sendChat = async (value:string) => {
    const text=value.trim(); if(!text||chatTyping)return;
    setChatMessages((current)=>[...current,{role:"user",text}]);setChatInput("");setChatTyping(true);
    const reply=await answerChat(lang,text,chatStage,chatGender);
    setChatMessages((current)=>[...current,{role:"bot",text:reply.text,href:reply.href}]);
    setChatStage(reply.stage);if(reply.gender)setChatGender(reply.gender);setChatTyping(false);
  };
  const addToBag = (p: Product, count = 1) => {
    // Shop-grid quick add has no picker, so fall back to the product's own first colour/variant.
    const productColors: readonly string[] = p.colors;
    const color = productColors.includes(selectedColor) ? selectedColor : (productColors[0] ?? "");
    const variant = p.variants.some((v) => v.key === selectedVariant) ? selectedVariant : p.variants[0]?.key;
    setCart((current) => {
      const key = current.findIndex(
        (item) =>
          item.id === p.id &&
          item.color === color &&
          item.personal === personal &&
          item.variant === (p.variants.length ? variant : undefined),
      );
      if (key < 0)
        return [...current, { id: p.id, qty: count, color, personal, variant: p.variants.length ? variant : undefined }];
      return current.map((item, index) =>
        index === key ? { ...item, qty: item.qty + count } : item,
      );
    });
    setBagOpen(true);
  };
  const updateCart = (index: number, change: number) =>
    setCart((current) =>
      current.flatMap((item, i) =>
        i === index
          ? item.qty + change > 0
            ? [{ ...item, qty: Math.min(item.qty + change, 10) }]
            : []
          : [item],
      ),
    );
  const visible = useMemo(() => {
    const query = new URLSearchParams(queryString);
    let list = products.filter((p) => {
      const gender = query.get("gender");
      const collection = query.get("collection");
      const category = query.get("category");
      const searchTerm = query.get("q");
      return (
        (route.id === "accessories" ? p.category === "accessory" : route.id === "collection" ? p.category === "work-shoulder-bag" : p.category !== "accessory") &&
        (!gender || (p.category !== "accessory" && (p.gender as readonly string[]).includes(gender))) &&
        (!collection || p.collection === collection) &&
        (!category || p.category === category) &&
        (!searchTerm ||
          p.name[lang].toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    if (availability) list = list.filter((p) => p.stock > 0);
    if (filterColors.length)
      list = list.filter((p) =>
        p.colors.some((col) => filterColors.includes(col)),
      );
    if (filterGender) list = list.filter((p) => filterGender === "unisex" ? p.gender.length === 2 : (p.gender as readonly string[]).includes(filterGender));
    if (filterMotifs.length) list = list.filter((p) => p.motifs.some((motif) => filterMotifs.includes(motif)));
    if (material.length)
      list = list.filter((p) => p.material.some((m) => material.includes(m)));
    if (filterPersonal) list = list.filter((p) => p.price !== null);
    if (sort === "lowHigh")
      list = [...list].sort(
        (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
      );
    if (sort === "highLow")
      list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === "newest") list = [...list].reverse();
    return list;
  }, [
    queryString,
    route.id,
    lang,
    availability,
    filterColors,
    filterGender,
    filterMotifs,
    material,
    filterPersonal,
    sort,
  ]);
  const navItems = [
    { key: "about", label: c.nav[0], href: `${base(lang)}/about` },
    { key: "women", label: c.nav[1], href: `${base(lang)}/shop?gender=women` },
    { key: "men", label: c.nav[2], href: `${base(lang)}/shop?gender=men` },
    { key: "collections", label: c.nav[3], href: `${base(lang)}/collections/heritage-in-motion` },
    {
      key: "gifts",
      label: c.nav[4],
      href: `${base(lang)}/accessories`,
    },
    { key: "community", label: c.nav[5], href: `${base(lang)}/community` },
  ];
  const mega = (key: string) => {
    if (key === "about")
      return [
        [
          u.about,
          [
            [lang === "vi" ? "Câu chuyện thương hiệu" : translate("Our story", lang), `${base(lang)}/about#story`],
            [lang === "vi" ? "Chi tiết thiết kế" : translate("Design details", lang), `${base(lang)}/about#sustainability`],
            [lang === "vi" ? "Bền vững" : translate("Sustainability", lang), `${base(lang)}/about#sustainability`],
            [u.news, `${base(lang)}/news`],
            [u.contact, `${base(lang)}/contact`],
          ],
        ],
      ];
    if (key === "community")
      return [[u.account, [[u.community, `${base(lang)}/community`]]]];
    if (key === "collections")
      return [
        [
          lang === "vi" ? "Heritage in Motion – Di sản trong từng chuyển động" : translate("Heritage in Motion", lang),
          [
            ...products.slice(0, 4).map((p) => [p.name[lang], `${base(lang)}/products/${p.id}`]),
            [lang === "vi" ? "Xem cả bộ sưu tập" : translate("View collection", lang), `${base(lang)}/collections/heritage-in-motion`],
          ],
        ],
      ];
    if (key === "gifts")
      return [
        [
          c.nav[4],
          [
            [
              lang === "vi" ? "Tất cả phụ kiện" : translate("All accessories", lang),
              `${base(lang)}/accessories`,
            ],
            ...products
              .filter((p) => p.category === "accessory")
              .map((p) => [p.name[lang], `${base(lang)}/products/${p.id}`]),
          ],
        ],
      ];
    if (key === "men")
      return [
        [
          lang === "vi" ? "Túi nam" : translate("Men's bags", lang),
          [
            [u.all, `${base(lang)}/shop?gender=men`],
            [
              lang === "vi" ? "Túi công sở đeo vai" : translate("Work shoulder bags", lang),
              `${base(lang)}/shop?gender=men&category=work-shoulder-bag`,
            ],
          ],
        ],
        [
          lang === "vi" ? "Hướng dẫn" : translate("Guides", lang),
          [[u.lookbook, `${base(lang)}/huong-dan-phoi-do`], [u.care, `${base(lang)}/huong-dan-bao-quan`]],
        ],
      ];
    return [
      [
        lang === "vi" ? "Túi nữ" : translate("Women's bags", lang),
        [
          [u.all, `${base(lang)}/shop?gender=women`],
          [
            lang === "vi" ? "Túi công sở đeo vai" : translate("Work shoulder bags", lang),
            `${base(lang)}/shop?gender=women&category=work-shoulder-bag`,
          ],
        ],
      ],
      [
        lang === "vi" ? "Hướng dẫn" : translate("Guides", lang),
        [[u.lookbook, `${base(lang)}/huong-dan-phoi-do`], [u.care, `${base(lang)}/huong-dan-bao-quan`]],
      ],
    ];
  };
  const setAnchor = (path: string) => {
    navigate(path);
  };
  const productCard = (p: Product) => (
    <article className={`rf-product-card rf-${p.id}`} key={p.id}>
      <button
        className="rf-card-media"
        onClick={() => showProduct(p)}
        aria-label={p.name[lang]}
      >
        {p.images.length ? <>
          <img className="rf-card-main" src={p.images[0]} alt={productPhotoAlt(p, lang)} loading="lazy" />
          <img className="rf-card-hover" src={p.lifestyle} alt="" loading="lazy" />
        </> : <span className="rf-image-pending">{u.comingSoon}</span>}
        {p.images.length > 0 && <span className="rf-card-badge">{u.new}</span>}
      </button>
      <div className="rf-card-meta">
        <button className="rf-card-name" onClick={() => showProduct(p)}>
          {p.name[lang]}
        </button>
        <div className="rf-swatches">
          {p.colors.map((cl) => (
            <span
              key={cl}
              style={{ background: colours[cl].hex }}
              title={colours[cl].name[lang]}
            />
          ))}
        </div>
        <div className="rf-card-bottom">
          <strong>{currency(p.price)}</strong>
          <button aria-label={p.stock ? u.add : u.comingSoon} onClick={() => addToBag(p)} disabled={!p.stock}>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
  const postRequest = (payload: Record<string, unknown>) =>
    fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, locale: lang === "vi" ? "vi" : "en" }),
    }).then((res) => res.ok, () => false);
  const field = (label: string, type = "text", required = true) => (
    <label className="rf-field" key={label}>
      <span>{label}</span>
      <input
        type={type}
        name={label}
        required={required}
        min={type === "number" ? 1 : undefined}
      />
    </label>
  );
  const copyVoucher = (code: string) => {
    if (!navigator.clipboard) {
      setToast(u.copyFailed);
      return;
    }
    void navigator.clipboard.writeText(code).then(
      () => setToast(u.copied),
      () => setToast(u.copyFailed),
    );
  };
  const closeOverlays = () => {
    setMobile(false);
    setFilterOpen(false);
    setBagOpen(false);
    setAccountOpen(false);
    closeModal();
    setSearchOpen(false);
  };

  return (
    <div className="rf-site">
      <header
        className={`rf-header ${route.page === "home" && !solid && !menu && !mobile ? "rf-header-clear" : "rf-header-solid"}`}
        onMouseLeave={() => setMenu(null)}
      >
        <div className="rf-header-inner">
          <button
            className="rf-icon rf-mobile-menu"
            aria-label={u.menu}
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <nav className="rf-desktop-nav" aria-label="Main">
            {navItems.map((item) => (
              <button
                key={item.key}
                onMouseEnter={() => setMenu(item.key)}
                onFocus={() => setMenu(item.key)}
                onClick={() => navigate(item.href)}
              >
                {item.label}
                <ChevronDown size={12} />
              </button>
            ))}
          </nav>
          <button
            className="rf-logo"
            onClick={() => navigate(base(lang))}
            aria-label="Refolks home"
          >
            <img src="/images/refolks/logo-red-motif.png" alt="Refolks" />
            <img className="rf-logo-red" src="/images/refolks/logo-red-motif.png" alt="" aria-hidden="true" />
          </button>
          <div className="rf-header-actions">
            <div className="rf-lang" aria-label="Language">
              {locales.map((locale, index) => <span key={locale} className="rf-lang-option"><button className={lang === locale ? "active" : ""} onClick={() => switchLang(locale)} lang={locale}>{locale === "zh-CN" ? "中文" : locale.toUpperCase()}</button>{index < locales.length - 1 && <span>/</span>}</span>)}
            </div>
            <button
              className="rf-icon rf-desktop-action"
              aria-label={u.search}
              onClick={() => setSearchOpen(true)}
            >
              <Search size={21} />
            </button>
            <button
              className="rf-icon"
              aria-label={u.account}
              onClick={() => setAccountOpen(!accountOpen)}
            >
              <UserRound size={21} />
            </button>
            <button
              className="rf-icon rf-bag-trigger"
              aria-label={u.bag}
              onClick={() => setBagOpen(true)}
            >
              <ShoppingBag size={21} />
              {totalCount > 0 && <span>{totalCount}</span>}
            </button>
          </div>
        </div>
        {menu && (
          <div className="rf-mega" onMouseEnter={() => setMenu(menu)}>
            <div className="rf-mega-cols">
              {mega(menu).map(([heading, links]) => (
                <div key={heading as string}>
                  <h3>{heading as string}</h3>
                  {(links as string[][]).map(([label, href]) => (
                    <button key={label} onClick={() => setAnchor(href)}>
                      {label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <button
              className="rf-mega-feature"
              onClick={() =>
                showShop(
                  menu === "men" || menu === "women" ? `?gender=${menu}` : "",
                )
              }
            >
              <img
                src={img(
                  menu === "women"
                  ? "the-herald"
                    : menu === "men"
                      ? "tote-01-front"
                      : "tote-02-front",
                )}
                alt=""
              />
              <span>
                {u.explore} <ArrowRight size={15} />
              </span>
            </button>
          </div>
        )}
      </header>

      {route.page === "home" && (
        <main>
          <section className="rf-hero">
            <div className="rf-hero-slides">
              {products.slice(0, 4).map((piece, index) => <img key={piece.id} className={heroIndex === index ? "active" : ""} src={piece.lifestyle} alt={piece.name[lang]} aria-hidden={heroIndex !== index} />)}
            </div>
            <div className="rf-hero-shade" />
            <div className="rf-hero-copy">
              <span className="rf-eyebrow">REFOLKS · HERITAGE IN MOTION</span>
              <h1>{c.heroTitle}</h1>
              <p>{c.heroSub}</p>
              <button
                className="rf-button rf-button-light"
                onClick={() => navigate(`${base(lang)}/collections/heritage-in-motion`)}
              >
                {c.heroCta}
                <ArrowRight size={18} />
              </button>
            </div>
            <button
              className="rf-hero-scroll"
              onClick={() =>
                document
                  .getElementById("rf-featured")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {lang === "vi" ? "Cuộn để khám phá" : translate("Scroll to explore", lang)} ↓
            </button>
            <div className="rf-hero-dots" aria-label={lang === "vi" ? "Chọn ảnh bộ sưu tập" : translate("Choose collection image", lang)}>
              {products.slice(0, 4).map((piece, index) => <button key={piece.id} className={heroIndex === index ? "active" : ""} onClick={() => setHeroIndex(index)} aria-label={`${piece.name[lang]} ${index + 1}`} aria-current={heroIndex === index ? "true" : undefined} />)}
            </div>
          </section>
          <div
            className="rf-marquee"
            aria-label="SHAPE. TEXTURE. EVERYDAY CARRY."
          >
            <div>
              {Array(4)
                .fill("SHAPE. TEXTURE. EVERYDAY CARRY.")
                .map((s, i) => (
                  <span key={i}>{s} &nbsp; ✦ &nbsp; </span>
                ))}
            </div>
          </div>
          <section id="rf-featured" className="rf-section rf-featured">
            <div className="rf-section-head">
              <div>
                <span className="rf-eyebrow">01 / {u.explore}</span>
                <h2>{u.featured}</h2>
              </div>
              <button className="rf-text-link" onClick={() => showShop()}>
                {u.viewAll}
                <ArrowRight size={17} />
              </button>
            </div>
            <div className="rf-category-grid">
              {[
                [
                  lang === "vi" ? "Túi nữ" : translate("Women's bags", lang),
                  "products-2026-11/the-herald-01",
                  "?gender=women",
                ],
                [
                  lang === "vi" ? "Túi nam" : translate("Men's bags", lang),
                  "products-2026-11/the-curator-01",
                  "?gender=men",
                ],
                [
                  lang === "vi" ? "Phụ kiện & Quà tặng" : translate("Accessories & gifts", lang),
                  "products-2026-11/the-storyteller-01",
                  "?category=accessory",
                ],
              ].map(([label, image, query], i) => (
                <button
                  className="rf-category"
                  key={label}
                  onClick={() => showShop(query)}
                >
                  <img src={img(image)} alt="" loading="lazy" />
                  <span>
                    {label}
                    <ArrowRight size={18} />
                  </span>
                  <small>
                    {
                      [
                        lang === "vi" ? "Túi công sở đeo vai" : translate("Work shoulder bag", lang),
                        lang === "vi" ? "Túi công sở đeo vai" : translate("Work shoulder bag", lang),
                        lang === "vi"
                          ? "Ví · Ví thẻ · Charm"
                          : "Wallets · Cardholders · Charms",
                      ][i]
                    }
                  </small>
                </button>
              ))}
            </div>
          </section>
          <section className="rf-section rf-products-home">
            <div className="rf-section-head">
              <div>
                <span className="rf-eyebrow">02 / SHOP</span>
                <h2>{c.shopTitle}</h2>
                <p>{c.shopIntro}</p>
              </div>
              <button className="rf-text-link" onClick={() => showShop()}>
                {u.viewAll}
                <ArrowRight size={17} />
              </button>
            </div>
            <div className="rf-product-grid">
              {products.slice(0, 3).map(productCard)}
            </div>
          </section>
          <section className="rf-section rf-products-home">
            <div className="rf-section-head"><div><span className="rf-eyebrow">03 / {u.explore}</span><h2>{c.nav[4]}</h2></div><button className="rf-text-link" onClick={() => navigate(`${base(lang)}/accessories`)}>{u.viewAll}<ArrowRight size={17}/></button></div>
            <div className="rf-product-grid">{products.filter((p) => p.category === "accessory").slice(0, 2).map(productCard)}</div>
          </section>
          <section className="rf-story">
            <div className="rf-story-copy">
              <span className="rf-eyebrow">03 / {u.about}</span>
              <h2>{c.aboutTitle}</h2>
              {c.aboutStory.slice(0, 1).map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
              <button
                className="rf-text-link"
                onClick={() => navigate(`${base(lang)}/about`)}
              >
                {u.discover}
                <ArrowRight size={18} />
              </button>
            </div>
            <img
              src={img("weaving-tools")}
              alt={
                lang === "vi"
                  ? "Chi tiết dụng cụ dệt"
                  : translate("Textile tool details", lang)
              }
              loading="lazy"
            />
          </section>
          <section className="rf-section rf-usps">
            <div className="rf-section-head">
              <div>
                <span className="rf-eyebrow">04 / REFOLKS</span>
                <h2>{u.heritage}</h2>
              </div>
            </div>
            <div className="rf-usp-grid">
              {c.usps.map((text, i) => (
                <details key={i} className="rf-usp">
                  <summary>
                    <img
                      src={img(
                        [
                          "motif-booc-khoay",
                          "weaving-textile",
                          "tote-02-inside",
                        ][i],
                      )}
                      alt=""
                      loading="lazy"
                    />
                    <span>
                      {i === 0 ? <Gem size={35} strokeWidth={1.5}/> : i === 1 ? <RefreshCw size={35} strokeWidth={1.5}/> : <Laptop size={35} strokeWidth={1.5}/>}
                      <small>0{i + 1}</small>
                      <strong>{c.uspTitles[i]}</strong>
                      <Plus size={20} />
                    </span>
                    <p className="rf-usp-overlay">{text}</p>
                  </summary>
                  <p>{text}</p>
                </details>
              ))}
            </div>
          </section>
          <section className="rf-community-teaser">
            <div>
              <span className="rf-eyebrow">05 / COMMUNITY</span>
              <h2>{u.community}</h2>
              <p>{c.communitySub}</p>
              <div className="rf-buttons">
                <button
                  className="rf-button"
                  onClick={() => navigate(`${base(lang)}/community`)}
                >
                  {u.community}
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
            <img
              src={img("weaving-market")}
              alt={
                lang === "vi"
                  ? "Cộng đồng cùng tìm hiểu nghề dệt"
                  : translate("Community textile gathering", lang)
              }
              loading="lazy"
            />
          </section>
          <section className="rf-section rf-news">
            <div className="rf-section-head">
              <div>
                <span className="rf-eyebrow">06 / JOURNAL</span>
                <h2>{u.news}</h2>
              </div>
              <button
                className="rf-text-link"
                onClick={() => navigate(`${base(lang)}/journal`)}
              >
                {u.viewAll}
                <ArrowRight size={17} />
              </button>
            </div>
            <div className="rf-news-grid">
              {journalItems.map((article) => (
                <button
                  key={article.id}
                  onClick={() =>
                    navigate(`${base(lang)}/journal/${article.id}`)
                  }
                >
                  <img src={img(article.image)} alt="" loading="lazy" />
                  <small>{article.tag}</small>
                  <h3>{article.title}</h3>
                  <span>
                    {u.readMore} <ArrowRight size={15} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>
      )}

      {route.page === "journal" && (
        <main className="rf-page rf-journal">
          <div className="rf-breadcrumb">
            <button onClick={() => navigate(base(lang))}>{u.home}</button> /{" "}
            <button onClick={() => navigate(`${base(lang)}/journal`)}>
              {u.news}
            </button>
          </div>
          {route.id && journalItems.some((item) => item.id === route.id) ? (
            (() => {
              const article = journalItems.find(
                (item) => item.id === route.id,
              )!;
              return (
                <article className="rf-article">
                  <span className="rf-eyebrow">
                    {article.tag} / REFOLKS JOURNAL
                  </span>
                  <h1>{article.title}</h1>
                  <img src={img(article.image)} alt="" />
                  <div>
                    {article.body.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                  <button
                    className="rf-text-link"
                    onClick={() => navigate(`${base(lang)}/journal`)}
                  >
                    {u.viewAll}
                    <ArrowRight size={16} />
                  </button>
                </article>
              );
            })()
          ) : (
            <section className="rf-section">
              <span className="rf-eyebrow">REFOLKS JOURNAL</span>
              <h1>{u.news}</h1>
              <div className="rf-news-grid">
                {journalItems.map((article) => (
                  <button
                    key={article.id}
                    onClick={() =>
                      navigate(`${base(lang)}/journal/${article.id}`)
                    }
                  >
                    <img src={img(article.image)} alt="" loading="lazy" />
                    <small>{article.tag}</small>
                    <h3>{article.title}</h3>
                    <span>
                      {u.readMore}
                      <ArrowRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {route.page === "shop" && (
        <main className="rf-page rf-shop">
          <div className="rf-breadcrumb">
            <button onClick={() => navigate(base(lang))}>{u.home}</button> /{" "}
            {u.shop}
          </div>
          <div className="rf-shop-intro">
            <span className="rf-eyebrow">{route.id === "accessories" ? (lang === "vi" ? "REFOLKS / PHỤ KIỆN & QUÀ TẶNG" : translate("REFOLKS / ACCESSORIES & GIFTS", lang)) : "THE WORKPLACE ESSENTIALS"}</span>
            <h1>{route.id === "accessories" ? c.nav[4] : c.shopTitle}</h1>
            <p>{route.id === "accessories" ? (lang === "vi" ? "Phụ kiện đồng hành cùng chiếc túi của bạn." : translate("Accessories to accompany your bag.", lang)) : c.shopIntro}</p>
            {readMore && <p>{c.aboutStory[4]}</p>}
            <button
              className="rf-text-link"
              onClick={() => setReadMore(!readMore)}
            >
              {readMore ? u.readLess : u.readMore}
              <ChevronDown size={15} />
            </button>
          </div>
          {route.id === "collection" && (
            <figure className="rf-collection-visual">
              <img
                src={img("heritage-collection")}
                alt={lang === "vi" ? "Bốn mẫu túi Refolks trong bộ sưu tập Heritage in Motion" : translate("Four Refolks bags from the Heritage in Motion collection", lang)}
              />
            </figure>
          )}
          <div className="rf-shop-toolbar">
            <button onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal size={18} />
              {u.filter} +
            </button>
            <span>
              {visible.length} {u.shown}
            </span>
            <label>
              {u.sort}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">{u.recommended}</option>
                <option value="newest">{u.newest}</option>
                <option value="lowHigh">{u.lowHigh}</option>
                <option value="highLow">{u.highLow}</option>
              </select>
            </label>
          </div>
          <div className="rf-product-grid rf-shop-grid">
            {visible.map(productCard)}
          </div>
          {visible.length === 0 && (
            <div className="rf-empty">{u.comingSoon}</div>
          )}
          {route.id !== "accessories" && <div className="rf-shop-usps">
            {c.uspTitles.map((title, i) => (
              <div key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{c.usps[i]}</p>
              </div>
            ))}
          </div>}
        </main>
      )}

      {route.page === "product" && (
        <main className={`rf-page rf-pdp rf-${product.id}`}>
          <div className="rf-breadcrumb">
            <button onClick={() => navigate(base(lang))}>{u.home}</button> /{" "}
            <button onClick={() => showShop()}>{u.shop}</button> /{" "}
            {product.name[lang]}
          </div>
          <div className="rf-pdp-grid">
            <div className="rf-gallery">
              <div className="rf-main-image">
                {galleryImages.length ? <img
                  src={galleryImages[activeImage]}
                  alt={productPhotoAlt(product, lang)}
                /> : <span className="rf-image-pending">{u.comingSoon}</span>}
                {galleryImages.length > 0 && <button
                  aria-label={u.zoom}
                  onClick={() => {
                    setZoomImage(galleryImages[activeImage]);
                    setModal("zoom");
                  }}
                >
                  <Plus size={22} />
                </button>}
              </div>
              <div className="rf-thumbs">
                {galleryImages.map((src, i) => (
                  <button
                    key={src}
                    className={i === activeImage ? "selected" : ""}
                    onClick={() => setActiveImage(i)}
                    aria-label={`${u.view360} ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
              {galleryImages.length > 1 && <button
                className="rf-text-link rf-angle"
                onClick={() =>
                  setActiveImage((activeImage + 1) % galleryImages.length)
                }
              >
                {u.view360}
                <ArrowRight size={16} />
              </button>}
            </div>
            <div className="rf-pdp-info">
              <span className="rf-eyebrow">
                REFOLKS / {product.category === "accessory" ? c.nav[4] : product.collection.toUpperCase()}
              </span>
              <h1>{product.name[lang]}</h1>
              <p className="rf-product-subtitle">{product.subtitle[lang]}</p>
              <div className="rf-price">
                {currency(product.price)}
              </div>
              {product.category === "work-shoulder-bag" ? <blockquote className="rf-meaning"><strong>{lang === "vi" ? "Chi tiết thiết kế" : translate("Design details", lang)}</strong><span>{product.meaning[lang]}</span></blockquote> : <p>{product.meaning[lang]}</p>}
              <p>{product.short[lang]}</p>
              {product.variants.length > 0 && <label className="rf-field"><span>{lang === "vi" ? "Phiên bản" : translate("Version", lang)}</span><select value={variant} onChange={(event) => {setVariant(event.target.value);setActiveImage(0)}}>{product.variants.map((option) => <option key={option.key} value={option.key}>{option.label[lang]}</option>)}</select></label>}
              {product.colors.length > 0 && <div className="rf-pdp-swatches">
                <strong>{u.colour}</strong>
                <div>
                  {product.colors.map((cl) => (
                    <button
                      key={cl}
                      className={color === cl ? "selected" : ""}
                      aria-label={colours[cl].name[lang]}
                      onClick={() => setColor(cl)}
                      style={{ background: colours[cl].hex }}
                    />
                  ))}
                </div>
                <small>{colours[color]?.name[lang]}</small>
              </div>}
              {product.category === "work-shoulder-bag" && <label className="rf-toggle">
                <input
                  type="checkbox"
                  checked={personal}
                  onChange={(e) => setPersonal(e.target.checked)}
                />
                <span>{u.customize}</span>
              </label>}
              <div className="rf-pdp-buy">
                <div className="rf-qty">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease"
                  >
                    <Minus size={16} />
                  </button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} aria-label="Increase">
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  className="rf-button"
                  onClick={() => addToBag(product, qty)}
                  disabled={!product.stock}
                >
                  {product.stock ? `${u.add} – ${currency(product.price)}` : u.comingSoon}
                  <ArrowRight size={18} />
                </button>
              </div>
              {product.category === "work-shoulder-bag" && <div className="rf-accordions">
                {(lang === "vi" ? accordion.vi : lang === "en" ? accordion.en : localize(accordion.en, lang)).map(([title, body]) => (
                  <details key={title}>
                    <summary>
                      {title}
                      <Plus size={17} />
                    </summary>
                    <p>{body}</p>
                  </details>
                ))}
              </div>}
            </div>
          </div>
          {product.category === "work-shoulder-bag" && product.lifestyle && <section className="rf-pdp-lookbook">
            <img
              src={product.lifestyle}
              alt={product.name[lang]}
              loading="lazy"
            />
            <div>
              <span className="rf-eyebrow">{u.lookbook}</span>
              <h2>{c.aboutTitle}</h2>
              <p>{c.aboutStory[4]}</p>
            </div>
          </section>}
          {product.category === "work-shoulder-bag" && <><StylingGuide lang={lang} compact /><CareGuide lang={lang} compact onBook={() => setModal("care")}/></>}
          <section className="rf-section">
            <div className="rf-section-head">
              <h2>{u.recommendation}</h2>
            </div>
            <div className="rf-product-grid">
              {products.filter((p) => p.id !== product.id).map(productCard)}
            </div>
          </section>
        </main>
      )}

      {route.page === "styling" && <main className="rf-page"><StylingGuide lang={lang}/></main>}
      {route.page === "care" && <main className="rf-page"><CareGuide lang={lang} onBook={() => setModal("care")}/></main>}
      {route.page === "contact" && <main className="rf-page rf-simple-page"><span className="rf-eyebrow">REFOLKS / {u.contact}</span><h1>{u.contact}</h1><p>{u.demoContact}</p><p>{u.map}</p></main>}
      {route.page === "not-found" && <main className="rf-page rf-simple-page"><span className="rf-eyebrow">404 / REFOLKS</span><h1>{lang === "vi" ? "Không tìm thấy trang" : translate("Page not found", lang)}</h1><p>{lang === "vi" ? "Đường dẫn này không tồn tại hoặc đã thay đổi." : translate("This page does not exist or has moved.", lang)}</p><button className="rf-button" onClick={() => navigate(base(lang))}>{lang === "vi" ? "Về trang chủ" : translate("Back to home", lang)}<ArrowRight size={16}/></button></main>}

      {route.page === "about" && (
        <main className="rf-page rf-about">
          <section id="story" className="rf-about-chapter rf-about-opening" style={{backgroundImage:`linear-gradient(#1f130d91,#1f130d91),url(${img("navigator-front-final")})`}}>
            <span className="rf-eyebrow">01 / {lang === "vi" ? "THIẾT KẾ" : translate("DESIGN", lang)}</span>
            <h1>{c.aboutTitle}</h1><p>{c.aboutStory[0]}</p>
          </section>
          <section className="rf-about-chapter rf-about-split">
            <img src={img("navigator-front-final")} alt={lang === "vi" ? "Chi tiết họa tiết dệt trên túi The Navigator" : translate("Woven motif detail on The Navigator bag", lang)} loading="lazy" />
            <div><span className="rf-eyebrow">02 / {lang === "vi" ? "THIẾT KẾ" : translate("DESIGN", lang)}</span><h2>{lang === "vi" ? "Một thiết kế, nhiều chi tiết" : translate("One design, many details", lang)}</h2><p>{c.aboutStory[1]}</p></div>
          </section>
          <section className="rf-about-chapter rf-about-quote"><span className="rf-eyebrow">03 / REFOLKS</span><h2>{c.aboutStory[2]}</h2></section>
          <section className="rf-about-chapter rf-about-opening" style={{backgroundImage:`linear-gradient(#1f130da1,#1f130da1),url(${img("navigator-front-final")})`}}><span className="rf-eyebrow">04 / {lang === "vi" ? "CHI TIẾT THIẾT KẾ" : translate("DESIGN DETAILS", lang)}</span><h2>{lang === "vi" ? "Họa tiết trong nhịp sống hiện đại" : translate("Woven details for everyday life", lang)}</h2><p>{c.aboutStory[3]}</p></section>
          <section className="rf-about-chapter rf-about-split"><div><span className="rf-eyebrow">05 / {lang === "vi" ? "BỘ SƯU TẬP" : translate("THE COLLECTION", lang)}</span><h2>{lang === "vi" ? "Khám phá các mẫu túi" : translate("Explore the bag designs", lang)}</h2><p>{c.aboutStory[4]}</p><button className="rf-button" onClick={() => navigate(`${base(lang)}/collections/heritage-in-motion`)}>{c.heroCta}<ArrowRight size={17}/></button></div><img src={img("vanguard-women-scarf-final")} alt="The Vanguard" loading="lazy" /></section>
          <section id="sustainability" className="rf-section rf-usps"><div className="rf-section-head"><div><span className="rf-eyebrow">REFOLKS</span><h2>{u.heritage}</h2></div></div><div className="rf-usp-grid">{c.usps.map((p,i)=><article className="rf-usp-static" key={i}><img src={img(["motif-booc-khoay","weaving-textile","tote-02-inside"][i])} alt="" loading="lazy" /><h3>{c.uspTitles[i]}</h3><p>{p}</p></article>)}</div></section>
        </main>
      )}

      {route.page === "community" && (
        <main className="rf-page rf-community">
          <div className="rf-community-hero">
            <span className="rf-eyebrow">01 / COMMUNITY</span>
            <h1>{u.account} &amp; {u.vouchers}</h1>
          </div>
          <section id="account" className="rf-section rf-community-account">
            <MemberBenefits
              lang={lang}
              account={account}
              orders={orders}
              onSignIn={() => setAccountOpen(true)}
              onCopy={copyVoucher}
            />
          </section>
          <section id="donation" className="rf-section rf-donation">
            <div className="rf-section-head">
              <div>
                <span className="rf-eyebrow">01 / COMMUNITY</span>
                <h2>{c.donationTitle}</h2>
                <p>{c.donationStory}</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {route.page === "admin" &&
        (account && account.role !== "customer" ? (
          <AdminPanel lang={lang} role={account.role} />
        ) : (
          <main className="rf-page rf-account-page">
            <h1>{u.admin}</h1>
            <p>{u.signInFirst}</p>
            {!account && <button className="rf-button" onClick={() => setAccountOpen(true)}>{u.signIn}</button>}
          </main>
        ))}
      {route.page === "account" && (
        <main className="rf-page rf-account-page">
          <span className="rf-eyebrow">REFOLKS / ACCOUNT</span>
          <h1>{u.account}</h1>
          {!account && <p>{u.signInFirst}</p>}
          {!account && <button className="rf-button" onClick={() => setAccountOpen(true)}>{u.signIn}<ArrowRight size={17}/></button>}
          {account && <>
            <MemberBenefits
              lang={lang}
              account={account}
              orders={orders}
              onSignIn={() => setAccountOpen(true)}
              onCopy={copyVoucher}
            />
            <section>
            <h2>{u.orders}</h2>
            {orders.length ? (
              orders.map((order) => (
                <div className="rf-order" key={order.number}>
                  <strong>#{order.number.slice(-6)}</strong>
                  <span>{new Date(order.createdAt).toLocaleDateString(lang === "zh-CN" ? "zh-CN" : lang)}</span>
                  <span>
                    {order.items.length} {u.shown}
                  </span>
                  <span>{statusLabel(order.status, lang)}</span>
                  <strong>{currency(order.total)}</strong>
                </div>
              ))
            ) : (
              <p>{u.comingSoon}</p>
            )}
            </section>
          </>}
        </main>
      )}

      {(route.page === "cart" || route.page === "checkout") && (
        <main className="rf-page rf-cart-page">
          <span className="rf-eyebrow">
            REFOLKS / {route.page === "cart" ? u.bag : u.checkout}
          </span>
          <h1>
            {route.page === "cart" ? u.bag : u.checkout} ({totalCount})
          </h1>
          {route.page === "checkout" && (
            <p className="rf-demo-notice">{u.demoNotice}</p>
          )}
          {cart.length === 0 ? (
            <div className="rf-empty">
              <ShoppingBag size={32} />
              <p>{u.empty}</p>
              <button className="rf-button" onClick={() => showShop()}>
                {u.keepShopping}
              </button>
            </div>
          ) : (
            <div className="rf-cart-layout">
              <div>
                {cart.map((item, i) => {
                  const p = products.find((row) => row.id === item.id)!;
                  return (
                    <div className="rf-cart-row" key={i}>
                      {p.images[0] ? <img src={p.images[0]} alt="" /> : <span className="rf-cart-image-pending">{u.comingSoon}</span>}
                      <div>
                        <h3>{p.name[lang]}</h3>
                        <p>
                          {colours[item.color]?.name[lang]}
                          {item.personal ? ` · ${u.customize}` : ""}
                        </p>
                        <strong>
                          {p.price === null
                            ? u.priceSoon
                            : currency(p.price * item.qty)}
                        </strong>
                        <div className="rf-cart-row-actions">
                          <div className="rf-qty">
                            <button onClick={() => updateCart(i, -1)}>
                              <Minus size={14} />
                            </button>
                            <span>{item.qty}</span>
                            <button onClick={() => updateCart(i, 1)}>
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => updateCart(i, -item.qty)}>
                            {u.remove}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rf-cart-summary">
                <h2>{u.subtotal}</h2>
                <p>
                  <span>{u.subtotal}</span>
                  <strong>{currency(subtotal)}</strong>
                </p>
                <label className="rf-field">
                  <span>{u.region}</span>
                  <select
                    value={shippingRegion}
                    onChange={(e) =>
                      setShippingRegion(e.target.value as "hanoi" | "other")
                    }
                  >
                    <option value="hanoi">{u.hanoi}</option>
                    <option value="other">{u.otherRegion}</option>
                  </select>
                </label>
                <p>
                  <span>{u.shipping}</span>
                  <strong>{currency(shippingFee)}</strong>
                </p>
                <p className="rf-total">
                  <span>{u.total}</span>
                  <strong>{currency(subtotal + shippingFee)}</strong>
                </p>
                {route.page === "checkout" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (pending) return;
                      setPending(true);
                      const data = new FormData(e.currentTarget);
                      fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          locale: lang === "vi" ? "vi" : "en",
                          name: data.get(u.name),
                          email: data.get(u.email),
                          phone: data.get(u.phone),
                          address: data.get(u.address),
                          region: shippingRegion,
                          items: cart,
                        }),
                      })
                        .then(async (res) => {
                          const result = (await res.json().catch(() => ({}))) as { number?: string; total?: number; error?: string };
                          if (!res.ok || !result.number) {
                            setToast(result.error === "stock" ? u.outOfStock : u.orderFailed);
                            return;
                          }
                          setCart([]);
                          setToast(u.placed);
                          navigate(base(lang));
                        })
                        .catch(() => setToast(u.orderFailed))
                        .finally(() => setPending(false));
                    }}
                  >
                    {field(u.name)}
                    {field(u.email, "email")}
                    {field(u.phone, "tel")}
                    {field(u.address)}
                    <button className="rf-button" type="submit" disabled={pending}>
                      {u.checkout}
                    </button>
                  </form>
                ) : (
                  <button
                    className="rf-button"
                    onClick={() => navigate(`${base(lang)}/checkout`)}
                  >
                    {u.checkout}
                    <ArrowRight size={17} />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      <footer id="contact" className="rf-footer">
        <div className="rf-footer-top">
          <div>
            <img src="/images/refolks/logo-light.png" alt="Refolks" />
            <p>{u.footerThanks}</p>
            <div className="rf-social">
              <Camera size={18} />
              <Mail size={18} />
            </div>
          </div>
          <div>
            <h3>{u.contact}</h3>
            <p>{u.map}</p>
            <p>{u.demoContact}</p>
          </div>
          <div>
            <h3>{u.policies}</h3>
            <button onClick={() => setChatOpen(true)}>FAQs</button>
            <button onClick={() => setToast(u.freeship)}>{u.shipping}</button>
            <button onClick={() => navigate(`${base(lang)}/huong-dan-bao-quan`)}>Refolks Care</button>
          </div>
          <div>
            <h3>{u.information}</h3>
            <button onClick={() => navigate(`${base(lang)}/about`)}>
              {u.aboutUs}
            </button>
            <button onClick={() => navigate(`${base(lang)}/huong-dan-phoi-do`)}>{u.lookbook}</button>
            <button onClick={() => navigate(`${base(lang)}/huong-dan-bao-quan`)}>{u.care}</button>
          </div>
          <div>
            <h3>{u.newsletterTitle}</h3>
            <p>{u.newsletterDesc}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const email=String(new FormData(e.currentTarget).get("email")||"");
                postRequest({ kind: "newsletter", email }).then((ok) => setToast(ok ? u.newsletterDone : u.requestFailed));
              }}
            >
              <input
                type="email"
                name="email"
                required
                placeholder={u.email}
                aria-label={u.email}
              />
              <button type="submit" aria-label={u.submit}>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
        <div className="rf-footer-map">
          <MapPin size={22} />
          <div>
            <strong>{u.map}</strong>
            <small>{u.demoContact}</small>
          </div>
        </div>
        <div className="rf-footer-bottom">
          <span>© 2026 REFOLKS</span>
          <span>{u.map}</span>
          <span>VI / EN / KO / JA / 中文 · VND</span>
        </div>
      </footer>


      <div className="rf-float">
        {scrollY > 800 && (
          <button
            className="rf-back-top"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp size={19} />
          </button>
        )}
        <button
          className="rf-chat-trigger"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageCircle size={18} />
          {u.chat}
        </button>
      </div>
      {chatOpen && (
        <div className="rf-chat-panel">
          <div>
            <strong>REFOLKS · {u.chat}</strong>
            <button onClick={() => setChatOpen(false)} aria-label={u.close}>
              <X size={18} />
            </button>
          </div>
          <div className="rf-chat-messages"><p className="rf-chat-bot">{lang === "vi" ? chatCopy.vi.greeting : lang === "en" ? chatCopy.en.greeting : translate(chatCopy.en.greeting, lang)}</p>{chatMessages.map((message,index)=><div key={index} className={message.role==="bot"?"rf-chat-bot":"rf-chat-user"}><p>{message.text}</p>{message.href&&<button onClick={()=>navigate(`${base(lang)}${message.href}`)}>{lang==="vi"?"Xem chi tiết":translate("Explore", lang)}<ArrowRight size={14}/></button>}</div>)}{chatTyping&&<small>{lang==="vi"?"Đang gõ…":translate("Typing…", lang)}</small>}<div ref={chatEndRef}/></div>
          <div className="rf-chat-quick">{(lang === "vi" ? chatCopy.vi.quick : lang === "en" ? chatCopy.en.quick : localize(chatCopy.en.quick, lang)).map((idea)=><button key={idea} onClick={()=>sendChat(idea)}>{idea}</button>)}</div>
          <form className="rf-chat-form" onSubmit={(e)=>{e.preventDefault();sendChat(chatInput)}}><input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder={lang==="vi"?"Viết câu hỏi…":translate("Ask a question…", lang)} aria-label={lang==="vi"?"Câu hỏi":translate("Question", lang)}/><button type="submit" disabled={chatTyping} aria-label={u.submit}><ArrowRight size={18}/></button></form>
        </div>
      )}
      {searchOpen && (
        <div className="rf-overlay" onMouseDown={closeOverlays}>
          <div
            className="rf-search-panel"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSearchOpen(false)} aria-label={u.close}>
              <X />
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchOpen(false);
                showShop(`?q=${encodeURIComponent(search)}`);
              }}
            >
              <Search />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={u.search}
              />
            </form>
          </div>
        </div>
      )}
      {mobile && (
        <div className="rf-overlay" onMouseDown={closeOverlays}>
          <div
            className="rf-drawer rf-mobile-drawer"
            ref={dialogRef}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={u.menu}
          >
            <div className="rf-drawer-head">
              <strong>REFOLKS</strong>
              <button onClick={() => setMobile(false)} aria-label={u.close}>
                <X />
              </button>
            </div>
            <div className="rf-mobile-links">
              {navItems.map((item) => (
                <details key={item.key}>
                  <summary>
                    {item.label}
                    <ChevronDown size={17} />
                  </summary>
                  <button onClick={() => navigate(item.href)}>
                    {u.viewAll}
                  </button>
                  {mega(item.key).flatMap(([, links]) =>
                    (links as string[][]).map(([label, href]) => (
                      <button key={label} onClick={() => setAnchor(href)}>
                        {label}
                      </button>
                    )),
                  )}
                </details>
              ))}
            </div>
            <div className="rf-lang" aria-label="Language">{locales.map((locale, index) => <span key={locale} className="rf-lang-option"><button className={lang === locale ? "active" : ""} onClick={() => switchLang(locale)} lang={locale}>{locale === "zh-CN" ? "中文" : locale.toUpperCase()}</button>{index < locales.length - 1 && <span>/</span>}</span>)}</div>
          </div>
        </div>
      )}
      {filterOpen && (
        <div className="rf-overlay" onMouseDown={closeOverlays}>
          <div
            className="rf-drawer"
            ref={dialogRef}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={u.filter}
          >
            <div className="rf-drawer-head">
              <h2>{u.filter}</h2>
              <button onClick={() => setFilterOpen(false)} aria-label={u.close}>
                <X />
              </button>
            </div>
            <div className="rf-filter-body">
              <fieldset><legend>{lang === "vi" ? "Giới tính" : translate("Gender", lang)}</legend>{[["",lang === "vi" ? "Tất cả" : translate("All", lang)],["women",lang === "vi" ? "Nữ" : translate("Women", lang)],["men",lang === "vi" ? "Nam" : translate("Men", lang)],["unisex","Unisex"]].map(([key,label])=><label key={key}><input type="radio" name="gender-filter" checked={filterGender===key} onChange={()=>setFilterGender(key)}/>{label}</label>)}</fieldset>
              <fieldset><legend>{lang === "vi" ? "Họa tiết" : translate("Motifs", lang)}</legend>{[["booc-khoay","Boọc khoáy"],["canh-dua",lang === "vi" ? "Cành dừa" : translate("Coconut branch", lang)],["con-huou",lang === "vi" ? "Con hươu" : translate("The deer", lang)]].map(([key,label])=><label key={key}><input type="checkbox" checked={filterMotifs.includes(key)} onChange={()=>setFilterMotifs((current)=>current.includes(key)?current.filter((value)=>value!==key):[...current,key])}/>{label}</label>)}</fieldset>
              <fieldset>
                <legend>{u.availability}</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={availability}
                    onChange={(e) => setAvailability(e.target.checked)}
                  />
                  {u.inStock}
                </label>
              </fieldset>
              <fieldset>
                <legend>{u.colour}</legend>
                {Object.entries(colours).map(([key, val]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={filterColors.includes(key)}
                      onChange={() =>
                        setFilterColors((current) =>
                          current.includes(key)
                            ? current.filter((v) => v !== key)
                            : [...current, key],
                        )
                      }
                    />
                    <span
                      className="rf-filter-swatch"
                      style={{ background: val.hex }}
                    />
                    {val.name[lang]}{" "}
                    <small>
                      (
                      {
                        products.filter((p) =>
                          (p.colors as readonly string[]).includes(key),
                        ).length
                      }
                      )
                    </small>
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>{u.material}</legend>
                {[
                  ["brocade", lang === "vi" ? "Thổ cẩm" : translate("Brocade", lang)],
                  [
                    "recycled",
                    lang === "vi" ? "Vải tái chế" : translate("Recycled textile", lang),
                  ],
                  ["canvas", "Canvas"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={material.includes(key)}
                      onChange={() =>
                        setMaterial((current) =>
                          current.includes(key)
                            ? current.filter((v) => v !== key)
                            : [...current, key],
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>{u.personalisation}</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={filterPersonal}
                    onChange={(e) => setFilterPersonal(e.target.checked)}
                  />
                  {u.customize}
                </label>
              </fieldset>
            </div>
            <div className="rf-drawer-foot">
              <button
                onClick={() => {
                  setAvailability(false);
                  setMaterial([]);
                  setFilterColors([]);
                  setFilterGender("");
                  setFilterMotifs([]);
                  setFilterPersonal(false);
                }}
              >
                {u.clear}
              </button>
              <button
                className="rf-button"
                onClick={() => setFilterOpen(false)}
              >
                {u.apply} ({visible.length})
              </button>
            </div>
          </div>
        </div>
      )}
      {bagOpen && (
        <div className="rf-overlay" onMouseDown={closeOverlays}>
          <div
            className="rf-drawer rf-cart-drawer"
            ref={dialogRef}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={u.bag}
          >
            <div className="rf-drawer-head">
              <h2>
                {u.bag} ({totalCount})
              </h2>
              <button onClick={() => setBagOpen(false)} aria-label={u.close}>
                <X />
              </button>
            </div>
            <div className="rf-cart-drawer-body">
              {cart.length === 0 ? (
                <div className="rf-empty">
                  <ShoppingBag />
                  <p>{u.empty}</p>
                </div>
              ) : (
                <>
                  <div className="rf-freeship">
                    <Check size={18} />
                    {u.freeship}
                  </div>
                  {cart.map((item, i) => {
                    const p = products.find((row) => row.id === item.id)!;
                    return (
                      <div className="rf-cart-row" key={i}>
                        {p.images[0] ? <img src={p.images[0]} alt="" /> : <span className="rf-cart-image-pending">{u.comingSoon}</span>}
                        <div>
                          <h3>{p.name[lang]}</h3>
                          <p>{colours[item.color]?.name[lang]}</p>
                          <strong>
                            {p.price === null
                              ? u.priceSoon
                              : currency(p.price * item.qty)}
                          </strong>
                          <div className="rf-cart-row-actions">
                            <div className="rf-qty">
                              <button onClick={() => updateCart(i, -1)}>
                                <Minus size={14} />
                              </button>
                              <span>{item.qty}</span>
                              <button onClick={() => updateCart(i, 1)}>
                                <Plus size={14} />
                              </button>
                            </div>
                            <button onClick={() => updateCart(i, -item.qty)}>
                              {u.remove}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <h3>{u.recommendation}</h3>
                  <button
                    className="rf-mini-reco"
                    onClick={() => showProduct(products[1])}
                  >
                    <img src={products[1].images[0]} alt="" />
                    {products[1].name[lang]}
                    <ArrowRight size={16} />
                  </button>
                  <details className="rf-discount">
                    <summary>
                      {u.code}
                      <Plus size={16} />
                    </summary>
                    <input placeholder={u.codePlaceholder} />
                  </details>
                </>
              )}
            </div>
            <div className="rf-drawer-foot rf-cart-foot">
              <div>
                <span>{u.subtotal}</span>
                <strong>{currency(subtotal)}</strong>
              </div>
              <button
                className="rf-button"
                onClick={() => navigate(`${base(lang)}/checkout`)}
              >
                {u.checkout}
                <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate(`${base(lang)}/cart`)}>
                {u.viewBag}
              </button>
              <div className="rf-express">
                <button onClick={() => setToast(u.mockPay)}>PayPal</button>
                <button onClick={() => setToast(u.mockPay)}>GPay</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {accountOpen && (
        <div
          className="rf-overlay rf-account-overlay"
          onMouseDown={closeOverlays}
        >
          <div
            className="rf-account-popup"
            ref={dialogRef}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={u.account}
          >
            <button
              className="rf-popup-close"
              onClick={() => setAccountOpen(false)}
              aria-label={u.close}
            >
              <X size={18} />
            </button>
            {account ? (
              <>
                <div className="rf-avatar">
                  {account.name.charAt(0).toUpperCase()}
                </div>
                <h2>{account.name}</h2>
                <p>{account.email}</p>
                <button
                  className="rf-button"
                  onClick={() => navigate(`${base(lang)}/account`)}
                >
                  {u.orders}
                </button>
                {account.role !== "customer" && (
                  <button
                    className="rf-button"
                    onClick={() => navigate(`${base(lang)}/admin`)}
                  >
                    {u.admin}
                  </button>
                )}
                <button
                  className="rf-text-link"
                  onClick={() => {
                    fetch("/api/auth/logout", { method: "POST" })
                      .then(() => {
                        setAccount(null);
                        setOrders([]);
                        setAccountOpen(false);
                      })
                      .catch(() => setToast(u.authFailed));
                  }}
                >
                  {u.signOut}
                </button>
              </>
            ) : (
              <>
                <h2>{u.signPrompt}</h2>
                {(authMode === "signin" || authMode === "signup") && (
                  <div className="rf-tabs">
                    <button
                      className={authMode === "signin" ? "active" : ""}
                      onClick={() => setAuthMode("signin")}
                    >
                      {u.signIn}
                    </button>
                    <button
                      className={authMode === "signup" ? "active" : ""}
                      onClick={() => setAuthMode("signup")}
                    >
                      {u.signUp}
                    </button>
                  </div>
                )}
                {authMode === "verify" && (
                  <p aria-live="polite">
                    <strong>{u.verifyTitle}</strong>
                    <br />
                    {u.verifyIntro} {authEmail}
                  </p>
                )}
                {authMode === "forgot" && (
                  <p>
                    <strong>{u.forgotTitle}</strong>
                    <br />
                    {u.forgotIntro}
                  </p>
                )}
                {authMode === "reset" && (
                  <p aria-live="polite">
                    {u.verifyIntro} {authEmail}
                  </p>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (pending) return;
                    setPending(true);
                    const data = new FormData(e.currentTarget);
                    const email = String(data.get("email") ?? authEmail);
                    const action = authMode === "signin" ? "login" : authMode;
                    fetch(`/api/auth/${action}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: data.get("name"),
                        email,
                        password: data.get("password"),
                        code: data.get("code"),
                        locale: lang === "vi" ? "vi" : "en",
                      }),
                    })
                      .then(async (res) => {
                        const result = (await res.json().catch(() => ({}))) as {
                          user?: Account;
                          error?: string;
                          verify?: boolean;
                          ok?: boolean;
                        };
                        if (result.verify) {
                          setAuthEmail(email);
                          setAuthMode("verify");
                          return;
                        }
                        if (authMode === "forgot" && result.ok) {
                          setAuthEmail(email);
                          setAuthMode("reset");
                          return;
                        }
                        if (!res.ok || !result.user) {
                          const messages: Record<string, string> = {
                            credentials: u.authCredentials,
                            exists: u.authExists,
                            locked: u.authLocked,
                            password: u.authPassword,
                            code: u.authCode,
                            cooldown: u.authCooldown,
                            email_unavailable: u.emailUnavailable,
                          };
                          setToast(messages[result.error ?? ""] ?? u.authFailed);
                          return;
                        }
                        setAccount(result.user);
                        setAccountOpen(false);
                        setAuthMode("signin");
                        setToast(lang === "vi" ? `Xin chào, ${result.user.name}!` : `Welcome, ${result.user.name}!`);
                      })
                      .catch(() => setToast(u.authFailed))
                      .finally(() => setPending(false));
                  }}
                >
                  {authMode === "signup" && (
                    <label className="rf-field">
                      <span>{u.name}</span>
                      <input name="name" required autoComplete="name" />
                    </label>
                  )}
                  {(authMode === "signin" || authMode === "signup" || authMode === "forgot") && (
                    <label className="rf-field">
                      <span>{u.email}</span>
                      <input name="email" type="email" required autoComplete="email" defaultValue={authEmail} />
                    </label>
                  )}
                  {(authMode === "verify" || authMode === "reset") && (
                    <label className="rf-field">
                      <span>{u.otpCode}</span>
                      <input
                        name="code"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        autoComplete="one-time-code"
                      />
                    </label>
                  )}
                  {(authMode === "signin" || authMode === "signup" || authMode === "reset") && (
                    <label className="rf-field">
                      <span>{authMode === "reset" ? u.newPassword : u.password}</span>
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                      />
                    </label>
                  )}
                  {authMode === "signup" && (
                    <label className="rf-check">
                      <input type="checkbox" />
                      {u.newsletter}
                    </label>
                  )}
                  <button className="rf-button" type="submit" disabled={pending}>
                    {{ signin: u.signIn, signup: u.signUp, verify: u.verifyButton, forgot: u.sendCode, reset: u.resetButton }[authMode]}
                  </button>
                </form>
                {(authMode === "signin" || authMode === "signup") && authFeatures.google && (
                  // Full-page navigation: the API route redirects to Google, so no fetch.
                  <button
                    className="rf-button rf-button-outline"
                    type="button"
                    onClick={() => location.assign(new URL("/api/auth/google", location.origin).href)}
                  >
                    {u.google}
                  </button>
                )}
                {authMode === "signin" && authFeatures.email && (
                  <button className="rf-text-link" type="button" onClick={() => setAuthMode("forgot")}>
                    {u.forgot}
                  </button>
                )}
                {authMode === "verify" && (
                  <button
                    className="rf-text-link"
                    type="button"
                    onClick={() => {
                      fetch("/api/auth/resend", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: authEmail, locale: lang === "vi" ? "vi" : "en" }),
                      })
                        .then((res) => setToast(res.ok ? u.resent : res.status === 429 ? u.authCooldown : u.authFailed))
                        .catch(() => setToast(u.authFailed));
                    }}
                  >
                    {u.resend}
                  </button>
                )}
                {authMode !== "signin" && authMode !== "signup" && (
                  <button className="rf-text-link" type="button" onClick={() => setAuthMode("signin")}>
                    {u.backToSignIn}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {modal && (
        <div className="rf-overlay" onMouseDown={closeOverlays}>
          <div
            className={`rf-modal ${modal === "zoom" ? "rf-zoom" : ""}`}
            ref={dialogRef}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="rf-popup-close"
              onClick={closeModal}
              aria-label={u.close}
            >
              <X />
            </button>
            {modal === "zoom" ? (
              <img src={zoomImage} alt={productPhotoAlt(product, lang)} />
            ) : modal === "care" ? (
              <><span className="rf-eyebrow">REFOLKS CARE</span><h2>{lang === "vi" ? "Đặt lịch bảo dưỡng" : translate("Book a care appointment", lang)}</h2><form onSubmit={(e)=>{e.preventDefault();if(pending)return;setPending(true);const data=new FormData(e.currentTarget);postRequest({kind:"care",name:data.get(u.name),email:data.get(u.email),phone:data.get(u.phone),note:data.get("note")}).then((ok)=>{if(!ok){setToast(u.requestFailed);return;}setModal(null);setToast(lang==="vi"?"Đã ghi nhận yêu cầu bảo dưỡng.":translate("Care request recorded.", lang))}).finally(()=>setPending(false))}}>{field(u.name)}{field(u.email,"email")}{field(u.phone,"tel")}<label className="rf-field"><span>{u.note}</span><textarea name="note" required rows={3}/></label><button type="submit" className="rf-button" disabled={pending}>{u.submit}</button></form></>
            ) : null}
          </div>
        </div>
      )}
      {toast && (
        <div className="rf-toast" role="status">
          {toast}
          <button onClick={() => setToast("")} aria-label={u.close}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
