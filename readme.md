
# 🌌 AI Trainer Dashboard

A WordPress plugin that integrates **RAG search with Exa.ai and OpenAI**, providing an AI-powered training dashboard with comprehensive analytics and monitoring capabilities.

---

## 🚀 Features
- **AI-powered search** with Exa + OpenAI integration
- **Autopage creation** with custom Psybrarian template
- **Knowledge management** for Q&A, files, text, and websites
- **CSAT Analytics** with reaction tracking and satisfaction metrics
- **Psychedelics.com Monitor** for content guarantee compliance
- **Domain management** with tier-based prioritization
- **Modern UI** with dark theme and enhanced user experience
- **Reaction system** for user feedback (like/dislike)
- **Export functionality** for data analysis
- **Greenshift integration** for frontend styling

---

## 📦 Requirements
- **WordPress 6.0+**  
- **PHP 7.4+**  
- [**Greenshift Animation and Page Builder**](https://wordpress.org/plugins/greenshift-animation-and-page-builder/) (required for design/layout)  
- **Composer** (for PHP dependencies)

---

## ⚙️ Installation

1. **Install and activate WordPress 6.0+**
2. **Install and activate GreenShift Animation and Page Builder**
3. **Download or clone this plugin** into your `wp-content/plugins/` directory:

   ```bash
   cd wp-content/plugins/
   git clone https://github.com/samnguyen92/rag-exa-plugin.git
   ```
4. **Install PHP dependencies**:
   ```bash
   cd rag-exa-plugin
   composer install
   ```
5. **Create environment file** for your API keys:
   ```bash
   # Create .env file (do not commit this to git)
   EXA_API_KEY=your_real_exa_key
   OPENAI_API_KEY=your_real_openai_key
   ```
6. **Activate the plugin** from **WordPress Dashboard → Plugins**

---

## 🚀 Usage

### **Frontend Integration**
- The plugin automatically creates a training dashboard page when activated
- Use the shortcode to embed the AI Search box anywhere:
  ```php
  [ai_trainer_dashboard]
  ```
- For advanced styling, use the provided **Psybrarian Page Template**

### **Admin Dashboard**
Access the admin interface at **AI Trainer** in your WordPress admin menu:

- **Q&A Management**: Add/edit Q&A pairs for training
- **File Management**: Upload and process PDFs, documents
- **Text Management**: Add custom text content
- **Website Management**: Configure domain priorities and sources
- **Block Website**: Manage blocked domains
- **Chat Log**: View conversation history
- **CSAT Analytics**: Monitor user satisfaction metrics
- **Psychedelics.com Monitor**: Track content guarantee compliance

### **Knowledge Sources**
- **Q&A**: Question-answer pairs for direct responses
- **Files**: PDF and document processing with embedding
- **Text**: Custom text content for training
- **Websites**: Domain-based content with tier prioritization

---

## 📂 Project Structure

```
rag-exa-plugin/
├── admin/                    # Admin interface
│   ├── admin-ui.php         # Main admin UI
│   └── tabs/                # Admin tab content
│       ├── qna.php          # Q&A management
│       ├── files.php        # File management
│       ├── text.php         # Text management
│       ├── website.php      # Website management
│       ├── block-website.php # Domain blocking
│       ├── chatlog.php      # Chat history
│       └── csat-analytics.php # Satisfaction analytics
├── assets/                   # Frontend assets
│   ├── css/                 # Stylesheets
│   │   ├── core.scss        # Core styles (compiled)
│   │   ├── style.css        # Main styles
│   │   ├── admin.css        # Admin styles
│   │   └── icons.css        # Icon styles
│   ├── js/                  # JavaScript
│   │   ├── exa.js          # Main frontend logic
│   │   └── admin.js        # Admin functionality
│   └── images/              # Images and icons
├── build/                    # Compiled assets
│   └── index.css            # Compiled core styles
├── includes/                 # Core functionality
│   ├── openai.php           # OpenAI integration
│   ├── utils.php            # Helper functions
│   └── autopage.php         # Auto-page creation
├── src/                      # Source files
│   └── index.js             # Build entry point
├── vendor/                   # Composer dependencies
├── ai-trainer.php            # Main plugin file
├── reaction-logger.php       # User reaction handling
├── composer.json             # PHP dependencies
├── package.json              # Node.js dependencies
└── readme.md                 # This file
```

---

## 🔑 Environment Variables

Create a `.env` file in the plugin root directory:

```env
EXA_API_KEY=your_real_exa_key
OPENAI_API_KEY=your_real_openai_key
```

⚠️ **Important**: Never commit `.env` to GitHub. The `.gitignore` file is configured to exclude it.

---

## 🧑‍💻 Development

### **Build System**
The plugin uses a modern build system for CSS compilation:

```bash
# Install Node.js dependencies
npm install

# Build CSS from SCSS
npm run build

# Development mode with watch
npm run start
```

### **PHP Dependencies**
Manage PHP dependencies with Composer:

```bash
# Install dependencies
composer install

# Update dependencies
composer update
```

### **Useful Commands**

```bash
# Check project status
ls -la
git status

# Build assets
npm run build

# Install PHP dependencies
composer install

# Stage and commit changes
git add .
git commit -m "Update feature"
git push origin main
```

---

## 📊 Key Features Explained

### **CSAT Analytics**
- **Customer Satisfaction** tracking via user reactions
- **Time-based filtering** (Today, Week, Month, Year, All Time)
- **Trend analysis** with week-over-week comparisons
- **Export functionality** for data analysis

### **Psychedelics.com Guarantee**
- **Content guarantee** system ensures relevant content inclusion
- **Fallback search** when primary results are insufficient
- **Relevance scoring** to maintain content quality
- **Performance monitoring** and analytics

### **Domain Management**
- **Tier-based prioritization** (1-4 levels)
- **Automatic content inclusion** based on domain tiers
- **Blocked domain management** for content filtering
- **Real-time monitoring** of domain performance

---

## 📜 License

MIT License © 2025

---

## 🤝 Support

For support and questions, please refer to the plugin documentation or contact the development team.
