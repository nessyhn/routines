/**
 * SMART REMINDER & NOTIFICATION WORKER
 * 1 gün önce, 5 saat önce, 1 saat önce ve özel dakikalar için otomatik hatırlatıcı motoru.
 */

const Reminders = {
  plans: [],
  checkedNotifications: new Set(),
  checkInterval: null,

  init() {
    this.requestNotificationPermission();
    // Her 30 saniyede bir hatırlatıcıları kontrol et
    this.checkInterval = setInterval(() => this.checkUpcomingReminders(), 30000);
  },

  syncPlans(plansList) {
    this.plans = plansList || [];
    this.checkUpcomingReminders();
  },

  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  },

  checkUpcomingReminders() {
    const now = new Date();

    this.plans.forEach((plan) => {
      if (!plan.isoTarih) return;

      const timeStr = plan.saat || "09:00";
      const [year, month, day] = plan.isoTarih.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);

      const eventDate = new Date(year, month - 1, day, hours, minutes, 0);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 0) return; // Geçmiş plan

      const activeReminders = plan.hatirlaticilar || ["1_gun_once", "5_saat_once", "1_saat_once"];

      activeReminders.forEach((remType) => {
        let targetMinutes = 0;
        let label = "";

        if (remType === "1_gun_once") {
          targetMinutes = 24 * 60; // 1440 dk
          label = "1 gün sonra";
        } else if (remType === "5_saat_once") {
          targetMinutes = 5 * 60; // 300 dk
          label = "5 saat sonra";
        } else if (remType === "1_saat_once") {
          targetMinutes = 60; // 60 dk
          label = "1 saat sonra";
        } else if (remType.includes("_dakika_once")) {
          const val = parseInt(remType.split("_")[0]) || 15;
          targetMinutes = val;
          label = `${val} dakika sonra`;
        } else if (remType.includes("_saat_once")) {
          const val = parseInt(remType.split("_")[0]) || 1;
          targetMinutes = val * 60;
          label = `${val} saat sonra`;
        } else if (remType.includes("_gun_once")) {
          const val = parseInt(remType.split("_")[0]) || 1;
          targetMinutes = val * 24 * 60;
          label = `${val} gün sonra`;
        } else if (remType.includes("_hafta_once")) {
          const val = parseInt(remType.split("_")[0]) || 1;
          targetMinutes = val * 7 * 24 * 60;
          label = `${val} hafta sonra`;
        }

        // Eğer hedeflenen hatırlatma aralığına girdiysek (örn. 5 dakika tolerans ile)
        if (diffMinutes <= targetMinutes && diffMinutes > (targetMinutes - 5)) {
          const notifKey = `${plan.id}_${remType}_${plan.tarih}`;
          if (!this.checkedNotifications.has(notifKey)) {
            this.checkedNotifications.add(notifKey);
            this.triggerAlert(plan, label);
          }
        }
      });
    });
  },

  triggerAlert(plan, timeLabel) {
    const title = `🔔 Plan Hatırlatması (${timeLabel})`;
    const message = `"${plan.plan}" planınızın saati yaklaşıyor! (${plan.saat})`;

    // 1. Arayüz içi Toast Bildirimi
    App.showToast(`${title}: ${message}`, "warning");

    // 2. Sesli Uyarı
    this.playChime();

    // 3. Tarayıcı Masaüstü Bildirimi (Web Notification API)
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          icon: "/static/favicon.ico"
        });
      } catch (e) {
        console.log("Tarayıcı bildirimi gösterilemedi:", e);
      }
    }
  },

  playChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // AudioContext engellendiğinde sessizce geç
    }
  }
};
