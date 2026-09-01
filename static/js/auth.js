/**
 * AUTH & USER SECURITY CONTROLLER
 * Giriş, Kayıt, Şifremi Unuttum ve Profil / Ayarlar yöneticisi.
 */

const Auth = {
  currentUser: null,
  userData: null,

  init() {
    this.bindEvents();
    this.checkSession();
  },

  bindEvents() {
    // 1. Giriş, Kayıt, Şifremi Unuttum & Ayarlar Formları
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const forgotStep1Form = document.getElementById("forgotStep1Form");
    const forgotStep2Form = document.getElementById("forgotStep2Form");
    const settingsForm = document.getElementById("settingsForm");

    if (loginForm) loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    if (registerForm) registerForm.addEventListener("submit", (e) => this.handleRegister(e));
    if (forgotStep1Form) forgotStep1Form.addEventListener("submit", (e) => this.handleSendForgotCode(e));
    if (forgotStep2Form) forgotStep2Form.addEventListener("submit", (e) => this.handleVerifyAndResetPassword(e));
    if (settingsForm) settingsForm.addEventListener("submit", (e) => this.handleSettingsUpdate(e));

    const btnBackToForgotStep1 = document.getElementById("btnBackToForgotStep1");
    if (btnBackToForgotStep1) {
      btnBackToForgotStep1.addEventListener("click", (e) => {
        e.preventDefault();
        this.resetForgotModalStep(1);
      });
    }

    // Canlı Şifre Kontrolleri
    const regPasswordInput = document.getElementById("regPassword");
    if (regPasswordInput) {
      regPasswordInput.addEventListener("input", (e) => this.validatePasswordLive(e.target.value, "reg"));
    }

    const forgotNewPassInput = document.getElementById("forgotNewPassword");
    if (forgotNewPassInput) {
      forgotNewPassInput.addEventListener("input", (e) => this.validatePasswordLive(e.target.value, "forgot"));
    }

    const setPasswordInput = document.getElementById("setNewPassword");
    if (setPasswordInput) {
      setPasswordInput.addEventListener("input", (e) => {
        if (e.target.value.trim().length > 0) {
          document.getElementById("settingsPasswordRequirements")?.style.setProperty("display", "block");
          this.validatePasswordLive(e.target.value, "settings");
        } else {
          document.getElementById("settingsPasswordRequirements")?.style.setProperty("display", "none");
        }
      });
    }

    // Çıkış Butonları (Header ve Ayarlar Modalı)
    const logoutBtn = document.getElementById("logoutBtn");
    const modalLogoutBtn = document.getElementById("modalLogoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => this.handleLogout());
    if (modalLogoutBtn) modalLogoutBtn.addEventListener("click", () => this.handleLogout());

    // Ayarlar Modalını Açma (Profil Rozeti ve Varsa Diğer Butonlar)
    const openSettingsBtn = document.getElementById("openSettingsBtn");
    const openSettingsBadgeBtn = document.getElementById("openSettingsBadgeBtn");
    if (openSettingsBtn) openSettingsBtn.addEventListener("click", () => this.openSettingsModal());
    if (openSettingsBadgeBtn) openSettingsBadgeBtn.addEventListener("click", () => this.openSettingsModal());

    // Modal Açma & Geçiş Tetikleyicileri
    const openLoginBtn = document.getElementById("openLoginModalBtn");
    const openRegBtn = document.getElementById("openRegisterModalBtn");
    const switchToRegister = document.getElementById("switchToRegister");
    const switchToLogin = document.getElementById("switchToLogin");
    const openForgotBtn = document.getElementById("openForgotModalBtn");
    const backToLoginFromForgot = document.getElementById("backToLoginFromForgot");

    if (openLoginBtn) openLoginBtn.addEventListener("click", () => this.openModal("loginModal"));
    if (openRegBtn) openRegBtn.addEventListener("click", () => this.openModal("registerModal"));

    if (switchToRegister) {
      switchToRegister.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeModal("loginModal");
        this.openModal("registerModal");
      });
    }

    if (switchToLogin) {
      switchToLogin.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeModal("registerModal");
        this.openModal("loginModal");
      });
    }

    if (openForgotBtn) {
      openForgotBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeModal("loginModal");
        this.resetForgotModalStep(1);
        this.openModal("forgotPasswordModal");
      });
    }

    if (backToLoginFromForgot) {
      backToLoginFromForgot.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeModal("forgotPasswordModal");
        this.openModal("loginModal");
      });
    }

    // Modal Kapatma
    document.querySelectorAll(".modal-close, .modal-cancel").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".modal-overlay").forEach((m) => m.classList.remove("active"));
      });
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  },

  openSettingsModal() {
    if (!this.userData) return;
    document.getElementById("setUsername").value = this.userData.kullaniciAdi || "";
    document.getElementById("setEmail").value = this.userData.gmail || "";
    document.getElementById("setBirthDate").value = this.userData.dogumTarihi || "";
    document.getElementById("setCurrentPassword").value = "";
    document.getElementById("setNewPassword").value = "";
    document.getElementById("settingsPasswordRequirements")?.style.setProperty("display", "none");
    this.openModal("settingsModal");
  },

  /**
   * Python sınıfındaki 5 temel güvenlik kuralı (Türkçe ve özel karakter destekli)
   */
  validatePasswordLive(password, prefix = "reg") {
    const rules = {
      length: password.length >= 8,
      upper: /[A-ZÇĞİÖŞÜ]/.test(password),
      lower: /[a-zçğıöşü]/.test(password),
      digit: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/.test(password)
    };

    this.updateReqItem(`${prefix}-req-length`, rules.length);
    this.updateReqItem(`${prefix}-req-upper`, rules.upper);
    this.updateReqItem(`${prefix}-req-lower`, rules.lower);
    this.updateReqItem(`${prefix}-req-digit`, rules.digit);
    this.updateReqItem(`${prefix}-req-special`, rules.special);

    return Object.values(rules).every(Boolean);
  },

  updateReqItem(elementId, isValid) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (isValid) {
      el.classList.add("valid");
      el.classList.remove("invalid");
      const icon = el.querySelector(".req-icon");
      if (icon) icon.textContent = "✓";
    } else {
      el.classList.remove("valid");
      el.classList.add("invalid");
      const icon = el.querySelector(".req-icon");
      if (icon) icon.textContent = "•";
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const birthDate = document.getElementById("regBirthDate").value.trim();
    const password = document.getElementById("regPassword").value;

    if (!this.validatePasswordLive(password, "reg")) {
      App.showToast("Şifreniz tüm güvenlik kurallarını sağlamalıdır!", "warning");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kullaniciAdi: username,
          sifre: password,
          gmail: email,
          dogumTarihi: birthDate
        })
      });

      const result = await response.json();
      if (response.ok) {
        App.showToast("Kayıt başarılı! Hoş geldiniz, " + username, "success");
        this.closeModal("registerModal");
        this.checkSession();
      } else {
        App.showToast(result.message || "Kayıt sırasında hata oluştu", "error");
      }
    } catch (err) {
      App.showToast("Sunucu ile bağlantı kurulamadı!", "error");
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kullaniciAdi: username,
          sifre: password
        })
      });

      const result = await response.json();
      if (response.ok) {
        App.showToast("Giriş yapıldı! Hoş geldiniz, " + username, "success");
        this.closeModal("loginModal");
        this.checkSession();
      } else {
        App.showToast(result.message || "Kullanıcı adı veya şifre yanlış!", "error");
      }
    } catch (err) {
      App.showToast("Giriş yapılamadı, sunucu kapalı olabilir", "error");
    }
  },

  resetForgotModalStep(step = 1) {
    const step1Form = document.getElementById("forgotStep1Form");
    const step2Form = document.getElementById("forgotStep2Form");
    const modalTitle = document.getElementById("forgotModalTitle");

    if (step === 1) {
      if (step1Form) step1Form.style.display = "block";
      if (step2Form) step2Form.style.display = "none";
      if (modalTitle) modalTitle.textContent = "Şifremi Sıfırla";
    } else {
      if (step1Form) step1Form.style.display = "none";
      if (step2Form) step2Form.style.display = "block";
      if (modalTitle) modalTitle.textContent = "Onay Kodu & Yeni Şifre";
    }
  },

  async handleSendForgotCode(e) {
    e.preventDefault();
    const username = document.getElementById("forgotUsername").value.trim();
    const email = document.getElementById("forgotEmail").value.trim();
    const btn = document.getElementById("btnSendForgotCode");

    if (!username || !email) {
      App.showToast("Lütfen kullanıcı adı ve e-posta adresinizi girin!", "warning");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Gönderiliyor...";
    }

    try {
      const response = await fetch("/api/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kullaniciAdi: username,
          gmail: email
        })
      });

      const result = await response.json();
      if (response.ok) {
        App.showToast("📧 6 haneli onay kodu e-postanıza gönderildi!", "success");
        
        const sentEmailText = document.getElementById("forgotSentEmailText");
        if (sentEmailText) sentEmailText.textContent = email;

        this.resetForgotModalStep(2);
        
        // Doğrulama kodu alanına odaklan
        const codeInput = document.getElementById("forgotVerificationCode");
        if (codeInput) {
          codeInput.value = "";
          codeInput.focus();
        }
      } else {
        App.showToast(result.message || "Doğrulama kodu gönderilemedi!", "error");
      }
    } catch (err) {
      App.showToast("Sunucu hatası oluştu!", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "<span>Doğrulama Kodu Gönder ⟶</span>";
      }
    }
  },

  async handleVerifyAndResetPassword(e) {
    e.preventDefault();
    const username = document.getElementById("forgotUsername").value.trim();
    const code = document.getElementById("forgotVerificationCode").value.trim();
    const newPassword = document.getElementById("forgotNewPassword").value;
    const btn = document.getElementById("btnVerifyAndReset");

    if (!code || code.length < 6) {
      App.showToast("Lütfen 6 haneli onay kodunu eksiksiz girin!", "warning");
      return;
    }

    if (!this.validatePasswordLive(newPassword, "forgot")) {
      App.showToast("Yeni şifreniz tüm güvenlik kurallarını karşılamalıdır!", "warning");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Doğrulanıyor...";
    }

    try {
      const response = await fetch("/api/forgot-password/verify-and-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kullaniciAdi: username,
          kod: code,
          yeniSifre: newPassword
        })
      });

      const result = await response.json();
      if (response.ok) {
        App.showToast("🎉 Şifreniz başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz.", "success");
        this.closeModal("forgotPasswordModal");
        this.openModal("loginModal");
        
        const loginUserInput = document.getElementById("loginUsername");
        if (loginUserInput) loginUserInput.value = username;
        const loginPassInput = document.getElementById("loginPassword");
        if (loginPassInput) {
          loginPassInput.value = "";
          loginPassInput.focus();
        }

        // Formu 1. adıma sıfırla
        this.resetForgotModalStep(1);
        document.getElementById("forgotStep1Form")?.reset();
        document.getElementById("forgotStep2Form")?.reset();
      } else {
        App.showToast(result.message || "Doğrulama başarısız!", "error");
      }
    } catch (err) {
      App.showToast("Sunucu hatası oluştu!", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Şifreyi Doğrula & Sıfırla";
      }
    }
  },

  async handleSettingsUpdate(e) {
    e.preventDefault();
    const username = document.getElementById("setUsername").value.trim();
    const email = document.getElementById("setEmail").value.trim();
    const birthDate = document.getElementById("setBirthDate").value.trim();
    const currentPassword = document.getElementById("setCurrentPassword").value;
    const newPassword = document.getElementById("setNewPassword").value;

    if (newPassword.trim() && !this.validatePasswordLive(newPassword, "settings")) {
      App.showToast("Yeni şifreniz güvenlik kurallarına uymalıdır!", "warning");
      return;
    }

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yeniKullaniciAdi: username,
          yeniGmail: email,
          yeniDogumTarihi: birthDate,
          yeniSifre: newPassword,
          mevcutSifre: currentPassword
        })
      });

      const result = await response.json();
      if (response.ok) {
        App.showToast(result.message || "Bilgileriniz güncellendi!", "success");
        this.closeModal("settingsModal");
        this.checkSession();
        App.loadHoroscopeQuote();
      } else {
        App.showToast(result.message || "Güncelleme başarısız!", "error");
      }
    } catch (err) {
      App.showToast("Sunucu hatası!", "error");
    }
  },

  async handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {}
    this.currentUser = null;
    this.userData = null;
    Calendar.plans = [];
    this.updateUserUI(false);

    // Açılış karşılama (splash) ekranına geri dön
    const heroScreen = document.getElementById("welcomeHeroScreen");
    if (heroScreen) {
      heroScreen.classList.remove("hidden");
    }

    // Açık tüm modalları kapat
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));

    if (typeof AIAssistant !== "undefined" && AIAssistant.showWidgets) {
      AIAssistant.showWidgets();
    }

    App.showToast("Oturum kapatıldı", "info");
    Calendar.render();
  },

  async checkSession() {
    try {
      const response = await fetch("/api/me");
      const data = await response.json();
      if (data.authenticated && data.user) {
        this.userData = data.user;
        this.currentUser = data.user.kullaniciAdi;
        this.updateUserUI(true, data.user.kullaniciAdi);
        Calendar.loadPlans();
        App.loadHoroscopeQuote();
      } else {
        this.currentUser = null;
        this.userData = null;
        this.updateUserUI(false);
      }
    } catch (e) {
      this.updateUserUI(false);
    }
  },

  updateUserUI(isAuthenticated, username = "") {
    const authGuestSection = document.getElementById("authGuestSection");
    const authUserSection = document.getElementById("authUserSection");
    const displayUsername = document.getElementById("displayUsername");
    const userAvatarText = document.getElementById("userAvatarText");
    const addPlanBtn = document.getElementById("openAddPlanBtn");
    const orientationToggleGroup = document.getElementById("orientationToggleGroup");

    const horoscopeWidget = document.getElementById("horoscopeWidgetSection");
    const horoscopeCard = document.getElementById("horoscopeCard");

    if (isAuthenticated) {
      if (authGuestSection) authGuestSection.style.display = "none";
      if (authUserSection) authUserSection.style.display = "flex";
      if (displayUsername) displayUsername.textContent = username;
      if (userAvatarText) userAvatarText.textContent = username.charAt(0).toUpperCase();
      if (addPlanBtn) addPlanBtn.removeAttribute("disabled");
      if (horoscopeWidget) horoscopeWidget.style.display = "flex";
      if (orientationToggleGroup) {
        orientationToggleGroup.style.display = (Calendar.currentView === "month" || Calendar.currentView === "week") ? "flex" : "none";
      }
    } else {
      if (authGuestSection) authGuestSection.style.display = "flex";
      if (authUserSection) authUserSection.style.display = "none";
      if (addPlanBtn) addPlanBtn.setAttribute("disabled", "true");
      if (horoscopeWidget) horoscopeWidget.style.display = "none";
      if (horoscopeCard) horoscopeCard.style.display = "none";
      if (orientationToggleGroup) orientationToggleGroup.style.display = "none";
      Calendar.currentOrientation = "horizontal";
      document.querySelectorAll(".orientation-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.orientation === "horizontal");
      });
    }
  }
};
