# Finance Advisor Application

Quickstart guide to run the **FastAPI backend** and **Expo (React Native) app** on your local machine.

## Prerequisites

| Component | Notes |
|-----------|-------|
| **Node.js** | LTS version (18.x or newer recommended) |
| **npm** | Included with Node |
| **Python** | 3.10+ (3.11+ recommended) |
| **Device / Emulator** | Optional: [Expo Go](https://expo.dev/go) on a physical phone, Android Emulator, iOS Simulator, or a web browser |

---

## 1. Backend (FastAPI)

Open a terminal at the repository root and navigate to the `finance-advisor` directory:

```bash
cd finance-advisor
```

### Python Environment

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

### Environment Variables

Copy `.env.example` to `.env` and fill in your **Google Gemini API key** (obtainable at [Google AI Studio](https://aistudio.google.com/apikey)):

```bash
copy .env.example .env
```

Update `GOOGLE_API_KEY` in `.env` — do not commit the `.env` file.

### Data Initialization and Running the Server

Before running for the first time, generate mock banking data:

```bash
python tools/seed_db.py
```

Then, start the server (listening on all interfaces so the mobile app/emulator can connect to your machine):

```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

Quick check: open your browser at `http://localhost:8000/docs` (Swagger UI) or `GET /health`.

Keep this terminal running while using the app.

---

## 2. Frontend (Expo)

Open a **new terminal** from the repository root:

```bash
cd finance-advisor-app
npm install
npm start
```

The `npm start` command opens **Expo Dev Tools**. You can:

- Press **`w`** — to run on **web**
- Press **`a`** — for **Android** (requires emulator or device)
- Press **`i`** — for **iOS** (macOS only, requires Xcode)
- Scan the **QR code** using **Expo Go** (Android/iOS)

Other scripts (in `package.json`):

```bash
npm run android
npm run ios
npm run web
```

---

## 3. Connecting the App to the Backend

The app calls the FastAPI backend. Default URLs are configured in `finance-advisor-app/constants/theme.ts`; you can change this in the app's **Settings** screen.

| Environment | Suggested URL |
|-------------|---------------|
| Web / iOS Simulator | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| Physical Phone (same Wi‑Fi) | `http://<Computer-IP>:8000` (e.g. `http://192.168.1.10:8000`) |

After saving the URL in Settings, use **Test** to verify the connection.

---

## Command Summary (Two Terminals)

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

On Windows, if using `cmd` instead of PowerShell, activate the venv with `.\.venv\Scripts\activate.bat`.

---

## Troubleshooting Tips

- **App cannot call API:** Ensure the backend is running, the firewall is not blocking port `8000`, and the URL in Settings matches your platform (see table above).
- **Errors during `npm install`:** Delete `node_modules` and `package-lock.json`, then re-run `npm install` (only if necessary).
- **Gemini / advise errors:** Verify that the `GOOGLE_API_KEY` in `finance-advisor/.env` is valid.
