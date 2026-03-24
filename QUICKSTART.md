# Quickstart — Chạy ứng dụng Finance Advisor

Hướng dẫn nhanh để chạy **backend FastAPI** và **ứng dụng Expo (React Native)** trên máy local.

## Yêu cầu

| Thành phần | Ghi chú |
|------------|---------|
| **Node.js** | Bản LTS (khuyến nghị 18.x trở lên) |
| **npm** | Đi kèm Node |
| **Python** | 3.10+ (khuyến nghị 3.11+) |
| **Thiết bị / giả lập** | Tùy chọn: [Expo Go](https://expo.dev/go) trên điện thoại, Android Emulator, iOS Simulator, hoặc trình duyệt (web) |

---

## 1. Backend (FastAPI)

Mở terminal tại thư mục gốc repo, vào thư mục `finance-advisor`:

```bash
cd finance-advisor
```

### Môi trường Python

**Windows (PowerShell):**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Biến môi trường

Sao chép `.env.example` thành `.env` và điền **API key Google Gemini** của bạn (lấy tại [Google AI Studio](https://aistudio.google.com/apikey)):

```bash
copy .env.example .env
```

Chỉnh `GOOGLE_API_KEY` trong `.env` — không commit file `.env`.

### Khởi tạo dữ liệu và Chạy server

Trước khi chạy lần đầu, hãy tạo dữ liệu mẫu (mock data) cho ngân hàng:

```bash
python tools/seed_db.py
```

Sau đó, khởi động server (lắng nghe trên mọi interface để app trên điện thoại/emulator có thể trỏ tới máy bạn):

```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

Kiểm tra nhanh: mở trình duyệt tại `http://localhost:8000/docs` (Swagger) hoặc `GET /health`.

Giữ terminal này chạy khi dùng app.

---

## 2. Frontend (Expo)

Mở **terminal mới**, từ thư mục gốc repo:

```bash
cd finance-advisor-app
npm install
npm start
```

Lệnh `npm start` mở **Expo Dev Tools**. Bạn có thể:

- Nhấn **`w`** — chạy trên **web**
- Nhấn **`a`** — **Android** (cần emulator hoặc thiết bị)
- Nhấn **`i`** — **iOS** (chỉ trên macOS, cần Xcode)
- Quét **QR** bằng **Expo Go** (Android/iOS)

Các script khác (trong `package.json`):

```bash
npm run android
npm run ios
npm run web
```

---

## 3. Kết nối app với backend

App gọi API FastAPI. URL mặc định được cấu hình trong `finance-advisor-app/constants/theme.ts`; bạn có thể đổi trong màn **Settings** của app.

| Môi trường | URL gợi ý |
|------------|-----------|
| Web / iOS Simulator | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| Điện thoại thật (cùng Wi‑Fi) | `http://<IP-máy-tính>:8000` (ví dụ `http://192.168.1.10:8000`) |

Sau khi lưu URL trong Settings, dùng **Test** để kiểm tra kết nối.

---

## Tóm tắt lệnh (hai terminal)

**Terminal A — backend:**

```bash
cd finance-advisor
.\.venv\Scripts\Activate.ps1
python tools/seed_db.py
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal B — app:**

```bash
cd finance-advisor-app
npm start
```

Trên Windows, nếu dùng `cmd` thay vì PowerShell, kích hoạt venv bằng `.\.venv\Scripts\activate.bat`.

---

## Gợi ý xử lý sự cố

- **App không gọi được API:** Kiểm tra backend đang chạy, firewall không chặn cổng `8000`, và URL trong Settings khớp với nền tảng (bảng trên).
- **Lỗi khi `npm install`:** Xóa `node_modules` và `package-lock.json` rồi chạy lại `npm install` (chỉ khi cần).
- **Lỗi Gemini / advise:** Xác nhận `GOOGLE_API_KEY` trong `finance-advisor/.env` hợp lệ.

Chi tiết kiến trúc và kế hoạch triển khai: xem `README.md` và `TASK.md` trong repo.
