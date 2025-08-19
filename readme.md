
# 🌌 AI Trainer Dashboard

A WordPress plugin that integrates **RAG search with Exa.ai and OpenAI**, providing an AI-powered training dashboard

---

## 🚀 Features
- AI-powered search with Exa + OpenAI integration.  
- Autopage creation with custom template (`psybrarian`).  
- Embedding for Q&A, files, and text into vector DB.  
- Greenshift integration for frontend styling.  

---

## 📦 Requirements
- **WordPress 6.0+**  
- **PHP 7.4+**  
- [**Greenshift Animation and Page Builder**](https://wordpress.org/plugins/greenshift-animation-and-page-builder/) (required for design/layout)  
- **Psychedelic Plugin** (optional, for enhanced interface and UI styling)  

---

## ⚙️ Installation

1. Install and activate **WordPress**.  
2. Install and activate the required plugins:
   - GreenShift Animation and Page Builder
   - Psychedelic Plugin (for advanced interface support)  
3. Download or clone this repo into your `wp-content/plugins/` directory:

   ```bash
   cd wp-content/plugins/
   git clone https://github.com/samnguyen92/rag-exa-plugin.git
   ```
4. Install dependencies (if any):
   ```bash
   composer install
   ```
5. Add your API keys by creating a `.env` file in the plugin folder:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your real keys:
   ```env
   EXA_API_KEY=your_real_exa_key
   OPENAI_API_KEY=your_real_openai_key
   ```
6. Activate the plugin from **WordPress Dashboard → Plugins**.

---

## 🚀 Usage

- The plugin automatically creates a training dashboard page when activated.  
- Use the shortcode to embed the AI Search box anywhere:
  ```php
  [ai_trainer_dashboard]
  ```
- You can manage **Q&A, Files, and Text** training data directly in the plugin dashboard.  
- For advanced styling, use the provided **Psybrarian Page Template**.

---

## 📂 Project Structure

```
ai-trainer-dashboard/
│── includes/
│   ├── openai.php         # OpenAI integration
│   ├── utils.php          # Helper functions
│   ├── autopage.php       # Auto-create page with template
│── assets/
│   ├── css/
│   └── js/
│── templates/
│   └── template-psybrarian.php
│── vendor/                # Composer packages
│── .env.example           # Example environment variables
│── .gitignore
│── README.md
│── ai-trainer-dashboard.php   # Main plugin file
```

---

## 🔑 Environment Variables

- `EXA_API_KEY` → Your Exa.ai API key  
- `OPENAI_API_KEY` → Your OpenAI API key  

➡️ Never commit `.env` to GitHub. Only `.env.example` should be tracked.

---

## 🧑‍💻 Development

### Useful commands

```bash
# See all files
ls -la

# Check Git status
git status

# Stage and commit changes
git add .
git commit -m "Update feature"

# Push to GitHub
git push origin main
```

---

## 📜 License

MIT License © 2025
