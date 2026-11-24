# DEPLOY-VERCEL — Đưa website Refolks (front-end + back-end) lên Vercel

> Dành cho người làm front-end. Làm lần lượt từ bước 1 đến bước 9, mỗi bước có mục **Đạt khi** để tự kiểm tra.
> Không cần sửa code: back-end (MongoDB, tài khoản, OTP email, đăng nhập Google, admin) đã có trong nhánh `main`.
> **Không dán mật khẩu, connection string hay khóa bí mật vào chat, issue hay file trong repo. Repo này PUBLIC.**
> Chỉ nhập các giá trị đó ở Vercel (Environment Variables) và trong file `.env.local` trên máy bạn (file này không bị commit).

Nếu muốn nhờ AI (Claude Code, Codex…) làm cùng, mở AI trong thư mục dự án và dán đoạn này:

```text
Đọc DEPLOY-VERCEL.md, UPDATE.md và CLAUDE.md. Hướng dẫn tôi làm từng bước trong DEPLOY-VERCEL.md,
chạy các lệnh trên máy khi cần, so kết quả với "Đạt khi", lỗi thì tra mục 10. Không in giá trị biến
môi trường nào. Việc cần tài khoản của tôi (Vercel, Atlas, Google) thì chỉ tôi bấm ở đâu rồi chờ.
```

---

## Tổng quan: cần những gì

| Dịch vụ | Dùng để | Bắt buộc? |
|---|---|---|
| GitHub (repo này) | Vercel lấy code từ nhánh `main` | Có |
| Vercel | Chạy website và API | Có |
| MongoDB Atlas (cluster `Refolks`, db `refolks`) | Lưu tài khoản, đơn hàng, tồn kho, tin nhắn, lịch hẹn, đăng ký quyên góp | **Có**. Thiếu thì mọi API lỗi |
| Gmail (App Password) hoặc Resend | Gửi mã OTP, email đơn hàng | Không. Thiếu thì đăng ký vào thẳng, ẩn "Quên mật khẩu" |
| Google Cloud (OAuth client) | Nút "Tiếp tục với Google" | Không. Thiếu thì nút tự ẩn |
| Tên miền `refolks.store` | Địa chỉ chính thức | Nên có (Google đăng nhập cần tên miền cố định) |

---

## Bước 1. MongoDB Atlas

Vào https://cloud.mongodb.com, chọn project chứa cluster `Refolks`.

1. **Đổi mật khẩu user ứng dụng** (mật khẩu cũ đã từng bị lộ): Security → Database Access → `refolks-app` → Edit → Edit Password → Autogenerate → Copy → Update User. Lưu mật khẩu vào trình quản lý mật khẩu của bạn.
   User này chỉ cần quyền `readWrite` trên database `refolks`. Không dùng user admin của Atlas.
2. **Cho phép Vercel kết nối**: Security → Network Access → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`) → Confirm. (Vercel không có IP cố định nên phải mở như vậy; vẫn an toàn vì cần user và mật khẩu.)
3. **Lấy connection string**: Database → Connect → Drivers → copy chuỗi, thay `<db_password>` bằng mật khẩu mới.
   - Nếu chuỗi dạng `mongodb+srv://...` gây lỗi `querySrv` trên máy Windows, dùng dạng chuẩn `mongodb://host1,host2,host3/?ssl=true&authSource=admin&replicaSet=...` (trong Connect chọn phiên bản driver cũ để thấy chuỗi này). Trên Vercel dùng dạng nào cũng được.
   - Mật khẩu có ký tự đặc biệt (`@ : / ? # %`) phải mã hóa URL, ví dụ `@` → `%40`. Dùng mật khẩu Autogenerate (chỉ chữ và số) sẽ tránh được việc này.

**Đạt khi:** có một connection string đầy đủ (giữ bí mật) và Network Access có `0.0.0.0/0` ở trạng thái Active.

---

## Bước 2. Kiểm tra trên máy và tạo index (một lần)

Cần Node.js ≥ 22.13. Mở PowerShell ở thư mục dự án:

```powershell
git pull
npm ci
```

Tạo hoặc sửa file `.env.local` ở thư mục gốc (copy từ `.env.example`), điền ít nhất:

```dotenv
MONGODB_URI=<connection string ở bước 1>
MONGODB_DB=refolks
```

Rồi chạy:

```powershell
node --env-file=.env.local scripts/mongo-setup.mjs
```

**Đạt khi:** in ra `Indexes ready in database "refolks".` (Lệnh này chạy lại nhiều lần cũng an toàn.)

Tùy chọn, kiểm tra build trước khi đưa lên: `npm run build` phải in `✓ Compiled successfully`.

---

## Bước 3. Gửi email (khuyến nghị: Gmail)

1. Dùng một tài khoản Gmail để gửi thư (nên tạo riêng cho cửa hàng). Bật **Xác minh 2 bước**: https://myaccount.google.com/security
2. Tạo App Password: https://myaccount.google.com/apppasswords → đặt tên "Refolks" → copy 16 ký tự, **viết liền, bỏ dấu cách**.
3. Ghi lại 2 giá trị cho bước 5: `GMAIL_USER` = địa chỉ Gmail đó, `GMAIL_APP_PASSWORD` = 16 ký tự.

Thay thế: dùng Resend (`RESEND_API_KEY`, `EMAIL_FROM` với domain đã xác minh trên resend.com). Có Gmail thì không cần Resend.

**Đạt khi:** có App Password 16 ký tự.

---

## Bước 4. Đăng nhập Google (tùy chọn)

Vào https://console.cloud.google.com (chọn hoặc tạo project "Refolks").

1. APIs & Services → **OAuth consent screen**: User type External, tên app "Refolks", email hỗ trợ, scope `email`, `profile`, `openid`. Khi sẵn sàng cho khách thật: bấm **Publish app** (nếu còn "Testing" thì chỉ email trong Test users đăng nhập được).
2. APIs & Services → **Credentials** → Create credentials → OAuth client ID → Application type **Web application**.
3. **Authorized redirect URIs**, thêm đúng từng ký tự:
   - `https://refolks.store/api/auth/google/callback`
   - `https://<tên-project>.vercel.app/api/auth/google/callback` (tên miền Vercel cấp, xem ở bước 6)
   - `http://localhost:3000/api/auth/google/callback` (để thử trên máy)
4. Copy **Client ID** và **Client secret** cho bước 5.

**Đạt khi:** có Client ID (đuôi `.apps.googleusercontent.com`) và Client secret (đầu `GOCSPX-`).

---

## Bước 5. Tạo project trên Vercel

1. https://vercel.com → Add New → Project → Import repo `refolks-storefront-dev` từ GitHub.
2. Cấu hình (thường Vercel tự nhận đúng nhờ `vercel.json`):
   - Framework Preset: **Next.js**
   - Install Command: `npm ci`
   - Build Command: `npm run build`
   - Output: để mặc định
   - Root Directory: để trống
3. Settings → General → **Node.js Version: 22.x** (hoặc mới hơn).
4. Settings → Git → Production Branch: `main`.
5. Settings → **Environment Variables**, thêm từng biến, chọn môi trường **Production** (và **Preview** nếu muốn bản thử cũng chạy):

| Biến | Giá trị | Bắt buộc |
|---|---|---|
| `MONGODB_URI` | connection string bước 1 | **Có** |
| `MONGODB_DB` | `refolks` | Có |
| `NEXT_PUBLIC_SITE_ORIGIN` | `https://refolks.store` (chưa có tên miền thì bỏ trống) | Nên có |
| `GMAIL_USER` | địa chỉ Gmail bước 3 | Để bật OTP |
| `GMAIL_APP_PASSWORD` | 16 ký tự bước 3 | Để bật OTP |
| `ORDER_NOTIFY_EMAIL` | email nhận thông báo đơn mới | Không |
| `DONATION_NOTIFY_EMAIL` | email nhận thông báo đăng ký quyên góp | Không |
| `EMAIL_FROM` | tên/địa chỉ người gửi (khi dùng Resend) | Không |
| `GOOGLE_CLIENT_ID` | bước 4 | Để bật Google |
| `GOOGLE_CLIENT_SECRET` | bước 4 | Để bật Google |
| `RATE_LIMIT_SALT` | một chuỗi ngẫu nhiên dài ≥ 32 ký tự, tự đặt | Nên có |
| `BANK_BIN`, `BANK_NAME`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` | chỉ điền thông tin ngân hàng thật đã được chủ shop duyệt | Không |

   **Không** thêm: `DATA_SOURCE`, `DATA_DIR`, `SEED_PASSWORD`, `SUPABASE_*`.
   Tạo chuỗi ngẫu nhiên cho `RATE_LIMIT_SALT` bằng PowerShell: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

6. Bấm **Deploy**.

**Đạt khi:** Deployment báo **Ready** (log build có `✓ Compiled successfully`).

> Đổi hoặc thêm biến sau này: phải vào Deployments → bản mới nhất → ⋯ → **Redeploy** thì mới có tác dụng.

---

## Bước 6. Gắn tên miền `refolks.store`

1. Vercel → Project → Settings → **Domains** → Add `refolks.store`, rồi Add `www.refolks.store`.
2. Làm theo bản ghi DNS Vercel hiển thị (thường: bản ghi `A` cho `refolks.store` và `CNAME` cho `www`), nhập ở nơi bạn mua tên miền.
3. `vercel.json` đã tự chuyển `www.refolks.store` → `refolks.store`.
4. Nếu chưa có tên miền: dùng tạm `https://<tên-project>.vercel.app` (xem ở Domains), nhớ thêm URI callback tương ứng ở bước 4.

**Đạt khi:** `https://refolks.store` mở được, có ổ khóa HTTPS.

---

## Bước 7. Kiểm tra website trên host

Thay `<site>` bằng `https://refolks.store` (hoặc tên miền `.vercel.app`):

| # | Làm | Đạt khi |
|---|---|---|
| 7.1 | Mở `<site>/api/auth/me` | Thấy JSON `{"user":null,"features":{"google":true,"email":true}}` (`false` nếu bạn bỏ qua bước 3/4) |
| 7.2 | Mở `<site>/en` và `<site>/vi` | Trang chủ hiện, chữ "Refolks" |
| 7.3 | Bấm icon người dùng → Đăng ký bằng email thật | Chuyển sang bước nhập mã; mã 6 số tới hộp thư (xem cả Spam); nhập mã → đã đăng nhập |
| 7.4 | Đăng xuất → "Quên mật khẩu?" | Nhận mã, đặt mật khẩu mới, đăng nhập lại được |
| 7.5 | "Tiếp tục với Google" | Quay về trang tài khoản và đã đăng nhập |
| 7.6 | Thêm 1 túi vào giỏ → thanh toán (COD) | Có mã đơn; vào tài khoản thấy đơn trong lịch sử |
| 7.7 | Gửi form Care/newsletter, đặt lịch ghé studio | Báo gửi thành công |

Kiểm tra dữ liệu đã vào Atlas: Atlas → Database → Browse Collections → db `refolks` → thấy `users`, `orders`, `sessions`…

---

## Bước 8. Tạo tài khoản quản trị (super_admin)

1. Trên website thật, đăng ký tài khoản bằng email của chủ shop (bước 7.3).
2. Trên máy (đã có `.env.local` trỏ tới **cùng** cluster ở bước 2), chạy:

```powershell
node --env-file=.env.local scripts/set-role.mjs <email-chủ-shop> super_admin
```

3. Đăng nhập lại (đổi quyền sẽ đăng xuất phiên cũ) → mở `<site>/en/admin`.

**Đạt khi:** thấy danh sách đơn hàng và tab quản lý người dùng.

Quyền: `support` xem đơn; `admin` xem và sửa trạng thái đơn; `super_admin` thêm quản lý user và cấp quyền (cấp ngay trong trang admin).

---

## Bước 9. Dọn trước khi mở cho khách

- Nếu từng chạy dữ liệu mẫu (`npm run db:seed:mongo`) trên cluster này, xóa đi:
  `node --env-file=.env.local scripts/mongo-seed.mjs --reset` (chỉ xóa dữ liệu có đánh dấu mẫu, không đụng dữ liệu thật).
- **Không** đặt `SEED_PASSWORD` trên Vercel; không chạy seed trên database thật sau khi đã mở bán.
- Google OAuth consent screen: đã **Publish app** (bước 4.1).
- Xóa các redirect URI `localhost` khỏi Google nếu không còn thử trên máy (không bắt buộc).

---

## 10. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Build trên Vercel báo thiếu `.openai/hosting.json` | Build Command không phải `npm run build` | Đặt lại Build Command `npm run build` (bước 5.2) |
| API (đăng nhập, đặt hàng) lỗi 500 ngay lập tức; log có `No production data store configured` | Thiếu `MONGODB_URI` trên Vercel hoặc chưa Redeploy | Thêm biến (bước 5.5) → Redeploy |
| API treo ~30 giây rồi lỗi; log có `Server selection timed out` | Atlas chưa mở `0.0.0.0/0` | Bước 1.2 |
| Log có `Authentication failed` | Sai mật khẩu trong `MONGODB_URI` hoặc mật khẩu chưa mã hóa URL | Bước 1.1 và 1.3, cập nhật biến → Redeploy |
| `/api/auth/me` có `"email":false` | Thiếu/sai tên `GMAIL_USER`, `GMAIL_APP_PASSWORD`, hoặc chưa Redeploy | Kiểm tra tên biến, Redeploy |
| Log có `Email code failed` + `EAUTH` | App Password sai/đã thu hồi, hoặc tắt xác minh 2 bước | Tạo App Password mới (bước 3) |
| Mã OTP không tới | Vào Spam; hoặc bấm gửi lại trước 60 giây | Xem Spam, đợi 1 phút rồi "Gửi lại mã" |
| Google báo `redirect_uri_mismatch` | URI callback chưa khai báo đúng tên miền | Bước 4.3, thêm chính xác `<site>/api/auth/google/callback` |
| Google báo "Access blocked" | Consent screen còn Testing | Thêm Test users hoặc Publish app |
| Google lỗi trên link Preview của Vercel | Mỗi bản Preview có tên miền khác | Thử Google trên tên miền chính thức |
| Thông báo "Đăng nhập Google chưa hoàn tất" | Quá 10 phút, hoặc email Google đã gắn tài khoản Google khác | Thử lại; xem log `Google sign-in failed` |
| Sitemap/canonical trỏ sai tên miền | `NEXT_PUBLIC_SITE_ORIGIN` sai hoặc đổi mà chưa Redeploy | Sửa biến → Redeploy (biến này được đọc lúc build) |
| `set-role.mjs` báo không tìm thấy user | Chưa đăng ký, hoặc `.env.local` trỏ khác cluster/db với Vercel | Đăng ký trước; kiểm tra `MONGODB_URI`, `MONGODB_DB` khớp |
| `querySrv ECONNREFUSED` khi chạy script trên máy | DNS máy chặn `mongodb+srv://` | Dùng chuỗi dạng `mongodb://` (bước 1.3) |

Xem log trên Vercel: Project → **Logs** (hoặc Deployments → bản mới nhất → Functions/Runtime Logs).

---

## Ghi chú kỹ thuật (cho người lập trình)

- Kiến trúc chạy trên Vercel: Next.js thật (`next build` / `next start`), không qua Vinext/Cloudflare. `vite.config.ts` và `.openai/hosting.json` chỉ dùng cho đường Cloudflare Worker (xem `UPDATE.md` mục 5B).
- Vercel có ổ đĩa chỉ đọc nên adapter local `.data/` không dùng được; production bắt buộc có `MONGODB_URI`.
- Kết nối MongoDB được giữ lại trong mỗi instance serverless; kết nối lỗi sẽ được thử lại ở request sau (`src/lib/data/mongo.ts`).
- `siteOrigin` (`src/lib/seo.ts`): `NEXT_PUBLIC_SITE_ORIGIN`, nếu trống thì `https://$VERCEL_PROJECT_PRODUCTION_URL`.
- Cookie đăng nhập dùng `Secure` ở production nên bắt buộc HTTPS (Vercel có sẵn).
- Thanh toán hiện chỉ là đơn COD (demo); chưa có cổng thanh toán hay webhook.
- Chi tiết tính năng và bản đồ file: `UPDATE.md`. Luật nội dung/thiết kế: `CLAUDE.md`.
