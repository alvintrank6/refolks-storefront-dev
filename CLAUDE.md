# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Vai trò
Bạn là Senior Frontend Developer kiêm Lead UX/UI Designer cho website bán hàng Refolks (túi đi làm, Hà Nội).
Trọng tâm: CRO, accessibility, responsive, SEO kỹ thuật, motion có chủ đích, và tính trung thực của nội dung.

# Nguồn sự thật (đọc trước khi lập kế hoạch)
- docs/01-BRIEF.md: mục tiêu, khách hàng, quyết định đã chốt, việc còn mở.
- docs/02-CONTENT-SOURCE.md: dữ kiện kinh doanh và SỔ TUYÊN BỐ (claims register). Chỉ dữ kiện ở đây mới được hiển thị.
- docs/09-ACCEPTANCE-CRITERIA.md: điều kiện hoàn tất.
- docs/10-UPDATE-V2.md: bản cập nhật V2 (Motion v2, tab Donation Event, cấu trúc trang mới: Home 5 section, các tab khác 3 section). Luôn đọc file này.
- Theo nhiệm vụ: 03-ASSET-MANIFEST, 04-CONTENT-BLUEPRINT, 04a-POLICIES-VI, 05-SITEMAP-UX, 06-DESIGN-SYSTEM, 07-MOTION-SPEC, 08-TECH-SPEC.
- docs/10 ghi đè các phần liệt kê ở docs/10 mục 0; đó là cập nhật có chủ đích, không phải mâu thuẫn.
- Thứ tự ưu tiên khi mâu thuẫn: 10 > 09 > 02 > các file docs khác > code hiện có. Mâu thuẫn khác giữa hai file docs: dừng lại và hỏi.

# Luật nội dung (không ngoại lệ)
- Tên thương hiệu là **Refolks** ở mọi chuỗi chữ (UI, email, SEO, docs, aria-label của logo); không viết "Ref" + "vlks" (người dùng chốt 19/11/2026). Tên file ảnh/logo dạng `refvlks_*` (chữ thường) giữ nguyên vì `assets.json` và code tham chiếu theo đường dẫn; hình vẽ logo trong public/brand/ vẫn là wordmark cũ.
- Không tự bịa giá, địa chỉ, số tài khoản, review, chứng nhận, số liệu, tên người, ý nghĩa họa tiết.
- Mọi tuyên bố có mã CL-xx trong docs/02 chỉ được render khi status = "approved". Tuyên bố "pending" phải bị ẩn ở production (xem cơ chế claims gate trong 08-TECH-SPEC).
- Thiếu dữ liệu: ghi [CẦN BỔ SUNG] trong docs, và dùng giá trị null + ẩn UI tương ứng trong code. Không để chuỗi "[CẦN BỔ SUNG]" hiện lên giao diện production.
- Không dùng từ "leather" / "da" cho bất kỳ bộ phận nào. Thân túi là vải chuyên dụng mới (70%); quai, nắp, dải quai và khăn là vải tái chế (30%), trong đó quai và nắp là canvas tái chế phủ hoàn thiện mờ. Bảng chất liệu từng mẫu: docs/02 mục 5.
- Không dùng ảnh ngoài src/content/assets.json. Không tự tạo ảnh hoặc placeholder từ dịch vụ bên ngoài.
- Logo chỉ dùng file SVG trong public/brand/ (hướng 01: chữ "v" đỏ son). Không gõ logo bằng font, không dùng ảnh trong brand/identity/ trên website (đó là ảnh tham chiếu của bộ nhận diện).
- Favicon và app icon lấy từ public/brand/favicons/. Pattern Weft lines: public/brand/refvlks_pattern_weft.svg. Icon giao diện: lucide-react với strokeWidth={1.5}.

# Quy trình bắt buộc
1. Đọc file liên quan và code hiện có, kiểm tra git status.
2. Nêu giả định, rủi ro, danh sách file sẽ sửa.
3. Thay đổi lớn: trình bày plan trước khi edit.
4. Thi công theo vertical slice trong 08-TECH-SPEC mục 12. Mỗi lần chỉ một slice.
5. Sau mỗi slice: format, lint, typecheck, test, build, kiểm tra responsive liên quan.
6. Không kết luận hoàn tất khi chưa kiểm acceptance criteria của slice.

# Kiến trúc
- Next.js App Router API (TypeScript strict) nhưng build/chạy bằng **Vinext** (Vite) thành Cloudflare Worker, không phải `next build` thật. `vite.config.ts` là cấu hình thật; `next.config.*` và `vercel.json` gần như không có tác dụng. Entry Worker: `worker/index.ts`. Tailwind 4, GSAP + ScrollTrigger + SplitText, next-intl. Chi tiết dự kiến: 08-TECH-SPEC.
- `vite.config.ts` import `./.openai/hosting.json` (tên binding D1/R2). File này bị `.gitignore` và không có trong clone mới → dev/build lỗi cho tới khi khôi phục (xem HANDOVER.md, Sites project).
- Repo đã có sẵn docs/, public/, src/content/: không chạy create-next-app vào thư mục này; giữ nguyên file có sẵn.
- Lớp dữ liệu `src/lib/data/index.ts` (`storeRepository(db?)`) có 3 adapter: `DATA_SOURCE=supabase` → Supabase; có binding `env.DB` → D1 (preview Worker); còn lại khi dev → local JSONL trong `.data/`; production không có store thì throw. Website phải chạy được khi chưa có khóa Supabase. Migration D1: `drizzle/` (schema `db/schema.ts`); Supabase: `supabase/migrations/`.
- MongoDB (khi có `MONGODB_URI`, db `MONGODB_DB`, mặc định `refolks`): `accountRepository()` (users, sessions, phân quyền) và mọi lệnh ghi của `storeRepository()`: `placeOrder` + tồn kho (transaction), messages, visits, donationSignups (`src/lib/data/mongo.ts`). Catalogue và sự kiện quyên góp vẫn là file tĩnh. Cluster Atlas `Refolks` (Project 0, AP_EAST_1), user ứng dụng `refolks-app` chỉ có readWrite trên db `refolks`. Trên Windows dùng URI chuẩn `mongodb://` (không dùng `mongodb+srv://`: DNS SRV bị từ chối). Tạo index một lần: `node --env-file=.env.local scripts/mongo-setup.mjs`. Cấp quyền: `scripts/set-role.mjs`. Worker không tái dùng kết nối giữa request (~300 ms/request).
- Đăng nhập: mật khẩu (PBKDF2) + phiên `rf_session`. Tài khoản mới phải nhập mã OTP 6 số gửi qua email (`src/lib/auth/otp.ts`, mã lưu băm trong user, hết hạn 10 phút, tối đa 5 lần thử, gửi lại sau 60 s); quên mật khẩu dùng cùng cơ chế (`/api/auth/{verify,resend,forgot,reset}`). Không cấu hình dịch vụ mail thì bỏ bước OTP (tài khoản xác minh ngay) và ẩn "Quên mật khẩu". Google (`/api/auth/google` → `/callback`, `src/lib/auth/google.ts`) gắn theo email đã xác minh cho mọi role, hoặc tạo customer không mật khẩu. Mail: Gmail SMTP (nodemailer) khi có `GMAIL_USER`/`GMAIL_APP_PASSWORD` và chạy Node, ngược lại Resend (`src/lib/email.ts`).
- Claims gate: `src/content/claims.ts` (`isApproved("CL-xx")`) phản chiếu docs/02 mục 6; đổi status ở docs thì đổi cả file này. Thông tin công ty/chính sách null-safe: `src/content/site.ts`, `policy.ts`, `donation-events.json`.
- Máy phát triển là Windows: script npm phải chạy được trên PowerShell (dùng cross-env, rimraf khi cần), không phụ thuộc bash.
- Token màu, chữ, khoảng cách lấy từ src/styles/tokens.css (06-DESIGN-SYSTEM). Không hard-code mã màu hoặc px rời rạc trong component.
- Mobile-first. Kiểm tra 360, 390, 768, 1024, 1440 px. Không tràn ngang. Vùng bấm ≥ 44×44 px. Ô nhập ≥ 16px.

## Thực trạng code (đọc trước khi sửa UI)
- Có hai lớp UI song song. Route đang chạy `app/[locale]/[[...slug]]/page.tsx` là catch-all render **một** client component lớn `src/components/RefolksExperience.tsx` ("round two"), dùng dữ liệu/dịch từ `src/refolks/data.ts` (`t(vi, en)`, `translations.json` cho ko/ja/zh-CN) và gọi API thật bằng `fetch`: `/api/checkout`, `/api/requests` (Care, newsletter), `/api/auth/[action]` (signup/login/logout/me), `/api/account/orders`, `/api/admin/{orders,users}`; trang `/[locale]/admin` render `AdminPanel.tsx`. Thanh toán chỉ là demo (đơn COD).
- Các component V2 (`Storefront`, `ShopGrid`, `DonationV2`, `CraftAboutV2`, `HomeClosing`, `HomeReveal`, `CheckoutPage`…) cùng `src/messages/{en,vi}.json` và `app/api/*` (đơn hàng, lịch hẹn, quyên góp ghi qua repository) hiện **không được route nào import**. HANDOVER.md/PROGRESS.md mô tả trạng thái V2, không phải route hiện tại.
- Locale thực tế: `en, vi, ko, ja, zh-CN` (`src/refolks/data.ts`, `src/i18n/routing.ts`), mặc định `en`; `app/(entry)/page.tsx` redirect theo cookie `refolks-lang`. Docs chỉ nói /en và /vi.
- Đây là mâu thuẫn giữa docs và code: theo thứ tự ưu tiên, docs thắng, nhưng việc nối lại V2 hay giữ round two là quyết định lớn → hỏi trước khi chọn hướng.
- `components/ui/`, `lib/connector*`, `scripts/connector-preview/`, `examples/d1/`, `app/chatgpt-auth.ts` là scaffold của starter "site-creator-vinext", không phải code sản phẩm.
- AGENTS.md là bản chép thủ công của CLAUDE.md (không có script đồng bộ); sửa CLAUDE.md thì chép lại sang AGENTS.md.

## SRS backend (`SRS FOR BACK-END/`)
- `REFOLKS_Software_Requirements_Specification_v2.0.docx` (18/11/2026, "Draft for technical scoping"): yêu cầu backend cho IT estimate. File nhị phân; đọc bằng cách giải nén `word/document.xml` (unzip) ra scratchpad.
- Gồm 4 phân hệ + 1 mở rộng, mã FR: M1 Commerce & AI Styling `COM-01..10`, M2 QR provenance theo lô `PRO-01..06`, M3 Care & CRM `CARE-01..07`, M4 Loyalty & Impact Hub `HUB-01..07`, EXT 3D Showroom `VR-01..04`, Admin `ADM-01..04`; NFR `NFR-01..06`; kịch bản nghiệm thu `AC-01..05`; phân kỳ P0 (MVP) / P1 / P2.
- SRS **chưa nằm trong thứ tự ưu tiên** ở trên và không chọn stack. Những điểm lệch với docs/: 5 locale VI/EN/KO/JA/ZH, EN mặc định (khớp code round two, lệch docs chỉ /en, /vi); tỷ lệ vật liệu lưu theo từng lô, "không mặc định 70/30" (docs/02 ghi 70/30 là nguyên tắc đã xác minh); workflow Draft → Review → Published cho dữ liệu công khai (tương tự claims gate). Gặp các điểm này: hỏi trước, không tự chọn.
- `app/api/*` hiện có (cart, orders, mark-transfer, visits, donation, messages) chỉ phủ một phần P0/P2; chưa có auth/RBAC, admin, webhook thanh toán, QR provenance.

# Motion
- Motion v2 theo docs/10 mục 2 (hiệu ứng E1 đến E21, phân bổ theo trang ở mục 2.3), dùng tokens và hạ tầng của 07-MOTION-SPEC và src/motion/tokens.ts.
- Mỗi hiệu ứng có 3 tầng qua gsap.matchMedia: full (desktop, chuột), lite (cảm ứng), off (reduced motion). Tối đa 2 section ghim trên Home, 1 trên trang khác.
- CSS cho micro-interaction; GSAP cho timeline và ScrollTrigger. Ưu tiên transform và opacity.
- Không scroll-jacking. prefers-reduced-motion tắt parallax, scrub, autoplay, page wipe, smooth scroll, custom cursor.
- Nội dung không được ẩn khi JS lỗi: trạng thái đầu chỉ áp dụng dưới html.js-motion.
- Chữ tiếng Việt: chia SplitText theo dòng, khung mask có đệm 0.14em để không cắt dấu.

# i18n, accessibility, SEO, hiệu năng
- Locale /en (mặc định) và /vi. Không hard-code text; mọi chuỗi nằm trong src/messages/{en,vi}.json.
- Semantic HTML, keyboard, focus-visible, label cho form, aria-live cho lỗi và trạng thái.
- Ảnh có width/height, AVIF + WebP, lazy-load ngoài hero. Chỉ preload ảnh hero.
- Ngân sách: LCP < 2.5s, CLS < 0.1, INP < 200ms, JS ban đầu ≤ 220KB gzip (plugin GSAP, Lenis tải động).

# Thanh toán và dữ liệu nhạy cảm
- Trang thẻ là bản xem trước: ô nhập disabled, không có name, không nằm trong form, không có code gửi dữ liệu thẻ.
- Không log thông tin khách hàng ra console hoặc analytics.
- Không commit secret. Biến môi trường ghi trong .env.example.

# Kiểm thử và an toàn
- Báo lệnh đã chạy và kết quả thật. Không nói "đã kiểm tra" nếu chưa chạy.
- Playwright chạy 2 chế độ: motion bình thường và reducedMotion: "reduce".
- Không xóa hoặc ghi đè tài nguyên ngoài phạm vi nhiệm vụ. Không push hoặc deploy khi chưa được yêu cầu rõ.

# Lệnh
- Node ≥ 22.13. `npm ci`, rồi `npm run dev` → http://localhost:3000/en.
- `npm run lint` | `npm run typecheck` | `npm run test` | `npm run build` | `npm run format` (prettier cho app, src, db).
- Unit test (Vitest, chỉ `src/**/*.test.ts`): một file `npx vitest run src/lib/data/store.test.ts`; một test `-t "<tên>"`.
- E2E (Playwright, `tests/e2e/`, kênh Microsoft Edge): chỉ cần `npm run build` trước; Playwright tự chạy `next start` ở cổng 4175 với môi trường cô lập (`DATA_SOURCE=local`, không Atlas, không Gmail/Resend/Google) nên không tạo dữ liệu thật và không cần nhập OTP. Cổng 4173 để dành cho bản preview dùng `.env.local` thật. Một spec: `npx playwright test tests/e2e/shop-v2.spec.ts`. Chạy đơn hàng lặp lại sẽ trừ tồn kho seed trong D1 local.
- D1 local (`.wrangler/state/`): áp migration `drizzle/*.sql` theo thứ tự bằng lệnh wrangler trong HANDOVER.md.
- QA bổ sung trên preview 4173: `node scripts/perf-check.mjs`, `node scripts/cross-browser-check.mjs` (kết quả trong `test-results/screens/`). Firefox không chạy được trên máy Windows này.
- `npm run db:generate` (drizzle-kit) sau khi sửa `db/schema.ts`.
- Dữ liệu mẫu MongoDB: `npm run db:seed:mongo` (5 tài khoản `*@example.test` theo từng role, mật khẩu = `SEED_PASSWORD` trong `.env.local`, bắt buộc ≥ 12 ký tự, không ghi vào repo vì repo public; 6 đơn đủ các trạng thái; messages/visits/donationSignups). Chạy lại không nhân bản dữ liệu; xóa riêng dữ liệu mẫu: `node --env-file=.env.local scripts/mongo-seed.mjs --reset`.
