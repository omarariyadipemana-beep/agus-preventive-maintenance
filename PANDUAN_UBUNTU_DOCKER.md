# Panduan Lengkap Deploy Docker di Ubuntu 26.04 LTS
================================================================================
Aplikasi: **Preventive Maintenance System (QMS-0039442 v2.6.0)**  
Target OS: **Ubuntu 26.04 LTS (Noble Numbat / Server Linux)**  
Metode: **Docker Compose (Containerized Node.js + SQLite Persistent)**

---

## DAFTAR ISI
1. [Langkah 1: Install Docker & Docker Compose di Ubuntu](#langkah-1-install-docker--docker-compose-di-ubuntu)
2. [Langkah 2: Salin / Clone Projek ke Server Ubuntu](#langkah-2-salin--clone-projek-ke-server-ubuntu)
3. [Langkah 3: Konfigurasi File Environment (.env)](#langkah-3-konfigurasi-file-environment-env)
4. [Langkah 4: Jalankan Aplikasi via Docker Compose](#langkah-4-jalankan-aplikasi-via-docker-compose)
5. [Langkah 5: Verifikasi & Akses Aplikasi di Browser](#langkah-5-verifikasi--akses-aplikasi-di-browser)
6. [Backup & Restore Database SQLite](#backup--restore-database-sqlite)
7. [Perintah Operasional Harian](#perintah-operasional-harian)
8. [Opsional: Nginx Reverse Proxy & SSL (HTTPS)](#opsional-nginx-reverse-proxy--ssl-https)

---

## Langkah 1: Install Docker & Docker Compose di Ubuntu

Buka terminal SSH server Ubuntu 26.04 LTS Anda, lalu jalankan perintah berikut:

```bash
# 1. Update paket sistem
sudo apt update && sudo apt upgrade -y

# 2. Install dependensi dasar
sudo apt install -y ca-certificates curl gnupg lsb-release

# 3. Install Docker Engine & Docker Compose Plugin resmi
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Berikan izin user saat ini agar bisa menjalankan docker tanpa 'sudo'
sudo usermod -aG docker $USER

# Aktifkan perubahan grup (atau logout lalu login SSH kembali)
newgrp docker

# 5. Verifikasi versi docker
docker --version
docker compose version
```

---

## Langkah 2: Salin / Clone Projek ke Server Ubuntu

Pilih salah satu metode berikut:

### Opsi A: Menggunakan Git Clone (Paling Praktis)
```bash
# Masuk ke direktori web/projek (misal /opt atau folder home)
cd /opt  # atau cd ~

# Clone repository dari GitHub
git clone https://github.com/omarariyadipemana-beep/agus-preventive-maintenance.git agus_mantenance

# Masuk ke folder projek
cd agus_mantenance
```

### Opsi B: Transfer Manual dari Komputer Lokal via SCP
Dari komputer lokal Anda (PowerShell / Terminal):
```powershell
scp -r "c:\Users\Mustofa\agus_mantenance" user@ip-server-ubuntu:/home/user/
```

---

## Langkah 3: Konfigurasi File Environment (.env)

Di dalam folder projek `agus_mantenance` di server Ubuntu, salin template environment:

```bash
cp .env.docker.example .env
```

Jika ingin mengubah port atau kunci rahasia token, buka file `.env`:
```bash
nano .env
```

Isi default `.env`:
```env
# Port aplikasi di server Ubuntu (default: 3001)
# Ubah misal APP_PORT=80 jika ingin langsung dibuka di port web standar tanpa :3001
APP_PORT=3001

# Kunci rahasia token PIN (ganti dengan teks acak bebas untuk produksi)
AUTH_SECRET=rahasia-super-aman-agus-pm-2026-salt

# CORS: izinkan akses dari seluruh IP di jaringan LAN pabrik
ALLOWED_ORIGINS=*
```

Simpan dengan menekan `Ctrl + O`, `Enter`, lalu keluar dengan `Ctrl + X`.

---

## Langkah 4: Jalankan Aplikasi via Docker Compose

Cukup jalankan satu perintah ini:

```bash
docker compose up -d --build
```

Docker akan:
1. Men-download base image Node.js 20 LTS Debian Bookworm.
2. Mengompilasi library native `better-sqlite3` secara otomatis di dalam container builder.
3. Menyiapkan folder penyimpanan database persisten `./data`.
4. Menjalankan service di background (`-d`).

Untuk melihat status container:
```bash
docker compose ps
```
*Pastikan statusnya `Up` atau `Up (healthy)`*.

Untuk memantau log aplikasi secara realtime:
```bash
docker compose logs -f
```
*(Tekan `Ctrl + C` untuk keluar dari tampilan log)*.

---

## Langkah 5: Verifikasi & Akses Aplikasi di Browser

Buka browser di laptop, tablet, atau smartphone teknisi yang terhubung ke jaringan:

- URL: **`http://<IP_SERVER_UBUNTU>:3001`**  
  *(Contoh: `http://192.168.1.100:3001` atau `http://localhost:3001`)*

### Kredensial Akses PIN:
- **PIN Teknisi / User**: `2323` (Hak akses input inspeksi baru & lihat riwayat)
- **PIN Supervisor / Admin**: `3434` (Hak akses Dashboard, hapus data & export laporan)

---

## Backup & Restore Database SQLite

Karena menggunakan volume mounting `./data:/app/data`, seluruh database SQLite tersimpan aman langsung di folder host Ubuntu `./data/database.sqlite`. Data **TIDAK AKAN HILANG** meskipun container di-stop, di-restart, atau di-rebuild!

### Cara Backup Manual:
```bash
# Salin file database ke folder backup dengan timestamp tanggal
mkdir -p ~/backup_pm
cp ./data/database.sqlite ~/backup_pm/database_$(date +%Y%m%d_%H%M%S).sqlite
```

### Cara Backup Otomatis Setiap Tengah Malam (Cron Job):
```bash
crontab -e
```
Tambahkan baris berikut di paling bawah:
```cron
0 0 * * * cp /opt/agus_mantenance/data/database.sqlite /home/user/backup_pm/database_$(date +\%Y\%m\%d).sqlite
```

### Cara Restore Database:
```bash
# 1. Hentikan container
docker compose down

# 2. Salin file cadangan menimpa database aktif
cp ~/backup_pm/database_20261104.sqlite ./data/database.sqlite

# 3. Jalankan kembali container
docker compose up -d
```

---

## Perintah Operasional Harian

| Kebutuhan | Perintah di Terminal Ubuntu |
| :--- | :--- |
| **Melihat Log Aplikasi** | `docker compose logs -f` |
| **Melihat Status Service** | `docker compose ps` |
| **Restart Aplikasi** | `docker compose restart` |
| **Menghentikan Aplikasi** | `docker compose down` |
| **Update Kode Terbaru dari Git** | `git pull && docker compose up -d --build` |
| **Cek Penggunaan CPU/Memori** | `docker stats agus_pm_app` |

---

## Opsional: Nginx Reverse Proxy & SSL (HTTPS)

Jika Anda memiliki domain pabrik (misal: `pm.pabrikku.co.id`) dan ingin menggunakan HTTPS:

1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```
2. Buat file konfigurasi `/etc/nginx/sites-available/pm`:
   ```nginx
   server {
       listen 80;
       server_name pm.pabrikku.co.id; # Ganti dengan domain atau IP publik Anda

       client_max_body_size 20M;

       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Aktifkan dan restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pm /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
4. Pasang SSL gratis Let's Encrypt:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d pm.pabrikku.co.id
   ```

Aplikasi kini dapat diakses secara aman via **https://pm.pabrikku.co.id**!

