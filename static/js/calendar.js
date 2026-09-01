/**
 * ADVANCED CALENDAR & ROUTINE RENDER ENGINE
 * Aylık, Haftalık, Günlük, Yıllık ve Yatay / Dikey düzen motoru.
 */

const Calendar = {
  currentDate: new Date(),
  currentView: "month", // 'month' | 'week' | 'day' | 'year'
  currentOrientation: "horizontal", // 'horizontal' | 'vertical'
  plans: [],
  editingPlan: null,
  availableReminders: [
    { key: "1_gun_once", label: "1 gün önce bildir", isDefault: true },
    { key: "5_saat_once", label: "5 saat önce bildir", isDefault: true },
    { key: "1_saat_once", label: "1 saat önce bildir", isDefault: true }
  ],

  monthNames: [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ],
  dayNames: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
  shortDayNames: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],

  // Türkiye ve Dünya İçin Önemli Günler & Resmi Tatiller
  specialDays: {
    "01-01": { title: "Yılbaşı", type: "holiday", icon: "🎉" },
    "02-14": { title: "Dünya Sevgililer Günü", type: "world", icon: "❤️" },
    "03-08": { title: "Dünya Kadınlar Günü", type: "world", icon: "💐" },
    "03-14": { title: "Tıp Bayramı & Pi Günü", type: "world", icon: "⚕️" },
    "03-18": { title: "18 Mart Çanakkale Zaferi", type: "national", icon: "🇹🇷" },
    "03-21": { title: "Nevruz & Bahar Bayramı", type: "nature", icon: "🌱" },
    "04-22": { title: "Dünya Günü (Earth Day)", type: "world", icon: "🌍" },
    "04-23": { title: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı", type: "national", icon: "🇹🇷" },
    "05-01": { title: "1 Mayıs Emek ve Dayanışma Günü", type: "national", icon: "✊" },
    "05-19": { title: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı", type: "national", icon: "🇹🇷" },
    "06-05": { title: "Dünya Çevre Günü", type: "nature", icon: "🌿" },
    "06-21": { title: "Yaz Gündönümü (En Uzun Gün)", type: "nature", icon: "☀️" },
    "07-15": { title: "15 Temmuz Demokrasi ve Milli Birlik Günü", type: "national", icon: "🇹🇷" },
    "08-30": { title: "30 Ağustos Zafer Bayramı", type: "national", icon: "🇹🇷" },
    "09-21": { title: "Dünya Barış Günü", type: "world", icon: "🕊️" },
    "10-04": { title: "Dünya Hayvanları Koruma Günü", type: "world", icon: "🐾" },
    "10-29": { title: "29 Ekim Cumhuriyet Bayramı", type: "national", icon: "🇹🇷" },
    "11-10": { title: "10 Kasım Atatürk'ü Anma Günü", type: "national", icon: "🕊️" },
    "11-24": { title: "24 Kasım Öğretmenler Günü", type: "national", icon: "📚" },
    "12-21": { title: "Kış Gündönümü (En Uzun Gece)", type: "nature", icon: "🌙" },
    "12-31": { title: "Yılbaşı Gecesi", type: "holiday", icon: "✨" }
  },

  getSpecialEventsForDate(year, monthIndex, day) {
    const mm = String(monthIndex + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const key = `${mm}-${dd}`;
    const events = [];

    // 1. Ülke ve Dünya İçin Önemli Günler
    if (this.specialDays[key]) {
      const sp = this.specialDays[key];
      events.push({
        title: `${sp.icon} ${sp.title}`,
        type: sp.type,
        isSpecialDay: true
      });
    }

    // 2. Kişinin Kendi Doğum Günü
    if (Auth.userData && Auth.userData.dogumTarihi) {
      const parts = Auth.userData.dogumTarihi.replace(/-/g, ".").replace(/\//g, ".").split(".");
      let bDay, bMonth;
      if (parts.length === 3) {
        if (parts[0].length === 4) { // YYYY.MM.DD
          bMonth = parseInt(parts[1], 10);
          bDay = parseInt(parts[2], 10);
        } else { // DD.MM.YYYY
          bDay = parseInt(parts[0], 10);
          bMonth = parseInt(parts[1], 10);
        }
        if (bDay === day && bMonth === (monthIndex + 1)) {
          events.push({
            title: "🎂 Doğum Gününüz Kutlu Olsun!",
            type: "birthday",
            isBirthday: true
          });
        }
      }
    }

    return events;
  },

  triggerMobileGlide() {
    if (window.innerWidth <= 1024 && this.currentView === "month") {
      const today = new Date();
      const sectionEl = document.getElementById(`month-section-${today.getFullYear()}-${today.getMonth()}`);
      if (!sectionEl) return;
      const gridEl = sectionEl.querySelector(".month-grid-wrapper") || sectionEl;
      const rect = gridEl.getBoundingClientRect();
      const targetTop = Math.max(0, rect.top + window.pageYOffset - 136 - 6);
      const startTop = window.pageYOffset || 0;
      const distance = targetTop - startTop;
      const duration = 800;
      let startTime = null;

      const easeInOutCubic = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t * t + b;
        t -= 2;
        return (c / 2) * (t * t * t + 2) + b;
      };

      const animateGlide = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const currentProgress = Math.min(elapsed, duration);
        const currentScroll = easeInOutCubic(currentProgress, startTop, distance, duration);
        window.scrollTo(0, currentScroll);

        if (elapsed < duration) {
          requestAnimationFrame(animateGlide);
        } else {
          window.scrollTo(0, targetTop);
        }
      };

      requestAnimationFrame(animateGlide);
    }
  },

  init() {
    this.bindEvents();
    this.renderRemindersChecklist();
    this.render();
  },

  renderRemindersChecklist(selectedKeys = ["1_gun_once", "5_saat_once", "1_saat_once"]) {
    const container = document.getElementById("remindersChecklist");
    if (!container) return;

    container.innerHTML = this.availableReminders.map(item => {
      const isChecked = selectedKeys.includes(item.key) ? "checked" : "";
      if (item.isDefault) {
        return `
          <label class="reminder-checkbox-label" data-key="${item.key}">
            <div class="left-checkbox-group">
              <input type="checkbox" class="reminder-checkbox" value="${item.key}" ${isChecked}>
              <span>${item.label}</span>
            </div>
          </label>
        `;
      } else {
        return `
          <label class="reminder-checkbox-label" data-key="${item.key}">
            <div class="left-checkbox-group">
              <input type="checkbox" class="reminder-checkbox" value="${item.key}" ${isChecked}>
              <span>${item.label}</span>
            </div>
            <button type="button" class="btn-del-custom-rem" onclick="Calendar.deleteCustomCheckbox('${item.key}', event)" title="Bu hatırlatıcıyı listeden kaldır">&times;</button>
          </label>
        `;
      }
    }).join("");
  },

  deleteCustomCheckbox(key, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.availableReminders = this.availableReminders.filter(r => r.key !== key);
    const checked = Array.from(document.querySelectorAll("#remindersChecklist .reminder-checkbox:checked"))
      .map(cb => cb.value)
      .filter(k => k !== key);
    this.renderRemindersChecklist(checked);
    App.showToast("Özel hatırlatıcı listeden kaldırıldı", "info");
  },

  bindEvents() {
    // Görünüm Değiştirme Butonları (Aylık, Haftalık, Günlük, Yıllık)
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.currentView = e.currentTarget.dataset.view;
        if (this.currentView === "week" && window.innerWidth <= 1024) {
          this.currentOrientation = "vertical";
        }
        this.render();
      });
    });

    // Yönlendirme Değiştirme (Yatay / Dikey)
    document.querySelectorAll(".orientation-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".orientation-btn").forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.currentOrientation = e.currentTarget.dataset.orientation;
        this.render();
      });
    });

    // Navigasyon (Önceki, Sonraki, Bugün)
    const prevBtn = document.getElementById("navPrevBtn");
    const nextBtn = document.getElementById("navNextBtn");
    const todayBtn = document.getElementById("navTodayBtn");

    if (prevBtn) prevBtn.addEventListener("click", () => this.navigate(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => this.navigate(1));
    if (todayBtn) todayBtn.addEventListener("click", () => {
      this.currentDate = new Date();
      this.render();
    });

    // Yeni Plan Ekleme Formu
    const planForm = document.getElementById("addPlanForm");
    if (planForm) {
      planForm.addEventListener("submit", (e) => this.handleAddPlan(e));
    }

    // Özel Hatırlatıcı Aç/Kapa ve Ekle Butonları
    const toggleCustomRemindBtn = document.getElementById("btnToggleCustomReminder");
    if (toggleCustomRemindBtn) {
      toggleCustomRemindBtn.addEventListener("click", () => {
        const cCont = document.getElementById("customRemindersContainer");
        if (cCont) {
          const isHidden = cCont.style.display === "none" || !cCont.style.display;
          cCont.style.display = isHidden ? "block" : "none";
          toggleCustomRemindBtn.textContent = isHidden ? "- Özel Hatırlatıcıyı Gizle" : "+ Özel Hatırlatıcı Ekle";
        }
      });
    }

    const addCustomBtn = document.getElementById("btnAddCustomReminder");
    if (addCustomBtn) {
      addCustomBtn.addEventListener("click", () => this.addCustomReminder());
    }

    // Modal Açma
    const openAddPlanBtn = document.getElementById("openAddPlanBtn");
    if (openAddPlanBtn) {
      openAddPlanBtn.addEventListener("click", () => {
        if (!Auth.currentUser) {
          App.showToast("Plan eklemek için lütfen önce giriş yapın!", "warning");
          Auth.openModal("loginModal");
          return;
        }
        this.editingPlan = null;
        const titleModal = document.getElementById("addPlanModalTitle");
        const btnSubmit = document.getElementById("btnSubmitPlan");
        if (titleModal) titleModal.textContent = "Yeni Plan Ekle";
        if (btnSubmit) btnSubmit.textContent = "Kaydet & Sırala";
        
        // 1. Önce formu temizle
        document.getElementById("addPlanForm")?.reset();

        // 2. Ardından o an seçili / görüntülenen günün tarihi ve saatleriyle doldur
        const dateInput = document.getElementById("planDate");
        if (dateInput) {
          dateInput.value = this.formatDateISO(this.currentDate);
        }

        const now = new Date();
        const curH = now.getHours();
        const startHStr = curH < 10 ? `0${curH}:00` : `${curH}:00`;
        const nextH = curH === 23 ? 0 : curH + 1;
        const endHStr = nextH < 10 ? `0${nextH}:00` : `${nextH}:00`;

        const startInput = document.getElementById("planStartTime");
        const endInput = document.getElementById("planEndTime");
        if (startInput) startInput.value = startHStr;
        if (endInput) endInput.value = endHStr;
        
        this.renderRemindersChecklist(["1_gun_once", "5_saat_once", "1_saat_once"]);
        const cCont = document.getElementById("customRemindersContainer");
        if (cCont) cCont.style.display = "none";
        const toggleBtn = document.getElementById("btnToggleCustomReminder");
        if (toggleBtn) toggleBtn.textContent = "+ Özel Hatırlatıcı Ekle";
        Auth.openModal("addPlanModal");
      });
    }
  },

  openEditPlanModal(planIdOrObject, event) {
    if (event) event.stopPropagation();
    if (!Auth.currentUser) {
      App.showToast("Planı düzenlemek için lütfen giriş yapın!", "warning");
      Auth.openModal("loginModal");
      return;
    }

    let plan = typeof planIdOrObject === "object" ? planIdOrObject : this.plans.find(p => String(p.id) === String(planIdOrObject));
    if (!plan) return;

    this.editingPlan = { ...plan };

    const titleModal = document.getElementById("addPlanModalTitle");
    const btnSubmit = document.getElementById("btnSubmitPlan");
    if (titleModal) titleModal.textContent = "Planı Düzenle";
    if (btnSubmit) btnSubmit.textContent = "Değişiklikleri Kaydet";

    const titleInput = document.getElementById("planTitle");
    const dateInput = document.getElementById("planDate");
    const startInput = document.getElementById("planStartTime");
    const endInput = document.getElementById("planEndTime");
    const catInput = document.getElementById("planCategory");

    let isoDateVal = plan.isoTarih;
    if (!isoDateVal && plan.tarih) {
      if (plan.tarih.includes(".")) {
        const parts = plan.tarih.split(".");
        if (parts.length === 3) {
          isoDateVal = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      } else {
        isoDateVal = plan.tarih;
      }
    }

    if (titleInput) titleInput.value = plan.plan || "";
    if (dateInput) dateInput.value = isoDateVal || "";
    if (startInput) startInput.value = plan.saat || "09:00";
    if (endInput) endInput.value = plan.bitisSaati || "10:00";
    if (catInput) catInput.value = plan.kategori || "Genel";

    const activeRems = plan.hatirlaticilar || [];

    // Bu plandaki tüm özel hatırlatıcıları availableReminders listesine onay kutusu olarak ekle
    activeRems.forEach(r => {
      if (!this.availableReminders.some(item => item.key === r)) {
        let val = parseInt(r, 10);
        let unit = "dakika";
        if (r.includes("saat")) unit = "saat";
        else if (r.includes("gun") || r.includes("gün")) unit = "gun";
        else if (r.includes("hafta")) unit = "hafta";
        else if (r.includes("dakika")) unit = "dakika";

        if (!isNaN(val) && val > 0) {
          const unitName = unit === "dakika" ? "dakika" : (unit === "saat" ? "saat" : (unit === "gun" ? "gün" : "hafta"));
          this.availableReminders.push({
            key: r,
            label: `${val} ${unitName} önce bildir`,
            isDefault: false
          });
        }
      }
    });

    // Checkbox listesini bu planın hatırlatıcıları seçili olarak render et!
    this.renderRemindersChecklist(activeRems);

    const cCont = document.getElementById("customRemindersContainer");
    const toggleBtn = document.getElementById("btnToggleCustomReminder");
    if (cCont) cCont.style.display = "none";
    if (toggleBtn) toggleBtn.textContent = "+ Özel Hatırlatıcı Ekle";

    Auth.openModal("addPlanModal");
  },

  addCustomReminder() {
    const valInput = document.getElementById("customRemindVal");
    const unitSelect = document.getElementById("customRemindUnit");
    if (!valInput || !unitSelect) return;

    const val = parseInt(valInput.value, 10);
    const unit = unitSelect.value;
    if (isNaN(val) || val <= 0) {
      App.showToast("Lütfen geçerli bir süre girin!", "warning");
      return;
    }

    const key = `${val}_${unit}_once`;
    const unitName = unit === "dakika" ? "dakika" : (unit === "saat" ? "saat" : (unit === "gun" ? "gün" : "hafta"));
    const label = `${val} ${unitName} önce bildir`;

    if (!this.availableReminders.some(r => r.key === key)) {
      this.availableReminders.push({ key, label, isDefault: false });
    }

    // Halihazırda işaretli kutucukları topla ve yenisini de işaretle
    const checked = Array.from(document.querySelectorAll("#remindersChecklist .reminder-checkbox:checked"))
      .map(cb => cb.value);
    if (!checked.includes(key)) {
      checked.push(key);
    }

    this.renderRemindersChecklist(checked);
    App.showToast(`"${label}" onay kutusu olarak eklendi!`, "success");

    const cCont = document.getElementById("customRemindersContainer");
    const toggleBtn = document.getElementById("btnToggleCustomReminder");
    if (cCont) cCont.style.display = "none";
    if (toggleBtn) toggleBtn.textContent = "+ Özel Hatırlatıcı Ekle";
  },

  navigate(step) {
    if (this.currentView === "month") {
      this.currentDate.setMonth(this.currentDate.getMonth() + step);
    } else if (this.currentView === "week") {
      this.currentDate.setDate(this.currentDate.getDate() + (step * 7));
    } else if (this.currentView === "day") {
      this.currentDate.setDate(this.currentDate.getDate() + step);
    } else if (this.currentView === "year") {
      this.currentDate.setFullYear(this.currentDate.getFullYear() + step);
    }
    this.render();
  },

  async loadPlans() {
    if (!Auth.currentUser) return;
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();
      if (data.status === "success") {
        this.plans = data.plans || [];
        this.render();
        // Hatırlatıcı motoruna planları ilet
        Reminders.syncPlans(this.plans);
      }
    } catch (e) {
      console.error("Planlar yüklenemedi:", e);
    }
  },

  async handleAddPlan(e) {
    e.preventDefault();
    const dateVal = document.getElementById("planDate").value;
    const titleVal = document.getElementById("planTitle").value.trim();
    const startTimeVal = document.getElementById("planStartTime").value || "09:00";
    const endTimeVal = document.getElementById("planEndTime").value || "10:00";
    const categoryVal = document.getElementById("planCategory").value;

    if (!titleVal || !dateVal) {
      App.showToast("Lütfen tarih ve plan başlığını doldurun!", "warning");
      return;
    }

    // Bitiş saati kontrolü: Bitiş saati başlangıç saatinden önce veya eşit olamaz
    if (startTimeVal && endTimeVal && endTimeVal <= startTimeVal) {
      App.showToast("Bitiş saati, başlangıç saatinden sonra olmalıdır! (Örn: 09:00 - 10:00)", "warning");
      return;
    }

    // Seçilen tüm onay kutularını (varsayılan + özel) topla
    const checkedBoxes = document.querySelectorAll("#remindersChecklist .reminder-checkbox:checked");
    const reminders = Array.from(checkedBoxes).map(cb => cb.value);

const isEdit = !!this.editingPlan;
    const endpoint = isEdit ? "/api/plans/update" : "/api/plans";
    const payload = isEdit ? {
      id: this.editingPlan.id,
      eskiTarih: this.editingPlan.tarih,
      eskiPlan: this.editingPlan.plan,
      tarih: dateVal,
      plan: titleVal,
      saat: startTimeVal,
      bitisSaati: endTimeVal,
      kategori: categoryVal,
      hatirlaticilar: reminders
    } : {
      tarih: dateVal,
      plan: titleVal,
      saat: startTimeVal,
      bitisSaati: endTimeVal,
      kategori: categoryVal,
      hatirlaticilar: reminders
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      if (response.ok) {
        App.showToast(isEdit ? "Plan başarıyla güncellendi!" : "Plan başarıyla kaydedildi!", "success");
        Auth.closeModal("addPlanModal");
        e.target.reset();
        this.editingPlan = null;
        this.renderRemindersChecklist(["1_gun_once", "5_saat_once", "1_saat_once"]);
        const cCont = document.getElementById("customRemindersContainer");
        if (cCont) cCont.style.display = "none";
        const toggleBtn = document.getElementById("btnToggleCustomReminder");
        if (toggleBtn) toggleBtn.textContent = "+ Özel Hatırlatıcı Ekle";
        this.loadPlans();
      } else {
        App.showToast(res.message || "İşlem başarısız", "error");
      }
    } catch (err) {
      App.showToast("Sunucu hatası!", "error");
    }
  },

async deletePlan(planIdOrTarih, maybePlanMetni) {
    let plan = null;
    let planId = "";
    let planTitle = "Plan";
    let planTarih = "";

    if (typeof planIdOrTarih === "string" && !maybePlanMetni) {
      // Doğrudan plan ID ile çağrıldı
      planId = planIdOrTarih;
      plan = this.plans.find(p => String(p.id) === String(planId));
      if (plan) {
        planTitle = plan.plan || "Plan";
        planTarih = plan.tarih || "";
      }
    } else {
      // Tarih ve plan metni ile çağrıldı (eski çağrılar için)
      planTarih = planIdOrTarih;
      planTitle = maybePlanMetni || "Plan";
      plan = this.plans.find(p => p.tarih === planTarih && p.plan === planTitle);
      if (plan) {
        planId = plan.id;
      }
    }

    if (!confirm(`"${planTitle}" planını silmek istediğinize emin misiniz?`)) return;

    try {
      const response = await fetch("/api/plans/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: planId,
          tarih: planTarih,
          plan: planTitle
        })
      });

      const res = await response.json();
      if (response.ok) {
        App.showToast("Plan başarıyla silindi", "success");
        // Lokal listeden de ID ile anında temizle
        if (planId) {
          this.plans = this.plans.filter(p => String(p.id) !== String(planId));
        }
        this.loadPlans();
      } else {
        App.showToast(res.message || "Silme başarısız", "error");
      }
    } catch (err) {
      // Offline / statik demo modu
      if (planId) {
        this.plans = this.plans.filter(p => String(p.id) !== String(planId));
        this.render();
        App.showToast("Plan silindi", "success");
      } else {
        App.showToast("Silme işlemi sırasında hata oluştu", "error");
      }
    }
  },

    render() {
    this.updateHeaderTitle();
    this.renderMiniCalendar();
    this.renderDailySummaryNote();

    const container = document.getElementById("calendarViewContent");
    if (!container) return;

    // Gerçek veya önizleme takvim görünümünü oluştur
    let originalPlans = this.plans;
    if (!Auth.currentUser) {
      const y = this.currentDate.getFullYear();
      const m = String(this.currentDate.getMonth() + 1).padStart(2, "0");
      const d = String(this.currentDate.getDate()).padStart(2, "0");
      const curIso = `${y}-${m}-${d}`;
      
      this.plans = [
        // O an seçili olan gün için zengin saatlik planlar (Günlük görünüm için)
        { id: "demo_d1", isoTarih: curIso, saat: "09:30", bitisSaati: "10:30", kategori: "Is", plan: "Haftalık Ekip Değerlendirmesi" },
        { id: "demo_d2", isoTarih: curIso, saat: "11:00", bitisSaati: "12:30", kategori: "Egitim", plan: "Yapay Zeka ve Yazılım Çalışması" },
        { id: "demo_d3", isoTarih: curIso, saat: "14:00", bitisSaati: "15:00", kategori: "Saglik", plan: "Açık Hava Yürüyüşü & Egzersiz" },
        { id: "demo_d4", isoTarih: curIso, saat: "16:30", bitisSaati: "17:30", kategori: "Kisisel", plan: "Kitap Okuma & Dinlenme" },
        { id: "demo_d5", isoTarih: curIso, saat: "19:00", bitisSaati: "20:00", kategori: "Rutin", plan: "Günlük Rutin & Planlama" },
        // Aylık ve Yıllık görünüm için diğer günlere dağıtılmış örnek planlar
        { id: "demo_m1", isoTarih: `${y}-${m}-04`, saat: "09:30", bitisSaati: "10:30", kategori: "Is", plan: "Haftalık Ekip Değerlendirmesi" },
        { id: "demo_m2", isoTarih: `${y}-${m}-11`, saat: "14:00", bitisSaati: "15:30", kategori: "Egitim", plan: "Yapay Zeka ve Yazılım Çalışması" },
        { id: "demo_m3", isoTarih: `${y}-${m}-18`, saat: "18:00", bitisSaati: "19:00", kategori: "Saglik", plan: "Açık Hava Yürüyüşü & Egzersiz" },
        { id: "demo_m4", isoTarih: `${y}-${m}-25`, saat: "11:00", bitisSaati: "12:00", kategori: "Kisisel", plan: "Kitap Okuma & Dinlenme" }
      ];

      // Yıllık görünüm için her aya 1-2 demo plan serp
      for (let monthIdx = 1; monthIdx <= 12; monthIdx++) {
        const mm = String(monthIdx).padStart(2, "0");
        this.plans.push(
          { id: `demo_y_${mm}_1`, isoTarih: `${y}-${mm}-10`, saat: "10:00", bitisSaati: "11:00", kategori: "Is", plan: "Aylık Hedef İncelemesi" },
          { id: `demo_y_${mm}_2`, isoTarih: `${y}-${mm}-22`, saat: "15:00", bitisSaati: "16:00", kategori: "Saglik", plan: "Sağlık & Spor Rutini" }
        );
      }
    }

    // Yönlendirme (Yatay / Dikey) buton görünürlüğünü güncelle
    const isMobileDevice = window.innerWidth <= 1024;
    const orientationToggleGroup = document.getElementById("orientationToggleGroup");
    if (orientationToggleGroup) {
      if (!Auth.currentUser || isMobileDevice) {
        orientationToggleGroup.style.display = "none";
        if (isMobileDevice && this.currentView === "week") {
          this.currentOrientation = "vertical";
        } else {
          this.currentOrientation = "horizontal";
        }
      } else {
        orientationToggleGroup.style.display = (this.currentView === "month" || this.currentView === "week") ? "flex" : "none";
      }
    }

    const tempDiv = document.createElement("div");
    if (this.currentView === "month") {
      if (this.currentOrientation === "horizontal") {
        this.renderMonthGrid(tempDiv);
      } else {
        this.renderMonthVertical(tempDiv);
      }
    } else if (this.currentView === "week") {
      if (this.currentOrientation === "horizontal") {
        this.renderWeekGrid(tempDiv);
      } else {
        this.renderWeekTimeline(tempDiv);
      }
    } else if (this.currentView === "day") {
      this.renderDayAgenda(tempDiv);
    } else if (this.currentView === "year") {
      this.renderYearOverview(tempDiv);
    }

    if (!Auth.currentUser) {
      this.plans = originalPlans; // Orijinal plan listesini geri yükle

      // Misafir oturumunda takvim arkada hafif canlı buzlu cam ve üstünde şık oturum aç kartı gösterilir
      container.innerHTML = `
        <div class="calendar-guest-wrapper">
          <div class="calendar-blur-backdrop">
            ${tempDiv.innerHTML}
          </div>
          <div class="calendar-guest-overlay">
            <div class="calendar-guest-card">
              <div class="guest-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M9 16l2 2 4-4"></path>
                </svg>
              </div>
              <h3 class="guest-card-title">Takviminizi ve Planlarınızı Yönetin</h3>
              <p class="guest-card-desc">Günlük planlarınızı kaydetmek, akıllı hatırlatıcılar kurmak ve yapay zeka zaman koçunu kullanmak için lütfen oturum açın.</p>
              
              <div class="guest-features-row">
                <span class="guest-feature-tag">AI Zaman Koçu</span>
                <span class="guest-feature-tag">Akıllı Hatırlatıcılar</span>
                <span class="guest-feature-tag">Kişisel Ajanda</span>
              </div>

              <div class="guest-card-actions">
                <button class="btn btn-primary" onclick="Auth.openModal('loginModal')">
                  <span>Oturum Aç</span>
                </button>
                <button class="btn btn-outline" onclick="Auth.openModal('registerModal')">
                  <span>Hesap Oluştur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = tempDiv.innerHTML;
    }
  },

  normalizeISO(dateStr) {
    if (!dateStr) return "";
    if (dateStr.includes("-")) return dateStr;
    if (dateStr.includes(".")) {
      const parts = dateStr.split(".");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    return dateStr;
  },

  getTodayISO() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  },

  getCompletedPlansStorageKey() {
    return `routines_completed_plans_${this.getTodayISO()}`;
  },

  getCompletedPlansToday() {
    try {
      const raw = localStorage.getItem(this.getCompletedPlansStorageKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  getPlanUniqueKey(plan) {
    if (!plan) return "";
    if (plan.id && String(plan.id).trim() !== "") return String(plan.id);
    const pDate = this.normalizeISO(plan.isoTarih || plan.tarih || "");
    const pTitle = plan.plan || plan.baslik || "";
    const pTime = plan.saat || plan.baslangicSaat || "";
    return `${pDate}_${pTitle}_${pTime}`;
  },

  togglePlanCompleted(planKey, event) {
    if (event) event.stopPropagation();
    if (!planKey) return;
    const completedList = this.getCompletedPlansToday();
    const idx = completedList.indexOf(planKey);
    if (idx === -1) {
      completedList.push(planKey);
    } else {
      completedList.splice(idx, 1);
    }
    localStorage.setItem(this.getCompletedPlansStorageKey(), JSON.stringify(completedList));
    this.renderDailySummaryNote();
  },

  renderDailySummaryNote() {
    const listEl = document.getElementById("noteTodoList");
    const drawerListEl = document.getElementById("drawerNoteTodoList");
    const dateTagEl = document.getElementById("noteDateTag");
    const drawerDateTagEl = document.getElementById("drawerNoteDateTag");

    if (dateTagEl) dateTagEl.textContent = "Bugün";
    if (drawerDateTagEl) drawerDateTagEl.textContent = "Bugün";

    const todayISO = this.getTodayISO();
    let todayPlans = this.plans.filter(p => {
      const pIso = this.normalizeISO(p.isoTarih || p.tarih);
      return pIso === todayISO;
    });

    if (!Auth.currentUser) {
      todayPlans = [];
    }

    const completedList = this.getCompletedPlansToday();

    let html = "";
    if (todayPlans.length > 0) {
      todayPlans.forEach(plan => {
        const planTitle = plan.plan || plan.baslik || "Plan";
        const planTime = plan.saat || plan.baslangicSaat || "";
        const planKey = this.getPlanUniqueKey(plan);
        const isCompleted = completedList.includes(planKey);
        const timeStr = planTime ? `<span class="note-todo-time">(${planTime})</span>` : "";

        html += `
          <div class="note-todo-item ${isCompleted ? 'completed' : ''}" onclick="Calendar.togglePlanCompleted('${planKey}', event)" title="${isCompleted ? 'Tamamlandı (Geri almak için tıkla)' : 'Tamamlandı olarak işaretle'}">
            <div class="note-checkbox"></div>
            <div class="note-todo-content">
              <span class="note-todo-text">${planTitle}</span>
              ${timeStr}
            </div>
          </div>
        `;
      });
    } else {
      html = `
        <div class="note-empty-state">
          Bugün yeni başlangıçlar için harika bir gün ✨
        </div>
      `;
    }

    if (listEl) listEl.innerHTML = html;
    if (drawerListEl) drawerListEl.innerHTML = html;
  },

  updateStats() {
    this.renderDailySummaryNote();
  },

  renderMiniCalendar() {
    const grid = document.getElementById("miniCalendarGrid");
    const monthBadge = document.getElementById("miniCalCurrentMonth");
    if (!grid) return;

    // Hızlı takvim HER ZAMAN içinde bulunduğumuz gerçek güncel ayı gösterir
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    if (monthBadge) {
      monthBadge.textContent = `${this.monthNames[month]} ${year}`;
      monthBadge.style.cursor = "pointer";
      monthBadge.title = "Aylık görünüme geçmek için tıklayın";
      monthBadge.onclick = () => this.jumpToDate(year, month, 1, "month");
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayIndex = firstDay.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const totalDays = lastDay.getDate();
    const isThisMonth = true;

    let html = `
      <div class="mini-cal-day-name">P</div>
      <div class="mini-cal-day-name">S</div>
      <div class="mini-cal-day-name">Ç</div>
      <div class="mini-cal-day-name">P</div>
      <div class="mini-cal-day-name">C</div>
      <div class="mini-cal-day-name">C</div>
      <div class="mini-cal-day-name">P</div>
    `;

    for (let i = 0; i < startDayIndex; i++) {
      html += `<div class="mini-cal-cell" style="opacity: 0.15;">•</div>`;
    }

    for (let d = 1; d <= totalDays; d++) {
      const isToday = today.getDate() === d;
      const isSelected = this.currentDate.getFullYear() === year && this.currentDate.getMonth() === month && this.currentDate.getDate() === d;
      const isoStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const hasPlans = this.plans.some(p => p.isoTarih === isoStr);
      const spEvents = this.getSpecialEventsForDate(year, month, d);
      const isBday = spEvents.some(s => s.isBirthday);
      const hasSpecial = spEvents.length > 0;

      let specialTitle = `${d} ${this.monthNames[month]} programına git`;
      if (isBday) specialTitle = `🎂 Doğum Gününüz! (${d} ${this.monthNames[month]})`;
      else if (hasSpecial) specialTitle = `${spEvents[0].title} (${d} ${this.monthNames[month]})`;

      html += `
        <div class="mini-cal-cell ${isToday ? 'today' : ''} ${isSelected && !isToday ? 'selected' : ''} ${hasPlans || hasSpecial ? 'has-plans' : ''}" style="${isBday ? 'color:#f472b6; font-weight:700;' : ''}" title="${specialTitle}" onclick="Calendar.jumpToDate(${year}, ${month}, ${d}, 'day')">
          ${d}
        </div>
      `;
    }

    // Son haftanın eksik günlerini simetrik olarak doldur
    const totalFilled = startDayIndex + totalDays;
    const remainingSlots = (7 - (totalFilled % 7)) % 7;
    for (let i = 0; i < remainingSlots; i++) {
      html += `<div class="mini-cal-cell" style="opacity: 0.15; cursor: default;">•</div>`;
    }

    grid.innerHTML = html;
  },

  jumpToDate(year, month, day, view = "day") {
    this.currentDate = new Date(year, month, day);
    if (view) {
      this.currentView = view;
      document.querySelectorAll(".view-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.view === view);
      });
    }
    this.render();
    if (window.innerWidth <= 900) {
      document.querySelector(".main-content-panel")?.scrollIntoView({ behavior: "smooth" });
    }
  },

  jumpToToday(view = "day") {
    const today = new Date();
    this.jumpToDate(today.getFullYear(), today.getMonth(), today.getDate(), view);
  },

  updateStats() {
    const totalPlansEl = document.getElementById("statTotalPlans");
    const activeRemindersEl = document.getElementById("statActiveReminders");
    const todayPillEl = document.getElementById("todayDatePill");

    const drawerTotalPlansEl = document.getElementById("drawerStatTotalPlans");
    const drawerActiveRemindersEl = document.getElementById("drawerStatActiveReminders");
    const drawerTodayPillEl = document.getElementById("drawerTodayDatePill");

    const totalCount = this.plans.length;
    let reminderCount = 0;
    this.plans.forEach(p => {
      if (p.hatirlaticilar && p.hatirlaticilar.length) {
        reminderCount += p.hatirlaticilar.length;
      }
    });
    const today = new Date();
    const todayFormatted = `${today.getDate()} ${this.monthNames[today.getMonth()]}`;

    if (totalPlansEl) totalPlansEl.textContent = totalCount;
    if (activeRemindersEl) activeRemindersEl.textContent = reminderCount;
    if (todayPillEl) todayPillEl.textContent = todayFormatted;

    if (drawerTotalPlansEl) drawerTotalPlansEl.textContent = totalCount;
    if (drawerActiveRemindersEl) drawerActiveRemindersEl.textContent = reminderCount;
    if (drawerTodayPillEl) drawerTodayPillEl.textContent = todayFormatted;
  },

  updateHeaderTitle() {
    const titleEl = document.getElementById("navDateTitle");
    if (!titleEl) return;

    const isMobile = window.innerWidth <= 1024;
    const year = this.currentDate.getFullYear();
    const month = this.monthNames[this.currentDate.getMonth()];
    const day = this.currentDate.getDate();

    if (this.currentView === "month") {
      titleEl.innerHTML = `<span>${month} ${year}</span>`;
    } else if (this.currentView === "week") {
      const weekRange = this.getWeekRange(this.currentDate);
      titleEl.innerHTML = `<span>${weekRange.startText} – ${weekRange.endText}</span>`;
    } else if (this.currentView === "day") {
      titleEl.innerHTML = `<span>${day} ${month} ${year}</span>`;
    } else if (this.currentView === "year") {
      titleEl.innerHTML = `<span>${year}</span>`;
    }
  },

  // ---------------------------------------------------------
  // AYLIK GÖRÜNÜM (Grid & Dikey)
  // ---------------------------------------------------------
  renderMonthGrid(container) {
    const isMobileDevice = window.innerWidth <= 1024;
    const activeYear = this.currentDate.getFullYear();
    const activeMonth = this.currentDate.getMonth();
    const today = new Date();
    const todayStr = this.formatDateISO(today);

    if (isMobileDevice) {
      let html = `<div class="continuous-months-container" id="continuousMonthsContainer">`;

      for (let m = 0; m < 12; m++) {
        const firstDay = new Date(activeYear, m, 1);
        const lastDay = new Date(activeYear, m + 1, 0);

        let startDayIndex = firstDay.getDay() - 1;
        if (startDayIndex === -1) startDayIndex = 6;

        const totalDays = lastDay.getDate();
        const prevMonthLastDay = new Date(activeYear, m, 0).getDate();

        const isCurrentActiveMonth = (m === activeMonth);
        const isRealTodayMonth = (m === today.getMonth() && activeYear === today.getFullYear());

        html += `
          <section class="month-stream-section ${isCurrentActiveMonth ? 'is-active-month' : ''}" id="month-section-${activeYear}-${m}">
            <div class="month-stream-header">
              <h3 class="month-stream-title">
                ${this.monthNames[m]} <span class="month-stream-year">${activeYear}</span>
              </h3>
              ${isRealTodayMonth ? `<span class="badge-today-pill">Bu Ay</span>` : ''}
            </div>

            <div class="month-grid-wrapper mobile-boxless-wrapper">
              <div class="month-days-header">
                ${this.shortDayNames.map(s => `
                  <div class="month-day-header-cell">${s[0]}</div>
                `).join("")}
              </div>
              <div class="month-days-grid mobile-pure-dates-grid">
        `;

        for (let i = startDayIndex - 1; i >= 0; i--) {
          const dNum = prevMonthLastDay - i;
          html += `
            <div class="day-cell other-month">
              <div class="day-number-circle other">${dNum}</div>
            </div>
          `;
        }

        for (let d = 1; d <= totalDays; d++) {
          const currentCellDate = new Date(activeYear, m, d);
          const isoDate = this.formatDateISO(currentCellDate);
          const isToday = isoDate === todayStr;
          const dayPlans = this.getPlansForDate(isoDate);
          const specialEvents = this.getSpecialEventsForDate(activeYear, m, d);

          html += `
            <div class="day-cell ${isToday ? 'today' : ''} ${dayPlans.length > 0 ? 'has-plans' : ''}" onclick="Calendar.goToDayView('${isoDate}')" title="${d} ${this.monthNames[m]} gününü aç">
              <div class="day-cell-top">
                <div class="day-number-circle ${isToday ? 'is-today' : ''}">
                  ${d}
                </div>
                ${specialEvents.length > 0 ? `
                  <span class="special-day-sparkle" title="${specialEvents[0].title}">
                    ${specialEvents[0].isBirthday ? '🎂' : '🇹🇷'}
                  </span>
                ` : ''}
              </div>

              <div class="day-event-dots-row">
                ${dayPlans.slice(0, 3).map(p => `
                  <span class="event-dot dot-${p.kategori || 'Genel'}" title="${p.saat || ''} ${p.plan || ''}"></span>
                `).join("")}
                ${dayPlans.length > 3 ? `<span class="event-dot dot-more">+</span>` : ''}
              </div>
            </div>
          `;
        }

        html += `</div></div></section>`;
      }

      html += `</div>`;
      container.innerHTML = html;

      const updateMobileVisibleMonthTitle = () => {
        if (Calendar.currentView !== "month" || window.innerWidth > 1024) return;
        const curTitleEl = document.getElementById("navDateTitle");
        if (!curTitleEl) return;

        const headerBottom = 136;
        const scanY = headerBottom + 60;
        const sections = document.querySelectorAll(".month-stream-section");
        let visibleMonth = activeMonth;

        for (let i = 0; i < sections.length; i++) {
          const sec = sections[i];
          const rect = sec.getBoundingClientRect();
          if (rect.top <= scanY && rect.bottom > scanY) {
            const mMatch = sec.id.match(/month-section-(\d+)-(\d+)/);
            if (mMatch) {
              visibleMonth = parseInt(mMatch[2], 10);
            }
            break;
          }
        }

        const newTitle = `${Calendar.monthNames[visibleMonth]} ${activeYear}`;
        if (curTitleEl.textContent.trim() !== newTitle) {
          curTitleEl.innerHTML = `<span>${newTitle}</span>`;
        }
      };

      const executeCinematicMonthGlide = () => {
        const sectionEl = document.getElementById(`month-section-${activeYear}-${activeMonth}`);
        if (!sectionEl) return;

        const gridEl = sectionEl.querySelector(".month-grid-wrapper") || sectionEl;
        const rect = gridEl.getBoundingClientRect();
        const targetTop = Math.max(0, rect.top + window.pageYOffset - 136 - 6);
        const startTop = window.pageYOffset || 0;
        const distance = targetTop - startTop;
        const duration = 800;
        let startTime = null;

        const easeInOutCubic = (t, b, c, d) => {
          t /= d / 2;
          if (t < 1) return (c / 2) * t * t * t + b;
          t -= 2;
          return (c / 2) * (t * t * t + 2) + b;
        };

        const animateGlide = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const currentProgress = Math.min(elapsed, duration);
          const currentScroll = easeInOutCubic(currentProgress, startTop, distance, duration);
          window.scrollTo(0, currentScroll);
          updateMobileVisibleMonthTitle();

          if (elapsed < duration) {
            requestAnimationFrame(animateGlide);
          } else {
            window.scrollTo(0, targetTop);
            updateMobileVisibleMonthTitle();
          }
        };

        requestAnimationFrame(animateGlide);
      };

      setTimeout(executeCinematicMonthGlide, 80);

      window.removeEventListener("scroll", window._calendarMobileScrollSpy);
      window._calendarMobileScrollSpy = updateMobileVisibleMonthTitle;
      window.addEventListener("scroll", updateMobileVisibleMonthTitle, { passive: true });

    } else {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Pazartesi başlangıçlı indeks (0 = Pazartesi, 6 = Pazar)
    let startDayIndex = firstDay.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const totalDays = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    let html = `
      <div class="month-grid-wrapper">
        <div class="month-days-header">
          ${this.dayNames.map(d => `<div>${d}</div>`).join("")}
        </div>
        <div class="month-days-grid">
    `;

    // Önceki aydan kalan günler
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      html += `<div class="day-cell other-month"><span class="day-number">${dNum}</span></div>`;
    }

    // Bu ayın günleri
    const todayStr = this.formatDateISO(new Date());
    for (let d = 1; d <= totalDays; d++) {
      const currentCellDate = new Date(year, month, d);
      const isoDate = this.formatDateISO(currentCellDate);
      const isToday = isoDate === todayStr;
      const dayPlans = this.getPlansForDate(isoDate);
      const specialEvents = this.getSpecialEventsForDate(year, month, d);

      html += `
        <div class="day-cell ${isToday ? 'today' : ''}" onclick="Calendar.goToDayView('${isoDate}')" title="${d} ${this.monthNames[month]} gününe gitmek için tıklayın">
          <div class="day-number-row">
            <span class="day-number">${d}</span>
            ${dayPlans.length > 0 ? `<span class="badge-category cat-Is">${dayPlans.length} plan</span>` : ''}
          </div>
          <div class="day-events-list">
            <!-- Özel Günler ve Doğum Günü Rozetleri -->
            ${specialEvents.map(sp => `
              <div class="${sp.isBirthday ? 'birthday-chip' : 'special-day-chip ' + (sp.type || '')}" title="${sp.title}">
                <span>${sp.title}</span>
              </div>
            `).join("")}
            
            <!-- Plan Özeti (Hücreye tıklanınca doğrudan o güne gider) -->
            ${dayPlans.slice(0, 2).map(p => `
              <div class="event-chip cat-${p.kategori}" title="${p.saat} - ${p.plan}">
                <span class="chip-time">${p.saat}</span>
                <span class="chip-text">${p.plan}</span>
              </div>
            `).join("")}
            ${dayPlans.length > 2 ? `<div class="more-plans-hint">+${dayPlans.length - 2} daha...</div>` : ''}
          </div>
        </div>
      `;
    }

    html += `</div></div>`;
    container.innerHTML = html;
    }
  },

  goToDayView(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    this.currentDate = new Date(y, m - 1, d);
    this.currentView = "day";
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === "day");
    });
    this.render();
  },

  renderMonthVertical(container) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    let html = `<div class="month-vertical-list">`;
    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const isoDate = this.formatDateISO(cellDate);
      const dayPlans = this.getPlansForDate(isoDate);
      const specialEvents = this.getSpecialEventsForDate(year, month, d);
      let dayIndex = cellDate.getDay() - 1;
      if (dayIndex === -1) dayIndex = 6;
      const dayName = this.dayNames[dayIndex];

      html += `
        <div class="vertical-day-row">
          <div class="vertical-date-badge">
            <span class="vertical-date-num">${d} ${this.monthNames[month]}</span>
            <span class="vertical-date-name">${dayName}</span>
          </div>
          <div class="vertical-events-flow">
            ${specialEvents.map(sp => `
              <div class="${sp.isBirthday ? 'birthday-chip' : 'special-day-chip ' + (sp.type || '')}" style="display:inline-flex;">
                <span>${sp.title}</span>
              </div>
            `).join("")}
            ${dayPlans.length === 0 && specialEvents.length === 0 ? `<span style="color: var(--text-tertiary); font-size: 0.8rem;">Plan yok</span>` : ""}
            ${dayPlans.map(p => this.renderPlanCard(p)).join("")}
          </div>
        </div>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;
  },

  // ---------------------------------------------------------
  // HAFTALIK GÖRÜNÜM (Yatay Sütunlar & Dikey Geniş Kartlar)
  // ---------------------------------------------------------
  renderWeekGrid(container) {
    const weekDays = this.getWeekDays(this.currentDate);
    const today = new Date();
    const todayIso = this.formatDateISO(today);

    let html = `<div class="week-grid-container">`;

    weekDays.forEach((dayObj) => {
      const dayPlans = this.getPlansForDate(dayObj.isoDate);
      const dayDate = dayObj.dateObj;
      const isToday = dayObj.isoDate === todayIso;
      const specialEvents = this.getSpecialEventsForDate(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());

      html += `
        <div class="week-column ${isToday ? 'is-today' : ''}">
          <div class="week-col-header" onclick="Calendar.jumpToDate(${dayDate.getFullYear()}, ${dayDate.getMonth()}, ${dayDate.getDate()}, 'day')" title="${dayObj.dateNum} ${dayObj.monthName} gününe git" style="cursor: pointer;">
            <div class="week-col-day">${dayObj.dayName}</div>
            <div class="week-col-date">${dayObj.dateNum}</div>
            ${isToday ? `<span class="badge-today-mini">Bugün</span>` : ''}
          </div>
          <div class="week-events-stack">
            ${specialEvents.map(sp => `
              <div class="${sp.isBirthday ? 'birthday-chip' : 'special-day-chip ' + (sp.type || '')}">
                <span>${sp.title}</span>
              </div>
            `).join("")}
            ${dayPlans.length === 0 && specialEvents.length === 0 ? `
              <div class="week-col-empty" onclick="Calendar.quickAddPlanForSlot('${dayObj.isoDate}')">
                <span>+ Plan Ekle</span>
              </div>
            ` : ""}
            ${dayPlans.map(p => this.renderPlanCard(p)).join("")}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  renderWeekTimeline(container) {
    const weekDays = this.getWeekDays(this.currentDate);
    const today = new Date();
    const todayIso = this.formatDateISO(today);

    let html = `<div class="week-timeline-vertical-list">`;

    weekDays.forEach((dayObj) => {
      const dayPlans = this.getPlansForDate(dayObj.isoDate);
      const dayDate = dayObj.dateObj;
      const isToday = dayObj.isoDate === todayIso;
      const specialEvents = this.getSpecialEventsForDate(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());

      html += `
        <div class="week-day-card ${isToday ? 'is-today' : ''}">
          <div class="week-day-card-header" onclick="Calendar.jumpToDate(${dayDate.getFullYear()}, ${dayDate.getMonth()}, ${dayDate.getDate()}, 'day')" title="${dayObj.dateNum} ${dayObj.monthName} günlük programına git">
            <div class="week-day-date-badge">
              <span class="week-day-num">${dayObj.dateNum}</span>
              <div class="week-day-text-wrap">
                <span class="week-day-name">${dayObj.dayName}</span>
                <span class="week-day-month">${dayObj.monthName}</span>
              </div>
            </div>
            ${isToday ? `<span class="badge-today-pill">Bugün</span>` : ''}
          </div>

          <div class="week-day-card-body">
            ${specialEvents.length > 0 ? `
              <div class="week-day-special-events">
                ${specialEvents.map(sp => `
                  <div class="${sp.isBirthday ? 'birthday-chip' : 'special-day-chip ' + (sp.type || '')}">
                    <span>${sp.title}</span>
                  </div>
                `).join("")}
              </div>
            ` : ''}

            <div class="week-day-plans-flow">
              ${dayPlans.map(p => this.renderPlanCard(p)).join("")}
            </div>
          </div>

          <div class="week-day-card-footer">
            <button type="button" class="btn-quick-add-week" onclick="Calendar.quickAddPlanForSlot('${dayObj.isoDate}')" title="${dayObj.dayName} gününe yeni plan ekle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Plan Ekle</span>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  // ---------------------------------------------------------
  // GÜNLÜK GÖRÜNÜM (Saatlik Bloklar — Tıklayarak Plan Ekleme)
  // ---------------------------------------------------------
  renderDayAgenda(container) {
    const isoDate = this.formatDateISO(this.currentDate);
    const dayPlans = this.getPlansForDate(isoDate);
    const specialEvents = this.getSpecialEventsForDate(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate());

    let html = `
      <div class="day-agenda-wrapper">
        ${specialEvents.length > 0 ? `
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
            ${specialEvents.map(sp => `
              <div class="${sp.isBirthday ? 'birthday-chip' : 'special-day-chip ' + (sp.type || '')}" style="font-size: 0.85rem; padding: 0.4rem 0.85rem;">
                <span>${sp.title}</span>
              </div>
            `).join("")}
          </div>
        ` : ''}
        ${dayPlans.length >= 2 ? `
          <div class="day-ai-optimize-banner">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>✨</span>
              <span style="font-size: 0.825rem; font-weight: 600;">Bu günde ${dayPlans.length} kayıtlı plan bulunuyor.</span>
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="AIAssistant.optimizeDay('${isoDate}')" style="padding: 0.35rem 0.85rem; font-size: 0.8rem;">
              ⚡ Günü AI ile Optimize Et
            </button>
          </div>
        ` : ''}
    `;

    for (let hour = 0; hour <= 23; hour++) {
      const hourStr = hour < 10 ? `0${hour}:00` : `${hour}:00`;
      const nextHour = hour === 23 ? "23:59" : ((hour + 1) < 10 ? `0${hour + 1}:00` : `${hour + 1}:00`);
      const hourPlans = dayPlans.filter(p => p.saat.startsWith(hour < 10 ? `0${hour}` : `${hour}`));

      html += `
        <div class="hourly-slot-row" onclick="Calendar.quickAddPlanForSlot('${isoDate}', '${hourStr}', '${nextHour}')" title="${hourStr} saatine plan eklemek için tıklayın">
          <div class="hour-timestamp">${hourStr}</div>
          <div class="slot-events-container">
            ${hourPlans.map(p => this.renderPlanCard(p)).join("")}
          </div>
        </div>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;
  },

  quickAddPlanForSlot(isoDate, startTime = "09:00", endTime = "10:00") {
    if (!Auth.currentUser) {
      App.showToast("Plan eklemek için lütfen önce giriş yapın!", "warning");
      Auth.openModal("loginModal");
      return;
    }

    const [y, m, d] = isoDate.split("-").map(Number);
    this.currentDate = new Date(y, m - 1, d);

    this.editingPlan = null;
    const titleModal = document.getElementById("addPlanModalTitle");
    const btnSubmit = document.getElementById("btnSubmitPlan");
    if (titleModal) titleModal.textContent = "Yeni Plan Ekle";
    if (btnSubmit) btnSubmit.textContent = "Kaydet & Sırala";

    // 1. Önce formu temizle
    document.getElementById("addPlanForm")?.reset();

    // 2. Ardından tıklanan o günün tarihi ve saat aralığını doldur
    const dateInput = document.getElementById("planDate");
    const startInput = document.getElementById("planStartTime");
    const endInput = document.getElementById("planEndTime");

    if (dateInput) dateInput.value = isoDate;
    if (startInput) startInput.value = startTime;
    if (endInput) endInput.value = endTime;

    this.renderRemindersChecklist(["1_gun_once", "5_saat_once", "1_saat_once"]);
    const cCont = document.getElementById("customRemindersContainer");
    if (cCont) cCont.style.display = "none";
    const toggleBtn = document.getElementById("btnToggleCustomReminder");
    if (toggleBtn) toggleBtn.textContent = "+ Özel Hatırlatıcı Ekle";

    Auth.openModal("addPlanModal");
  },

  quickSelectDate(isoDate) {
    this.quickAddPlanForSlot(isoDate, "09:00", "10:00");
  },

  // ---------------------------------------------------------
  // YILLIK GÖRÜNÜM (Web Tasarımıyla Birebir 12 Ay Genel Bakış)
  // ---------------------------------------------------------
  renderYearOverview(container) {
    const year = this.currentDate.getFullYear();
    let html = `<div class="year-overview-grid">`;

    for (let m = 0; m < 12; m++) {
      const monthDays = new Date(year, m + 1, 0).getDate();
      let firstDayIdx = new Date(year, m, 1).getDay() - 1;
      if (firstDayIdx === -1) firstDayIdx = 6;

      const monthPlans = (this.plans || []).filter(p => {
        if (!p || !p.isoTarih) return false;
        const [pY, pM] = p.isoTarih.split("-").map(Number);
        return pY === year && pM === (m + 1);
      });

      html += `
        <div class="year-month-card" onclick="Calendar.selectYearMonth(${m})" title="${this.monthNames[m]} ayına gitmek için tıklayın">
          <div class="year-month-title">
            <span>${this.monthNames[m]}</span>
          </div>
          <div class="year-mini-grid">
            ${this.shortDayNames.map(s => `<div class="year-mini-header-cell">${s[0]}</div>`).join("")}
            ${Array(firstDayIdx).fill('<div class="year-mini-cell empty"></div>').join("")}
            ${Array.from({ length: monthDays }, (_, i) => {
              const d = i + 1;
              const iso = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const hasEvents = (this.plans || []).some(p => p.isoTarih === iso);
              const spEvents = this.getSpecialEventsForDate ? this.getSpecialEventsForDate(year, m, d) : [];
              const hasSpecial = spEvents.length > 0;
              const isBday = spEvents.some(s => s.isBirthday);

              let cellClass = '';
              if (isBday) cellClass = 'is-birthday';
              else if (hasEvents) cellClass = 'has-plan';
              else if (hasSpecial) cellClass = 'is-special';

              return `<div class="year-mini-cell ${cellClass}" title="${this.monthNames[m]} ayına git"><span>${d}</span></div>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  },

  selectYearMonth(monthIndex) {
    const year = this.currentDate.getFullYear();
    this.currentDate = new Date(year, monthIndex, 1);
    this.currentView = "month";
    document.querySelectorAll(".view-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.view === "month");
    });
    this.render();

    // Aylık görünüme geçince doğrudan tıklanan aya (ör. Ocak) odaklan ve başlığı güncelle
    setTimeout(() => {
      const isMobile = window.innerWidth <= 1024;
      if (isMobile) {
        const targetEl = document.getElementById(`month-section-${year}-${monthIndex}`);
        if (targetEl) {
          const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: targetTop, behavior: "smooth" });
        }
      }
      const titleEl = document.getElementById("navDateTitle");
      if (titleEl) {
        titleEl.innerHTML = `<span>${this.monthNames[monthIndex]} ${year}</span>`;
      }
    }, 60);
  },

  renderPlanCard(plan) {
    const remindersText = (plan.hatirlaticilar || []).map(r => {
      if (r === "1_gun_once") return "1 gün önce";
      if (r === "5_saat_once") return "5 saat önce";
      if (r === "1_saat_once") return "1 saat önce";
      
      let val = parseInt(r, 10);
      let unitName = "dakika";
      if (r.includes("saat")) unitName = "saat";
      else if (r.includes("gun") || r.includes("gün")) unitName = "gün";
      else if (r.includes("hafta")) unitName = "hafta";
      else if (r.includes("dakika")) unitName = "dakika";

      if (!isNaN(val) && val > 0) {
        return `${val} ${unitName} önce`;
      }
      return r.replace(/_/g, " ").replace("once", "önce");
    }).join(", ");

    return `
      <div class="plan-card" onclick="event.stopPropagation(); Calendar.openEditPlanModal('${plan.id}', event)" title="Planı düzenlemek için tıklayın" style="cursor: pointer;">
        <div class="plan-card-header">
          <span class="badge-category cat-${plan.kategori || 'Genel'}">${plan.kategori || 'Genel'}</span>
          <button class="action-btn-del" onclick="event.stopPropagation(); Calendar.deletePlan('${plan.id}')" title="Planı Sil">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="plan-title">${plan.plan}</div>
        <div class="plan-card-meta">
          <span class="meta-time">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>${plan.saat} – ${plan.bitisSaati || ''}
          </span>
          ${remindersText ? `<span class="meta-reminder" title="Hatırlatıcılar: ${remindersText}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 2px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> ${remindersText}</span>` : ''}
        </div>
      </div>
    `;
  },

  renderEmptyState() {
    const container = document.getElementById("calendarViewContent");
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3>Planlarınızı Görüntülemek İçin Giriş Yapın</h3>
          <p>Kullanıcı hesabınızla giriş yaparak günlük plan ve rutinlerinizi yönetebilirsiniz.</p>
          <button class="btn btn-primary" onclick="Auth.openModal('loginModal')">Oturum Aç</button>
        </div>
      `;
    }
  },

  getPlansForDate(isoDate) {
    return this.plans.filter(p => {
      const pIso = this.normalizeISO(p.isoTarih || p.tarih);
      return pIso === isoDate;
    });
  },

  formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },

  getWeekDays(baseDate) {
    const curr = new Date(baseDate);
    let day = curr.getDay() - 1;
    if (day === -1) day = 6;
    const monday = new Date(curr.setDate(curr.getDate() - day));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push({
        dateObj: nextDay,
        isoDate: this.formatDateISO(nextDay),
        dateNum: nextDay.getDate(),
        monthName: this.monthNames[nextDay.getMonth()],
        dayName: this.dayNames[i]
      });
    }
    return week;
  },

  getWeekRange(baseDate) {
    const days = this.getWeekDays(baseDate);
    const start = days[0];
    const end = days[6];
    return {
      startText: `${start.dateNum} ${start.monthName}`,
      endText: `${end.dateNum} ${end.monthName} ${end.dateObj.getFullYear()}`
    };
  }
};
