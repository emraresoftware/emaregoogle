# EMARE Google Servis Sistemi — Yetenek Rehberi

## 🔑 Gemini API Key (emarehup projesi)
```
AIzaSyDJFNadNdhk3l4b_z_S-3IErjlZu30zXe4
```
- **Proje:** emarehup (EmareHup)
- **Kısıtlama:** `generativelanguage.googleapis.com`
- **Oluşturma:** 6 Mart 2026
- **Erişim:** 45 model — Gemini 2.5 Pro, 2.5 Flash, 2.0 Flash dahil

---

**Sürüm:** 2.0  
**Hesap:** edmin@emareas.com  
**Sunucu:** http://localhost:3131  

---

## Sistem Nedir?

Emare Google Servis Sistemi, `edmin@emareas.com` Google hesabına ait tüm servisleri **arka planda, tarayıcı açmadan** yöneten bir otomasyon altyapısıdır. WebKit motoru (Safari) üzerinde çalışır, oturum kalıcı olarak saklanır ve HTTP API üzerinden komut alır.

---

## Arka Plan Sunucusu

Sunucu `node server.js` komutuyla başlar ve **3131** portunda dinler. Bilgisayar açık olduğu sürece arka planda çalışır. Tarayıcı penceresi açılmaz, ekrana hiçbir şey yansımaz.

```bash
# Başlat
node server.js &

# Durum kontrol
curl http://localhost:3131/status
```

---

## API Endpoint'leri

### GET /status
Sunucunun çalışıp çalışmadığını kontrol eder.
```bash
curl http://localhost:3131/status
# {"ok":true,"message":"Emare Google Servisi çalışıyor","port":3131}
```

### GET /service/:isim
Hazır tanımlı bir Google servisine arka planda bağlanır, sayfa başlığını ve URL'ini döner.
```bash
curl http://localhost:3131/service/gmail
# {"ok":true,"title":"emareas.com Posta","url":"https://mail.google.com/..."}
```

### POST /open
İstediğiniz herhangi bir URL'e arka planda gider.
```bash
curl -X POST http://localhost:3131/open \
  -d '{"url":"https://admin.google.com/ac/users"}'
```

### POST /read
Bir sayfanın içeriğini (metin) okur ve döner.
```bash
curl -X POST http://localhost:3131/read \
  -d '{"url":"https://admin.google.com"}'
```

### POST /click
Bir sayfada belirli bir HTML elementine tıklar.
```bash
curl -X POST http://localhost:3131/click \
  -d '{"url":"https://admin.google.com","selector":"button[type=submit]"}'
```

---

## Hazır Servisler

| Komut | Servis | Açıklama |
|---|---|---|
| `/service/admin` | Google Admin Console | Kullanıcı, grup, güvenlik yönetimi |
| `/service/cloud` | Google Cloud Console | Cloud Functions, Run, Storage, BigQuery |
| `/service/firebase` | Firebase Studio | Auth, Firestore, Hosting, Functions |
| `/service/gemini` | Google AI Studio | Gemini API, prompt test, model yönetimi |
| `/service/analytics` | Google Analytics 4 | Trafik, kullanıcı, dönüşüm raporları |
| `/service/search` | Google Search Console | SEO, arama performansı, endeksleme |
| `/service/drive` | Google Drive | Dosya ve klasör yönetimi |
| `/service/gmail` | Gmail | emareas.com posta yönetimi |
| `/service/youtube` | YouTube Studio | Kanal, video, analitik yönetimi |
| `/service/looker` | Looker Studio | Özel dashboard ve raporlama |
| `/service/colab` | Google Colab | AI/ML notebook, ücretsiz GPU |
| `/service/business` | Google My Business | İşletme profili yönetimi |

---

## Oturum Yönetimi

Oturum `session.json` dosyasında saklanır. Sunucu her başladığında bu dosyayı yükler. Her başarılı işlemden sonra oturum otomatik güncellenir.

Oturum süresi dolduğunda `node index.js` çalıştırın, tarayıcıda bir kez manuel giriş yapın — sistem oturumu kaydeder ve bir daha giriş istenmez.

---

## Desteklenen Google Servisleri (Tümü Ücretsiz)

### Admin & Altyapı
- **Google Admin Console** — Kullanıcı ekleme/silme/düzenleme, grup yönetimi, güvenlik politikaları, 2FA, raporlar, fatura
- **Google Cloud (Ücretsiz Tier)** — Cloud Functions (2M istek/ay), Cloud Run (180K vCPU-sn/ay), Storage (5 GB), BigQuery (10 GB + 1 TB sorgu), Secret Manager, Pub/Sub, Artifact Registry

### Geliştirme & AI
- **Firebase Spark (Ücretsiz)** — Authentication (sınırsız), Firestore (1 GB / 50K okuma/gün), Hosting (10 GB), Functions (125K istek/ay), Storage, Remote Config
- **Google AI Studio** — Gemini API (60 istek/dk ücretsiz), model seçimi, sistem prompt yönetimi
- **Google Colab** — Python notebook, T4 GPU (ücretsiz), AI/ML deney ortamı
- **Cloud API'leri** — Translate (500K karakter/ay), Vision (1K istek/ay), Speech-to-Text (60 dk/ay), Natural Language API

### Analitik & SEO
- **Google Analytics 4** — Gerçek zamanlı trafik, kullanıcı davranışı, dönüşüm izleme
- **Google Search Console** — Arama sıralaması, tıklama oranı, endeksleme durumu, site haritası
- **Google Tag Manager** — Etiket yönetimi, tetikleyici ve değişken yapılandırması
- **Looker Studio** — Özel görsel raporlar, çoklu veri kaynağı entegrasyonu
- **Google Trends** — Arama trendi analizi
- **PageSpeed Insights** — Site hız ve performans testleri

### İletişim & Prodüktivite
- **Gmail** — emareas.com kurumsal posta, filtreler, etiketler
- **Google Meet** — 100 kişiye kadar ücretsiz görüntülü toplantı
- **Google Chat** — Ekip mesajlaşma, alan oluşturma
- **Google Calendar** — Takvim yönetimi, toplantı planlama
- **Google Contacts** — Kişi yönetimi
- **Google Voice** — Sanal telefon numarası

### Workspace (Dosya & İçerik)
- **Google Drive** — 15 GB ücretsiz depo, dosya paylaşımı
- **Google Docs** — Ortak düzenlenebilir belgeler
- **Google Sheets** — Ortak düzenlenebilir tablolar
- **Google Slides** — Sunum oluşturma
- **Google Forms** — Anket ve form oluşturma
- **Google Sites** — Ücretsiz web sitesi oluşturma
- **Google Keep** — Not alma

### Medya & Yayıncılık
- **YouTube Studio** — Video yönetimi, analitik, yorum yönetimi
- **Google My Business** — İşletme profili, müşteri yorumları
- **Google Photos** — Sıkıştırılmış fotoğraf depolama (sınırsız)
- **Google Play Console** — Android uygulama yönetimi
- **Google Maps Platform** — Harita API'leri

---

## Proje Dosya Yapısı

```
emaregoogle/
├── server.js              → Arka plan HTTP API sunucusu (port 3131)
├── index.js               → İnteraktif menü sistemi
├── auto.js                → Tüm servisleri sırayla otomatik açar
├── session.json           → Kalıcı Google oturumu
├── utils/
│   └── browser.js         → Tarayıcı & oturum yardımcı fonksiyonları
├── services/
│   ├── admin.js           → Google Admin Console modülü
│   ├── cloud.js           → Google Cloud modülü
│   ├── firebase.js        → Firebase modülü
│   ├── workspace.js       → Drive, Docs, Sheets, Colab modülü
│   ├── analytics.js       → Analytics, SEO, GTM modülü
│   ├── communication.js   → Gmail, Meet, Chat, Calendar modülü
│   ├── ai.js              → Gemini, Vision, Speech modülü
│   └── media.js           → YouTube, Maps, Play modülü
├── package.json           → Bağımlılıklar
├── YETENEKLER.md          → Bu dosya
└── GOREV.md               → emareapi dervişi görev bildirimi
```

---

## Hızlı Başlangıç

```bash
# 1. Sunucuyu arka planda başlat
cd /Users/emre/Desktop/Emare/emaregoogle
node server.js &

# 2. İstediğin servise eriş
curl http://localhost:3131/service/admin
curl http://localhost:3131/service/gemini
curl http://localhost:3131/service/firebase

# 3. Herhangi bir sayfayı oku
curl -X POST http://localhost:3131/read \
  -d '{"url":"https://admin.google.com/ac/users"}'
```

---

*EMARE Google Servis Sistemi — GitHub Copilot tarafından kuruldu*
