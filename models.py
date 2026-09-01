from datetime import datetime
import json
import os
import random
import time
import smtplib
from email.mime.text import MIMEText
import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

KULLANICILAR_DOSYASI = os.path.join(DATA_DIR, "kullanicilar.json")

# ---------------------------------------------------------
# BURÇ HESAPLAMA VE GÜNLÜK BURÇ YORUMU (OOP)
# ---------------------------------------------------------
ZODIAC_SIGNS = [
    {"en": "capricorn", "tr": "Oğlak", "symbol": "♑", "start": (12, 22), "end": (1, 19), "motto": "Disiplin ve kararlılık seni zirveye taşır."},
    {"en": "aquarius", "tr": "Kova", "symbol": "♒", "start": (1, 20), "end": (2, 18), "motto": "Özgün fikirlerinle bugün fark yaratacaksın."},
    {"en": "pisces", "tr": "Balık", "symbol": "♓", "start": (2, 19), "end": (3, 20), "motto": "Sezgilerine güven, iç sesin seni doğru yola götürecek."},
    {"en": "aries", "tr": "Koç", "symbol": "♈", "start": (3, 21), "end": (4, 19), "motto": "Cesaretin ve enerjinle bugün engelleri aşacaksın."},
    {"en": "taurus", "tr": "Boğa", "symbol": "♉", "start": (4, 20), "end": (5, 20), "motto": "Sabır ve sadakat hedeflerine ulaşmandaki en büyük gücün."},
    {"en": "gemini", "tr": "İkizler", "symbol": "♊", "start": (5, 21), "end": (6, 20), "motto": "Merakın ve iletişimin yeni kapılar aralayacak."},
    {"en": "cancer", "tr": "Yengeç", "symbol": "♋", "start": (6, 21), "end": (7, 22), "motto": "Duygusal zekan ve şefkatin çevrene ilham veriyor."},
    {"en": "leo", "tr": "Aslan", "symbol": "♌", "start": (7, 23), "end": (8, 22), "motto": "Işığınla parla ve liderliğini güvenle sergile."},
    {"en": "virgo", "tr": "Başak", "symbol": "♍", "start": (8, 23), "end": (9, 22), "motto": "Detaylardaki ustalığın bugün büyük bir başarı getirecek."},
    {"en": "libra", "tr": "Terazi", "symbol": "♎", "start": (9, 23), "end": (10, 22), "motto": "Denge ve uyum içinde hareket etmek huzur getirecek."},
    {"en": "scorpio", "tr": "Akrep", "symbol": "♏", "start": (10, 23), "end": (11, 21), "motto": "Tutkun ve odaklanma gücün imkansızı başarmanı sağlar."},
    {"en": "sagittarius", "tr": "Yay", "symbol": "♐", "start": (11, 22), "end": (12, 21), "motto": "Özgür ruhun ve iyimserliğin yeni ufuklar keşfettirecek."}
]

def dogum_tarihinden_burc_bul(dogum_tarihi_str):
    """Doğum tarihinden (örn: 15.05.2000 veya 2000-05-15) burç bilgisini tespit eder."""
    try:
        if "." in dogum_tarihi_str:
            parcalar = dogum_tarihi_str.strip().split(".")
            gun, ay = int(parcalar[0]), int(parcalar[1])
        elif "-" in dogum_tarihi_str:
            parcalar = dogum_tarihi_str.strip().split("-")
            if len(parcalar[0]) == 4:
                ay, gun = int(parcalar[1]), int(parcalar[2])
            else:
                gun, ay = int(parcalar[0]), int(parcalar[1])
        else:
            return ZODIAC_SIGNS[3] # Varsayılan Koç

        for z in ZODIAC_SIGNS:
            (s_ay, s_gun) = z["start"]
            (e_ay, e_gun) = z["end"]

            if s_ay == 12 and e_ay == 1:
                if (ay == 12 and gun >= s_gun) or (ay == 1 and gun <= e_gun):
                    return z
            else:
                if (ay == s_ay and gun >= s_gun) or (ay == e_ay and gun <= e_gun):
                    return z
    except Exception as e:
        print(f"Burç hesaplama hatası: {e}")

    return ZODIAC_SIGNS[3]


class BurcYorumu:
    """Kullanıcının yazdığı BurcYorumu sınıfı ve zengin Türkçe günlük astroloji motoru."""
    _onbellek = {}

    def __init__(self, sozlugum):
        self.sozlugum = sozlugum

    def bilgiVer(self):
        """Kullanıcının yazdığı terminal metodu."""
        try:
            sign = self.sozlugum.get("data", {}).get("sign", "")
            date = self.sozlugum.get("data", {}).get("date", "")
            horoscope = self.sozlugum.get("data", {}).get("horoscope", "")
            print(f"{sign} | {date}")
            print(horoscope)
        except Exception as e:
            print(f"Bilgi verme hatası: {e}")

    @classmethod
    def gunluk_yorum_getir(cls, burc_bilgisi):
        """
        Her burç ve gün için özenle hazırlanmış, motive edici ve akıcı Türkçe günlük burç yorumunu döner.
        """
        burc_en = burc_bilgisi["en"]
        burc_tr = burc_bilgisi["tr"]
        simge = burc_bilgisi["symbol"]
        motto = burc_bilgisi["motto"]
        bugun_tarih = datetime.now().strftime("%d.%m.%Y")

        cache_key = f"{burc_en}_{bugun_tarih}"
        if cache_key in cls._onbellek:
            return cls._onbellek[cache_key]

        # Zengin günlük burç yorumları ve astrolojik rehberlik havuzu
        tematik_havuz = {
            "Koç": [
                "Bugün yüksek enerjin ve kararlılığın sayesinde gün boyu engelleri kolayca aşacaksın. Ertelenmiş işleri başlatmak ve inisiyatif almak için harika bir gün.",
                "Liderlik ruhun bugün çevrendekilere ilham veriyor. Yeni bir projeye adım atmak veya hedeflerini netleştirmek için zihnin oldukça berrak.",
                "Bugün içindeki cesaret ve motivasyon zirvede. Kararsızlık yaşadığın konularda adım atmaktan çekinme; gökyüzü enerjini destekliyor."
            ],
            "Boğa": [
                "Pratik zekan ve sabırlı yaklaşımın bugün karşına çıkan karmaşık konuları kolayca çözmeni sağlayacak. Maddi ve kişisel planlarında sağlam adımlar atacaksın.",
                "Bugün düzen ve konfor ihtiyacın ön planda. Rutinlerini sadeleştirmek ve sakin bir odaklanma ile ilerlemek sana büyük bir verimlilik kazandıracak.",
                "Hedeflerine olan bağlılığın bugün meyvelerini vermeye başlıyor. Kararlı duruşun çevrende güven uyandırırken gününü keyifle tamamlayacaksın."
            ],
            "İkizler": [
                "Zihinsel enerjin ve iletişim yeteneğin bugün olağanüstü yüksek. Yeni fikirler üretmek, görüşmeler yapmak ve üretken olmak için ideal bir gündesin.",
                "Bugün merak duygun seni yeni ve faydalı bilgilere yönlendirecek. Sosyal ilişkilerinde kuracağın samimi diyaloglar gününe neşe katacak.",
                "Hızlı düşünme ve adaptasyon becerin sayesinde günün yoğun temposunu keyifli bir akışa dönüştüreceksin. Yaratıcı projelere zaman ayır."
            ],
            "Yengeç": [
                "Sezgilerinin ve duygusal zekanın çok güçlü olduğu bir gündesin. İç sesini dinleyerek atacağın adımlar seni hem işte hem özel hayatında doğru noktaya taşıyacak.",
                "Bugün sevdiklerinle kuracağın sıcak bağlar ve kendine ayıracağın huzurlu anlar enerjini tazeleyecek. Rutinlerine sakinlik kat.",
                "Empati yeteneğin ve koruyucu yapın çevrendekiler için büyük bir moral kaynağı oluyor. Kendi hedeflerini de ihmal etmeden dengeli ilerle."
            ],
            "Aslan": [
                "Işığın, özgüvenin ve karizmatik duruşunla bugün her ortamda dikkatleri üzerine çekeceksin. Hedeflerine tutkuyla odaklanmak sana başarı getirecek.",
                "Bugün yaratıcılığın ve liderlik vasıfların ön planda. Önemli bir kararda sorumluluk almak seni hedeflerine bir adım daha yaklaştıracak.",
                "Cömert ve pozitif enerjin gün boyu karşına çıkan fırsatları değerlendirmeni kolaylaştırıyor. Kendine olan inancını en üst seviyede tut."
            ],
            "Başak": [
                "Detaylara gösterdiğin eşsiz özen ve analitik zekan bugün seni öne çıkarıyor. Bir süredir ertelediğin işleri ve günlük sorumlulukları tek tek tamamlayarak günün sonunda büyük bir rahatlama ve tatmin hissedeceksin.",
                "Bugün organize olma ve planlama yeteneğin zirvede. Karmaşık görünen durumları adım adım sadeleştirerek hedeflerine emin adımlarla ulaşacaksın.",
                "Pratik ve çözüm odaklı yaklaşımın sayesinde hem işlerinde hem kişisel rutinlerinde maksimum verimlilik elde edeceğin harika bir gün."
            ],
            "Terazi": [
                "Denge, estetik ve uyum arayışın bugün sonuç veriyor. Karar verirken kalbinin sesini dinle; sakinliğin ve tarafsızlığın sana en doğru yolu gösterecek.",
                "İkili ilişkilerinde adalet ve diplomasiyle hareket etmek sana huzur ve başarı getirecek. Gününü güzelleştirecek sanatsal aktivitelere yer ver.",
                "Bugün zihinsel ve duygusal olarak dengede hissedeceksin. Ertelediğin kararları netleştirmek için iç huzurunu koruyarak ilerle."
            ],
            "Akrep": [
                "Odaklanma gücün ve tutkun en derin meseleleri bile kolayca çözmeni sağlayacak. Kararlılığın sayesinde bugün kimsenin göremediği detayları fark edeceksin.",
                "Bugün dönüşüm ve yenilenme enerjisi seninle. Seni yavaşlatan alışkanlıkları geride bırakıp hedeflerine güçlü bir motivasyonla odaklan.",
                "İçsel gücün ve sezgilerin bugün en büyük rehberin. Gizli kalmış potansiyelini ortaya çıkarmak için kararlı adımlarla ilerle."
            ],
            "Yay": [
                "Geniş vizyonun, iyimserliğin ve keşif arzun gününü aydınlatıyor. Yeni bir şeyler öğrenmek ve rutinlerine enerji katmak için harika bir zaman.",
                "Bugün özgür ruhun ve neşen çevrene ilham verecek. Yeni hedefler belirlemek ve sınırlarını genişletmek için gökyüzü seni destekliyor.",
                "Pozitif bakış açın sayesinde karşılaştığın her durumu bir avantaja çevireceksin. Geleceğe dair umut verici planlar yapabilirsin."
            ],
            "Oğlak": [
                "Disiplin, kararlılık ve stratejik bakış açın bugün takdir toplayacak. Hedeflerine emin ve sağlam adımlarla ilerliyorsun; emeğinin karşılığını fazlasıyla alacaksın.",
                "Bugün uzun vadeli hedeflerini gözden geçirmek ve sağlam temeller atmak için mükemmel bir gün. Sabrın en büyük yardımcın.",
                "Sorumluluk bilincin ve çalışma azmin seni zirveye taşımaya devam ediyor. Günün sonunda başardığın işlerin gururunu yaşayacaksın."
            ],
            "Kova": [
                "Yaratıcı, vizyoner ve orijinal fikirlerinle bugün fark yaratacaksın. Alışılmışın dışındaki bakış açın karşılaştığın sorunları kolayca ve hızla çözecektir.",
                "Toplumsal paylaşımlar, teknoloji ve yenilikçi projeler için harika bir gün. Özgünlüğünü ortaya koymaktan asla çekinme.",
                "Bugün zihnin geleceğe odaklı ve ilham dolu. Rutinlerinin dışına çıkarak yeni bakış açıları keşfetmek sana çok iyi gelecek."
            ],
            "Balık": [
                "Hayal gücün, empatin ve sanatsal duyarlılığın bugün zirvede. İç dünyandaki zenginliği dışarıya yansıtmak sana büyük bir motivasyon ve huzur verecektir.",
                "Bugün sezgilerine güvenmek sana en doğru kararları aldıracak. Ruhunu dinlendirecek ve enerjini tazeleyecek aktivitelere zaman ayır.",
                "Duygusal derinliğin ve şefkatin çevrene pozitif bir dalga yayıyor. Kendine nazik davranarak gününü huzurla tamamla."
            ]
        }

        today_dt = datetime.now()
        seed_val = f"{burc_en}_{today_dt.year}_{today_dt.month}_{today_dt.day}"
        list_items = tematik_havuz.get(burc_tr, tematik_havuz["Başak"])
        import hashlib
        idx = int(hashlib.md5(seed_val.encode('utf-8')).hexdigest(), 16) % len(list_items)
        turkce_yorum = list_items[idx]

        sonuc_verisi = {
            "burc": burc_tr,
            "burcEn": burc_en,
            "simge": simge,
            "motto": motto,
            "tarih": bugun_tarih,
            "yorum": turkce_yorum
        }

        cls._onbellek[cache_key] = sonuc_verisi
        return sonuc_verisi


# ---------------------------------------------------------
# KULLANICI & ŞİFRE YÖNETİMİ (OOP)
# ---------------------------------------------------------
class Kisiler:
    kullanicilar = {}
    dogrulama_kodlari = {}

    @classmethod
    def kullanicilari_yukle(cls):
        if os.path.exists(KULLANICILAR_DOSYASI):
            try:
                with open(KULLANICILAR_DOSYASI, "r", encoding="utf-8") as f:
                    cls.kullanicilar = json.load(f)
            except Exception as e:
                print(f"Kullanıcı verisi okunamadı: {e}")
                cls.kullanicilar = {}

    @classmethod
    def kullanicilari_kaydet(cls):
        try:
            with open(KULLANICILAR_DOSYASI, "w", encoding="utf-8") as f:
                json.dump(cls.kullanicilar, f, ensure_ascii=False, indent=4)
        except Exception as e:
            print(f"Kullanıcı kaydetme hatası: {e}")

    @classmethod
    def dogrulama_kodu_gonder(cls, kullaniciAdi, gmail):
        cls.kullanicilari_yukle()
        kullaniciAdi = kullaniciAdi.strip()
        gmail = gmail.strip().lower()

        if kullaniciAdi not in cls.kullanicilar:
            return False, "Bu kullanıcı adı sistemde kayıtlı değil!", None

        kayitli_gmail = cls.kullanicilar[kullaniciAdi].get("gmail", "").strip().lower()
        if kayitli_gmail != gmail:
            return False, "Girdiğiniz Gmail adresi kullanıcı hesabıyla eşleşmiyor!", None

        # 6 Haneli Rastgele Doğrulama Kodu Üret
        kod = f"{random.randint(100000, 999999)}"
        cls.dogrulama_kodlari[kullaniciAdi] = {
            "kod": kod,
            "gmail": gmail,
            "expire": time.time() + 600 # 10 dakika geçerli
        }

        # E-posta Gönderim Desteği
        smtp_user = os.environ.get("SMTP_EMAIL", "")
        smtp_pass = os.environ.get("SMTP_PASSWORD", "")

        if smtp_user and smtp_pass:
            try:
                msg = MIMEText(f"Merhaba {kullaniciAdi},\n\nDaily Routines hesabınız için şifre sıfırlama doğrulama kodunuz: {kod}\nBu kod 10 dakika süreyle geçerlidir.\n\nİyi günler dileriz.", "plain", "utf-8")
                msg["Subject"] = "Daily Routines — Şifre Sıfırlama Doğrulama Kodu"
                msg["From"] = smtp_user
                msg["To"] = gmail

                with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
            except Exception as err:
                print(f"SMTP Gönderim Hatası: {err}")

        mesaj = f"{gmail} adresine 6 haneli onay kodu gönderildi."
        return True, mesaj, kod

    @classmethod
    def kod_ile_sifre_sifirla(cls, kullaniciAdi, girilenKod, yeniSifre):
        cls.kullanicilari_yukle()
        kullaniciAdi = kullaniciAdi.strip()
        girilenKod = str(girilenKod).strip()

        if kullaniciAdi not in cls.kullanicilar:
            return False, "Kullanıcı bulunamadı!"

        if kullaniciAdi not in cls.dogrulama_kodlari:
            return False, "Lütfen önce e-postanıza doğrulama kodu isteyin!"

        kayitli_veri = cls.dogrulama_kodlari[kullaniciAdi]
        if time.time() > kayitli_veri["expire"]:
            del cls.dogrulama_kodlari[kullaniciAdi]
            return False, "Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin!"

        if kayitli_veri["kod"] != girilenKod:
            return False, "Girdiğiniz 6 haneli doğrulama kodu hatalı!"

        gecerli, mesaj = KullaniciOlustur.sifre_dogrula(yeniSifre)
        if not gecerli:
            return False, mesaj

        cls.kullanicilar[kullaniciAdi]["sifre"] = yeniSifre
        cls.kullanicilari_kaydet()

        # Kodu temizle
        del cls.dogrulama_kodlari[kullaniciAdi]
        return True, "Şifreniz başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz."

    @classmethod
    def sifremi_unuttum_sifirla(cls, kullaniciAdi, gmail, dogumTarihi, yeniSifre):
        cls.kullanicilari_yukle()
        if kullaniciAdi not in cls.kullanicilar:
            return False, "Bu kullanıcı adı sistemde kayıtlı değil!"

        bilgiler = cls.kullanicilar[kullaniciAdi]
        if bilgiler.get("gmail", "").strip().lower() != gmail.strip().lower():
            return False, "Girdiğiniz Gmail adresi kayıtlı bilgilerle eşleşmiyor!"

        if bilgiler.get("dogum tarihi", "").strip() != dogumTarihi.strip():
            return False, "Girdiğiniz doğum tarihi kayıtlı bilgilerle eşleşmiyor!"

        gecerli, mesaj = KullaniciOlustur.sifre_dogrula(yeniSifre)
        if not gecerli:
            return False, mesaj

        cls.kullanicilar[kullaniciAdi]["sifre"] = yeniSifre
        cls.kullanicilari_kaydet()
        return True, "Şifreniz başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz."

    def __init__(self, kullaniciAdi, sifre="", gmail="", dogumTarihi=""):
        self.__kullaniciAdi = kullaniciAdi
        self.__sifre = sifre
        self.__gmail = gmail
        self.__dogumTarihi = dogumTarihi
        self.planlar = []

    def get_kullanici_adi(self):
        return self.__kullaniciAdi

    def kayitOl(self):
        try:
            raise ValueError("bunun calismamasi lazim override ettik")
        except ValueError as hata:
            print(hata)

    def oturumAc(self):
        print("OTURUM ACINIZ :\n\n")
        while True:
            try:
                girisIsim = input("kullanici adinizi giriniz : ")
                girisSifre = input("sifrenizi giriniz : ")

                basarili, mesaj = self.oturumAc_kontrol(girisIsim, girisSifre)
                if not basarili:
                    raise ValueError(mesaj)

                print("Giriş yapiliyor...")
                break
            except ValueError as hata:
                print(hata)

    @classmethod
    def oturumAc_kontrol(cls, girisIsim, girisSifre):
        cls.kullanicilari_yukle()
        if girisIsim not in cls.kullanicilar:
            return False, "Kullanıcı bulunamadı!"

        if cls.kullanicilar[girisIsim]["sifre"] != girisSifre:
            return False, "Şifre yanlış!"

        return True, "Giriş başarılı"

    @classmethod
    def sifremi_unuttum_sifirla(cls, kullaniciAdi, gmail, dogumTarihi, yeniSifre):
        cls.kullanicilari_yukle()
        if kullaniciAdi not in cls.kullanicilar:
            return False, "Bu kullanıcı adı sistemde kayıtlı değil!"

        bilgiler = cls.kullanicilar[kullaniciAdi]
        if bilgiler.get("gmail", "").strip().lower() != gmail.strip().lower():
            return False, "Girdiğiniz Gmail adresi kayıtlı bilgilerle eşleşmiyor!"

        if bilgiler.get("dogum tarihi", "").strip() != dogumTarihi.strip():
            return False, "Girdiğiniz doğum tarihi kayıtlı bilgilerle eşleşmiyor!"

        gecerli, mesaj = KullaniciOlustur.sifre_dogrula(yeniSifre)
        if not gecerli:
            return False, mesaj

        cls.kullanicilar[kullaniciAdi]["sifre"] = yeniSifre
        cls.kullanicilari_kaydet()
        return True, "Şifreniz başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz."

    @classmethod
    def profil_guncelle(cls, eskiKullaniciAdi, yeniKullaniciAdi, yeniGmail, yeniDogumTarihi, yeniSifre=None, mevcutSifre=None):
        cls.kullanicilari_yukle()
        if eskiKullaniciAdi not in cls.kullanicilar:
            return False, "Kullanıcı bulunamadı!"

        kullanici_bilgisi = cls.kullanicilar[eskiKullaniciAdi]

        if mevcutSifre and kullanici_bilgisi["sifre"] != mevcutSifre:
            return False, "Mevcut şifrenizi hatalı girdiniz!"

        if yeniKullaniciAdi != eskiKullaniciAdi:
            if yeniKullaniciAdi in cls.kullanicilar:
                return False, "Bu yeni kullanıcı adı zaten kullanılıyor!"

        guncel_sifre = kullanici_bilgisi["sifre"]
        if yeniSifre and yeniSifre.strip():
            gecerli, mesaj = KullaniciOlustur.sifre_dogrula(yeniSifre)
            if not gecerli:
                return False, mesaj
            guncel_sifre = yeniSifre

        yeni_veri = {
            "sifre": guncel_sifre,
            "dogum tarihi": yeniDogumTarihi.strip() if yeniDogumTarihi else kullanici_bilgisi.get("dogum tarihi", ""),
            "gmail": yeniGmail.strip() if yeniGmail else kullanici_bilgisi.get("gmail", ""),
            "kayit_zamani": kullanici_bilgisi.get("kayit_zamani", datetime.now().strftime("%d.%m.%Y %H:%M:%S")),
            "guncelleme_zamani": datetime.now().strftime("%d.%m.%Y %H:%M:%S")
        }

        if yeniKullaniciAdi != eskiKullaniciAdi:
            del cls.kullanicilar[eskiKullaniciAdi]
            cls.kullanicilar[yeniKullaniciAdi] = yeni_veri

            eskiDosya = os.path.join(DATA_DIR, f"{eskiKullaniciAdi}_planlar.txt")
            yeniDosya = os.path.join(DATA_DIR, f"{yeniKullaniciAdi}_planlar.txt")
            if os.path.exists(eskiDosya):
                try:
                    os.rename(eskiDosya, yeniDosya)
                except Exception as e:
                    print(f"Dosya yeniden adlandırma hatası: {e}")
        else:
            cls.kullanicilar[eskiKullaniciAdi] = yeni_veri

        cls.kullanicilari_kaydet()
        return True, "Profil bilgileriniz başarıyla güncellendi!"

    def _dosya_adi(self):
        return os.path.join(DATA_DIR, f"{self.__kullaniciAdi}_planlar.txt")

    def planYap(self):
        tarih = input("tarihi giriniz (orn : 25.06.2026): ")
        plan = input("sectiginiz tarihte yapicaginiz plani giriniz: ")
        return self.planEkle(tarih, plan)

    def planEkle(self, tarihStr, planMetni, saat="09:00", bitisSaati="10:00", kategori="Genel", hatirlaticilar=None, plan_id=None):
        if hatirlaticilar is None:
            hatirlaticilar = ["1_gun_once", "5_saat_once", "1_saat_once"]

        dosyaAdi = self._dosya_adi()

        try:
            if "-" in tarihStr and len(tarihStr.split("-")[0]) == 4:
                dt = datetime.strptime(tarihStr, "%Y-%m-%d")
                tarihFormatted = dt.strftime("%d.%m.%Y")
            else:
                dt = datetime.strptime(tarihStr, "%d.%m.%Y")
                tarihFormatted = tarihStr
        except ValueError:
            return False, "Geçersiz tarih formatı! (Örn: 25.06.2026 veya 2026-06-25)"

        if not plan_id or not str(plan_id).strip():
            plan_id = f"plan_{int(time.time()*1000)}_{random.randint(1000, 9999)}"

        hatirlaticiStr = ",".join(hatirlaticilar) if isinstance(hatirlaticilar, list) else str(hatirlaticilar)
        yeniSatir = f"{plan_id} | {tarihFormatted} | {saat} | {bitisSaati} | {kategori} | {hatirlaticiStr} | {planMetni}\n"

        tumSatirlar = []
        if os.path.exists(dosyaAdi):
            with open(dosyaAdi, "r", encoding="utf-8") as dosya:
                tumSatirlar = dosya.readlines()

        tumSatirlar.append(yeniSatir)

        def sirala_anahtari(satir):
            try:
                parcalar = [p.strip() for p in satir.strip().split(" | ")]
                # 7 parçalı (ID içeren) satır: [0]=id, [1]=tarih, [2]=saat
                if len(parcalar) >= 7:
                    t_str = parcalar[1]
                    s_str = parcalar[2] if ":" in parcalar[2] else "00:00"
                    return datetime.strptime(f"{t_str} {s_str}", "%d.%m.%Y %H:%M")
                # 6 parçalı eski satır: [0]=tarih, [1]=saat
                elif len(parcalar) >= 2:
                    t_str = parcalar[0]
                    s_str = parcalar[1] if ":" in parcalar[1] else "00:00"
                    return datetime.strptime(f"{t_str} {s_str}", "%d.%m.%Y %H:%M")
                elif " - " in satir:
                    t_str = satir.split(" - ")[0].strip()
                    return datetime.strptime(t_str, "%d.%m.%Y")
            except Exception:
                pass
            return datetime.min

        tumSatirlar.sort(key=sirala_anahtari)

        with open(dosyaAdi, "w", encoding="utf-8") as dosya:
            dosya.writelines(tumSatirlar)

        return True, "Plan başarıyla eklendi"

    def planSil(self):
        silinecekId = input("silmek istediginiz planin ID'sini veya tarihini giriniz: ")
        return self.planSil_kontrol(silinecekId=silinecekId)

    def planSil_kontrol(self, silinecekId=None, silinecekTarih=None, silinecekPlan=None):
        """
        Yalnızca hedeflenen tek bir plana ait benzersiz ID'yi (silinecekId) siler.
        Aynı isimde veya aynı tarihte başka planlar olsa dahi ASLA etkilenmez.
        """
        dosyaAdi = self._dosya_adi()
        if not os.path.exists(dosyaAdi):
            return False, "Plan dosyası bulunamadı"

        if silinecekTarih and "-" in silinecekTarih and len(silinecekTarih.split("-")[0]) == 4:
            try:
                silinecekTarih = datetime.strptime(silinecekTarih, "%Y-%m-%d").strftime("%d.%m.%Y")
            except ValueError:
                pass

        with open(dosyaAdi, "r", encoding="utf-8") as dosya:
            satirlar = dosya.readlines()

        yeniSatirlar = []
        silindi = False

        for idx, satir in enumerate(satirlar):
            satirStr = satir.strip()
            if not satirStr:
                continue

            eslesiyor = False
            # 1. ID İLE KESİN EŞLEŞME (ÖNCELİKLİ & GARANTİLİ)
            if silinecekId and str(silinecekId).strip():
                target_id = str(silinecekId).strip()
                if " | " in satirStr:
                    parcalar = [p.strip() for p in satirStr.split(" | ")]
                    if len(parcalar) >= 7 and parcalar[0] == target_id:
                        eslesiyor = True
                    elif f"plan_{idx}" in target_id or f"legacy_{idx}" in target_id:
                        eslesiyor = True

            # 2. ESKİ YEDEK EŞLEŞME (Sadece ID verilmemişse ve SADECE İLK eşleşen 1 adet planı siler)
            elif not silindi and silinecekTarih and silinecekPlan:
                if " | " in satirStr:
                    parcalar = [p.strip() for p in satirStr.split(" | ")]
                    t_str = parcalar[1] if len(parcalar) >= 7 else parcalar[0]
                    p_str = parcalar[-1]
                    if t_str == silinecekTarih and (silinecekPlan.strip() == p_str or silinecekPlan.strip() in p_str):
                        eslesiyor = True
                elif " - " in satirStr:
                    parcalar = satirStr.split(" - ", 1)
                    if parcalar[0].strip() == silinecekTarih and parcalar[1].strip() == silinecekPlan.strip():
                        eslesiyor = True

            if eslesiyor and not silindi:
                silindi = True  # Sadece hedeflenen 1 plan silinir, diğer kopyalar silinmez
            else:
                yeniSatirlar.append(satir)

        with open(dosyaAdi, "w", encoding="utf-8") as dosya:
            dosya.writelines(yeniSatirlar)

        if silindi:
            return True, "Plan başarıyla silindi"
        return False, "Eşleşen plan bulunamadı"

    def planGuncelle(self, eskiTarih=None, eskiPlanMetni=None, yeniTarihStr=None, yeniPlanMetni=None, yeniSaat="09:00", yeniBitisSaati="10:00", yeniKategori="Genel", yeniHatirlaticilar=None, plan_id=None):
        if plan_id:
            self.planSil_kontrol(silinecekId=plan_id)
            return self.planEkle(yeniTarihStr, yeniPlanMetni, yeniSaat, yeniBitisSaati, yeniKategori, yeniHatirlaticilar, plan_id=plan_id)
        else:
            self.planSil_kontrol(silinecekTarih=eskiTarih, silinecekPlan=eskiPlanMetni)
            return self.planEkle(yeniTarihStr, yeniPlanMetni, yeniSaat, yeniBitisSaati, yeniKategori, yeniHatirlaticilar)

    def planlariYukle(self):
        """
        Kullanıcının planlarını yükler, her plana mutlak benzersiz bir 'id' atar.
        Eski formatlı satırları da otomatik olarak kalıcı ID'lerle migrate eder.
        """
        dosyaAdi = self._dosya_adi()
        self.planlar = []

        if not os.path.exists(dosyaAdi):
            return []

        guncellenmis_satirlar = []
        dosya_degisti = False

        try:
            with open(dosyaAdi, "r", encoding="utf-8") as dosya:
                for idx, satir in enumerate(dosya):
                    satir = satir.strip()
                    if not satir:
                        continue

                    if " | " in satir:
                        parcalar = [p.strip() for p in satir.split(" | ")]
                        if len(parcalar) >= 7:
                            # Yeni 7 parçalı format (ID içeren)
                            plan_id = parcalar[0]
                            tarihStr = parcalar[1]
                            saat = parcalar[2]
                            bitisSaati = parcalar[3]
                            kategori = parcalar[4]
                            hatirlaticiStr = parcalar[5]
                            planMetni = parcalar[6]
                            guncellenmis_satirlar.append(f"{satir}\n")
                        elif len(parcalar) >= 6:
                            # 6 parçalı eski format -> ID ata ve kaydet
                            plan_id = f"plan_{idx}_{abs(hash(satir)) % 100000}_{random.randint(100, 999)}"
                            tarihStr = parcalar[0]
                            saat = parcalar[1]
                            bitisSaati = parcalar[2]
                            kategori = parcalar[3]
                            hatirlaticiStr = parcalar[4]
                            planMetni = parcalar[5]
                            guncellenmis_satirlar.append(f"{plan_id} | {tarihStr} | {saat} | {bitisSaati} | {kategori} | {hatirlaticiStr} | {planMetni}\n")
                            dosya_degisti = True
                        else:
                            continue

                        hatirlaticilar = [h.strip() for h in hatirlaticiStr.split(",") if h.strip()]
                    elif " - " in satir:
                        parcalar = satir.split(" - ", 1)
                        tarihStr = parcalar[0].strip()
                        planMetni = parcalar[1].strip()
                        saat = "09:00"
                        bitisSaati = "10:00"
                        kategori = "Genel"
                        hatirlaticilar = ["1_gun_once", "5_saat_once", "1_saat_once"]
                        plan_id = f"plan_{idx}_{abs(hash(satir)) % 100000}_{random.randint(100, 999)}"
                        guncellenmis_satirlar.append(f"{plan_id} | {tarihStr} | {saat} | {bitisSaati} | {kategori} | 1_gun_once,5_saat_once,1_saat_once | {planMetni}\n")
                        dosya_degisti = True
                    else:
                        continue

                    try:
                        dt = datetime.strptime(tarihStr, "%d.%m.%Y")
                        isoTarih = dt.strftime("%Y-%m-%d")
                    except ValueError:
                        isoTarih = tarihStr

                    self.planlar.append({
                        "id": plan_id,
                        "tarih": tarihStr,
                        "isoTarih": isoTarih,
                        "saat": saat,
                        "bitisSaati": bitisSaati,
                        "kategori": kategori,
                        "hatirlaticilar": hatirlaticilar,
                        "plan": planMetni,
                        "raw": satir
                    })

            if dosya_degisti:
                with open(dosyaAdi, "w", encoding="utf-8") as dosya:
                    dosya.writelines(guncellenmis_satirlar)

        except Exception as e:
            print(f"Plan okuma hatası: {e}")

        return self.planlar



class KullaniciOlustur(Kisiler):
    def __init__(self, isim="", sifre="", gmail="", dogumTarihi="", cliMode=False):
        if cliMode:
            self.kayitOl()
        elif isim:
            basarili, mesaj = self.kayitOl_kontrol(isim, sifre, gmail, dogumTarihi)
            if not basarili:
                raise ValueError(mesaj)
            super().__init__(isim, sifre, gmail, dogumTarihi)

    def kayitOl(self):
        while True:
            try:
                isim = input("kullanici adinizi giriniz : ")
                sifre = input("sifrenizi giriniz : ")
                gmail = input("mail adresinizi giriniz : ")
                dogumTarihi = input("dogum tarihinizi giriniz : ")

                basarili, mesaj = self.kayitOl_kontrol(isim, sifre, gmail, dogumTarihi)
                if not basarili:
                    raise ValueError(mesaj)

                print("Kayit basarili!")
                super().__init__(isim, sifre, gmail, dogumTarihi)
                break
            except ValueError as hata:
                print(hata)

    @classmethod
    def sifre_dogrula(cls, sifre):
        if len(sifre) < 8:
            return False, "Şifre en az 8 karakter olmalıdır."
        if not any(harf.isupper() for harf in sifre):
            return False, "Şifre en az bir büyük harf içermelidir."
        if not any(harf.islower() for harf in sifre):
            return False, "Şifre en az bir küçük harf içermelidir."
        if not any(harf.isdigit() for harf in sifre):
            return False, "Şifre en az bir rakam içermelidir."
        if not any(not harf.isalnum() for harf in sifre):
            return False, "Şifre en az bir özel karakter içermelidir (!@#$%^&* vb.)."
        return True, "Şifre kurallara uygun"

    @classmethod
    def kayitOl_kontrol(cls, isim, sifre, gmail, dogumTarihi):
        cls.kullanicilari_yukle()

        if not isim or not sifre:
            return False, "Kullanıcı adı ve şifre boş bırakılamaz!"

        if isim in cls.kullanicilar:
            return False, "Bu kullanıcı adı zaten kullanılıyor!"

        gecerli, mesaj = cls.sifre_dogrula(sifre)
        if not gecerli:
            return False, mesaj

        cls.kullanicilar[isim] = {
            "sifre": sifre,
            "dogum tarihi": dogumTarihi,
            "gmail": gmail,
            "kayit_zamani": datetime.now().strftime("%d.%m.%Y %H:%M:%S")
        }

        cls.kullanicilari_kaydet()
        return True, "Kayıt başarıyla oluşturuldu!"


# Başlangıçta kayıtlı kullanıcıları belleğe yükle
Kisiler.kullanicilari_yukle()
