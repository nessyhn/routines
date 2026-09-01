import os
import json
import re
from datetime import datetime, timedelta
import requests

# .env dosyasını oku
ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_FILE):
    try:
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()
    except Exception as e:
        print(f"Env okuma hatası: {e}")

class AIEngine:
    """
    ROUTINES DEEP AI ASSISTANT & SCHEDULE OPTIMIZER
    Google Gemini (Çok turlu hafıza, resilient model chain) + Derin Yerel Akıl Yürütme Motoru.
    """

    GEMINI_MODELS = [
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ]

    @classmethod
    def get_api_key(cls, user_data=None):
        if user_data and isinstance(user_data, dict):
            user_key = user_data.get("gemini_api_key", "").strip()
            if user_key:
                return user_key
        return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""

    @classmethod
    def translate_to_turkish(cls, text):
        """
        İngilizce metinleri (örneğin günlük burç yorumunu) Gemini ile samimi, motive edici, doğal ve temiz Türkçeye çevirir.
        """
        if not text or not text.strip():
            return ""

        api_key = cls.get_api_key()
        if api_key:
            for model_name in cls.GEMINI_MODELS:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                    payload = {
                        "system_instruction": {
                            "parts": [{"text": "Sen profesyonel ve samimi bir astroloji ve yaşam koçusun. Sana verilen İngilizce burç yorumunu motive edici, akıcı ve kusursuz bir Türkçe paragrafa çevir. Çıktında kesinlikle düşünce adımları, analizler, madde işaretleri, başlıklar veya İngilizce kelimeler kullanma. Yalnızca tek parça akıcı Türkçe yorum paragrafını döndür."}]
                        },
                        "contents": [{
                            "role": "user",
                            "parts": [{
                                "text": f"Aşağıdaki İngilizce burç yorumunu Türkçe olarak yaz:\n\n{text.strip()}"
                            }]
                        }],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 800
                        }
                    }
                    resp = requests.post(url, json=payload, timeout=7)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and parts[0].get("text"):
                                raw_result = parts[0].get("text", "").strip()
                                # Temizlik: Varsa başlıkları, markdown kalıntılarını veya tırnakları ayıkla
                                cleaned = re.sub(r"\*.*?\*", "", raw_result) # Yıldızlı düşünce/etiketleri kaldır
                                cleaned = cleaned.replace('"', '').replace("'", "").strip()
                                if len(cleaned) > 20:
                                    return cleaned
                                return raw_result.strip().strip('"')
                except Exception as e:
                    print(f"[AIEngine] Çeviri hatası ({model_name}): {e}")

        return ""

    @classmethod
    def chat(cls, username, user_message, plans=None, user_data=None, current_date=None, history=None):
        """
        Kullanıcı mesajına çok turlu konuşma geçmişini (history) ve takvim context'ini kullanarak akıllı yanıt üretir.
        """
        if plans is None:
            plans = []
        if user_data is None:
            user_data = {}
        if history is None:
            history = []
        if not current_date:
            current_date = datetime.now().strftime("%Y-%m-%d")

        today_str = datetime.strptime(current_date, "%Y-%m-%d").strftime("%d.%m.%Y") if "-" in current_date else current_date
        today_plans = [p for p in plans if p.get("isoTarih") == current_date or p.get("tarih") == today_str]
        
        api_key = cls.get_api_key(user_data)
        
        # 1. Google Gemini Çok Turlu LLM Çağrısı (Model Zinciri)
        if api_key:
            for model_name in cls.GEMINI_MODELS:
                try:
                    gemini_reply = cls._call_gemini_chat_multiturn(api_key, model_name, username, user_message, history, today_plans, plans, current_date)
                    if gemini_reply:
                        return {
                            "status": "success",
                            "engine": f"gemini_{model_name}",
                            "reply": gemini_reply,
                            "todayPlanCount": len(today_plans)
                        }
                except Exception as e:
                    print(f"[AIEngine] Gemini model ({model_name}) çağrısı başarısız, sonraki modele geçiliyor: {e}")

        # 2. Gelişmiş Yerel Çok Turlu & Bağlamsal Akıl Yürütme Motoru (Deep Stateful Fallback)
        local_reply = cls._generate_deep_multiturn_reply(username, user_message, history, today_plans, plans, current_date)
        return {
            "status": "success",
            "engine": "deep_stateful_local",
            "reply": local_reply,
            "todayPlanCount": len(today_plans)
        }

    @classmethod
    def _call_gemini_chat_multiturn(cls, api_key, model_name, username, user_message, history, today_plans, all_plans, current_date):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        
        system_instruction = (
            f"Sen 'Routines' adlı modern, lüks ve şık takvim & rutin uygulamasının son derece zeki, empatik, hafızası kuvvetli ve kişisel Yaşam & Zaman Koçusun. "
            f"Kullanıcının adı: {username}. Bugünün tarihi: {current_date}. "
            f"Kullanıcının bugünkü kayıtlı planları ({len(today_plans)} adet): {json.dumps(today_plans, ensure_ascii=False)}. "
            f"Kullanıcının tüm takvim planları ({len(all_plans)} adet): {json.dumps(all_plans[:25], ensure_ascii=False)}. "
            "ÖNEMLİ KURALLAR:\n"
            "1. Kullanıcı ile önceki konuşma turlarını ASLA unutma. Kullanıcı takip soruları sorduğunda ('peki ya şu saat?', 'hangisini önce yapayım?', 'bunu yarına ertele' vb.) önceki mesajlardaki bağlamı hemen hatırla ve buna göre cevap ver.\n"
            "2. Kullanıcıya doğrudan bir uzman zaman ve verimlilik koçu gibi konuş. Tavsiyelerin yapıcı, uygulanabilir, motive edici ve net olsun.\n"
            "3. Cevaplarını okunması keyifli, estetik Markdown formatında (kalın vurgular, maddeler, uygun emojiler) yaz. Aşırı uzun ve boğucu paragraflardan kaçın."
        )

        contents = []

        # Önceki sohbet geçmişini konuşma sırasına göre ekle
        for turn in history[-14:]:
            role = "user" if turn.get("role") in ["user", "human"] else "model"
            text = turn.get("content") or turn.get("text") or ""
            text = text.strip()
            if text:
                contents.append({
                    "role": role,
                    "parts": [{"text": text}]
                })

        # Mevcut kullanıcı mesajını ekle
        contents.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 850
            }
        }

        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()

        return None

    @classmethod
    def _generate_deep_multiturn_reply(cls, username, user_message, history, today_plans, all_plans, current_date):
        """
        Gemini API çevrimdışıyken çalışan
        Son derece zeki, konuşma geçmişini (history) hatırlayan ve bağlamsal akıl yürüten yerel AI motoru.
        """
        msg_lower = user_message.lower().strip()
        plan_count = len(today_plans)

        last_user_msg = ""
        topics_discussed = []

        if history:
            for turn in reversed(history):
                content = (turn.get("content") or turn.get("text") or "").lower()
                role = turn.get("role", "")
                if role in ["user", "human"] and not last_user_msg:
                    last_user_msg = content

                if any(w in content for w in ["spor", "yürüyüş", "egzersiz", "koşu"]):
                    topics_discussed.append("spor")
                if any(w in content for w in ["toplantı", "sunum", "iş", "proje", "yönetim"]):
                    topics_discussed.append("iş")
                if any(w in content for w in ["mola", "dinlen", "nefes", "stres", "yoruldum"]):
                    topics_discussed.append("mola")
                if any(w in content for w in ["ders", "sınav", "çalış", "ödev"]):
                    topics_discussed.append("eğitim")

        # Saat / Zaman Soru ve Değişiklik Talepleri
        time_match = re.search(r"(\d{1,2})[:.](\d{2})", msg_lower)
        if not time_match:
            time_match = re.search(r"saat\s+(\d{1,2})", msg_lower)

        if time_match and any(w in msg_lower for w in ["uygun mu", "nasıl", "alsak", "koyalım", "ertel", "ekle", "yapsak", "alalım", "olur mu"]):
            hour_val = int(time_match.group(1))
            min_val = int(time_match.group(2)) if len(time_match.groups()) > 1 and time_match.group(2) else 0
            time_str = f"{hour_val:02d}:{min_val:02d}"

            conflicting_plan = None
            for p in today_plans:
                p_start = p.get("saat", "09:00")
                p_end = p.get("bitisSaati", "10:00")
                p_s_min = cls._time_to_minutes(p_start)
                p_e_min = cls._time_to_minutes(p_end)
                target_min = hour_val * 60 + min_val

                if p_s_min <= target_min < p_e_min:
                    conflicting_plan = p
                    break

            if conflicting_plan:
                return (
                    f"Az önce konuştuğumuz programı kontrol ettim {username} 🧐\n\n"
                    f"⚠️ **Saat {time_str}** aralığında şu an takviminde **'{conflicting_plan.get('plan')}' ({conflicting_plan.get('saat')} - {conflicting_plan.get('bitisSaati')})** planı bulunuyor.\n\n"
                    f"💡 **Alternatif Önerim:**\n"
                    f"• Bu işi **{conflicting_plan.get('bitisSaati')}** sonrasına alabilirsin, böylece çakışma yaşamadan rahatça odaklanabilirsin.\n"
                    "• Veya mevcut planı yarına erteleyip bu saati yeni hedefine açabiliriz. Hangisini tercih edersin?"
                )
            else:
                context_ref = "Az önce bahsettiğimiz konu" if topics_discussed else "Bu plan"
                return (
                    f"Harika bir zaman seçimi {username}! 🎯\n\n"
                    f"✅ **Saat {time_str}** için takviminde hiçbir çakışma görünmüyor ve bu saat dilimi tamamen boş.\n\n"
                    f"🕒 {context_ref} için bu saati güvenle kullanabilirsin. Günün enerjisini dengede tutmak için bu görevin ardına 10 dakikalık bir su/mola aralığı bırakmayı unutma!"
                )

        # Önceliklendirme Soruları
        if any(w in msg_lower for w in ["hangis", "önce", "başlay", "öncelik", "sıra", "kararsız"]):
            if today_plans:
                sorted_plans = sorted(today_plans, key=lambda x: cls._time_to_minutes(x.get("saat", "09:00")))
                first_plan = sorted_plans[0]
                plan_list_text = "\n".join([f"• **[{p.get('saat')}]** {p.get('plan')} *({p.get('kategori')})*" for p in sorted_plans])
                
                return (
                    f"Önceki konuşmamızı ve bugünkü {plan_count} planını göz önünde bulundurduğumda stratejim şöyle {username}: 🧠\n\n"
                    f"📋 **Günün Akışı:**\n{plan_list_text}\n\n"
                    f"🥇 **Öncelikli Başlangıç:**\n"
                    f"En yüksek zihinsel enerjini gerektiren **'{first_plan.get('plan')}'** ile başlamalısın. "
                    "Zorlu işi ilk blokta tamamlamak günün geri kalanındaki stresini tamamen yok edecektir.\n\n"
                    "Bunu tamamladıktan sonra ikinci göreve geçmeden önce bana haber ver, mola saatini birlikte ayarlayalım! 🚀"
                )

        # Açıklama / Neden Soruları
        if any(w in msg_lower for w in ["neden", "niçin", "nasıl yani", "sebebi ne", "açıkla"]):
            return (
                f"Çok haklı bir soru {username}! Şöyle açıklayayım: 🔬\n\n"
                "Beynimiz aralıksız 90 dakikadan fazla yüksek odaklanmayı sürdürdüğünde bilişsel yorgunluk başlar ve hata yapma oranı %50 artar.\n\n"
                "Az önce önerdiğim **15 dakikalık dinlenme molaları**, dopamin seviyeni yeniler ve günün ikinci yarısında tükenmişlik hissetmeni engeller. Bu yüzden planların arasına tampon süreler koyduk."
            )

        # Onay ve Teşekkür
        if any(w in msg_lower for w in ["tamam", "harika", "teşekkür", "anladım", "olur", "süper", "güzel", "eyvallah", "sağol"]):
            return (
                f"Rica ederim {username}, her zaman yanındayım! 😊✨\n\n"
                f"Bugünkü programınla ilgili başka değiştirmek istediğin bir saat veya aklına takılan bir konu olursa buradayım. Harika bir gün geçirmeni dilerim! 🌟"
            )

        # Yoğunluk
        if any(w in msg_lower for w in ["yoğun", "yogun", "sıkışık", "sikisik", "yetiş", "yetis", "toparla", "zamanım yok", "çok işim", "sığdıramad"]):
            plan_names = ", ".join([f"**{p.get('plan')}** ({p.get('saat')})" for p in today_plans]) if today_plans else "Henüz kayıtlı plan yok"
            return (
                f"Bugünkü takvimini inceledim {username}. Toplam **{plan_count} planın** var:\n{plan_names}\n\n"
                "⚡ **Akıllı Toparlama Önerim:**\n"
                "1. Saat çakışmalarını sıraya dizelim.\n"
                "2. Görevler arasına 15'er dakikalık nefes aralıkları ekleyelim.\n"
                "3. Acil olmayan işleri akşama veya yarına kaydıralım.\n\n"
                "👉 Dilersen gün görünümündeki **'⚡ Günü AI ile Optimize Et'** butonuna basarak tüm saatleri tek tıkla otomatik kusursuzlaştırabilirsin!"
            )

        # Genel Yanıt
        return (
            f"Seni dinliyorum {username}! ✨\n\n"
            f"Bugün takviminde **{plan_count} plan** kayıtlı. "
            "Bana günün planlaması, saat çakışmaları veya alışkanlık rutinleri hakkında dilediğini sorabilirsin!"
        )

    @classmethod
    def optimize_day(cls, username, date_str, day_plans):
        """
        Belirli bir günün planlarını analiz eder, çakışmaları çözer,
        aralara mola yerleştirir ve optimize edilmiş yeni bir program taslağı döner.
        """
        if not day_plans:
            return {
                "status": "empty",
                "message": "Bu tarih için optimize edilecek kayıtlı bir plan bulunamadı.",
                "analysis": "Gününüz tamamen boş. Yeni hedefler ekleyebilirsiniz!",
                "suggestions": ["Güne erken saatte bir odaklanma planı ekleyebilirsiniz."],
                "originalPlans": [],
                "optimizedPlans": [],
                "changesCount": 0
            }

        parsed_plans = []
        for p in day_plans:
            start_str = p.get("saat", "09:00").strip()
            end_str = p.get("bitisSaati", "10:00").strip()
            
            start_min = cls._time_to_minutes(start_str)
            end_min = cls._time_to_minutes(end_str)
            if end_min <= start_min:
                end_min = start_min + 60

            parsed_plans.append({
                "original": p,
                "plan": p.get("plan", ""),
                "kategori": p.get("kategori", "Genel"),
                "tarih": p.get("tarih", ""),
                "isoTarih": p.get("isoTarih", date_str),
                "hatirlaticilar": p.get("hatirlaticilar", []),
                "start_min": start_min,
                "end_min": end_min,
                "duration": end_min - start_min
            })

        parsed_plans.sort(key=lambda x: x["start_min"])

        conflicts = 0
        total_minutes = sum(p["duration"] for p in parsed_plans)
        
        for i in range(len(parsed_plans) - 1):
            if parsed_plans[i]["end_min"] > parsed_plans[i+1]["start_min"]:
                conflicts += 1

        optimized_list = []
        current_cursor = max(parsed_plans[0]["start_min"], 540)

        suggestions = []
        if conflicts > 0:
            suggestions.append(f"⚡ {conflicts} adet saat çakışması tespit edildi ve saatler sıralı hale getirildi.")
        if len(parsed_plans) >= 4:
            suggestions.append("📊 Gün yoğunluğu dengelenerek görevler arasına zihinsel dinlenme aralıkları eklendi.")
        if total_minutes > 360:
            suggestions.append("💡 Günlük çalışma süreniz 6 saati aştığı için odaklanma blokları optimize edildi.")

        for idx, item in enumerate(parsed_plans):
            task_duration = min(item["duration"], 120)
            new_start_min = current_cursor
            new_end_min = new_start_min + task_duration

            start_str = cls._minutes_to_time(new_start_min)
            end_str = cls._minutes_to_time(new_end_min)

            optimized_list.append({
                "plan": item["plan"],
                "kategori": item["kategori"],
                "tarih": item["tarih"],
                "isoTarih": item["isoTarih"],
                "saat": start_str,
                "bitisSaati": end_str,
                "hatirlaticilar": item["hatirlaticilar"],
                "isModified": (start_str != item["original"].get("saat") or end_str != item["original"].get("bitisSaati")),
                "type": "task"
            })

            if idx < len(parsed_plans) - 1:
                break_duration = 15
                break_start_min = new_end_min
                break_end_min = break_start_min + break_duration

                optimized_list.append({
                    "plan": "🌿 15 Dk Nefes, Su & Dinlenme Molası",
                    "kategori": "Sağlık",
                    "tarih": item["tarih"],
                    "isoTarih": item["isoTarih"],
                    "saat": cls._minutes_to_time(break_start_min),
                    "bitisSaati": cls._minutes_to_time(break_end_min),
                    "hatirlaticilar": ["1_saat_once"],
                    "isNewBreak": True,
                    "type": "break"
                })
                current_cursor = break_end_min
            else:
                current_cursor = new_end_min

        changes_count = sum(1 for p in optimized_list if p.get("isModified") or p.get("isNewBreak"))

        analysis_text = (
            f"Bugün için toplam {len(parsed_plans)} plan incelendi. "
            f"{conflicts} çakışma giderildi ve {len(parsed_plans)-1} dinlenme molası entegre edildi."
        )

        return {
            "status": "success",
            "date": date_str,
            "analysis": analysis_text,
            "suggestions": suggestions if suggestions else ["Programınız optimize edilerek dengeli bir akışa kavuşturuldu."],
            "originalPlans": day_plans,
            "optimizedPlans": optimized_list,
            "changesCount": changes_count
        }

    @staticmethod
    def _time_to_minutes(time_str):
        try:
            parts = time_str.strip().split(":")
            return int(parts[0]) * 60 + int(parts[1])
        except Exception:
            return 540

    @staticmethod
    def _minutes_to_time(minutes):
        hours = (minutes // 60) % 24
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"
