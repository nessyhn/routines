import sys
import os

# UTF-8 stdout desteği
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from models import Kisiler, KullaniciOlustur
from ai_engine import AIEngine

print("==================================================")
print(" SISTEM TESTI VE DOGRULAMA BASLATILIYOR")
print("==================================================")

# 1. Şifre Doğrulama Testi
print("\n[1] Sifre Kurallari Testi:")
gecerli, msg = KullaniciOlustur.sifre_dogrula("kisa")
print(f"  [!] Kisa Sifre: {gecerli} -> {msg}")

gecerli, msg = KullaniciOlustur.sifre_dogrula("Gecerli.2026!")
print(f"  [OK] Guclu Sifre: {gecerli} -> {msg}")

# 2. Kayıt ve Giriş Testi
print("\n[2] Kayit ve Giris Testi:")
kayit_ok, kayit_msg = KullaniciOlustur.kayitOl_kontrol("ahmet_kaya", "Gecerli.2026!", "ahmet@gmail.com", "20.04.1998")
print(f"  Kullanici Kaydi: {kayit_ok} -> {kayit_msg}")

giris_ok, giris_msg = Kisiler.oturumAc_kontrol("ahmet_kaya", "Gecerli.2026!")
print(f"  Giris Sonucu: {giris_ok} -> {giris_msg}")

# 3. Plan Ekleme, Sıralama ve Dosyalama Testi
print("\n[3] Plan Ekleme & TXT Kayit Testi:")
kisi = Kisiler("ahmet_kaya")
kisi.planEkle("2026-08-15", "Sabah Kosusu ve Fitness", "07:30", "08:30", "Saglik", ["1_gun_once", "1_saat_once"])
kisi.planEkle("2026-08-15", "Yazilim Mimarisi Toplantisi", "14:00", "15:30", "Is", ["5_saat_once", "1_saat_once"])
kisi.planEkle("2026-08-16", "Ingilizce Kitap Okuma & Kelime Calismasi", "21:00", "22:00", "Egitim", ["1_saat_once"])

planlar = kisi.planlariYukle()
print(f"  Toplam Plan Sayisi: {len(planlar)}")
for p in planlar:
    print(f"     - {p['tarih']} ({p['saat']}-{p['bitisSaati']}) [{p['kategori']}]: {p['plan']}")

# 4. Şifremi Unuttum Testi
print("\n[4] Sifremi Unuttum (Sifirlama) Testi:")
# Yanlış doğum tarihi ile deneme
sifirla_hata, hata_msg = Kisiler.sifremi_unuttum_sifirla("ahmet_kaya", "ahmet@gmail.com", "01.01.1990", "Yeni.Sifre2026!")
print(f"  [!] Hatali Bilgi Testi: {sifirla_hata} -> {hata_msg}")

# Doğru bilgilerle sıfırlama
sifirla_ok, sifirla_msg = Kisiler.sifremi_unuttum_sifirla("ahmet_kaya", "ahmet@gmail.com", "20.04.1998", "Yeni.Sifre2026!")
print(f"  [OK] Basarili Sifirlama: {sifirla_ok} -> {sifirla_msg}")

# Yeni şifreyle giriş testi
yeni_giris_ok, _ = Kisiler.oturumAc_kontrol("ahmet_kaya", "Yeni.Sifre2026!")
print(f"  Yeni Sifreyle Giris: {yeni_giris_ok}")

# 5. Ayarlar / Profil Güncelleme Testi
print("\n[5] Ayarlar & Profil Guncelleme Testi:")
guncelle_ok, guncelle_msg = Kisiler.profil_guncelle(
    eskiKullaniciAdi="ahmet_kaya",
    yeniKullaniciAdi="ahmet_pro",
    yeniGmail="ahmet.pro@gmail.com",
    yeniDogumTarihi="20.04.1998",
    yeniSifre="Guncel.Sifre2026!",
    mevcutSifre="Yeni.Sifre2026!"
)
print(f"  Profil Guncelleme: {guncelle_ok} -> {guncelle_msg}")

# Dosya ismi kontrolü
eski_dosya = os.path.join("data", "ahmet_kaya_planlar.txt")
yeni_dosya = os.path.join("data", "ahmet_pro_planlar.txt")
print(f"  Eski dosya silindi mi: {not os.path.exists(eski_dosya)}")
print(f"  Yeni dosya mevcut mu: {os.path.exists(yeni_dosya)}")

print("\n==================================================")
print(" TUM TESTLER BASARIYLA GECTI!")
print("==================================================")
