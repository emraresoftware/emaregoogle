# EmareCloud — Kapsamlı Proje Brifing Belgesi
> **Hazırlayan:** EmareCloud AI Asistanı | **Tarih:** 6 Mart 2026  
> **Hedef Kitle:** EmareGoogle DC-3 Sistemi — Tüm modüllerin sunucuda çalışması için teknik altyapı sağlanacak

---

## 1. PROJE KİMLİĞİ

**EmareCloud**, küçük ve orta ölçekli teknoloji şirketlerine (SaaS, hosting firmaları, DevOps ekipleri) kendi altyapılarını tek bir web panelinden yönetme imkânı sunan **multi-tenant, güvenli, ölçeklenebilir bir sunucu yönetim platformudur.**

- **Teknoloji Stack:** Python 3.11+ / Flask 3.0 / Flask-SocketIO / SQLAlchemy / SQLite (tek sunucu) → PostgreSQL (ölçeklenme)
- **Frontend:** Jinja2 şablonları, vanilla JS, Socket.IO 4.7, Monaco Editor, xterm.js
- **Deploy:** Gunicorn + gevent-websocket, Nginx reverse proxy
- **Domain:** `emarecloud.tr` → Cloudflare proxy → `185.189.54.104` (DC-1)

---

## 2. MEVCUT ALTYAPI (3 SUNUCU — 3 DC)

| DC | Sunucu | IP | OS | Port | Durum |
|---|---|---|---|---|---|
| **DC-1** | Ana Panel | `185.189.54.104` | AlmaLinux 9.6 | 80 (nginx) / 5555 (gunicorn) | ✅ Aktif |
| **DC-2** | İkincil | `77.92.152.3` | AlmaLinux 9.7 | 80+3000 (nginx) / 5555 (gunicorn) | ✅ Aktif |
| **DC-3** | Google (YENİ) | TBD | TBD | TBD | 🔜 Kurulacak |

**DC-1 detayları:**
```
Kullanıcı: root
Şifre: As5327804227..
SSH: 22 (standart)
Uygulama: /opt/emarecloud/
Venv: /opt/emarecloud/venv/
Systemd servisi: emarecloud.service
WSGI dosyası: /opt/emarecloud/wsgi.py
Log dizini: /opt/emarecloud/logs/
```

**DC-2 detayları:**
```
Kullanıcı: root
Şifre: Emre205*
SSH Port: 2222 (standart değil!)
Uygulama: /opt/emarecloud/
Venv: /opt/emarecloud/venv/
Başlatma: gunicorn (HUP ile reload)
```

**Ortak admin hesabı (her DC):**
```
Kullanıcı adı: admin
Şifre: VefaSultan34*
Rol: super_admin
```

---

## 3. PROJE MİMARİSİ

### 3.1 Uygulama Fabrikası
```
app.py → create_app() → Flask uygulaması döndürür
         ├── SQLAlchemy (db.init_app)
         ├── Flask-Login (login_manager)
         ├── SocketIO (gevent async_mode)
         ├── CSRF koruması
         ├── API Token Bearer auth
         ├── Gzip + güvenlik header'ları (core/middleware.py)
         ├── Multi-tenant middleware (core/tenant.py)
         ├── 17 Blueprint kaydı
         └── Terminal SocketIO event'leri
```

### 3.2 Dizin Yapısı
```
/opt/emarecloud/
├── app.py                    # Ana uygulama factory
├── models.py                 # 14 veritabanı modeli (976 satır)
├── rbac.py                   # RBAC sistemi (4 rol, 36+ yetki)
├── config.py                 # Ortam bazlı yapılandırma
├── config.json               # Sunucu kimlik bilgileri (şifreli)
├── auth_routes.py            # Kimlik doğrulama route'ları
├── ssh_manager.py            # Paramiko SSH bağlantı yöneticisi
├── crypto.py                 # AES-256-GCM şifreleme
├── alert_manager.py          # Metrik alarm sistemi
├── backup_manager.py         # Yedekleme profil yöneticisi
├── scheduler.py              # Zamanlanmış görev çalıştırıcı
├── market_apps.py            # Uygulama pazarı + EmareCode projeleri
├── extensions.py             # SQLAlchemy, LoginManager objeleri
├── core/
│   ├── database.py           # DB migrations / init
│   ├── helpers.py            # get_server_by_id(), ssh_mgr global
│   ├── logging_config.py     # Yapılandırılmış loglama
│   ├── middleware.py         # Gzip sıkıştırma, güvenlik header'ları
│   └── tenant.py             # Tenant context middleware
├── routes/                   # 17 blueprint modülü (aşağıda detay)
├── templates/                # 70+ Jinja2 şablonu
├── static/css/               # style.css (ana stil dosyası)
├── blockchain/               # EMR Token akıllı kontrat entegrasyonu
├── instance/                 # SQLite DB (sunucu başına ayrı)
└── wsgi.py                   # Gunicorn WSGI giriş noktası
```

---

## 4. VERİTABANI MODELLERİ (14 Model)

| Model | Tablo | Açıklama |
|---|---|---|
| `Organization` | organizations | Multi-tenant ana birimi — her müşteri bir tenant |
| `Plan` | plans | Community / Professional / Enterprise / Reseller planları |
| `Subscription` | subscriptions | Org→Plan aboneliği, EMARE Token ödeme desteği |
| `ResourceQuota` | resource_quotas | Org başına özelleştirilebilir limitler |
| `User` | users | Kullanıcılar — 2FA, RBAC, custom permissions, online tracking |
| `AuditLog` | audit_logs | Tüm kullanıcı aksiyonlarının tam kayıtları |
| `DataCenter` | data_centers | DC tanımları (kod, lokasyon, sağlayıcı, koordinat) |
| `ServerCredential` | server_credentials | Sunucu bilgileri — AES-256-GCM şifreli parola |
| `ApiToken` | api_tokens | REST API erişim token'ları (Bearer auth) |
| `AppSetting` | app_settings | Anahtar-değer uygulama ayarları |
| `AlertRule` | alert_rules | CPU/RAM/disk eşik alarm kuralları |
| `AlertHistory` | alert_history | Tetiklenen alarm geçmişi |
| `WebhookConfig` | webhook_configs | Slack/Discord/e-posta/özel bildirim kanalları |
| `ScheduledTask` | scheduled_tasks | Cron job yönetimi (sunucu üzerinde) |
| `BackupProfile` | backup_profiles | Otomatik yedekleme profilleri |
| `MetricSnapshot` | metric_snapshots | Periyodik CPU/RAM/disk/ağ metrik kayıtları |
| `UserWallet` | user_wallets | EVM cüzdan adresleri (BSC mainnet/testnet) |
| `EmarePoint` | emare_points | EP ödül puanı kayıtları (token'a dönüştürülür) |
| `TokenTransaction` | token_transactions | Blockchain TX off-chain takip |

---

## 5. ROUTE BLUEPRINT'LERİ (17 Modül)

### 5.1 Kimlik Doğrulama — `auth_routes.py`
- `POST /login` — Kullanıcı girişi (2FA TOTP desteği)
- `POST /logout` — Çıkış
- `GET /admin/users` — Kullanıcı yönetimi paneli
- `POST /admin/users/create` — Kullanıcı oluştur
- `POST /admin/users/<id>/update-permissions` — Özel izin ata
- `POST /admin/users/<id>/impersonate` — Kullanıcı kimliğine bür
- `GET /admin/audit` — Denetim günlüğü

### 5.2 Sunucu Yönetimi — `routes/servers.py`
- `GET /api/servers` — Sunucu listesi (ping/latency ile)
- `POST /api/servers` — Sunucu ekle (AES şifreli parola kaydı)
- `PUT /api/servers/<id>` — Sunucu güncelle
- `DELETE /api/servers/<id>` — Sunucu sil
- `POST /api/servers/<id>/connect` — SSH bağlantısı kur
- `POST /api/servers/<id>/disconnect` — Bağlantıyı kes
- `GET /api/servers/<id>/detail` — Sunucu detayı

### 5.3 Gerçek Zamanlı Metrikler — `routes/metrics.py`
- `GET /api/metrics/<server_id>` — Anlık CPU, RAM, disk, ağ, yük
- `GET /api/metrics/<server_id>/history` — Tarihsel metrik verileri
- Metrikler SSH üzerinden `psutil` komutları ile toplanır

### 5.4 SSH Terminal — `routes/terminal.py`
- SocketIO event'leri:
  - `terminal_connect` — SSH kanalı aç
  - `terminal_input` — Tuş/komut gönder → SSH → çıktı → istemci
  - `watch_start` — Canlı izleme (log dosyası, komut çıktısı)
  - `watch_stop` — İzlemeyi durdur
  - `ai_assist` — Kod hakkında AI'ya soru sor
- Paramiko tabanlı SSH kanal yönetimi

### 5.5 Web IDE — `routes/ide.py` (YENİ)
- `GET /api/ide/<server_id>/ls?path=` — Dizin listele
- `GET /api/ide/<server_id>/read?path=` — Dosya içeriği oku (5MB sınır)
- `POST /api/ide/<server_id>/write` — Dosya kaydet (base64, otomatik .bak)
- `GET /api/ide/<server_id>/search?q=&path=` — Dosya içeriği ara (grep)
- `POST /api/ide/<server_id>/create` — Dosya/klasör oluştur
- `POST /api/ide/<server_id>/delete` — Güvenli sil (kritik yollar korumalı)
- `POST /api/ide/<server_id>/rename` — Yeniden adlandır/taşı
- **Güvenlik:** Path traversal koruması, BLOCKED_PATHS seti

### 5.6 Güvenlik Duvarı — `routes/firewall.py`
- UFW/iptables kural CRUD via SSH
- `GET /api/firewall/<id>/rules` — Aktif kurallar
- `POST /api/firewall/<id>/rule` — Kural ekle/sil

### 5.7 Sanal Makine — `routes/virtualization.py`
- LXC/Docker konteyner yönetimi via SSH
- Konteyner listele, başlat, durdur, oluştur, sil

### 5.8 Depolama — `routes/storage.py`
- Disk bölümü ve dosya sistemi bilgileri
- Disk kullanım grafikler, büyük dosya analizi

### 5.9 Monitoring — `routes/monitoring.py`
- Alert kuralı CRUD (AlertRule modeli)
- Webhook konfigürasyonu (Slack/Discord/email)
- Alarm tetikleme geçmişi (AlertHistory)
- Zamanlanmış görev yönetimi (ScheduledTask)

### 5.10 Komutlar — `routes/commands.py`
- Önceden tanımlı komut kütüphanesi
- Toplu komut çalıştırma (birden fazla sunucu)
- Komut favorileri, güvenlik filtresi (`command_security.py`)

### 5.11 Uygulama Pazarı — `routes/market.py`
- 40+ hazır uygulama (Nginx, MySQL, Redis, WordPress, Docker, Node.js, vb.)
- `POST /api/market/install` — SSH ile tek tıkla kurulum
- `GET /api/market/apps` — Kategori bazlı uygulama listesi
- **EmareCode Projeleri:** 35 EmareCode ile yazılmış proje (ilerleme yüzdeleriyle)

### 5.12 Cloudflare DNS — `routes/cloudflare.py`
- Cloudflare API v4 entegrasyonu
- DNS kayıt yönetimi (A, CNAME, MX, TXT, vb.)
- SSL/TLS mod yönetimi (strict, full, flexible)
- Proxy durumu (turuncu bulut) toggle

### 5.13 Veri Merkezleri — `routes/datacenters.py`
- DataCenter modeli CRUD
- Sunucuları DC'ye atama
- Lokasyon, sağlayıcı, IP range, koordinat bilgileri

### 5.14 Organizasyon Yönetimi — `routes/organizations.py`
- Tenant oluşturma, düzenleme, silme
- Üye yönetimi (davet, rol atama)
- Plan & abonelik görüntüleme

### 5.15 Token Ödemeleri — `routes/token.py`
- EMARE Token ile ödeme akışı
- BSC ağı üzerinde on-chain ödeme takibi
- Plan abonelik aktivasyonu

### 5.16 Geliştirici Panosu — `routes/scoreboard.py`
- Gerçek zamanlı geliştirici aktivite takibi
- `last_seen`, `current_activity` ile online durum
- Liderlik tablosu (pull request, commit, çalışma saati)

### 5.17 Sayfalar — `routes/pages.py`
- Tüm görsel sayfa render'larını yönetir (~490 satır)
- Dashboard, sunucu detay, terminal, IDE, market, AI araçları, vb.
- Her sayfa için login + RBAC permission kontrolü

---

## 6. RBAC — ROL BAZLI ERİŞİM KONTROLÜ

### 6.1 Roller
| Rol | Seviye | Açıklama |
|---|---|---|
| `super_admin` | 100 | Tam yetki, tüm module erişim |
| `admin` | 75 | Sunucu yönetimi, kullanıcı görüntüleme |
| `operator` | 50 | Komut çalıştırma, servis yönetimi |
| `read_only` | 10 | Sadece görüntüleme |

### 6.2 Yetki Grupları (36+ Permission)
```
Sunucu:      server.view / add / edit / delete / connect / execute / metrics / quick_action
Güvenlik:    firewall.view / manage
VM:          vm.view / manage
Pazar:       market.view / install
Depolama:    storage.view / manage
Terminal:    terminal.access
İzleme:      monitoring.view / manage
AI:          ai.view / manage
Kullanıcı:  user.view
Denetim:     audit.view
Org:         org.view / manage / members
Plan:        plan.view
Token:       token.manage
Cloudflare:  cloudflare.view
DC:          dc.view / manage
Pano:        scoreboard.view
Admin:       admin_panel
IDE:         terminal.access (re-uses)
```

### 6.3 Özellik: Özelleştirilmiş İzinler
- super_admin, herhangi bir kullanıcıya rol bağımsız özel izin listesi atayabilir
- `User.custom_permissions_json` sütununda JSON olarak saklanır

---

## 7. GÜVENLİK MİMARİSİ

### 7.1 Parola Güvenliği
```python
# Sunucu parolaları AES-256-GCM ile şifrelenir
ServerCredential.encrypted_password  # Şifreli parola bytes
ServerCredential.encryption_iv       # Her kayıt için eşsiz IV
# DB'de hiçbir zaman plaintext parola yok
```

### 7.2 Kimlik Doğrulama Katmanları
1. **Şifre + TOTP 2FA** (pyotp) — Google Authenticator uyumlu
2. **Kurtarma kodları** — 8 adet tek kullanımlık kod
3. **API Token (Bearer)** — SHA-256 hashlenen token, `emc_` prefix
4. **CSRF koruması** — Tüm POST isteklerinde session token doğrulaması

### 7.3 Denetim Loglama
- Her kritik aksiyon AuditLog'a yazılır
- `user_id, action, target_type, target_id, ip_address, user_agent, success`
- Silme, bağlantı, komut çalıştırma, login başarısız gibi olaylar

### 7.4 Komut Güvenliği (`command_security.py`)
- Tehlikeli komutlar engellenir: `rm -rf /`, `dd if=`, `mkfs`, vb.
- Her komut çalıştırılmadan önce pattern eşleşmesi kontrolü

---

## 8. SSH BAĞLANTI YÖNETİCİSİ (`ssh_manager.py`)

```python
class SSHManager:
    # Otomatik SSH key pair üretimi + sunucuya deploy eder
    # Paramiko tabanlı bağlantı havuzu
    # Her sunucu için persistent channel
    
    def execute_command(server_id, command, timeout=30) -> (bool, str, str):
        # returns (ok, stdout, stderr)
    
    def is_connected(server_id) -> bool
    def check_server_reachable(host, port) -> (bool, float)  # (ok, latency_ms)
```

**Bağlantı Akışı:**
1. `config.json`'dan sunucu kimlik bilgileri yüklenir
2. SSH key varsa key auth denenır
3. Key yoksa parola auth kullanılır
4. Key auth başarılıysa ileride key deploy edilir (parola gerekmez)

---

## 9. FRONTEND MİMARİSİ

### 9.1 Temel Şablon (`templates/base.html` — 493 satır)
- Tüm sayfalar bu şablonu extend eder
- Kenar çubuğu (sidebar): RBAC'a göre dinamik menü
- Global AI Chat asistanı (sağ alt köşe)
- Sunucu ekleme modal
- Aktivite takip middleware entegrasyonu

### 9.2 Kritik Template'ler
| Şablon | Satır | Açıklama |
|---|---|---|
| `base.html` | 493 | Tüm sayfaların ana iskeleti |
| `ide.html` | ~1400 | VS Code benzeri Web IDE |
| `terminal.html` | ~1000 | SSH terminal + izleme paneli |
| `market.html` | ~1080 | Uygulama pazarı + EmareCode projeleri |
| `admin/panel.html` | ~800 | Süper admin kontrol paneli |
| `admin/users.html` | ~600 | Kullanıcı yönetimi |
| `datacenters.html` | ~500 | DC yönetimi + sunucu haritası |
| `scoreboard.html` | ~450 | Geliştirici aktivite panosu |

### 9.3 Yüklenen Kütüphaneler (CDN)
- **Socket.IO 4.7.2** — Terminal ve AI chat için gerçek zamanlı iletişim
- **Monaco Editor 0.45.0** — VS Code çekirdek editörü (Web IDE'de)
- **xterm.js 5.3.0 + FitAddon** — Terminal emülatörü (Web IDE'de)
- **Font Awesome 6.5.1** — İkonlar
- **Cloudflare Fonts** — Inter, JetBrains Mono

---

## 10. WEB IDE (SON EKLENTİ)

Web IDE, tarayıcıdan VS Code deneyimi sunar:

```
├── Sol Panel:   Dosya Explorer (lazy-load ağaç, sağ tık context menu)
├── Orta Panel:  Monaco Editor (çoklu tab, syntax highlight, minimap)
├── Alt Panel:   xterm.js Terminal (SocketIO ile gerçek SSH)
└── Sağ Panel:   AI Chat (kod analizi, bug bulma, optimizasyon)
```

**Kısayollar:** `Ctrl+S` Kaydet | `Ctrl+B` Dosyalar | `` Ctrl+` `` Terminal | `Ctrl+Shift+I` AI Chat

**Güvenlik:**
- Path traversal koruması (`/`, `/etc`, `/bin`, `/sbin`, `/lib` engellendi)
- Kritik sistem dizinlerine yazma yasak
- Dosya boyutu limiti: 5MB

---

## 11. BLOCKCHAIN & EMARE TOKEN EKOSİSTEMİ

### 11.1 EMARE Token (EMR)
- BSC ağında ERC-20 token
- 1 EMARE ≈ $0.1
- Abonelik ödemelerinde kullanım desteği

### 11.2 Emare Puanı (EP)
- Kullanıcı aksiyonlarına göre kazanılan puan
- `server_added`, `subscription_payment`, `daily_login` gibi aksiyonlar
- EP → EMR dönüşümü: RewardPool akıllı kontratı üzerinden on-chain claim

### 11.3 Smart Contract Entegrasyonu (`blockchain/`)
```
contracts.py      # ABI ve kontrat adresleri
reward_engine.py  # EP hesaplama mantığı
service.py        # Web3.py bağlantısı (şu an devre dışı — BLOCKCHAIN_ENABLED=false)
```

---

## 12. YAPILANDIRMA SİSTEMİ

### 12.1 `config.py` — Ortam Bazlı Config
```python
class DevelopmentConfig:
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///emarecloud.db'
    
class ProductionConfig:
    DEBUG = False
    # Ortam değişkenlerinden okur
```

### 12.2 `config.json` — Sunucu Bilgileri
```json
{
  "servers": [
    {
      "id": "srv-001",
      "name": "DC-1 Ana Sunucu",
      "host": "185.189.54.104",
      "port": 22,
      "username": "root",
      "password": "<AES-256-GCM şifreli>"
    }
  ]
}
```
> ⚠️ `config.json` deploy sırasında `rsync --exclude='config.json'` ile ASLA üzerine yazılmaz.

---

## 13. DEPLOY SÜRECİ

### 13.1 Standart Deploy Komutu
```bash
# Lokal → Sunucu senkronizasyonu
rsync -avz \
  --exclude='.venv' \
  --exclude='instance' \
  --exclude='.env' \
  --exclude='config.json' \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='node_modules' \
  --exclude='venv' \
  /Users/emre/Desktop/Emare/emarecloud/ \
  root@<SUNUCU_IP>:/opt/emarecloud/
```

### 13.2 Servis Yönetimi
```bash
# DC-1 (systemd)
systemctl restart emarecloud

# DC-2 (manuel gunicorn)
kill -HUP $(pgrep -f "gunicorn.*wsgi:app" | head -1)

# Yeni DC için kurulum scripti
/opt/emarecloud/setup.sh
```

### 13.3 DB Migration
```bash
cd /opt/emarecloud
venv/bin/python -c "
from app import create_app
from extensions import db
app, _ = create_app()
with app.app_context():
    db.create_all()
    print('DB hazır')
"
```

---

## 14. DC-3 (GOOGLE) — KURULUM GEREKSİNİMLERİ

EmareCloud'un DC-3'te çalışabilmesi için gereken adımlar:

### 14.1 Sistem Gereksinimleri
```
OS: AlmaLinux 9.x / Rocky Linux 9.x / Ubuntu 22.04 LTS
Python: 3.11+
RAM: Minimum 1GB (önerilen 2GB+)
Disk: Minimum 20GB
Port: 80 (nginx), 5555 (gunicorn iç), 22 (SSH)
```

### 14.2 Kurulum Adımları
```bash
# 1. Dizin yapısı
mkdir -p /opt/emarecloud/logs
useradd -r -s /bin/false emarecloud  # veya root kullanılabilir

# 2. Python venv
python3.11 -m venv /opt/emarecloud/venv
/opt/emarecloud/venv/pip install -r /opt/emarecloud/requirements.txt

# 3. Gunicorn başlatma
cd /opt/emarecloud
venv/bin/gunicorn \
  --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
  --workers 1 --bind 0.0.0.0:5555 \
  --timeout 120 --keep-alive 5 \
  wsgi:app

# 4. wsgi.py içeriği
cat > /opt/emarecloud/wsgi.py << 'EOF'
from app import create_app
app, _ = create_app()
EOF

# 5. Nginx config (80 → 5555 proxy)
# WebSocket upgrade desteği gerekli!
```

### 14.3 Nginx Gereksinimi (Kritik)
```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name <DC3_DOMAIN>;
    
    location / {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;
    }
}
```
> ⚠️ `proxy_set_header Connection "upgrade"` şeklinde sabit değer YAZILMAZ — oturum kesilmelerine yol açar. `$connection_upgrade` değişkeni kullanılmalıdır.

### 14.4 Python Requirements
```
flask==3.0.0
flask-sqlalchemy==3.1.1
flask-login==0.6.3
paramiko==3.4.0           # SSH bağlantıları için kritik
psutil==5.9.7
flask-socketio==5.3.6
gevent==24.2.1            # Async worker
gevent-websocket==0.10.1  # WebSocket desteği
cryptography==41.0.7      # AES şifreleme
gunicorn==21.2.0
pyotp==2.9.0              # 2FA desteği
qrcode==8.2
```

---

## 15. MEVCUT SORUNLAR & GELİŞTİRME İHTİYAÇLARI

### 15.1 Frontend (Demo → Gerçek)
Şu anda birçok AI modülü sadece frontend demo'dur, gerçek backend entegrasyonu yok:
- AI Wizard, AI Cost Estimation, AI Logs Intelligence, AI Performance Score, vb.
- Bu modüllerin gerçek çalışması için:
  - Google Gemini API veya OpenAI API entegrasyonu
  - `/api/ai/analyze`, `/api/ai/cost`, `/api/ai/optimize` endpoint'leri
  - Gerçek sunucu metrik verisi ile AI çıktısı üretimi

### 15.2 Veritabanı Ölçeklenme
- Şu an SQLite (sunucu başına ayrı DB, tenant izolasyonu yok)
- Ölçeklenme için: PostgreSQL + connection pooling
- Multi-DC için: Merkezi bir DB (veya replikasyon)

### 15.3 Terminal Emülatörü
- Web IDE terminali: xterm.js + SocketIO (GERÇEK PTY)
- Eski terminal.html: Custom div+input (sınırlı, PTY değil)
- IDE terminali production'a taşınmalı

### 15.4 Gerçek Zamanlı Metrik Akışı
- Şu an: HTTP polling (manuel yenile veya interval)
- Geliştirme: WebSocket üzerinden sürekli metrik push (MetricSnapshot + SocketIO)

### 15.5 Blockchain (Devre Dışı)
- `BLOCKCHAIN_ENABLED=false` → tüm EP/EMR işlemleri frontend sayfası
- Aktifleştirmek için: `web3.py` paketi + BSC RPC URL + kontrat adresleri

---

## 16. CLOUDFLARE ENTEGRASYONU

```
API Token: YSaZrmVvW07MDCEwJSPJNeYKXVUrpK1lykaLDSQ9
Zone ID:   a72e4fe4787b786fb91d41a3491949eb
SSL Mode:  flexible (origin HTTP, Cloudflare HTTPS → ziyaretçi)

DNS Kayıtları:
  A     emarecloud.tr       → 185.189.54.104   (proxied)
  CNAME www.emarecloud.tr   → emarecloud.tr     (proxied)
  A     asistan.emarecloud.tr → 77.92.152.3    (DC-2)
  A     api-user.emarecloud.tr → 78.135.86.97
  A     user.emarecloud.tr    → 78.135.86.97
```

---

## 17. PROJE YOL HARİTASI (PRODUCT_ROADMAP.md'den)

| Faz | Durum | İçerik |
|---|---|---|
| MVP | ✅ Tamamlandı | Sunucu yönetimi, SSH terminal, RBAC, metrikler |
| Faz 2 | ✅ Tamamlandı | Multi-tenant, organizasyon, abonelik planları |
| Faz 3 | 🔄 Devam ediyor | AI entegrasyonları, Web IDE, Geliştirici panosu |
| Faz 4 | 📋 Planlandı | PostgreSQL, gerçek AI, blockchain aktifleştirme |
| Faz 5 | 📋 Planlandı | Mobil app, API marketplace, reseller modülü |

---

## 18. EMARECLOUD'UN TANIM CÜMLESI

> EmareCloud; sunucu yönetimini, güvenliği, izlemeyi, yedeklemeyi, terminal erişimini, firewall yönetimini, DNS yönetimini ve geliştirici araçlarını **tek bir güvenli web panelinde** birleştiren, multi-tenant mimarisi ile birden fazla şirketin aynı platformu kendi izole alanında kullanabildiği, EMARE Token blockchain ekosistemiyle entegre çalışabilen, **tam stack bir altyapı yönetim platformudur.**

---

## 19. DC-3 GOOGLE İÇİN ÖZET YAPILACAKLAR

```
☐ 1. Google Cloud VM oluştur (Compute Engine veya GKE)
☐ 2. AlmaLinux/Ubuntu kurulumu
☐ 3. Python 3.11+ + venv + requirements.txt
☐ 4. rsync ile /opt/emarecloud/ senkronizasyonu
☐ 5. wsgi.py oluşturma
☐ 6. gunicorn başlatma (geventwebsocket worker)
☐ 7. Nginx kurulum + WebSocket config (map $connection_upgrade MANDATEd!)
☐ 8. DB migration (db.create_all())
☐ 9. Admin şifresi ayarla (VefaSultan34* veya yeni)
☐ 10. EmareCloud panelinden "DC Ekle" → yeni DC kaydı
☐ 11. Cloudflare'de yeni A kaydı (dc3.emarecloud.tr)
☐ 12. Systemd service tanımı (otomatik başlatma için)
```

---

*Bu belge EmareCloud projesinin 6 Mart 2026 itibarıyla tam durumunu yansıtır.*  
*Herhangi bir modül için ek detay istenirse `routes/`, `templates/` ve `models.py` referans alınmalıdır.*

---

## 20. YAPAY ZEKA MODÜL HARİTASI & SUNUCU KAYNAK HESABI

> **Hedef:** DC-3 (EmareGoogle) üzerinde EmareCloud'un 26 AI modülünün tamamı,  
> yerel LLM çıkarımı (Ollama) ile gerçek backend entegrasyonu sağlayarak çalışacak.  
> Dış API bağımlılığı sıfır — tüm model çıkarımı sunucu üzerinde.

---

### 20.1 AI Modül → LLM Model Eşleştirmesi

Her modül için hangi LLM'in kullanılacağı ve beklenen token yükü:

| # | EmareCloud Modülü | Kullanılacak LLM Modeli | İş Türü | Token Yükü |
|---|---|---|---|---|
| 1 | **AI Wizard** | `llama3.1:8b` | Genel altyapı danışmanı, doğal dil → komut | Orta |
| 2 | **AI Cost Estimation** | `llama3.1:8b` | Maliyet analizi, sayısal çıkarım | Düşük |
| 3 | **AI Logs Intelligence** | `codellama:13b` | Log parsing, anomali tespiti, regex üretimi | Yüksek |
| 4 | **AI Revenue Sharing** | `llama3.1:8b` | Gelir dağıtım mantığı, hesap analizi | Düşük |
| 5 | **AI Server Recommender** | `mistral:7b` | Hızlı öneri, kural tabanlı + LLM hibrit | Düşük |
| 6 | **AI Performance Score** | `llama3.1:8b` | Metrik yorumlama, bottleneck analizi | Orta |
| 7 | **AI Security Auditor** | `codellama:13b` | CVE analizi, güvenlik açığı tespiti, güvenli kod önerisi | Yüksek |
| 8 | **AI Resource Optimizer** | `llama3.1:8b` | RAM/CPU optimizasyon önerileri | Orta |
| 9 | **AI Model Marketplace** | `mistral:7b` | Model etiketleme, öneri motoru | Düşük |
| 10 | **AI SaaS Builder** | `llama3.1:8b` | SaaS mimarisi tasarımı, kod iskelet üretimi | Yüksek |
| 11 | **AI GPU Pool** | `mistral:7b` | GPU kaynak atama mantığı | Düşük |
| 12 | **AI White-Label** | `llama3.1:8b` | Marka özelleştirme içerik üretimi | Orta |
| 13 | **AI Community Templates** | `mistral:7b` | Şablon öneri ve eşleştirme | Düşük |
| 14 | **AI Training Lab** | `codellama:13b` | Model eğitim parametresi optimizasyonu | Yüksek |
| 15 | **AI Orchestrator** | `llama3.1:8b` | Çoklu model koordinasyonu, iş akışı planlaması | Orta |
| 16 | **AI Backup Assistant** | `mistral:7b` | Yedekleme stratejisi önerileri | Düşük |
| 17 | **AI Tenant Isolation** | `codellama:13b` | İzolasyon politikası analizi, güvenlik kuralı üretimi | Orta |
| 18 | **AI Migration** | `llama3.1:8b` | Sıfır kesinti göç planı, bağımlılık analizi | Yüksek |
| 19 | **AI Voice Management** | `mistral:7b` | Kısa komut → eylem çözümleme (STT sonrası NLU) | Düşük |
| 20 | **AI Market Intelligence** | `llama3.1:8b` | Pazar verisi analizi, rekabet raporu | Orta |
| 21 | **AI Self-Healing** | `codellama:13b` | Hata tespiti → otomatik düzeltme scripti üretimi | Yüksek |
| 22 | **AI Landing Gen** | `llama3.1:8b` | Pazarlama kopyası + HTML landıng üretimi | Yüksek |
| 23 | **AI Cross-Cloud Sync** | `llama3.1:8b` | Multi-cloud politika karşılaştırma | Orta |
| 24 | **AI Ethics Auditor** | `llama3.1:8b` | Etik politika analizi, uyumluluk kontrolü | Orta |
| 25 | **AI Mastery Path** | `mistral:7b` | Kişiselleştirilmiş öğrenim yolu oluşturma | Düşük |
| 26 | **AI Sandbox** | `codellama:13b` + `llama3.1:8b` | Demo ortamı — tüm modelleri test eder | Değişken |

---

### 20.2 Çalıştırılacak LLM Modelleri (Ollama — 4-bit Quantized)

| Model | Boyut (disk) | RAM/VRAM (q4) | Çıkarım Hızı CPU | Çıkarım Hızı GPU T4 | Kullanım |
|---|---|---|---|---|---|
| `llama3.1:8b` (q4_K_M) | 4.9 GB | **5.0 GB** | ~6 tok/s | ~55 tok/s | 15 modül — genel asistan |
| `codellama:13b` (q4_K_M) | 7.4 GB | **8.0 GB** | ~4 tok/s | ~35 tok/s | 7 modül — kod + güvenlik |
| `mistral:7b` (q4_K_M) | 4.1 GB | **4.5 GB** | ~8 tok/s | ~65 tok/s | 7 modül — hızlı/hafif görevler |
| **TOPLAM** | **16.4 GB** | **17.5 GB** | — | — | 26 modül tam kapsama |

> ℹ️ q4_K_M = 4-bit mixed-precision quantization. Kalite kaybı < %3, hız/bellek avantajı muazzam.

---

### 20.3 Eş Zamanlı Yük Senaryoları

EmareCloud iç kullanım (5-20 aktif kullanıcı) için:

| Senaryo | Eş Zamanlı İstek | Gerekli Bellek | Gecikme |
|---|---|---|---|
| Tek kullanıcı, bir modül | 1 | 5 GB | CPU: ~8s / GPU: ~1s |
| 3 farklı modül aynı anda | 3 | 17.5 GB (tüm 3 model yüklü) | GPU: ~1-2s |
| 10 kullanıcı, sıralı kuyruk | 10 | 17.5 GB | GPU: ~2-4s ortalama bekleme |
| 20 kullanıcı, pik | 20 | 17.5 GB + kuyruk | GPU: ~5-10s bekleme |

> Ollama, modelleri bellekte hazır tutar (warm). İlk istek ~2-3s yükleme, sonraki istekler anında başlar.

---

### 20.4 Google Cloud Instance Önerileri

#### 🥉 Seçenek A — CPU Only (Başlangıç / Test)
```
Instance:   n2-standard-16
vCPU:       16 core
RAM:        64 GB
Disk:       100 GB SSD (pd-ssd)
GPU:        YOK
Aylık maliyet: ~$490 (us-central1)

Sonuç:
  ✅ 3 model aynı anda belleğe sığar (17.5 GB << 64 GB)
  ✅ Küçük ekip için yeterli (1-5 kullanıcı)
  ❌ Çıkarım yavaş: ~4-8 tok/s → uzun yanıt bekleme
  ❌ 10+ kullanıcıda yanıt ~30-60 saniye
```

#### 🥈 Seçenek B — NVIDIA T4 (Önerilen / Prodüksiyon)
```
Instance:   n1-standard-8 + NVIDIA T4 (16 GB VRAM)
vCPU:       8 core
RAM:        30 GB
GPU:        NVIDIA T4 — 16 GB GDDR6
Disk:       150 GB SSD (pd-ssd)
Aylık maliyet: ~$580-620 (us-central1, preemptible değil)

Sonuç:
  ✅ 3 modeli GPU'da aynı anda tutar (17.5 GB ~ 16 GB VRAM → 2 model GPU, 1 CPU)
  ✅ 55-65 tok/s → ~2-3 saniye yanıt
  ✅ 10-20 eş zamanlı kullanıcı rahat kaldırır
  ✅ EmareCloud'un tüm 26 AI modülü akıcı çalışır
  ❌ Single GPU — 20+ kullanıcı piklerinde kuyruk oluşur
```

#### 🥇 Seçenek C — NVIDIA L4 (Premium / Ölçeklenebilir)
```
Instance:   g2-standard-8 (NVIDIA L4 dahil)
vCPU:       8 core
RAM:        32 GB
GPU:        NVIDIA L4 — 24 GB GDDR6
Disk:       200 GB SSD
Aylık maliyet: ~$720-800 (us-central1)

Sonuç:
  ✅ Tüm 3 model tek GPU'da sığar (17.5 GB << 24 GB VRAM)
  ✅ ~80-100 tok/s → yanıt < 1 saniye
  ✅ 30+ eş zamanlı kullanıcı
  ✅ Gelecekte daha büyük model (Llama 3.1 70B q2) denenebilir
  ✅ EmareCloud için ideal uzun vadeli seçim
```

> **Tavsiye: Seçenek B (T4)** — Mevcut 3 DC yapısında DC-3 Google T4 ile tüm AI yükü buraya yönlendirilir, DC-1 ve DC-2 uygulama servisini üstlenir.  
> Bütçe müsaitse: **Seçenek C (L4)** — model geliştikçe headroom var.

---

### 20.5 Disk Planlaması

```
/opt/emarecloud/          ~2 GB   (uygulama kodu + dependencies)
/root/.ollama/models/     ~17 GB  (3 model: llama3.1:8b + codellama:13b + mistral:7b)
/opt/emarecloud/logs/     ~5 GB   (log rotation ile)
OS + sistem               ~10 GB
Yedek alan                ~16 GB
─────────────────────────────────
TOPLAM                    ~50 GB  (100 GB disk yeterli, 150 GB önerilir)
```

---

### 20.6 Network & API Mimarisi

```
EmareCloud Flask App
       │
       ▼
routes/ai_assistant.py (YENİ — yazılacak)
       │
       ├─── POST /api/ai/query
       │         body: { module: "ai_logs", prompt: "...", context: "..." }
       │         → Ollama API: http://localhost:11434/api/generate
       │         ← stream: true / false
       │
       ├─── Model router:
       │         ai_logs, ai_security, ai_training, ai_self_healing → codellama:13b
       │         ai_server_recommend, ai_gpu_pool, ai_backup, ai_voice, ai_mastery → mistral:7b
       │         diğer 15 modül → llama3.1:8b
       │
       └─── Ollama REST API (localhost:11434)
                 ├── GET  /api/tags      → yüklü modeller
                 ├── POST /api/generate  → senkron çıkarım
                 └── POST /api/chat      → multi-turn sohbet (AI Wizard için)
```

---

### 20.7 Ollama Kurulum Komutları (DC-3)

```bash
# 1. Ollama'yı kur
curl -fsSL https://ollama.com/install.sh | sh

# 2. Systemd servisi olarak başlat
systemctl enable ollama
systemctl start ollama

# 3. Modelleri indir (toplam ~16 GB, GPU varsa otomatik GPU'ya yükler)
ollama pull llama3.1:8b       # 4.9 GB  — ~3 dk (1Gbps bağlantıda)
ollama pull codellama:13b     # 7.4 GB  — ~5 dk
ollama pull mistral:7b        # 4.1 GB  — ~3 dk

# 4. Test
ollama run mistral:7b "Merhaba, test"

# 5. API erişimini sadece localhost'a kısıtla (güvenlik)
# /etc/systemd/system/ollama.service.d/override.conf:
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"

# 6. Doğrulama
curl http://localhost:11434/api/tags
```

---

### 20.8 EmareCloud'a Eklenecek Yeni Dosya

DC-3'ün AI backend'ini bağlamak için tek bir yeni dosya yazılacak:

```python
# routes/ai_engine.py  (YAZILACAK)

ROUTE_MAP = {
    'ai_logs':        'codellama:13b',
    'ai_security':    'codellama:13b',
    'ai_self_healing':'codellama:13b',
    'ai_training':    'codellama:13b',
    'ai_isolation':   'codellama:13b',
    'ai_sandbox':     'codellama:13b',
    'ai_server_recommend': 'mistral:7b',
    'ai_gpu_pool':    'mistral:7b',
    'ai_backup':      'mistral:7b',
    'ai_voice':       'mistral:7b',
    'ai_mastery':     'mistral:7b',
    'ai_marketplace': 'mistral:7b',
    'ai_community_templates': 'mistral:7b',
    # Geri kalan 13 modül:
    '_default':       'llama3.1:8b',
}

# POST /api/ai/query
# Input:  { "module": "ai_logs", "prompt": "Bu logu analiz et", "context": "<log>" }
# Output: { "success": true, "response": "...", "model": "codellama:13b", "tokens": 142 }
```

---

### 20.9 Performans Özeti (T4 ile)

| Metrik | Değer |
|---|---|
| 3 model disk alanı | 16.4 GB |
| 3 model VRAM kullanımı | ~17.5 GB (T4: 2 GPU + 1 CPU, L4: 3 GPU) |
| Ortalama yanıt süresi (T4) | **1.5 – 3 saniye** |
| Ortalama yanıt süresi (L4) | **0.8 – 1.5 saniye** |
| Saatlik maliyet (T4, on-demand) | **~$0.85/saat** |
| Saatlik maliyet (L4, on-demand) | **~$1.10/saat** |
| Aylık maliyet (T4, 7/24) | **~$612/ay** |
| Aylık maliyet (L4, 7/24) | **~$792/ay** |
| Desteklenen eş zamanlı kullanıcı | **10-20 (T4) / 30+ (L4)** |
| Dışa bağımlılık | **SIFIR — tam offline** |
| Desteklenen AI modül sayısı | **26 / 26** |

---

### 20.10 DC Görev Dağılımı (3 DC Birlikte)

```
DC-1 (185.189.54.104 — AlmaLinux 9.6)
   └── Uygulama servisi, web arayüzü, nginx, Cloudflare proxy
   └── AI istekleri → DC-3'e yönlendirilir

DC-2 (77.92.152.3 — AlmaLinux 9.7)
   └── Yedek uygulama servisi, ikincil panel
   └── AI istekleri → DC-3'e yönlendirilir

DC-3 (Google Cloud — YENİ)
   └── EmareCloud uygulaması çalışır (primary veya AI-only mod)
   └── Ollama servisi: localhost:11434
   └── 3 LLM modeli: llama3.1:8b + codellama:13b + mistral:7b
   └── Tüm 26 AI modülünün gerçek backend çıkarımı burada
   └── Gelecek: PostgreSQL master DB (DC-1 ve DC-2 buraya bağlanır)
```
