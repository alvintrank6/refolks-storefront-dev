# UPDATE — Backend MongoDB, tài khoản, OTP email, đăng nhập Google (22/11/2026)

> **Dành cho người làm front-end không phải lập trình viên.** Bạn không cần đọc hết file này.
> Hãy mở Claude Code (hoặc AI lập trình khác) trong thư mục dự án và dán nguyên văn đoạn **"Lời nhắn cho AI"** ngay bên dưới.
> AI sẽ đọc phần còn lại, tự kiểm tra, sửa lỗi nếu có, và báo lại cho bạn bằng tiếng Việt.

---

## Lời nhắn cho AI (copy nguyên đoạn này)

```text
Đọc file UPDATE.md ở thư mục gốc dự án, rồi đọc CLAUDE.md. Làm lần lượt mục 4 (kiểm tra máy local)
và mục 5 (chạy trên host) trong UPDATE.md. Với mỗi bước: chạy lệnh, so với "Kết quả đúng",
nếu sai thì tra bảng mục 7 để sửa. Tuân thủ mục 8 (luật bắt buộc). Không in ra giá trị của bất kỳ
biến môi trường nào. Nếu cần thông tin chỉ tôi có (khóa, mật khẩu, tên miền, quyền truy cập),
dừng lại và hỏi tôi bằng tiếng Việt, giải thích từng bước bấm ở đâu. Cuối cùng báo cáo:
bước nào đạt, bước nào lỗi, đã sửa gì, còn việc gì tôi phải tự làm.
```

---

## 1. Tóm tắt thay đổi (bằng lời thường)

| Tính năng | Trước | Sau bản cập nhật |
|---|---|---|
| Lưu dữ liệu | File JSON trên máy (`.data/`) hoặc D1 | **MongoDB Atlas** (cloud) khi có `MONGODB_URI`; không có thì vẫn dùng `.data/` như cũ |
| Tài khoản | Chỉ đăng ký/đăng nhập bằng mật khẩu | Thêm **4 quyền**: customer, support, admin, super_admin; trang `/en/admin` |
| Đăng ký | Vào thẳng | Phải nhập **mã OTP 6 số** gửi qua email (chỉ khi đã cấu hình gửi mail) |
| Quên mật khẩu | Không có | Nhập email → nhận mã → đặt mật khẩu mới |
| Đăng nhập Google | Không có | Nút **"Tiếp tục với Google"** (chỉ hiện khi đã có khóa Google) |
| Gửi email | Resend | **Gmail** (khi chạy Node) hoặc Resend |
| Tên thương hiệu | tên cũ ("Ref" + "vlks") | **"Refolks"** ở mọi chữ (tên file ảnh `refvlks_*` giữ nguyên, cố ý) |

Giao diện chính vẫn là `src/components/RefolksExperience.tsx` (route `app/[locale]/[[...slug]]/page.tsx`).
Phần giao diện mới: trong khung tài khoản (bấm icon người dùng) có thêm nút Google, link "Quên mật khẩu?",
bước nhập mã, bước đặt mật khẩu mới. Chữ có đủ 5 ngôn ngữ (vi, en, ko, ja, zh-CN).

---

## 2. Bản đồ file (để AI biết sửa ở đâu)

| Khu vực | File |
|---|---|
| Chọn nơi lưu dữ liệu (Mongo / D1 / local) | `src/lib/data/index.ts` |
| Adapter MongoDB | `src/lib/data/mongo.ts` (+ test `mongo.test.ts`, chạy Mongo giả trong bộ nhớ) |
| Kiểu dữ liệu tài khoản, adapter D1 | `src/lib/data/account.ts`; local: `account-local.ts` |
| API đăng nhập/đăng ký/OTP/quên mật khẩu | `app/api/auth/[action]/route.ts` (`me, signup, login, logout, verify, resend, forgot, reset`) |
| Đăng nhập Google | `app/api/auth/google/route.ts`, `app/api/auth/google/callback/route.ts`, `src/lib/auth/google.ts` |
| Mã OTP | `src/lib/auth/otp.ts` (+ `otp.test.ts`) |
| Phiên đăng nhập, phân quyền | `src/lib/auth/session.ts`, `src/lib/auth/roles.ts`, `src/lib/auth/crypto.ts` |
| Gửi email | `src/lib/email.ts` |
| Trang admin | `src/components/AdminPanel.tsx`, API `app/api/admin/{orders,users}/route.ts` |
| Thanh toán, Care/newsletter | `app/api/checkout/route.ts`, `app/api/requests/route.ts` |
| Script MongoDB | `scripts/mongo-setup.mjs` (tạo index), `scripts/mongo-seed.mjs` (dữ liệu mẫu), `scripts/set-role.mjs` (cấp quyền) |
| D1 (chỉ khi dùng Cloudflare D1) | `db/schema.ts`, migration mới `drizzle/0004_aromatic_monster_badoon.sql` |
| E2E | `playwright.config.ts` tự chạy server cô lập ở cổng **4175** |
| Danh sách biến môi trường | `.env.example` |

Thư viện mới: `nodemailer` (gửi Gmail), `@types/nodemailer`. Đã có trong `package.json`, chỉ cần `npm ci`.

---

## 3. Biến môi trường (KHÔNG BAO GIỜ commit giá trị thật)

Máy local: đặt trong file `.env.local` (đã bị `.gitignore`). Host: đặt trong phần "Environment variables / Secrets" của host.

| Biến | Bắt buộc? | Lấy ở đâu |
|---|---|---|
| `MONGODB_URI` | Có, để lưu lên Atlas | MongoDB Atlas → cluster `Refolks` → Connect → Drivers. **Dùng dạng `mongodb://...` (không phải `mongodb+srv://`)** nếu máy/host báo lỗi `querySrv`. User ứng dụng: `refolks-app` |
| `MONGODB_DB` | Không (mặc định `refolks`) | Giữ `refolks` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Không (thiếu thì ẩn nút Google) | Google Cloud Console → APIs & Services → Credentials → OAuth client "Web application" |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Không (thiếu thì bỏ bước OTP) | Gmail gửi thư + App Password 16 ký tự tại https://myaccount.google.com/apppasswords (cần bật Xác minh 2 bước) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Thay cho Gmail trên Cloudflare Worker | resend.com, domain đã xác minh |
| `SEED_PASSWORD` | Chỉ khi chạy dữ liệu mẫu | Tự đặt, ≥ 12 ký tự |
| `DATA_SOURCE` | Không | Để `local` khi dev; **không** đặt `local` trên host thật nếu không có Mongo |

Quy tắc tính năng tự bật/tắt (không cần sửa code):
- Không có `GOOGLE_CLIENT_ID` → nút Google tự ẩn.
- Không có dịch vụ mail (Gmail hoặc Resend) → đăng ký vào thẳng không cần mã, link "Quên mật khẩu" ẩn.
- Không có `MONGODB_URI` → dùng `.data/` (dev) hoặc D1 (Worker).

Kiểm tra nhanh trạng thái: `GET /api/auth/me` trả `{"user":...,"features":{"google":true|false,"email":true|false}}`.

---

## 4. Kiểm tra trên máy local (làm trước khi đưa lên host)

Yêu cầu: Node ≥ 22.13, Windows PowerShell hoặc Git Bash. Chạy tại thư mục gốc dự án.

| # | Lệnh | Kết quả đúng |
|---|---|---|
| 4.1 | `git pull` rồi `git log --oneline -3` | Thấy commit "Add MongoDB Atlas data layer, accounts with RBAC, email OTP and Google sign-in" và commit thêm UPDATE.md |
| 4.2 | `npm ci` | Không lỗi (cảnh báo `npm warn` thì bỏ qua) |
| 4.3 | Có file `.env.local` với ít nhất `MONGODB_URI` (xem mục 3). AI chỉ kiểm tra **tên** biến có tồn tại, không in giá trị | Có `MONGODB_URI` |
| 4.4 | `node --env-file=.env.local scripts/mongo-setup.mjs` | `Indexes ready in database "refolks".` |
| 4.5 | `npm run typecheck` | Không có dòng `error TS` |
| 4.6 | `npm run test` | `Tests  31 passed` (có thể nhiều hơn nếu thêm test) |
| 4.7 | `npm run lint` | `0 errors` (2 cảnh báo `<img>` có từ trước là bình thường) |
| 4.8 | `npm run build` | `✓ Compiled successfully`, danh sách route có `/api/auth/google` và `/api/auth/google/callback` |
| 4.9 | `npx next start --port 4173` (chạy nền) | Server lên |
| 4.10 | Mở `http://localhost:4173/api/auth/me` | JSON có `"features"`; `google`/`email` = `true` nếu đã điền khóa tương ứng |
| 4.11 | Mở `http://localhost:4173/en` | Trang chủ hiện, chữ "Refolks", không còn tên cũ "Ref" + "vlks" |
| 4.12 | (Tùy chọn) `npm run db:seed:mongo` | Tạo 5 tài khoản mẫu `customer1@example.test`, `customer2@…`, `support@…`, `admin@…`, `super-admin@…`; mật khẩu = `SEED_PASSWORD` |
| 4.13 | Đăng nhập `admin@example.test` → vào `/en/admin` | Thấy danh sách đơn, đổi được trạng thái |
| 4.14 | Đăng ký bằng email thật (khi đã có Gmail) | Form chuyển sang bước nhập mã; mã 6 số tới hộp thư (xem cả Spam); nhập mã → đăng nhập được |
| 4.15 | Bấm "Tiếp tục với Google" (khi đã có khóa Google) | Về `/en/account` và đã đăng nhập |
| 4.16 | `npx playwright test tests/e2e/auth-rbac.spec.ts tests/e2e/backend-round-two.spec.ts` | `15 passed` (Playwright tự chạy server cổng 4175, không đụng Atlas/Gmail) |

Ghi chú 4.16: **chưa** chạy trọn toàn bộ bộ E2E sau bản cập nhật (lần chạy bị dừng do máy thiếu RAM). Nếu máy đủ mạnh, chạy thêm `npx playwright test` theo từng file trong `tests/e2e/`.

---

## 5. Chạy trên host

Dự án chưa từng deploy bản này. Có hai kiểu host; hỏi người dùng đang dùng kiểu nào trước khi làm.

### 5A. Host chạy Node (VPS, Render, Railway, Vercel…) — **đường đã kiểm chứng**

1. Đặt biến môi trường trên host (mục 3). Gmail SMTP hoạt động ở kiểu host này.
2. Lệnh cài: `npm ci`. Lệnh build: `npm run build`. Lệnh chạy: `npm run start` (host thường tự truyền `PORT`; nếu không: `npx next start --port $PORT`).
3. **MongoDB Atlas → Network Access**: thêm IP của host. Host không có IP cố định (Vercel, Render free…) thì phải thêm `0.0.0.0/0` (an toàn vì vẫn cần user/mật khẩu, nhưng nên đổi mật khẩu `refolks-app` định kỳ). Thiếu bước này → mọi API đăng nhập/đặt hàng lỗi 500 sau ~30 giây.
4. **Google Cloud Console → OAuth client → Authorized redirect URIs**: thêm `https://<tên-miền>/api/auth/google/callback` (đúng từng ký tự, có `https`).
5. **Google Cloud Console → OAuth consent screen**: nếu còn "Testing", chỉ email trong "Test users" đăng nhập được. Muốn mọi người dùng được → "Publish app".
6. Host phải có **HTTPS** (cookie đăng nhập dùng `Secure` khi chạy production).
7. Kiểm tra: `https://<tên-miền>/api/auth/me` → có `features`; làm lại 4.11, 4.13–4.15 trên tên miền thật.

### 5B. Cloudflare Worker (Vinext / Sites — cấu hình trong `vite.config.ts`) — **chưa kiểm chứng**

- Cần file `.openai/hosting.json` (bị `.gitignore`, phải lấy từ người giữ dự án; xem HANDOVER.md).
- **Gmail SMTP không chạy trên Worker.** Phải dùng Resend: đặt `RESEND_API_KEY` + `EMAIL_FROM`, không đặt `GMAIL_*`.
- Đặt secret bằng Wrangler (ví dụ `npx wrangler secret put MONGODB_URI`), không ghi vào `wrangler.json`.
- Worker mở kết nối MongoDB mới mỗi request (~300 ms) và cần cờ `nodejs_compat` (đã có trong `vite.config.ts`). Atlas Network Access phải là `0.0.0.0/0`.
- Nếu dùng D1 thay Mongo: áp thêm migration `drizzle/0004_aromatic_monster_badoon.sql` (lệnh mẫu trong HANDOVER.md).
- Đường này **chưa từng được build/chạy thử với MongoDB**; nếu lỗi kết nối Mongo trên Worker, báo người dùng và đề xuất dùng host Node (5A).

### Trước khi mở cho khách thật

- Xóa dữ liệu mẫu trên database thật: `node --env-file=.env.local scripts/mongo-seed.mjs --reset`.
- Cấp quyền super_admin cho tài khoản thật: `node --env-file=.env.local scripts/set-role.mjs <email> super_admin` (tài khoản phải đăng ký trước).
- Đổi mật khẩu user Atlas `refolks-app` (đã từng lộ trong phiên làm việc với AI) rồi cập nhật `MONGODB_URI` ở mọi nơi.

---

## 6. Cách các tính năng hoạt động (để AI chẩn đoán)

- **OTP**: mã 6 số, lưu dạng băm SHA-256 trong document user (`users.otp`), hết hạn 10 phút, sai 5 lần thì mã bị hủy, gửi lại cách nhau ≥ 60 giây. Đăng nhập đúng mật khẩu nhưng chưa xác minh → API trả `403 {"verify":true}` và gửi mã. Tài khoản cũ (không có trường `emailVerified`) coi như đã xác minh.
- **Quên mật khẩu**: `/api/auth/forgot` luôn trả `{"ok":true}` (không tiết lộ email có tồn tại hay không). Đặt lại mật khẩu thành công → đăng xuất mọi phiên cũ.
- **Google**: luồng OpenID Connect "authorization code" có `state` + `nonce` trong cookie `rf_oauth`. Email Google trùng tài khoản có sẵn (mọi quyền) → gắn vào tài khoản đó. Chưa có → tạo customer không mật khẩu (muốn có mật khẩu thì dùng "Quên mật khẩu"). Lỗi bất kỳ → chuyển về `/<lang>/account?auth=google_failed` và hiện thông báo.
- **Collection MongoDB** (db `refolks`): `users`, `sessions` (tự xóa khi hết hạn), `orders`, `inventory`, `messages`, `visits`, `donationSignups`. Đặt hàng dùng transaction (trừ kho + tạo đơn cùng lúc).
- **Quyền**: support xem đơn; admin xem + sửa đơn; super_admin thêm quản lý user/quyền. Đổi quyền → user bị đăng xuất.

---

## 7. Bảng lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `querySrv ECONNREFUSED` | DNS không phân giải `mongodb+srv://` | Dùng chuỗi `mongodb://host1,host2,host3/?ssl=true&authSource=admin&replicaSet=...` (Atlas → Connect → chọn driver phiên bản cũ / "standard connection string") |
| API treo ~30 s rồi lỗi 500, log có `Server selection timed out` | IP máy/host chưa có trong Atlas Network Access | Atlas → Network Access → Add IP (hoặc `0.0.0.0/0` cho host không có IP cố định) |
| `Authentication failed` (Mongo) | Sai mật khẩu trong `MONGODB_URI` | Atlas → Database Access → `refolks-app` → Edit password, cập nhật biến |
| `/api/auth/me` có `"email":false` dù đã điền Gmail | Chưa khởi động lại server, sai tên biến, hoặc chạy trên Worker | Khởi động lại; kiểm tra đúng tên `GMAIL_USER`, `GMAIL_APP_PASSWORD`; trên Worker dùng Resend |
| Gửi mã lỗi, log `Email code failed` + `EAUTH` | App Password sai/đã thu hồi, hoặc chưa bật 2 bước | Tạo App Password mới, viết liền 16 ký tự không dấu cách |
| Mã không tới | Thư vào Spam, hoặc gửi lại < 60 s (API trả `cooldown`) | Xem Spam; đợi 1 phút rồi "Gửi lại mã" |
| Google báo `redirect_uri_mismatch` | Chưa khai báo URI callback đúng tên miền/cổng | Thêm chính xác `<origin>/api/auth/google/callback` trong Google Cloud Console |
| Google báo "Access blocked" / chỉ vài người đăng nhập được | Consent screen ở chế độ Testing | Thêm Test users hoặc Publish app |
| Về trang có thông báo "Đăng nhập Google chưa hoàn tất" | Cookie `rf_oauth` hết hạn (>10 phút), state không khớp, hoặc email Google đã gắn tài khoản Google khác | Thử lại; xem log server dòng `Google sign-in failed` |
| Nút Google / "Quên mật khẩu" không hiện | Thiếu khóa tương ứng (cố ý) | Điền biến ở mục 3 và khởi động lại |
| `npm run build` lỗi thiếu `.openai/hosting.json` | Đang build bằng Vite/Vinext | Dùng `npm run build` (Next) cho host Node; hoặc lấy file từ người giữ dự án |
| Sau khi sửa `.env.local` không có tác dụng | Biến chỉ được đọc khi khởi động | Dừng server và chạy lại |
| E2E đăng ký hỏng vì đòi mã OTP | Chạy test trên server dùng `.env.local` thật | Dùng `npx playwright test` (tự chạy server cô lập cổng 4175); đừng trỏ test vào 4173 |
| Đăng nhập tài khoản mẫu báo sai mật khẩu | Mật khẩu là `SEED_PASSWORD`, không phải mật khẩu cũ | Xem `SEED_PASSWORD` trong `.env.local`, chạy lại `npm run db:seed:mongo` |

---

## 8. Luật bắt buộc khi AI sửa code

1. **Không commit secret.** Trước mỗi commit, kiểm tra diff không chứa giá trị nào trong `.env.local`, không có chuỗi `mongodb://user:pass@`, khóa Google `GOCSPX-…`, App Password. Repo GitHub này **PUBLIC**.
2. Không commit `.env.local`, `.data/`, `SRS FOR BACK-END/`, `.claude/settings.local.json`.
3. Tên thương hiệu luôn là **Refolks**. Không đổi tên file `refvlks_*` (ảnh/logo tham chiếu theo đường dẫn).
4. Không xóa dữ liệu thật trên Atlas. Chỉ được xóa dữ liệu có `sample: true` (bằng `--reset`).
5. Không in log thông tin khách (email, số điện thoại, địa chỉ) ra console.
6. Sau mỗi lần sửa: `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build` phải đạt như mục 4.
7. Các quy tắc nội dung/thiết kế khác: xem `CLAUDE.md` (ưu tiên `docs/10` > `docs/09` > `docs/02`).

---

## 9. Việc còn mở

- Chưa deploy lên host nào; đường Cloudflare Worker + MongoDB chưa chạy thử (5B).
- Chưa chạy trọn bộ E2E sau cập nhật (chỉ 15 test auth/backend đã đạt).
- Hình vẽ logo trong `public/brand/` vẫn là wordmark cũ (chữ đã đổi ở `aria-label`); cần designer xuất file mới nếu muốn logo ghi "Refolks".
- Đếm số lần nhập sai OTP chưa chống được nhiều request song song tuyệt đối (ghi chú `shortcut:` trong `src/lib/auth/otp.ts`); đủ cho quy mô hiện tại.
