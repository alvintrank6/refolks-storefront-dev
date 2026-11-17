/** Approved image files added from the November 13 product photo bundles. */
export const suppliedImageManifest = {
  heraldDetail: { file: "herald-interior-final.webp", altVi: "Bên trong túi The Herald", altEn: "Interior of The Herald" },
  curatorFront: { file: "curator-front-final.webp", altVi: "Mặt trước túi The Curator", altEn: "Front of The Curator" },
  curatorTop: { file: "curator-top-final.webp", altVi: "Góc nhìn phía trên túi The Curator", altEn: "Top view of The Curator" },
  curatorInside: { file: "curator-inside-final.webp", altVi: "Bên trong túi The Curator", altEn: "Interior of The Curator" },
  curatorBack: { file: "curator-back-final.webp", altVi: "Mặt sau túi The Curator", altEn: "Back of The Curator" },
  curatorBottom: { file: "curator-bottom-final.webp", altVi: "Mặt đáy túi The Curator", altEn: "Bottom of The Curator" },
  vanguardMen: { file: "vanguard-men-front-final.webp", altVi: "The Vanguard, phiên bản phối cardholder", altEn: "The Vanguard styled with the cardholder" },
  vanguardWomen: { file: "vanguard-women-scarf-final.webp", altVi: "The Vanguard với khăn họa tiết buộc trên quai", altEn: "The Vanguard with a motif scarf tied to the handle" },
  vanguardAngle: { file: "vanguard-angle-final.webp", altVi: "Góc nghiêng túi The Vanguard", altEn: "Angled view of The Vanguard" },
  vanguardInside: { file: "vanguard-inside-final.webp", altVi: "Bên trong túi The Vanguard", altEn: "Interior of The Vanguard" },
  vanguardBottom: { file: "vanguard-bottom-final.webp", altVi: "Mặt đáy túi The Vanguard", altEn: "Bottom of The Vanguard" },
  vanguardBack: { file: "vanguard-back-final.webp", altVi: "Mặt sau túi The Vanguard", altEn: "Back of The Vanguard" },
  navigatorFront: { file: "navigator-front-final.webp", altVi: "The Navigator nhìn chếch, thấy trọn phần thân túi", altEn: "Angled view of The Navigator with the full bag body visible" },
  navigatorLeft: { file: "navigator-left-final.webp", altVi: "Góc nhìn bên trái túi The Navigator", altEn: "Left-side view of The Navigator" },
  navigatorBottom: { file: "navigator-bottom-final.webp", altVi: "Mặt đáy túi The Navigator", altEn: "Bottom of The Navigator" },
  navigatorInside: { file: "navigator-inside-final.webp", altVi: "Bên trong túi The Navigator", altEn: "Interior of The Navigator" },
  dragonSoft: { file: "keychain-dragon-final.webp", altVi: "Ảnh tham khảo: móc khóa rồng bọc vải", altEn: "Reference image: fabric-wrapped dragon keychain" },
  dragonSilver: { file: "keychain-dragon-silver-final.webp", altVi: "Ảnh tham khảo: móc khóa rồng màu bạc", altEn: "Reference image: silver dragon keychain" },
  smallPouchReference: { file: "small-pouch-reference.webp", altVi: "Ảnh cận cảnh túi nhỏ có khóa kéo gắn trên túi", altEn: "Close-up reference of the zipped pouch attached to a bag" },
  scarfReference: { file: "thai-motif-scarf-reference.webp", altVi: "Khăn họa tiết buộc trên quai túi", altEn: "Motif scarf tied to a bag handle" },
} as const;

export type SuppliedImageKey = keyof typeof suppliedImageManifest;

export const suppliedImage = (key: SuppliedImageKey) =>
  `/images/refolks/${suppliedImageManifest[key].file}`;
