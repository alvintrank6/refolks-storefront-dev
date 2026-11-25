"use client";

import {
  BriefcaseBusiness,
  HeartHandshake,
  Leaf,
  Package,
  Scissors,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wrench,
} from "lucide-react";
import { localize, translate, type Lang } from "../refolks/data";

const image = (name: string) => `/images/refolks/${name}.webp`;

const styling = {
  vi:[
    ["Đi làm hằng ngày","Phối túi đeo vai với trang phục công sở cho diện mạo chỉn chu.","the-herald"],
    ["Gặp đối tác","Chọn tông trung tính be, nâu hoặc đen để họa tiết trên túi trở thành điểm nhấn duy nhất.","curator-front-final"],
    ["Cuối tuần","The Navigator dùng dây đeo dài, phối áo len và denim cho những chuyến dạo phố.","navigator-front-final"],
    ["Khăn họa tiết trên quai túi","Gấp khăn thành dải hẹp, luồn qua chân quai, rồi thắt gọn hai đầu. Bản phối nữ The Vanguard có khăn họa tiết.","vanguard-women-scarf-final"],
    ["Xếp đồ thông minh","Sắp xếp vật dụng hằng ngày để những món thường dùng luôn dễ lấy.","vanguard-inside-final"],
  ],
  en:[
    ["Everyday work","Pair a shoulder bag with workwear for a polished look.","the-herald"],
    ["Meeting clients","Choose neutral beige, brown or black so the bag's motif remains the single statement.","curator-front-final"],
    ["Weekend","Use The Navigator's long strap with a knit and denim for an easy city look.","navigator-front-final"],
    ["Patterned scarf on the handle","Fold the scarf into a narrow band, thread it around the handle base and tie the ends. The women's Vanguard styling includes a patterned scarf.","vanguard-women-scarf-final"],
    ["Pack with purpose","Arrange everyday items so the things you reach for often stay close at hand.","vanguard-inside-final"],
  ]
} as const;

export function StylingGuide({lang,compact=false}:{lang:Lang;compact?:boolean}) {
  const items = lang === "vi" ? styling.vi : styling.en.map(([title,body,asset]) => [translate(title,lang),translate(body,lang),asset] as const);
  return <section className={`rf-section rf-guide ${compact ? "rf-guide-compact" : ""}`} id="styling"><div className="rf-section-head"><div><span className="rf-eyebrow">REFOLKS / LOOKBOOK</span>{compact ? <h2>{lang === "vi" ? "Hướng dẫn phối đồ & sử dụng" : translate("Styling & use guide", lang)}</h2> : <h1>{lang === "vi" ? "Hướng dẫn phối đồ & sử dụng" : translate("Styling & use guide", lang)}</h1>}</div></div><div className="rf-guide-grid">{items.map(([title,body,asset])=><article key={title}><img src={image(asset)} alt={title} loading="lazy" /><div><BriefcaseBusiness size={25}/><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>;
}

const care = {
  vi:[
    ["Vải canvas & thổ cẩm","Lau nhẹ bằng khăn ẩm, ưu tiên giặt khô, không ngâm nước."],
    ["Khăn họa tiết","Không chà xát mạnh; giặt tay nhẹ hoặc giặt khô."],
    ["Bề mặt & chi tiết","Lau khô nhẹ khi tiếp xúc với nước và tránh phơi dưới nắng gắt."],
    ["Giữ phom","Nhồi giấy hoặc gối vải khi không dùng; tránh vật nặng đè lên."],
    ["Cất giữ","Để trong túi vải đi kèm, nơi khô thoáng, tránh ẩm mốc."],
    ["Refolks Care","Lau nhẹ bề mặt vải bằng khăn ẩm và tránh ngâm nước. Thông tin về dịch vụ chăm sóc và sửa chữa sẽ được cập nhật sau khi điều khoản được xác nhận."]
  ],
  en:[
    ["Canvas & brocade","Wipe gently with a damp cloth, dry clean where possible and do not soak."],
    ["Patterned scarf","Avoid hard rubbing; hand wash gently or dry clean."],
    ["Surface details","Dry gently after contact with water and avoid leaving in direct sun."],
    ["Keep its shape","Fill with paper or a fabric cushion when stored; avoid heavy pressure."],
    ["Storage","Keep in the supplied fabric bag in a dry, airy place."],
    ["Refolks Care","Wipe textile surfaces gently with a damp cloth and avoid soaking. Details of care and repair services will be shared once their terms are confirmed."]
  ]
} as const;

export function CareGuide({lang,compact=false,onBook}:{lang:Lang;compact?:boolean;onBook:()=>void}) {
  const icons=[ShieldCheck,Scissors,Sparkles,Package,Leaf,Wrench];
  const items = lang === "vi" ? care.vi : lang === "en" ? care.en : localize(care.en, lang);
  return <section className={`rf-section rf-care-guide ${compact ? "rf-guide-compact" : ""}`} id="care"><div className="rf-section-head"><div><span className="rf-eyebrow">REFOLKS CARE</span>{compact ? <h2>{lang === "vi" ? "Hướng dẫn bảo quản" : translate("Product care guide", lang)}</h2> : <h1>{lang === "vi" ? "Hướng dẫn bảo quản" : translate("Product care guide", lang)}</h1>}</div></div><div className="rf-care-grid">{items.map(([title,body],i)=>{const Icon=icons[i];return <article key={title}><Icon size={32} strokeWidth={1.5}/><h3>{title}</h3><p>{body}</p>{i===5&&<button className="rf-text-link rf-care-book-link" onClick={onBook}>{lang === "vi" ? "Đặt lịch bảo dưỡng" : translate("Book a care appointment", lang)}</button>}</article>})}</div></section>;
}

type MemberOrder = { total: number; status?: string };
type MemberAccount = { name: string; email: string } | null;

const englishTiers = [
  ["Member", "Register an account", "15% voucher for first order"],
  ["Silver", "From 2,000,000₫", "5% off every order"],
  ["Gold", "From 5,000,000₫", "10% off + priority Refolks Care"],
  ["Platinum", "From 10,000,000₫", "15% off + early invitations"],
];

const vietnameseTiers = [
  ["Thành viên", "Đăng ký tài khoản", "Voucher 15% cho đơn đầu tiên"],
  ["Bạc", "Từ 2.000.000₫", "Giảm 5% mọi đơn"],
  ["Vàng", "Từ 5.000.000₫", "Giảm 10% + ưu tiên Refolks Care"],
  ["Bạch kim", "Từ 10.000.000₫", "Giảm 15% + mời sớm workshop, BST mới"],
];

export function MemberBenefits({
  lang,
  account,
  orders,
  onSignIn,
  onCopy,
}: {
  lang: Lang;
  account: MemberAccount;
  orders: MemberOrder[];
  onSignIn: () => void;
  onCopy: (code: string) => void;
}) {
  const spend = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const tiers =
    lang === "vi"
      ? vietnameseTiers
      : lang === "en"
        ? englishTiers
        : localize(englishTiers, lang);
  const current = spend >= 10_000_000 ? 3 : spend >= 5_000_000 ? 2 : spend >= 2_000_000 ? 1 : 0;
  const next = [2_000_000, 5_000_000, 10_000_000][current];
  const numberLocale =
    lang === "vi"
      ? "vi-VN"
      : lang === "ko"
        ? "ko-KR"
        : lang === "ja"
          ? "ja-JP"
          : lang === "zh-CN"
            ? "zh-CN"
            : "en-US";
  const donationStatus =
    lang === "vi" ? "Chưa bắt đầu" : translate("Get started", lang);
  const memberTitle =
    lang === "vi" ? "Refolks Member" : translate("Refolks Member", lang);

  return (
    <div className="rf-benefits">
      {!account && (
        <div className="rf-benefits-preview">
          <p>
            {lang === "vi"
              ? "Đăng nhập / Đăng ký để xem quyền lợi"
              : translate("Sign in or register to see your benefits", lang)}
            .
          </p>
          <button className="rf-button" onClick={onSignIn}>
            {lang === "vi"
              ? "Đăng nhập / Đăng ký"
              : translate("Sign in / Register", lang)}
          </button>
        </div>
      )}

      <div className="rf-benefits-card">
        <div className="rf-avatar">
          {account?.name.charAt(0).toUpperCase() || "R"}
        </div>
        <div>
          <h3>{account?.name || memberTitle}</h3>
          <p>{account?.email || "—"}</p>
          <strong>{tiers[current][0]} ★</strong>
          {next !== undefined && (
            <>
              <div className="rf-progress">
                <span
                  style={{
                    width: `${Math.min(100, Math.round((spend / next) * 100))}%`,
                  }}
                />
              </div>
              <small>
                {lang === "vi"
                  ? `Còn ${new Intl.NumberFormat("vi-VN").format(Math.max(0, next - spend))}₫ để lên hạng ${tiers[current + 1][0]}`
                  : `${new Intl.NumberFormat(numberLocale).format(Math.max(0, next - spend))}₫ to ${tiers[current + 1][0]}`}
              </small>
            </>
          )}
        </div>
      </div>

      <div className="rf-benefits-card">
        <h3>
          {lang === "vi" ? "Bảng hạng thành viên" : translate("Membership tiers", lang)}
        </h3>
        <div className="rf-tier-table">
          <div className="rf-tier-head">
            <span>{lang === "vi" ? "Hạng" : translate("Tier", lang)}</span>
            <span>{lang === "vi" ? "Điều kiện" : translate("Requirement", lang)}</span>
            <span>{lang === "vi" ? "Quyền lợi" : translate("Benefits", lang)}</span>
          </div>
          {tiers.map((tier, index) => (
            <div
              key={tier[0]}
              className={current === index ? "current" : ""}
            >
              {tier.map((cell) => (
                <span key={cell}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="rf-benefits-card">
        <h3>{lang === "vi" ? "Kho voucher" : translate("Your vouchers", lang)}</h3>
        <button className="rf-voucher" onClick={() => onCopy("NEW15")}>
          <Ticket size={25} strokeWidth={1.5} />
          <span>
            <strong>NEW15</strong>
            <small>
              {lang === "vi"
                ? "Khách mới –15%"
                : translate("New customer –15%", lang)}
            </small>
          </span>
          <span>
            {lang === "vi" ? "Sao chép mã" : translate("Copy code", lang)}
          </span>
        </button>
      </div>

      <div className="rf-benefits-card">
        <h3>{lang === "vi" ? "Mức độ quyên góp" : translate("Donation impact", lang)}</h3>
        <div className="rf-impact">
          <HeartHandshake size={34} strokeWidth={1.5} />
          <strong>0 kg</strong>
          <span>
            {lang === "vi"
              ? `0 lần quyên góp · ${donationStatus}`
              : `0 ${translate("donations", lang)} · ${donationStatus}`}
          </span>
        </div>
        <div className="rf-progress">
          <span style={{ width: "0%" }} />
        </div>
        <p>
          {lang === "vi"
            ? "Mầm xanh 1–2 kg · Cây non 3–9 kg · Cánh rừng từ 10 kg"
            : translate("Green seed 1–2 kg · Sapling 3–9 kg · Forest 10 kg+", lang)}
        </p>
      </div>
    </div>
  );
}

