/**
 * CORE APP COORDINATOR & THEME MANAGER
 */

const App = {
  currentTheme: "obsidian",

  init() {
    this.initTheme();
    this.initResizer();
    this.bindGlobalEvents();
    this.loadHoroscopeQuote();

    // Modülleri başlat
    Auth.init();
    Calendar.init();
    Reminders.init();
    if (typeof AIAssistant !== "undefined") {
      AIAssistant.init();
    }
  },

  initResizer() {
    const resizer = document.getElementById("layoutResizer");
    const sidebar = document.querySelector(".sidebar-panel");
    const layoutGrid = document.querySelector(".app-layout-grid");
    if (!resizer || !sidebar || !layoutGrid) return;

    // Kayıtlı genişliği yükle (varsayılan: 350px - tam kıvamında orta genişlik)
    const savedWidth = localStorage.getItem("routines_sidebar_width") || "350";
    document.documentElement.style.setProperty("--sidebar-width", `${savedWidth}px`);

    let isDragging = false;

    const onMouseDown = (e) => {
      isDragging = true;
      resizer.classList.add("is-dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      sidebar.style.transition = "none";
      if (!e.type.includes("touch")) e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      const gridRect = layoutGrid.getBoundingClientRect();
      let newWidth = Math.round(clientX - gridRect.left);

      const minW = 260;
      const maxW = 750;

      if (newWidth < minW) newWidth = minW;
      if (newWidth > maxW) newWidth = maxW;

      document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);
      localStorage.setItem("routines_sidebar_width", newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      resizer.classList.remove("is-dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      sidebar.style.transition = "";
    };

    resizer.addEventListener("mousedown", onMouseDown);
    resizer.addEventListener("touchstart", onMouseDown, { passive: true });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onMouseMove, { passive: true });

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onMouseUp);
  },

  initTheme() {
    const savedTheme = localStorage.getItem("daily_routine_theme") || "obsidian";
    this.setTheme(savedTheme);

    const checkbox = document.getElementById("themeToggleCheckbox");
    if (checkbox) {
      checkbox.addEventListener("change", (e) => {
        const targetTheme = e.target.checked ? "obsidian" : "nordic";
        this.setTheme(targetTheme);
      });
    }

    const labelLight = document.getElementById("labelThemeLight");
    const labelDark = document.getElementById("labelThemeDark");
    if (labelLight) labelLight.addEventListener("click", () => this.setTheme("nordic"));
    if (labelDark) labelDark.addEventListener("click", () => this.setTheme("obsidian"));
  },

  setTheme(themeName) {
    this.currentTheme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("daily_routine_theme", themeName);

    const checkbox = document.getElementById("themeToggleCheckbox");
    if (checkbox) {
      checkbox.checked = (themeName === "obsidian");
    }

    const labelLight = document.getElementById("labelThemeLight");
    const labelDark = document.getElementById("labelThemeDark");
    if (labelLight) labelLight.classList.toggle("active", themeName === "nordic");
    if (labelDark) labelDark.classList.toggle("active", themeName === "obsidian");
  },

  bindGlobalEvents() {
    // Haydi Gününü Planla Butonu (Açılış Ekranı Yönlendirmesi)
    const startPlanningBtn = document.getElementById("startPlanningBtn");
    const aiFabBtn = document.getElementById("fabAiAssistantBtn");
    const heroScreen = document.getElementById("welcomeHeroScreen");

    if (heroScreen && !heroScreen.classList.contains("hidden") && aiFabBtn) {
      aiFabBtn.style.display = "none";
    }

    if (startPlanningBtn) {
      startPlanningBtn.addEventListener("click", () => {
        if (heroScreen) {
          heroScreen.classList.add("hidden");
        }
        if (aiFabBtn) {
          setTimeout(() => { aiFabBtn.style.display = "flex"; }, 300);
        }
        if (typeof Calendar !== "undefined" && Calendar.triggerMobileGlide) {
          setTimeout(() => Calendar.triggerMobileGlide(), 60);
        }
      });
    }

    // TXT Dosyası Olarak İndirme Butonu
    const exportBtn = document.getElementById("exportTxtBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        if (!Auth.currentUser) {
          this.showToast("Dosyayı indirmek için lütfen giriş yapın!", "warning");
          return;
        }
        window.location.href = "/api/export-txt";
      });
    }

    // Çekmece (Drawer) Menü Kontrolleri
    const openDrawerBtn = document.getElementById("btnOpenSideDrawer");
    const closeDrawerBtn = document.getElementById("btnCloseSideDrawer");
    const backdrop = document.getElementById("drawerBackdrop");

    if (openDrawerBtn) openDrawerBtn.addEventListener("click", () => this.openDrawer());
    if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", () => this.closeDrawer());
    if (backdrop) backdrop.addEventListener("click", () => this.closeDrawer());

    // Burç Yorumu Akordeon Toggle Butonu
    const toggleHoroscopeBtn = document.getElementById("btnToggleHoroscope");
    if (toggleHoroscopeBtn) {
      toggleHoroscopeBtn.addEventListener("click", () => this.toggleHoroscope());
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeDrawer();
      }
    });
  },

  toggleHoroscope() {
    const box = document.getElementById("drawerHoroscopeBox");
    const body = document.getElementById("drawerHoroscopeContent");
    const chevron = document.getElementById("horoscopeChevron");
    const btnTitle = document.getElementById("btnHoroscopeTitle");
    if (!body) return;

    const isHidden = body.style.display === "none" || !body.style.display;
    if (isHidden) {
      body.style.display = "flex";
      if (chevron) chevron.style.transform = "rotate(180deg)";
      if (btnTitle) btnTitle.textContent = "Günlük Burç Yorumunu Gizle";
      this.loadHoroscopeQuote();
      setTimeout(() => {
        box?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    } else {
      body.style.display = "none";
      if (chevron) chevron.style.transform = "rotate(0deg)";
      if (btnTitle) btnTitle.textContent = "Günlük Burç Yorumunu Görüntüle";
    }
  },

  openDrawer() {
    document.getElementById("drawerBackdrop")?.classList.add("active");
    document.getElementById("sideMenuDrawer")?.classList.add("active");
    this.updateDrawerUser();

    // Desktop vs Mobile visibility for drawer note
    const drawerNote = document.getElementById("drawerStickyNoteWidget");
    if (drawerNote) {
      if (window.innerWidth > 1024) {
        drawerNote.style.setProperty("display", "none", "important");
      } else {
        drawerNote.style.setProperty("display", "flex", "important");
      }
    }
  },

  closeDrawer() {
    document.getElementById("drawerBackdrop")?.classList.remove("active");
    document.getElementById("sideMenuDrawer")?.classList.remove("active");
  },

  updateDrawerUser() {
    const avatarEl = document.getElementById("drawerAvatarText");
    const nameEl = document.getElementById("drawerUsername");
    const statusEl = document.getElementById("drawerUserStatus");
    const authBtn = document.getElementById("drawerAuthActionBtn");

    if (Auth.currentUser) {
      if (avatarEl) avatarEl.textContent = Auth.currentUser.charAt(0).toUpperCase();
      if (nameEl) nameEl.textContent = Auth.currentUser;
      if (statusEl) statusEl.textContent = "Aktif Oturum";
      if (authBtn) {
        authBtn.textContent = "Oturumu Kapat";
        authBtn.className = "btn btn-outline btn-sm";
      }
    } else {
      if (avatarEl) avatarEl.textContent = "G";
      if (nameEl) nameEl.textContent = "Misafir Kullanıcı";
      if (statusEl) statusEl.textContent = "Giriş yapılmadı";
      if (authBtn) {
        authBtn.textContent = "Giriş Yap / Kayıt Ol";
        authBtn.className = "btn btn-primary btn-sm";
      }
    }
  },

  handleDrawerAuthBtn() {
    this.closeDrawer();
    if (Auth.currentUser) {
      Auth.handleLogout();
    } else {
      Auth.openModal("loginModal");
    }
  },

  async loadHoroscopeQuote() {
    const badgeEl = document.getElementById("horoscopeBadgeText");
    const dateEl = document.getElementById("horoscopeDateTag");
    const quoteEl = document.getElementById("horoscopeQuoteText");
    const mottoEl = document.getElementById("horoscopeMottoText");
    const symbolEl = document.getElementById("horoscopeSymbol");

    const drawerBadge = document.getElementById("drawerHoroscopeBadge");
    const drawerText = document.getElementById("drawerHoroscopeText");

    if (!Auth.currentUser) return;

    try {
      const response = await fetch("/api/horoscope");
      const result = await response.json();

      if (result.status === "success" && result.data) {
        const d = result.data;
        if (badgeEl) badgeEl.textContent = `${d.simge} ${d.burc} Burcu`;
        if (dateEl) dateEl.textContent = d.tarih;
        if (quoteEl) quoteEl.textContent = `"${d.yorum}"`;
        if (mottoEl) mottoEl.textContent = `💡 Günün İlhamı: ${d.motto}`;
        if (symbolEl) symbolEl.textContent = d.simge;

        if (drawerBadge) drawerBadge.textContent = `${d.simge} ${d.burc} Burcu`;
        if (drawerText) drawerText.textContent = `"${d.yorum}"`;
      }
    } catch (e) {
      console.log("Burç yorumu yüklenemedi:", e);
    }
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    if (type === "success") iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    if (type === "error") iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    if (type === "warning") iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

    toast.innerHTML = `
      <span style="display: inline-flex; align-items: center; flex-shrink: 0;">${iconHtml}</span>
      <span style="font-size: 0.85rem; font-weight: 500;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
