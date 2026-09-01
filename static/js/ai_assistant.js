/**
 * ROUTINES IN-SIDEBAR LIVE AI ASSISTANT & OPTIMIZER
 * Sol panel içinde çalışan interaktif canlı yapay zeka sohbeti ve zaman optimizasyon motoru.
 */

const AIAssistant = {
  chatHistory: [],
  currentOptimizedData: null,

  init() {
    this.loadHistoryFromSession();
    this.bindEvents();
  },

  loadHistoryFromSession() {
    try {
      const saved = sessionStorage.getItem("routines_ai_history");
      if (saved) {
        this.chatHistory = JSON.parse(saved);
      }
    } catch (e) {
      this.chatHistory = [];
    }
  },

  saveHistoryToSession() {
    try {
      sessionStorage.setItem("routines_ai_history", JSON.stringify(this.chatHistory));
    } catch (e) {}
  },

  bindEvents() {
    // 1. Sol Panelde AI Sohbetini Açan Butonlar
    const openChatButtons = [
      document.getElementById("widgetOpenAiChatBtn"),
      document.getElementById("fabAiAssistantBtn"),
      document.getElementById("openAiChatBtn")
    ];

    openChatButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener("click", () => this.openChat());
      }
    });

    const drawerAiBtn = document.getElementById("drawerAiAssistantBtn");
    if (drawerAiBtn) {
      drawerAiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.openChat();
      });
    }

    // 2. Chat'ten Widget'lara Geri Dön Butonu
    const backBtn = document.getElementById("btnSidebarBackToWidgets");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.showWidgets());
    }

    // 3. Sohbeti Temizle (Yeni Sohbet)
    const clearBtn = document.getElementById("btnClearAiChatSidebar");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearChat());
    }

    // 4. Sohbet Formu Gönderimi
    const chatForm = document.getElementById("sidebarAiChatForm");
    const chatInput = document.getElementById("sidebarAiChatInput");
    if (chatForm && chatInput) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
          this.sendMessage(text);
          chatInput.value = "";
        }
      });
    }

    // 5. Hızlı Soru Hapları (Prompt Pills)
    document.querySelectorAll(".ai-prompt-pill").forEach(pill => {
      pill.addEventListener("click", (e) => {
        if (typeof Auth !== "undefined" && !Auth.currentUser) {
          if (typeof App !== "undefined" && App.showToast) {
            App.showToast("AI Asistanı kullanabilmek için lütfen önce giriş yapın!", "warning");
          }
          if (typeof Auth !== "undefined" && Auth.openModal) {
            Auth.openModal("loginModal");
          }
          return;
        }
        const prompt = e.currentTarget.dataset.prompt || e.currentTarget.textContent.trim();
        this.openChat();
        this.sendMessage(prompt);
      });
    });

    // 6. Gün Optimizasyon Butonları
    const btnOptimizeSidebar = document.getElementById("widgetOptimizeTodayBtn");
    if (btnOptimizeSidebar) {
      btnOptimizeSidebar.addEventListener("click", () => {
        const todayIso = Calendar.formatDateISO(new Date());
        this.optimizeDay(todayIso);
      });
    }

    // 7. Optimizasyon Uygulama Onay Butonu
    const btnApplyOpt = document.getElementById("btnApplyAiOptimization");
    if (btnApplyOpt) {
      btnApplyOpt.addEventListener("click", () => this.applyOptimization());
    }

    // 8. Optimizasyon Modalı Kapatma
    const closeOptBtn = document.getElementById("closeAiOptimizeModal");
    if (closeOptBtn) {
      closeOptBtn.addEventListener("click", () => Auth.closeModal("aiOptimizeModal"));
    }
  },

  openChat(initialPrompt = null) {
    if (typeof Auth !== "undefined" && !Auth.currentUser) {
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast("AI Asistanı kullanabilmek için lütfen önce giriş yapın!", "warning");
      }
      if (typeof Auth !== "undefined" && Auth.openModal) {
        Auth.openModal("loginModal");
      }
      return;
    }

    if (typeof App !== "undefined" && App.closeDrawer) {
      App.closeDrawer();
    }

    const widgetsView = document.getElementById("sidebarWidgetsView");
    const chatView = document.getElementById("sidebarChatView");
    const sidebarPanel = document.getElementById("sidebarPanel");

    if (sidebarPanel) {
      sidebarPanel.classList.add("chat-active");
      sidebarPanel.scrollTop = 0;
    }

    if (widgetsView && chatView) {
      widgetsView.style.setProperty("display", "none", "important");
      chatView.style.setProperty("display", "flex", "important");

      const input = document.getElementById("sidebarAiChatInput");
      if (input) {
        setTimeout(() => {
          input.focus();
        }, 150);
      }

      // Ekranı geçmişle veya karşılama mesajıyla render et
      const messagesContainer = document.getElementById("sidebarAiChatMessages");
      if (messagesContainer) {
        if (this.chatHistory.length > 0 && messagesContainer.children.length === 0) {
          this.renderEntireChatHistory();
        } else if (messagesContainer.children.length === 0) {
          const username = (typeof Auth !== "undefined" && Auth.currentUser) ? Auth.currentUser : "dostum";
          this.appendMessage("ai", `Merhaba **${username}**! 👋

Ben senin kişisel Routines yapay zeka zaman koçunum. Gününü planlayabilir, motivasyon alabilir veya mola rutinleri ekleyebiliriz.

Nasıl yardımcı olabilirim?`, false);
        }
      }
    }

    if (initialPrompt) {
      this.sendMessage(initialPrompt);
    }
  },

  showWidgets() {
    const widgetsView = document.getElementById("sidebarWidgetsView");
    const chatView = document.getElementById("sidebarChatView");
    const sidebarPanel = document.getElementById("sidebarPanel");

    if (sidebarPanel) {
      sidebarPanel.classList.remove("chat-active");
    }

    if (widgetsView && chatView) {
      chatView.style.setProperty("display", "none", "important");
      widgetsView.style.setProperty("display", "flex", "important");
    }
  },

  toggleChat() {
    if (!Auth.currentUser) {
      App.showToast("Routines AI Asistan'ı kullanmak için lütfen önce oturum açın!", "warning");
      Auth.openModal("loginModal");
      return;
    }

    const chatView = document.getElementById("sidebarChatView");
    if (chatView && chatView.style.display === "flex") {
      this.showWidgets();
    } else {
      this.openChat();
    }
  },

  clearChat() {
    this.chatHistory = [];
    this.saveHistoryToSession();
    const container = document.getElementById("sidebarAiChatMessages");
    if (container) container.innerHTML = "";
    
    const username = Auth.currentUser || "dostum";
    this.appendMessage("ai", `Sohbet geçmişi temizlendi ✨ Yeni bir konuya başlayabiliriz **${username}**. Bugün sana nasıl yardımcı olabilirim?`, false);
    App.showToast("Yeni sohbet başlatıldı", "info");
  },

  renderEntireChatHistory() {
    const container = document.getElementById("sidebarAiChatMessages");
    if (!container) return;
    container.innerHTML = "";

    this.chatHistory.forEach(turn => {
      const sender = turn.role === "user" ? "user" : "ai";
      this.renderSingleBubble(sender, turn.content);
    });

    container.scrollTop = container.scrollHeight;
  },

  async sendMessage(text) {
    if (!Auth.currentUser) {
      App.showToast("Yapay zeka zaman koçunu kullanmak için lütfen oturum açın!", "warning");
      Auth.openModal("loginModal");
      return;
    }

    // 1. Kullanıcı mesajını UI'a ve history'ye ekle
    this.appendMessage("user", text, true);

    const typingId = this.showTypingIndicator();
    const currentIso = Calendar.formatDateISO(Calendar.currentDate || new Date());

    try {
      // 2. Backend'e güncel history ile birlikte gönder
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: this.chatHistory,
          currentDate: currentIso
        })
      });

      const data = await response.json();
      this.removeTypingIndicator(typingId);

      if (response.ok && data.reply) {
        // 3. AI cevabını UI'a ve history'ye kaydet
        this.appendMessage("ai", data.reply, true);
      } else {
        this.appendMessage("ai", "Üzgünüm, şu an yanıt üretilirken bir aksaklık oldu. Lütfen tekrar dener misiniz? 🙏", false);
      }
    } catch (err) {
      this.removeTypingIndicator(typingId);
      this.appendMessage("ai", "Sunucuyla iletişim kurulamadı. Lütfen bağlantınızı kontrol edin.", false);
    }
  },

  appendMessage(sender, text, shouldSaveToHistory = true) {
    if (shouldSaveToHistory) {
      this.chatHistory.push({
        role: sender === "user" ? "user" : "model",
        content: text
      });
      this.saveHistoryToSession();
    }

    this.renderSingleBubble(sender, text);
    const container = document.getElementById("sidebarAiChatMessages");
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  },

  renderSingleBubble(sender, text) {
    const container = document.getElementById("sidebarAiChatMessages");
    if (!container) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `sidebar-chat-bubble-row ${sender === "user" ? "user-row" : "ai-row"}`;

    // Markdown biçimlendirme (**bold**, *italic*, maddeler)
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n• /g, "<br>• ")
      .replace(/\n/g, "<br>");

    const avatarHtml = sender === "user" 
      ? `<div class="sidebar-chat-avatar user">${(Auth.currentUser || "U").charAt(0).toUpperCase()}</div>`
      : `<div class="sidebar-chat-avatar ai"><i class="fa-regular fa-comment-dots" style="font-size: 0.75rem;"></i></div>`;

    msgDiv.innerHTML = `
      ${sender === "ai" ? avatarHtml : ""}
      <div class="sidebar-chat-bubble ${sender}">
        ${formattedText}
      </div>
      ${sender === "user" ? avatarHtml : ""}
    `;

    container.appendChild(msgDiv);
  },

  showTypingIndicator() {
    const container = document.getElementById("sidebarAiChatMessages");
    if (!container) return null;

    const id = "typing_" + Date.now();
    const typingDiv = document.createElement("div");
    typingDiv.id = id;
    typingDiv.className = "sidebar-chat-bubble-row ai-row typing-row";
    typingDiv.innerHTML = `
      <div class="sidebar-chat-avatar ai"><i class="fa-regular fa-comment-dots" style="font-size: 0.75rem;"></i></div>
      <div class="sidebar-chat-bubble ai typing-bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;

    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  // ---------------------------------------------------------
  // GÜN OPTİMİZASYONU MOTORU (SCHEDULE OPTIMIZER)
  // ---------------------------------------------------------
  async optimizeDay(isoDate) {
    if (!Auth.currentUser) {
      App.showToast("Gün optimizasyonu için lütfen önce oturum açın!", "warning");
      Auth.openModal("loginModal");
      return;
    }

    if (!isoDate) {
      isoDate = Calendar.formatDateISO(Calendar.currentDate || new Date());
    }

    App.showToast("✨ AI gününüzü analiz ediyor...", "info");

    try {
      const response = await fetch("/api/ai/optimize-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: isoDate })
      });

      const data = await response.json();
      if (response.ok && data.status === "success") {
        this.currentOptimizedData = data;
        this.showOptimizationModal(data);
      } else {
        App.showToast(data.message || "Bu tarihte optimize edilecek plan bulunamadı.", "info");
      }
    } catch (err) {
      App.showToast("Optimizasyon servisine ulaşılamadı.", "error");
    }
  },

  showOptimizationModal(data) {
    const modal = document.getElementById("aiOptimizeModal");
    const summaryEl = document.getElementById("aiOptimizeSummary");
    const listContainer = document.getElementById("aiOptimizePlanList");
    const dateTitleEl = document.getElementById("aiOptimizeDateTitle");

    if (!modal || !listContainer) return;

    if (dateTitleEl) {
      try {
        const parts = data.date.split("-");
        const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        dateTitleEl.textContent = `${dObj.getDate()} ${Calendar.monthNames[dObj.getMonth()]} ${dObj.getFullYear()} — Gün Optimizasyonu`;
      } catch (e) {
        dateTitleEl.textContent = `${data.date} — Gün Optimizasyonu`;
      }
    }

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="ai-opt-analysis-badge">
          <span>🧠 AI Analizi:</span> ${data.analysis}
        </div>
        ${data.suggestions && data.suggestions.length ? `
          <ul class="ai-opt-suggestions-list">
            ${data.suggestions.map(s => `<li>${s}</li>`).join("")}
          </ul>
        ` : ""}
      `;
    }

    listContainer.innerHTML = data.optimizedPlans.map((p) => {
      const isBreak = p.type === "break" || p.isNewBreak;
      const isModified = p.isModified;

      return `
        <div class="ai-opt-plan-item ${isBreak ? 'is-break' : ''} ${isModified ? 'is-modified' : ''}">
          <div class="ai-opt-time-badge">
            ${p.saat} - ${p.bitisSaati}
          </div>
          <div class="ai-opt-plan-details">
            <div class="ai-opt-plan-title">
              ${p.plan}
              ${isBreak ? '<span class="ai-opt-tag break">Mola</span>' : ''}
              ${isModified ? '<span class="ai-opt-tag modified">Saat İyileştirildi</span>' : ''}
            </div>
            <div class="ai-opt-plan-meta">
              <span class="category-dot" data-category="${p.kategori}"></span>
              <span>${p.kategori}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    Auth.openModal("aiOptimizeModal");
  },

  async applyOptimization() {
    if (!this.currentOptimizedData || !this.currentOptimizedData.optimizedPlans) return;

    const targetDate = this.currentOptimizedData.date;
    const plansToSave = this.currentOptimizedData.optimizedPlans;

    App.showToast("🚀 Optimize edilmiş program takvime işleniyor...", "info");

    try {
      const response = await fetch("/api/ai/apply-optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: targetDate,
          plans: plansToSave
        })
      });

      const res = await response.json();
      if (response.ok) {
        App.showToast(res.message || "Gününüz başarıyla güncellendi!", "success");
        Auth.closeModal("aiOptimizeModal");
        Calendar.loadPlans();
      } else {
        App.showToast(res.message || "İşlem başarısız oldu.", "error");
      }
    } catch (err) {
      App.showToast("Kaydetme sırasında bir hata oluştu.", "error");
    }
  }
};
