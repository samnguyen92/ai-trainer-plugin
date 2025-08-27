# 🧑‍💻 AI Trainer Plugin - Developer Guide

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Core Components](#core-components)
5. [Admin Interface](#admin-interface)
6. [Frontend Integration](#frontend-integration)
7. [API Integration](#api-integration)
8. [Development Workflow](#development-workflow)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The AI Trainer Plugin is a WordPress plugin that creates an AI-powered knowledge base system using **RAG (Retrieval-Augmented Generation)** technology. It integrates with Exa.ai for web search and OpenAI for text embeddings to provide intelligent responses to user queries.

### **What This System Does**

- **Knowledge Management**: Stores and organizes information (Q&A, documents, text, websites)
- **Semantic Search**: Uses AI embeddings to find relevant content
- **Content Guarantee**: Ensures specific sources (like psychedelics.com) are always included
- **User Feedback**: Tracks user satisfaction through reaction system
- **Analytics**: Provides insights into system performance and user satisfaction

### **Key Technologies**

- **WordPress**: Plugin framework and admin interface
- **OpenAI API**: Text embeddings for semantic search
- **Exa.ai API**: Web search and content retrieval
- **PHP**: Backend logic and database operations
- **JavaScript**: Frontend interactions and AJAX
- **SCSS/CSS**: Styling and responsive design

---

## 🏗️ Architecture

### **High-Level Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   WordPress     │    │   External      │
│   (User Query)  │───▶│   Plugin        │───▶│   APIs          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   AI Services   │
                       │   (Knowledge)   │    │   (Embeddings)  │
                       └─────────────────┘    └─────────────────┘
```

### **File Structure**

```
rag-exa-plugin/
├── ai-trainer.php              # Main plugin file - WordPress integration
├── includes/                    # Core functionality
│   ├── openai.php              # OpenAI API integration
│   ├── utils.php               # Utility functions
│   └── autopage.php            # Auto-page creation system
├── admin/                       # WordPress admin interface
│   ├── admin-ui.php            # Main admin UI structure
│   └── tabs/                   # Individual admin tabs
│       ├── qna.php             # Q&A management
│       ├── files.php           # File management
│       ├── text.php            # Text management
│       ├── website.php         # Website management
│       ├── block-website.php   # Domain blocking
│       ├── chatlog.php         # Chat history
│       └── csat-analytics.php  # Satisfaction analytics
├── assets/                      # Frontend assets
│   ├── css/                    # Stylesheets
│   ├── js/                     # JavaScript files
│   └── images/                 # Images and icons
├── build/                       # Compiled assets
├── src/                         # Source files for build system
├── vendor/                      # Composer dependencies
└── reaction-logger.php          # User feedback system
```

---

## 🗄️ Database Schema

### **Main Tables**

#### **1. ai_knowledge** - Core Knowledge Base
```sql
CREATE TABLE ai_knowledge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),                    -- Human-readable title
    source_type VARCHAR(50),               -- 'qna', 'file', 'text', 'website'
    content LONGTEXT,                      -- Main content
    embedding LONGTEXT,                    -- AI embedding vector (JSON)
    metadata LONGTEXT,                     -- Additional data (JSON)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **2. ai_chat_log** - User Conversations
```sql
CREATE TABLE ai_chat_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,               -- WordPress user ID
    question TEXT,                          -- User's question
    answer LONGTEXT,                        -- AI response
    reaction LONGTEXT,                      -- User feedback (JSON)
    reaction_detail LONGTEXT,               -- Detailed feedback (JSON)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **3. ai_knowledge_chunks** - Text Chunks
```sql
CREATE TABLE ai_knowledge_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT,                          -- Reference to main entry
    source_type VARCHAR(50),                -- Type of source
    chunk_index INT,                        -- Order in original text
    content LONGTEXT,                       -- Chunk content
    embedding LONGTEXT,                     -- Chunk embedding (JSON)
    metadata LONGTEXT,                      -- Chunk metadata (JSON)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **4. ai_allowed_domains** - Content Sources
```sql
CREATE TABLE ai_allowed_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),                     -- Human-readable name
    url VARCHAR(255),                       -- Full URL
    domain VARCHAR(255),                    -- Domain only
    tier INT DEFAULT 3,                     -- Priority (1=highest, 4=lowest)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **5. ai_blocked_domains** - Blocked Sources
```sql
CREATE TABLE ai_blocked_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),                     -- Human-readable name
    url VARCHAR(255),                       -- Full URL
    domain VARCHAR(255),                    -- Domain only
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Core Components

### **1. Main Plugin File (ai-trainer.php)**

This is the entry point that:
- Registers WordPress hooks and filters
- Creates admin menus
- Handles plugin activation
- Loads required files
- Defines configuration constants

**Key Sections:**
- Plugin header and metadata
- Configuration constants
- Database table creation
- Admin menu setup
- AJAX handlers
- Frontend integration

### **2. OpenAI Integration (includes/openai.php)**

Handles all interactions with OpenAI's API:
- **Text Embeddings**: Converts text to numerical vectors
- **Vector Normalization**: Ensures consistent similarity calculations
- **Error Handling**: Manages API failures gracefully

**Key Functions:**
```php
ai_trainer_generate_embedding($text)      // Create embedding from text
ai_trainer_normalize_embedding($vector)   // Normalize vector to unit length
ai_trainer_cosine_similarity($vec1, $vec2) // Calculate similarity
```

### **3. Utility Functions (includes/utils.php)**

Common operations used throughout the plugin:
- **Database Operations**: CRUD operations for knowledge base
- **Text Processing**: Chunking long text for better search
- **Data Validation**: Input sanitization and validation

**Key Functions:**
```php
ai_trainer_save_to_db($title, $type, $content, $embedding, $meta)
ai_trainer_delete($id)
ai_trainer_update($id, $title, $content, $embedding, $meta)
ai_trainer_chunk_text($text, $max_length)
ai_trainer_save_chunks_to_db($parent_id, $source_type, $text, $meta)
```

### **4. Auto-Page Creation (includes/autopage.php)**

Automatically creates pages and templates:
- **Page Creation**: Sets up the main AI interface page
- **Template Management**: Handles custom page templates
- **Block Support**: Integrates with Gutenberg blocks

---

## 🎛️ Admin Interface

### **Tab Structure**

The admin interface uses a tabbed design for easy navigation:

1. **Q&A Tab**: Manage question-answer pairs
2. **Files Tab**: Upload and process documents
3. **Text Tab**: Add custom text content
4. **Website Tab**: Configure domain priorities
5. **Block Website Tab**: Manage blocked sources
6. **Chat Log Tab**: View conversation history
7. **CSAT Analytics Tab**: Monitor user satisfaction

### **How Tabs Work**

```php
// Tab switching is handled via GET parameters
// URL: /wp-admin/admin.php?page=ai-trainer&tab=qna

// Each tab content is included dynamically
include __DIR__ . '/tabs/qna.php';
```

### **Adding New Tabs**

To add a new admin tab:

1. **Create the tab file** in `admin/tabs/`
2. **Add menu item** in `ai-trainer.php`
3. **Include tab content** in `admin/admin-ui.php`
4. **Add CSS styling** for the new tab

---

## 🌐 Frontend Integration

### **Shortcode Usage**

The plugin provides a shortcode for embedding the AI interface:

```php
[ai_trainer_dashboard]
```

### **JavaScript Integration**

Frontend functionality is handled by `assets/js/exa.js`:
- **Search Interface**: User query input and display
- **AJAX Calls**: Communication with backend
- **UI Updates**: Dynamic content loading
- **Reaction System**: Like/dislike functionality

### **CSS Styling**

Styles are organized in multiple files:
- **core.scss**: Main styles (compiled to build/index.css)
- **style.css**: Frontend-specific styles
- **admin.css**: Admin interface styles
- **icons.css**: Icon definitions

---

## 🔌 API Integration

### **OpenAI API**

**Endpoint**: `https://api.openai.com/v1/embeddings`
**Model**: `text-embedding-ada-002`
**Output**: 1536-dimensional vector

**Usage Example:**
```php
$embedding = ai_trainer_generate_embedding("Your text here");
if ($embedding) {
    // Store in database
    ai_trainer_save_to_db("Title", "text", "Content", $embedding);
}
```

### **Exa.ai API**

**Purpose**: Web search and content retrieval
**Features**: Domain prioritization, content filtering
**Integration**: Used for finding relevant web content

### **Environment Variables**

Create a `.env` file in the plugin root:
```env
EXA_API_KEY=your_exa_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🚀 Development Workflow

### **Setting Up Development Environment**

1. **Clone the repository**
   ```bash
   git clone https://github.com/samnguyen92/rag-exa-plugin.git
   cd rag-exa-plugin
   ```

2. **Install dependencies**
   ```bash
   composer install          # PHP dependencies
   npm install              # Node.js dependencies
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env     # Create environment file
   # Edit .env with your API keys
   ```

4. **Build assets**
   ```bash
   npm run build            # Build CSS from SCSS
   npm run start            # Development mode with watch
   ```

### **Development Commands**

```bash
# Build production assets
npm run build

# Development mode with file watching
npm run start

# Format code
npm run format

# Lint CSS
npm run lint:css

# Lint JavaScript
npm run lint:js
```

### **Code Organization**

- **PHP Functions**: Use `ai_trainer_` prefix
- **CSS Classes**: Use `ai-` prefix
- **JavaScript Functions**: Use descriptive names
- **Database Tables**: Use `ai_` prefix

---

## 🛠️ Common Tasks

### **Adding New Knowledge Types**

1. **Update database schema** if needed
2. **Add admin interface** in appropriate tab
3. **Create processing logic** for the new type
4. **Add embedding generation** for search
5. **Update search functions** to include new type

### **Modifying Search Behavior**

1. **Edit search logic** in main plugin file
2. **Adjust relevance scoring** in search functions
3. **Update domain priorities** in admin interface
4. **Test with various queries** to ensure quality

### **Customizing the UI**

1. **Modify CSS** in appropriate stylesheet
2. **Update JavaScript** for new interactions
3. **Add new admin tabs** if needed
4. **Test responsiveness** on different devices

### **Adding New API Integrations**

1. **Create new include file** for the API
2. **Add configuration constants** in main file
3. **Create helper functions** for API calls
4. **Add error handling** and logging
5. **Update documentation** and examples

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Embeddings Not Generating**

**Symptoms**: No search results, empty embedding fields
**Causes**: Invalid API key, API rate limits, network issues
**Solutions**:
- Check API keys in `.env` file
- Verify API quota and billing
- Check network connectivity
- Review error logs

#### **2. Search Not Working**

**Symptoms**: Queries return no results
**Causes**: Missing embeddings, database issues, search logic errors
**Solutions**:
- Verify embeddings exist in database
- Check database connectivity
- Review search query logic
- Test with simple queries

#### **3. Admin Interface Not Loading**

**Symptoms**: Admin pages show errors or don't load
**Causes**: Missing files, permission issues, PHP errors
**Solutions**:
- Check file permissions
- Verify all required files exist
- Check PHP error logs
- Test with default WordPress theme

### **Debugging Tools**

#### **Error Logging**

The plugin logs errors to WordPress error log:
```php
error_log('AI Trainer: Error message here');
```

#### **Database Queries**

Use WordPress debug mode to see database queries:
```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('SAVEQUERIES', true);
```

#### **Frontend Console**

Check browser console for JavaScript errors and AJAX responses.

### **Performance Optimization**

#### **Database Optimization**

- **Indexes**: Add indexes on frequently queried columns
- **Query Optimization**: Review and optimize slow queries
- **Connection Pooling**: Use persistent database connections

#### **Caching**

- **Embedding Cache**: Cache generated embeddings
- **Search Results**: Cache frequent search results
- **Page Cache**: Use WordPress caching plugins

---

## 📚 Additional Resources

### **WordPress Development**

- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [WordPress Database API](https://developer.wordpress.org/reference/classes/wpdb/)

### **AI and Machine Learning**

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Text Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Vector Similarity Search](https://en.wikipedia.org/wiki/Vector_similarity_search)

### **Development Tools**

- [Composer Documentation](https://getcomposer.org/doc/)
- [npm Documentation](https://docs.npmjs.com/)
- [SCSS Documentation](https://sass-lang.com/documentation)

---

## 🤝 Getting Help

### **Internal Resources**

- **Code Comments**: Each function has detailed documentation
- **README.md**: Project overview and setup instructions
- **This Guide**: Comprehensive development documentation

### **External Support**

- **WordPress Forums**: Plugin development questions
- **Stack Overflow**: Programming and debugging help
- **GitHub Issues**: Bug reports and feature requests

### **Best Practices**

1. **Always test** changes in development environment
2. **Use version control** for all code changes
3. **Follow WordPress standards** for consistency
4. **Document new features** as you add them
5. **Test with different** WordPress versions and themes

---

*This guide is maintained by the development team. For updates or corrections, please submit a pull request or contact the team.*
