from flask import Flask, render_template, request, jsonify, session, send_file, send_from_directory
import os

try:
    from models import Kisiler, KullaniciOlustur, DATA_DIR, BurcYorumu, dogum_tarihinden_burc_bul, ZODIAC_SIGNS
except ImportError:
    from proje_routines.models import Kisiler, KullaniciOlustur, DATA_DIR, BurcYorumu, dogum_tarihinden_burc_bul, ZODIAC_SIGNS

try:
    from ai_engine import AIEngine
except ImportError:
    from proje_routines.ai_engine import AIEngine

app = Flask(__name__)
app.secret_key = "antigravity_daily_routines_super_secret_key_2026"

@app.route("/")
def index():
    return render_template("index.html")

# ---------------------------------------------------------
# SEO, PWA & FAVICON ENDPOINTLERİ
# ---------------------------------------------------------
@app.route("/robots.txt")
def robots():
    return send_from_directory("static", "robots.txt", mimetype="text/plain")

@app.route("/sitemap.xml")
def sitemap():
    return send_from_directory("static", "sitemap.xml", mimetype="application/xml")

@app.route("/manifest.json")
def manifest():
    return send_from_directory("static", "manifest.json", mimetype="application/json")

@app.route("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join("static", "img"), "favicon.ico", mimetype="image/vnd.microsoft.icon")

@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404

@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}
    isim = data.get("kullaniciAdi", "").strip()
    sifre = data.get("sifre", "").strip()
    gmail = data.get("gmail", "").strip()
    dogumTarihi = data.get("dogumTarihi", "").strip()

    basarili, mesaj = KullaniciOlustur.kayitOl_kontrol(isim, sifre, gmail, dogumTarihi)
    if basarili:
        session["kullaniciAdi"] = isim
        return jsonify({"status": "success", "message": mesaj, "user": isim}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    isim = data.get("kullaniciAdi", "").strip()
    sifre = data.get("sifre", "").strip()

    basarili, mesaj = Kisiler.oturumAc_kontrol(isim, sifre)
    if basarili:
        session["kullaniciAdi"] = isim
        return jsonify({"status": "success", "message": mesaj, "user": isim}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 401

@app.route("/api/forgot-password/send-code", methods=["POST"])
def api_forgot_password_send_code():
    data = request.get_json() or {}
    isim = data.get("kullaniciAdi", "").strip()
    gmail = data.get("gmail", "").strip()

    basarili, mesaj, kod = Kisiler.dogrulama_kodu_gonder(isim, gmail)
    if basarili:
        return jsonify({"status": "success", "message": mesaj, "debugCode": kod}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/api/forgot-password/verify-and-reset", methods=["POST"])
def api_forgot_password_verify_and_reset():
    data = request.get_json() or {}
    isim = data.get("kullaniciAdi", "").strip()
    kod = data.get("kod", "").strip()
    yeniSifre = data.get("yeniSifre", "").strip()

    basarili, mesaj = Kisiler.kod_ile_sifre_sifirla(isim, kod, yeniSifre)
    if basarili:
        return jsonify({"status": "success", "message": mesaj}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/api/forgot-password", methods=["POST"])
def api_forgot_password():
    data = request.get_json() or {}
    isim = data.get("kullaniciAdi", "").strip()
    gmail = data.get("gmail", "").strip()
    dogumTarihi = data.get("dogumTarihi", "").strip()
    yeniSifre = data.get("yeniSifre", "").strip()

    basarili, mesaj = Kisiler.sifremi_unuttum_sifirla(isim, gmail, dogumTarihi, yeniSifre)
    if basarili:
        return jsonify({"status": "success", "message": mesaj}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/api/profile/update", methods=["POST"])
def api_profile_update():
    eskiKullaniciAdi = session.get("kullaniciAdi")
    if not eskiKullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    data = request.get_json() or {}
    yeniKullaniciAdi = data.get("yeniKullaniciAdi", eskiKullaniciAdi).strip()
    yeniGmail = data.get("yeniGmail", "").strip()
    yeniDogumTarihi = data.get("yeniDogumTarihi", "").strip()
    yeniSifre = data.get("yeniSifre", "").strip()
    mevcutSifre = data.get("mevcutSifre", "").strip()

    basarili, mesaj = Kisiler.profil_guncelle(
        eskiKullaniciAdi=eskiKullaniciAdi,
        yeniKullaniciAdi=yeniKullaniciAdi,
        yeniGmail=yeniGmail,
        yeniDogumTarihi=yeniDogumTarihi,
        yeniSifre=yeniSifre if yeniSifre else None,
        mevcutSifre=mevcutSifre if mevcutSifre else None
    )

    if basarili:
        session["kullaniciAdi"] = yeniKullaniciAdi
        return jsonify({
            "status": "success",
            "message": mesaj,
            "user": {
                "kullaniciAdi": yeniKullaniciAdi,
                "gmail": yeniGmail,
                "dogumTarihi": yeniDogumTarihi
            }
        }), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/astrology")
@app.route("/astroloji")
def astrology_page():
    return render_template("astrology.html")

@app.route("/api/horoscope", methods=["GET"])
def api_horoscope():
    """Kullanıcının doğum tarihine veya seçilen burca göre Türkçe burç yorumunu döner."""
    kullaniciAdi = session.get("kullaniciAdi")
    selected_sign = request.args.get("sign") # İsteğe bağlı burç parametresi (örn: aries, virgo)

    if selected_sign:
        # Belirli bir burç istendiyse
        matched = next((z for z in ZODIAC_SIGNS if z["en"] == selected_sign.lower() or z["tr"].lower() == selected_sign.lower()), None)
        if not matched:
            matched = ZODIAC_SIGNS[3]
        burc_bilgisi = matched
    else:
        # Kullanıcının kendi doğum tarihinden hesapla
        if not kullaniciAdi or kullaniciAdi not in Kisiler.kullanicilar:
            return jsonify({"status": "error", "message": "Oturum açılmadı"}), 401

        dogumTarihi = Kisiler.kullanicilar[kullaniciAdi].get("dogum tarihi", "")
        if not dogumTarihi:
            return jsonify({"status": "error", "message": "Doğum tarihi bulunamadı"}), 400

        burc_bilgisi = dogum_tarihinden_burc_bul(dogumTarihi)

    yorum_verisi = BurcYorumu.gunluk_yorum_getir(burc_bilgisi)
    return jsonify({"status": "success", "data": yorum_verisi, "allSigns": ZODIAC_SIGNS}), 200

@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.pop("kullaniciAdi", None)
    return jsonify({"status": "success", "message": "Oturum kapatıldı"}), 200

@app.route("/api/me", methods=["GET"])
def api_me():
    kullaniciAdi = session.get("kullaniciAdi")
    if kullaniciAdi and kullaniciAdi in Kisiler.kullanicilar:
        bilgi = Kisiler.kullanicilar[kullaniciAdi]
        return jsonify({
            "authenticated": True,
            "user": {
                "kullaniciAdi": kullaniciAdi,
                "gmail": bilgi.get("gmail", ""),
                "dogumTarihi": bilgi.get("dogum tarihi", "")
            }
        })
    return jsonify({"authenticated": False, "user": None})

@app.route("/api/plans", methods=["GET"])
def api_get_plans():
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    kisi = Kisiler(kullaniciAdi)
    planlar = kisi.planlariYukle()
    return jsonify({"status": "success", "plans": planlar}), 200

@app.route("/api/plans", methods=["POST"])
def api_add_plan():
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    data = request.get_json() or {}
    tarihStr = data.get("tarih", "").strip()
    planMetni = data.get("plan", "").strip()
    saat = data.get("saat", "09:00").strip()
    bitisSaati = data.get("bitisSaati", "10:00").strip()
    kategori = data.get("kategori", "Genel").strip()
    hatirlaticilar = data.get("hatirlaticilar", ["1_gun_once", "5_saat_once", "1_saat_once"])

    if not tarihStr or not planMetni:
        return jsonify({"status": "error", "message": "Tarih ve plan metni zorunludur!"}), 400

    kisi = Kisiler(kullaniciAdi)
    basarili, mesaj = kisi.planEkle(tarihStr, planMetni, saat, bitisSaati, kategori, hatirlaticilar)
    
    if basarili:
        return jsonify({"status": "success", "message": mesaj, "plans": kisi.planlariYukle()}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/api/plans/update", methods=["POST"])
def api_update_plan():
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    data = request.get_json() or {}
    plan_id = data.get("id", "").strip()
    eskiTarih = data.get("eskiTarih", "").strip()
    eskiPlan = data.get("eskiPlan", "").strip()
    yeniTarih = data.get("tarih", "").strip()
    yeniPlan = data.get("plan", "").strip()
    saat = data.get("saat", "09:00").strip()
    bitisSaati = data.get("bitisSaati", "10:00").strip()
    kategori = data.get("kategori", "Genel").strip()
    hatirlaticilar = data.get("hatirlaticilar", ["1_gun_once", "5_saat_once", "1_saat_once"])

    if not yeniTarih or not yeniPlan:
        return jsonify({"status": "error", "message": "Tarih ve plan metni zorunludur!"}), 400

    kisi = Kisiler(kullaniciAdi)
    basarili, mesaj = kisi.planGuncelle(
        plan_id=plan_id,
        eskiTarih=eskiTarih,
        eskiPlanMetni=eskiPlan,
        yeniTarihStr=yeniTarih,
        yeniPlanMetni=yeniPlan,
        yeniSaat=saat,
        yeniBitisSaati=bitisSaati,
        yeniKategori=kategori,
        yeniHatirlaticilar=hatirlaticilar
    )

    if basarili:
        return jsonify({"status": "success", "message": "Plan başarıyla güncellendi", "plans": kisi.planlariYukle()}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/api/plans/delete", methods=["POST"])
def api_delete_plan():
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    data = request.get_json() or {}
    plan_id = data.get("id", "").strip()
    tarihStr = data.get("tarih", "").strip()
    planMetni = data.get("plan", "").strip()

    kisi = Kisiler(kullaniciAdi)
    basarili, mesaj = kisi.planSil_kontrol(silinecekId=plan_id, silinecekTarih=tarihStr, silinecekPlan=planMetni)

    if basarili:
        return jsonify({"status": "success", "message": mesaj, "plans": kisi.planlariYukle()}), 200
    else:
        return jsonify({"status": "error", "message": mesaj}), 400

@app.route("/api/export-txt", methods=["GET"])
def api_export_txt():
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    dosyaAdi = os.path.join(DATA_DIR, f"{kullaniciAdi}_planlar.txt")
    if os.path.exists(dosyaAdi):
        return send_file(dosyaAdi, as_attachment=True, download_name=f"{kullaniciAdi}_planlar.txt")
    else:
        return jsonify({"status": "error", "message": "Henüz kayıtlı plan dosyası bulunmuyor"}), 404

# ---------------------------------------------------------
# AKILLI YAPAY ZEKA ASİSTANI & GÜN OPTİMİZASYON ENDPOINTLERİ
# ---------------------------------------------------------
@app.route("/api/ai/chat", methods=["POST"])
def api_ai_chat():
    """Kullanıcının AI asistan ile çok turlu hafızaya sahip interaktif sohbet etmesini sağlar."""
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi or kullaniciAdi not in Kisiler.kullanicilar:
        return jsonify({"status": "error", "message": "Yapay zeka asistanını kullanmak için lütfen önce oturum açın!"}), 401

    data = request.get_json() or {}
    mesaj = data.get("message", "").strip()
    history = data.get("history", [])
    current_date = data.get("currentDate")

    if not mesaj:
        return jsonify({"status": "error", "message": "Mesaj boş olamaz!"}), 400

    kisi = Kisiler(kullaniciAdi)
    kisi_planlar = kisi.planlariYukle()
    user_data = Kisiler.kullanicilar.get(kullaniciAdi, {})

    cevap = AIEngine.chat(kullaniciAdi, mesaj, kisi_planlar, user_data, current_date, history=history)
    return jsonify(cevap), 200

@app.route("/api/ai/optimize-day", methods=["POST"])
def api_ai_optimize_day():
    """Belirli bir tarihteki planları analiz edip optimize edilmiş yeni bir akış taslağı döner."""
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    data = request.get_json() or {}
    tarihStr = data.get("date", "").strip()

    kisi = Kisiler(kullaniciAdi)
    tum_planlar = kisi.planlariYukle()
    
    # Seçili tarihe ait planları filtrele
    gun_planlari = [p for p in tum_planlar if p.get("isoTarih") == tarihStr or p.get("tarih") == tarihStr]

    sonuc = AIEngine.optimize_day(kullaniciAdi, tarihStr, gun_planlari)
    return jsonify(sonuc), 200

@app.route("/api/ai/apply-optimization", methods=["POST"])
def api_ai_apply_optimization():
    """Kullanıcının onayladığı optimize edilmiş planları takvime işler."""
    kullaniciAdi = session.get("kullaniciAdi")
    if not kullaniciAdi:
        return jsonify({"status": "error", "message": "Lütfen önce oturum açın!"}), 401

    data = request.get_json() or {}
    tarihStr = data.get("date", "").strip()
    yeni_planlar = data.get("plans", [])

    if not tarihStr or not isinstance(yeni_planlar, list):
        return jsonify({"status": "error", "message": "Geçersiz istek parametreleri!"}), 400

    kisi = Kisiler(kullaniciAdi)
    tum_planlar = kisi.planlariYukle()

    # O tarihteki eski planları sil
    eski_gun_planlari = [p for p in tum_planlar if p.get("isoTarih") == tarihStr or p.get("tarih") == tarihStr]
    for ep in eski_gun_planlari:
        kisi.planSil_kontrol(ep["tarih"], ep["plan"])

    # Yeni optimize edilmiş planları ekle
    for np in yeni_planlar:
        p_tarih = np.get("tarih") or tarihStr
        p_metin = np.get("plan", "").strip()
        p_saat = np.get("saat", "09:00").strip()
        p_bitis = np.get("bitisSaati", "10:00").strip()
        p_kat = np.get("kategori", "Genel").strip()
        p_hatirlat = np.get("hatirlaticilar", ["1_saat_once"])
        if p_metin:
            kisi.planEkle(p_tarih, p_metin, p_saat, p_bitis, p_kat, p_hatirlat)

    guncel_planlar = kisi.planlariYukle()
    return jsonify({
        "status": "success",
        "message": "Gününüz AI ile başarıyla optimize edildi ve takvime işlendi! ✨",
        "plans": guncel_planlar
    }), 200

if __name__ == "__main__":
    print("\n=======================================================")
    print(" [OK] DAILY ROUTINES WEB UYGULAMASI BASLATILDI")
    print(" [*] Tarayicinizda acin: http://127.0.0.1:5000")
    print("=======================================================\n")
    app.run(debug=True, port=5000)
