"use client";

import { BriefcaseBusiness, Leaf, Package, Scissors, ShieldCheck, Sparkles, Wrench } from "lucide-react";
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

