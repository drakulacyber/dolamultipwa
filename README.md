# Dola Multi Browser & Skill Hub (Progressive Web App) 🚀

Aplikasi **Progressive Web App (PWA)** yang dapat diinstal langsung di desktop (Windows/macOS/Linux) maupun smartphone via browser modern (Chrome, Edge, Safari, Brave), serta di-hosting gratis 100% menggunakan **GitHub Pages**.

## ✨ Fitur Unggulan
- 📱 **PWA Installable**: Tombol *Install Application* langsung muncul di bilah atas saat dibuka di Chrome atau Microsoft Edge.
- ⚡ **Split-Screen Workspace**: Membuka Google AI Studio dan Dola.com secara berdampingan.
- 🎚️ **Draggable Divider & Preset**: Atur rasio split (50:50, 70:30, 30:70) secara mulus.
- 🧩 **Dola Skill Hub**: Simpan, pratinjau, import file `SKILL.md`, dan salin instruksi dalam 1-klik via LocalStorage.
- 🔌 **Extension Connector**: Panduan dan integrasi MCP Server Dola.
- 🌐 **Deploy Otomatis via GitHub Pages**: Dilengkapi file `.github/workflows/deploy.yml` untuk auto-deploy ke domain `https://<username>.github.io/<repo-name>/`.

## 🚀 Cara Pasang ke GitHub Pages

1. Buat repositori baru di GitHub (misal: `dola-multi-pwa`).
2. Masukkan remote url dan push kode:
   ```bash
   cd C:\Users\ASUS\.gemini\antigravity\scratch\dola-multi-pwa
   git remote add origin https://github.com/<username>/dola-multi-pwa.git
   git branch -M main
   git push -u origin main
   ```
3. Di GitHub: buka tab **Settings** -> **Pages** -> Source: pilih **GitHub Actions**.
4. Tunggu workflow selesai, lalu buka URL web Anda dan klik tombol **Install** di browser!
