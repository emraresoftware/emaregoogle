# 📋 Görev Bildirimi — emareapi Dervişi'ne

**Tarih:** 6 Mart 2026  
**Gönderen:** GitHub Copilot (Otomasyon Sistemi)  
**Alıcı:** emareapi Dervişi  

---

## 🔔 Bildirim

Emare Dervişleri'nin tüm **ücretsiz Google servis ihtiyaçları** artık bu otomasyon sistemi üzerinden yönetilmektedir.

---

## ✅ Desteklenen Tüm Ücretsiz Google Servisleri

### 1. Google Admin Console
| Özellik | Durum |
|---|---|
| Kullanıcı yönetimi | ✅ |
| Grup & organizasyon | ✅ |
| Güvenlik & 2FA | ✅ |
| Raporlar | ✅ |

### 2. Google Cloud (Ücretsiz Tier)
| Servis | Ücretsiz Limit |
|---|---|
| Cloud Functions | 2M istek/ay |
| Cloud Run | 180K vCPU-saniye/ay |
| Cloud Storage | 5 GB |
| BigQuery | 10 GB depo + 1 TB sorgu/ay |

### 3. Firebase (Spark — Ücretsiz Plan)
| Servis | Ücretsiz Limit |
|---|---|
| Authentication | Sınırsız |
| Firestore | 1 GB depo, 50K okuma/gün |
| Hosting | 10 GB depo, 360 MB/gün bant |
| Functions | 125K istek/ay |

### 4. Google Workspace (Ücretsiz)
- ✅ Google Drive (15 GB)
- ✅ Google Docs, Sheets, Slides, Forms
- ✅ Google Sites
- ✅ Google Keep
- ✅ Google Colab (GPU destekli notebook)

### 5. Analytics & SEO
- ✅ Google Analytics 4
- ✅ Google Search Console
- ✅ Google Tag Manager
- ✅ Looker Studio
- ✅ Google Trends
- ✅ PageSpeed Insights

### 6. İletişim
- ✅ Gmail
- ✅ Google Meet (100 kişiye kadar ücretsiz)
- ✅ Google Chat
- ✅ Google Calendar
- ✅ Google Contacts
- ✅ Google Voice

### 7. Google AI (Ücretsiz Tier)
- ✅ Google AI Studio / Gemini API (60 istek/dak ücretsiz)
- ✅ Google Colab (T4 GPU ücretsiz)
- ✅ Translate API (500K karakter/ay)
- ✅ Natural Language API (5K birim/ay)
- ✅ Vision API (1K istek/ay)
- ✅ Speech-to-Text (60 dak/ay)

### 8. Medya & Yayıncılık
- ✅ YouTube Studio
- ✅ Google My Business
- ✅ Google Photos (sıkıştırılmış, sınırsız)
- ✅ Google Play Console

---

## 🚀 Kullanım

```bash
cd /Users/emre/Desktop/Emare/emaregoogle
node index.js
```

---

## 📁 Proje Yapısı

```
emaregoogle/
├── index.js                → Ana menü sistemi
├── session.json            → Aktif Google oturumu
├── utils/
│   └── browser.js          → Tarayıcı & oturum yönetimi
├── services/
│   ├── admin.js            → Google Admin Console
│   ├── cloud.js            → Google Cloud
│   ├── firebase.js         → Firebase Studio
│   ├── workspace.js        → Drive, Docs, Sheets…
│   ├── analytics.js        → Analytics, SEO, GTM
│   ├── communication.js    → Gmail, Meet, Chat…
│   ├── ai.js               → Gemini, Colab, Vision…
│   └── media.js            → YouTube, Maps, Play…
└── GOREV.md                → Bu dosya
```

---

> **Not:** Oturum `session.json` dosyasında saklanır. Süresi dolunca tek seferlik manuel giriş yeterlidir.

---

*— GitHub Copilot Otomasyon Sistemi — emareapi Dervişi için*
