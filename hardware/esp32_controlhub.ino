// ============================================================
//  ControlHub — Kode ESP32 / ESP8266
//  Polling state relay dari Cloudflare Pages Functions
//  Library yang dibutuhkan (install via Library Manager):
//    - ArduinoJson by Benoit Blanchon (versi 6.x)
// ============================================================

// ===== PILIH BOARD =====
// Uncomment sesuai board yang kamu pakai:

#define BOARD_ESP32    // pakai ini jika ESP32
// #define BOARD_ESP8266  // pakai ini jika ESP8266

#ifdef BOARD_ESP32
  #include <WiFi.h>
  #include <HTTPClient.h>
  #include <WiFiClientSecure.h>
#endif

#ifdef BOARD_ESP8266
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
  #include <WiFiClientSecureBearSSL.h>
#endif

#include <ArduinoJson.h>

// ===== KONFIGURASI — WAJIB DIISI =====
const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_KAMU";
const char* STATE_URL     = "https://namamu.pages.dev/api/state"; // ganti dengan domain kamu

// ===== PIN RELAY =====
// Sesuaikan dengan wiring kamu
// Indeks 0 = relay 1, indeks 7 = relay 8
// Relay biasanya ACTIVE LOW (HIGH = mati, LOW = nyala)
// Ubah RELAY_ACTIVE_LOW = false jika relay kamu ACTIVE HIGH
const bool RELAY_ACTIVE_LOW = true;

#ifdef BOARD_ESP32
  const int RELAY_PINS[8] = {26, 27, 14, 12, 13, 15, 2, 4};
#endif

#ifdef BOARD_ESP8266
  const int RELAY_PINS[8] = {D1, D2, D3, D4, D5, D6, D7, D8};
#endif

// ===== INTERVAL POLLING =====
const unsigned long POLL_MS = 2000; // 2 detik

// ===== STATE LOKAL =====
bool relayState[8] = {false, false, false, false, false, false, false, false};
unsigned long lastPoll = 0;

// ============================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== ControlHub ESP ===");

  // Init semua pin relay
  for (int i = 0; i < 8; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    setRelay(i, false); // mulai semua OFF
  }

  connectWiFi();
}

// ============================================================
void loop() {
  // Reconnect WiFi jika putus
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Putus, reconnecting...");
    connectWiFi();
    return;
  }

  // Polling setiap POLL_MS
  if (millis() - lastPoll >= POLL_MS) {
    lastPoll = millis();
    fetchAndApply();
  }
}

// ============================================================
void connectWiFi() {
  Serial.printf("[WiFi] Menghubungkan ke %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 30) {
    delay(500);
    Serial.print(".");
    attempt++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Terhubung! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Gagal terhubung, coba lagi 5 detik...");
    delay(5000);
  }
}

// ============================================================
void fetchAndApply() {
  // Cloudflare pakai HTTPS, kita skip verifikasi sertifikat
  // (untuk produksi sebaiknya tambahkan root CA)

#ifdef BOARD_ESP32
  WiFiClientSecure client;
  client.setInsecure(); // skip SSL verify
  HTTPClient http;
  http.begin(client, STATE_URL);
#endif

#ifdef BOARD_ESP8266
  BearSSL::WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, STATE_URL);
#endif

  http.setTimeout(5000);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.printf("[HTTP] OK: %s\n", payload.c_str());
    parseAndApply(payload);
  } else {
    Serial.printf("[HTTP] Error: %d\n", httpCode);
  }

  http.end();
}

// ============================================================
void parseAndApply(String json) {
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, json);

  if (err) {
    Serial.printf("[JSON] Parse error: %s\n", err.c_str());
    return;
  }

  for (int i = 0; i < 8; i++) {
    String key = "relay_" + String(i + 1);
    if (doc.containsKey(key)) {
      bool on = strcmp(doc[key], "on") == 0;
      if (on != relayState[i]) {
        relayState[i] = on;
        setRelay(i, on);
        Serial.printf("[Relay] R%d → %s\n", i + 1, on ? "ON" : "OFF");
      }
    }
  }
}

// ============================================================
void setRelay(int index, bool on) {
  // ACTIVE_LOW: LOW = nyala, HIGH = mati
  // ACTIVE_HIGH: HIGH = nyala, LOW = mati
  int level;
  if (RELAY_ACTIVE_LOW) {
    level = on ? LOW : HIGH;
  } else {
    level = on ? HIGH : LOW;
  }
  digitalWrite(RELAY_PINS[index], level);
}
