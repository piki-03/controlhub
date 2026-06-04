# ControlHub

Aplikasi web kontrol relay ESP32/ESP8266 menggunakan Cloudflare Pages + Pages Functions + KV.

## Struktur Project

```
CONTROLHUB/
├── index.html              ← Web UI
├── style.css               ← Styling
├── script.js               ← Logic web
├── functions/
│   └── api/
│       ├── relay.js        ← POST /api/relay (simpan state)
│       └── state.js        ← GET  /api/state (baca state)
└── hardware/
    └── esp32_controlhub.ino ← Kode Arduino
```

## Setup Cloudflare

### 1. Buat KV Namespace
- Masuk ke Cloudflare Dashboard → Workers & Pages → KV
- Klik **Create namespace**
- Nama: `RELAY_STATE`

### 2. Deploy ke Cloudflare Pages
- Masuk ke Workers & Pages → Pages → **Create a project**
- Pilih **Connect to Git** → pilih repo ini
- **Framework preset**: None
- **Build command**: (kosongkan)
- **Build output directory**: `/` (root)
- Klik **Save and Deploy**

### 3. Bind KV ke Pages
- Buka project Pages kamu
- Pergi ke **Settings** → **Functions** → **KV namespace bindings**
- Klik **Add binding**
  - Variable name: `RELAY_STATE`
  - KV namespace: pilih `RELAY_STATE` yang tadi dibuat
- Klik **Save** lalu **Redeploy**

### 4. Update Kode ESP32
Buka `hardware/esp32_controlhub.ino`, ubah:
```cpp
const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_KAMU";
const char* STATE_URL     = "https://namamu.pages.dev/api/state";
```

## Library Arduino yang Dibutuhkan
- **ArduinoJson** by Benoit Blanchon (versi 6.x)
  - Install via Arduino IDE → Library Manager

## Endpoint API

| Method | Endpoint      | Keterangan             |
|--------|--------------|------------------------|
| GET    | /api/state   | Baca semua state relay |
| POST   | /api/relay   | Ubah state satu relay  |

### Contoh POST /api/relay
```json
{ "relay": 1, "state": "on" }
```

### Contoh response GET /api/state
```json
{
  "relay_1": "on",
  "relay_2": "off",
  "relay_3": "off",
  "relay_4": "on",
  "relay_5": "off",
  "relay_6": "off",
  "relay_7": "off",
  "relay_8": "off"
}
```
