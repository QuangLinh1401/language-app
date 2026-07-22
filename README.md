# Language App — học tiếng Anh 4 kỹ năng

Dự án cá nhân gồm 2 phần chạy độc lập:

- `backend/` — Node.js + Express, **lưu tiến độ học vào Neon Postgres** (database đám mây, kết nối qua HTTPS), có sẵn thuật toán SRS cho từ vựng.
- `frontend/` — React + Vite, giao diện tiếng Anh, responsive, dùng tốt trên điện thoại khi mở bằng trình duyệt. Icon dùng bộ **animated outline + accent** tự vẽ (SVG, xem mục cuối).

> ⚠️ **Cần kết nối mạng.** Từ bản này, tiến độ được lưu trên database Neon chứ không còn trong file JSON cục bộ, nên backend phải có `DATABASE_URL` hợp lệ và có mạng mới chạy được.

## Chạy thử trong VS Code

Mở 2 terminal riêng (VS Code: `Terminal > Split Terminal`), hoặc dùng task có sẵn **"Run All (BE + UI)"** trong `.vscode/tasks.json`:

**Terminal 1 — Backend**
```bash
cd backend
npm install
cp .env.example .env      # rồi mở .env, điền DATABASE_URL (chuỗi kết nối Neon)
npm run dev
```
Backend chạy ở `http://localhost:4000`.

Lấy `DATABASE_URL` ở đâu: tạo project miễn phí tại [neon.tech](https://neon.tech) → copy **connection string** (dạng `postgresql://user:pass@...neon.tech/neondb?sslmode=require`) vào dòng `DATABASE_URL` trong `backend/.env`. Backend tự tạo bảng `app_state` lần đầu chạy, không cần chạy SQL tay.

> 🔒 `DATABASE_URL` chứa mật khẩu database — chỉ để ở `backend/.env` (đã được `.gitignore`), **tuyệt đối không** đưa sang frontend. Nếu mật khẩu từng bị lộ, vào Neon dashboard reset lại rồi cập nhật `.env`.

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```
Frontend chạy ở `http://localhost:5173` (Vite tự in ra link chính xác).

Mở link frontend trong trình duyệt là dùng được ngay (backend phải đang chạy + có mạng).

## Chuyển dữ liệu cũ (từ file JSON sang Neon)

Nếu trước đây bạn đã học và có tiến độ trong `backend/data/user-progress.json`, **lần đầu backend kết nối Neon nó sẽ tự nạp (migrate) toàn bộ tiến độ đó lên database** (XP, streak, tiến độ từ vựng/ngữ pháp...). Sau lần đầu, dữ liệu sống trong Neon; file JSON cũ được giữ lại như một bản lưu phòng hờ nhưng không còn được đọc nữa.

Muốn tự sao lưu bất cứ lúc nào: bấm **icon bánh răng (góc phải trên)** → **"Tải bản sao dữ liệu (JSON)"**. Cũng ở đó có nút **"Đặt lại toàn bộ tiến độ"** (có xác nhận) nếu muốn học lại từ đầu.

## Deploy lên Vercel (1 project, cả frontend + backend)

Repo đã cấu hình sẵn để deploy toàn bộ trên **Vercel**:

- `frontend/` build thành trang tĩnh (`frontend/dist`).
- `backend/` (Express) chạy dạng **serverless function** tại `api/index.js` — file `backend/app.js` export app (không `listen`), còn `backend/server.js` chỉ dùng cho chạy local.
- `vercel.json` lo: build frontend, đưa các file nội dung `backend/data/**` vào function, và rewrite mọi request `/api/*` về function.

**Các bước:**
1. Push repo này lên GitHub.
2. Vào [vercel.com](https://vercel.com) → **Add New Project** → import repo `language-app`. Vercel tự đọc `vercel.json`, không cần chỉnh build settings.
3. Ở **Settings → Environment Variables**, thêm:
   - `DATABASE_URL` = chuỗi kết nối Neon (bắt buộc — thiếu là API lỗi).
   - `ANTHROPIC_API_KEY` = (tuỳ chọn, để có bài đọc luyện từ do AI viết).
4. **Deploy**. Xong sẽ có 1 URL dùng được ở bất cứ đâu; frontend gọi `/api/*` cùng domain nên không cần cấu hình URL backend riêng.

> Neon là database cloud sẵn, không phải deploy. `DATABASE_URL` chỉ đặt trong Environment Variables của Vercel (phía server), không lộ ra frontend.

Chạy local vẫn như cũ: `cd backend && npm run dev` + `cd frontend && npm run dev` (dùng `backend/.env`).

## Cấu trúc nội dung học

Toàn bộ nội dung (từ vựng, ngữ pháp, bài nghe, bài đọc, câu/hội thoại shadowing) nằm ở `backend/data/*.json` — sửa/thêm trực tiếp trong các file này, không cần đụng vào code, restart backend là thấy ngay nội dung mới.

- `vocabulary.json` — ~3300 từ (đã lọc trùng), gom thành 10 nhóm chủ đề lớn (Đời sống, Công việc, Giao tiếp, Du lịch, Mua sắm, Sức khỏe, Công nghệ, Giải trí, Học tập, Xã hội), mỗi từ có cấp độ riêng (A1-B2) + ví dụ + mẫu câu giao tiếp thường dùng
- `grammar.json` — 86 bài ngữ pháp từ A1 đến B2, có lý thuyết (tiếng Việt) + bài tập
- `listening.json` — 30 bài nghe theo chủ đề và cấp độ (app dùng giọng đọc có sẵn của trình duyệt để "phát" bài nghe)
- `reading.json` — 20 bài đọc (350-500 từ/bài) kèm 4-5 câu hỏi trắc nghiệm mỗi bài, có theo dõi đã đọc/điểm/thời gian làm bài
- `speaking.json` — câu luyện nói kiểu shadowing theo 29 chủ đề đời sống + hội thoại (dialogues) nhiều dòng theo chủ đề

## Về phần Nghe & Nói (không cần file audio)

App không dùng file mp3 có sẵn — thay vào đó dùng **Web Speech API** ngay trong trình duyệt để đọc to transcript/câu mẫu (giọng đọc hệ thống, chọn được tốc độ). Phần Nói không còn dùng mic để chấm điểm — bạn tự nghe mẫu và luyện nói theo (shadowing) ở tốc độ của riêng mình.

Chất lượng giọng đọc phụ thuộc vào trình duyệt/máy (Chrome trên máy tính thường có giọng tự nhiên nhất). Nếu sau này muốn nâng cấp lên giọng đọc thật (AI voice), có thể thay phần `speechSynthesis` trong frontend bằng một API text-to-speech.

## Bộ icon (animated outline + accent)

Toàn bộ icon trong app do `frontend/src/components/Icon.jsx` sinh ra — mỗi icon là 1 SVG gồm **nét outline** (dùng `currentColor`, tự đổi màu theo chỗ đặt) + **đúng 1 chi tiết accent** tô màu cố định theo nghĩa (teal cho "đúng/đời sống", amber cho "streak/gợi ý", violet cho "phát âm/công nghệ"...). Khi rê chuột vào thẻ/nút chứa icon, chỉ phần accent chuyển động nhẹ (flicker cho lửa, pulse cho mic, draw cho dấu tick, page-flip cho sách...) — hiệu ứng bằng CSS keyframes, tôn trọng `prefers-reduced-motion`. Muốn thêm icon: khai báo thêm trong `ICON_SVGS` + `ICON_META` của file đó (không cần file ảnh/JSON ngoài).

## Giới hạn hiện tại

- Chưa có màn hình đăng nhập nhiều tài khoản — mặc định là 1 người dùng, toàn bộ tiến độ lưu trong 1 dòng của bảng `app_state` trên Neon (đúng nhu cầu app cá nhân). Muốn nhiều tài khoản thì cần thêm một lớp xác thực (Neon chỉ là database, không tự lo đăng nhập).
- Nội dung học là bộ dữ liệu tĩnh trong các file JSON — muốn mở rộng thêm thì sửa/thêm trực tiếp theo đúng cấu trúc hiện có.
