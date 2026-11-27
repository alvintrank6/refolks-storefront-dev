"use client";

import { usePathname } from "next/navigation";

export default function NotFound() {
  const vi = usePathname()?.startsWith("/vi");
  const base = vi ? "/vi" : "/en";
  return <main style={{minHeight:"80vh",background:"#f9f5e9",padding:"130px clamp(24px,8vw,150px)",fontFamily:"BeVietnam,Arial,sans-serif",color:"#33221a"}}>
    <a href="https://refolks.space/" aria-label="Refolks"><img src="/images/refolks/logo-red-motif.png" alt="Refolks" style={{width:190,marginLeft:-25}}/></a>
    <p style={{letterSpacing:3,color:"#7a1f1e"}}>404 / REFOLKS</p>
    <h1 style={{fontFamily:"LoraRefolks,Georgia,serif",color:"#7a1f1e",fontSize:"clamp(2rem,5vw,3.5rem)",fontWeight:400}}>{vi?"Không tìm thấy trang":"Page not found"}</h1>
    <p>{vi?"Đường dẫn này không tồn tại hoặc đã thay đổi.":"This page does not exist or has moved."}</p>
    <a href={base} style={{display:"inline-block",marginTop:22,padding:"14px 24px",background:"#7a1f1e",color:"white",textDecoration:"none"}}>{vi?"Về trang chủ":"Back to home"}</a>
  </main>;
}
