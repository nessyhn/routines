# 🤝 Routines Projesine Katkıda Bulunma (Contributing Guide)

Routines açık kaynak projesine katkıda bulunmak istediğiniz için teşekkürler! Projeyi geliştirmek, yeni özellikler eklemek veya hata bildirmek için aşağıdaki adımları izleyebilirsiniz.

---

## 🛠️ Geliştirme Ortamını Kurma

1. Projeyi çatallayın (Fork) ve bilgisayarınıza klonlayın:
   ```bash
   git clone https://github.com/nessyhn/routines.git
   cd routines
   ```

2. Python sanal ortamını oluşturun ve etkinleştirin:
   ```bash
   python -m venv .venv
   # Windows için:
   .venv\Scripts\activate
   # macOS / Linux için:
   source .venv/bin/activate
   ```

3. Bağımlılıkları yükleyin:
   ```bash
   pip install -r requirements.txt
   ```

4. `.env.example` dosyasını `.env` olarak kopyalayın ve Google Gemini API anahtarınızı girin:
   ```bash
   cp .env.example .env
   ```

5. Sunucuyu başlatın:
   ```bash
   python app.py
   ```

---

## 🚀 Katkı Süreci

1. Yeni bir özellik veya düzeltme için dal (branch) açın:
   ```bash
   git checkout -b ozellik/harika-yeni-ozellik
   ```
2. Değişikliklerinizi yapın ve test edin.
3. Değişikliklerinizi commit edin:
   ```bash
   git commit -m "feat: harika yeni özellik eklendi"
   ```
4. Dalınızı GitHub'a gönderin ve **Pull Request (PR)** açın!
