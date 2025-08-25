<?php

/**
 * Plugin Name: AI Trainer Dashboard
 * Description: Training for Search AI.
 * Version: 1.0
 * Author: Psychedelic
 */

if (!defined('ABSPATH')) exit;

define('AI_TRAINER_PATH', plugin_dir_path(__FILE__));

require_once AI_TRAINER_PATH . 'includes/openai.php';
require_once AI_TRAINER_PATH . 'includes/utils.php';
require_once AI_TRAINER_PATH . 'includes/autopage.php';

AI_Trainer_Auto_Page::boot(__FILE__);

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

define('EXA_API_KEY', isset($_ENV['EXA_API_KEY']) ? $_ENV['EXA_API_KEY'] : '');
define('OPENAI_API_KEY', isset($_ENV['OPENAI_API_KEY']) ? $_ENV['OPENAI_API_KEY'] : '');

// ENHANCED: Configuration for psychedelics.com guarantee
define('PSYCHEDELICS_COM_GUARANTEE', true); // Set to false to disable the guarantee
define('PSYCHEDELICS_COM_FALLBACK_ENABLED', true); // Set to false to disable fallback search
define('PSYCHEDELICS_COM_MIN_RESULTS', 3); // Minimum psychedelics.com results to include
define('PSYCHEDELICS_COM_MAX_RESULTS', 5); // Maximum psychedelics.com results to include
define('PSYCHEDELICS_COM_MIN_RELEVANCE', 0.5); // Minimum relevance score (0.0-1.0) for psychedelics.com results

// Configuration for main search results
// To change the number of sources returned, modify these values:
// - MAIN_SEARCH_MAX_RESULTS: How many results to request from Exa API (higher = more sources but slower)
// - MAIN_SEARCH_TARGET_RESULTS: Target number of results after filtering (should be lower than MAX_RESULTS)
define('MAIN_SEARCH_MAX_RESULTS', 100); // Maximum results to request from Exa API (default: 100)
define('MAIN_SEARCH_TARGET_RESULTS', 80); // Target results after filtering (default: 80)

register_activation_hook(__FILE__, function () {
    global $wpdb;
    $table = $wpdb->prefix . 'ai_knowledge';
    $chatlog_table = $wpdb->prefix . 'ai_chat_log';
    $chunk_table = $wpdb->prefix . 'ai_knowledge_chunks';
    $domains_table = $wpdb->prefix . 'ai_allowed_domains';
    $blocked_domains_table = $wpdb->prefix . 'ai_blocked_domains';
    $charset = $wpdb->get_charset_collate();
    $sql1 = "CREATE TABLE $table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        source_type VARCHAR(50),
        content LONGTEXT,
        embedding LONGTEXT,
        metadata LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) $charset;";
    $sql2 = "CREATE TABLE $chatlog_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED,
        question TEXT,
        answer LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) $charset;";
    $sql3 = "CREATE TABLE $chunk_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT,
        source_type VARCHAR(50),
        chunk_index INT,
        content LONGTEXT,
        embedding LONGTEXT,
        metadata LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) $charset;";
    $sql4 = "CREATE TABLE $domains_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        url VARCHAR(255),
        domain VARCHAR(255),
        tier INT DEFAULT 3,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) $charset;";
    $sql5 = "CREATE TABLE $blocked_domains_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        url VARCHAR(255),
        domain VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) $charset;";
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql1);
    dbDelta($sql2);
    dbDelta($sql3);
    dbDelta($sql4);
    dbDelta($sql5);

    // Note: Default domains are now managed through the admin interface
    // No hardcoded defaults to avoid conflicts with manual domain management

    // Add this to the activation hook to add the reaction column if not exists
    $columns = $wpdb->get_results("SHOW COLUMNS FROM $chatlog_table LIKE 'reaction'");
    if (empty($columns)) {
        $wpdb->query("ALTER TABLE $chatlog_table ADD COLUMN reaction LONGTEXT NULL");
    }
    // Add reaction_detail column if not exists
    $columns_detail = $wpdb->get_results("SHOW COLUMNS FROM $chatlog_table LIKE 'reaction_detail'");
    if (empty($columns_detail)) {
        $wpdb->query("ALTER TABLE $chatlog_table ADD COLUMN reaction_detail LONGTEXT NULL");
    }
    // Add beta_feedback column if not exists
    $columns_beta = $wpdb->get_results("SHOW COLUMNS FROM $chatlog_table LIKE 'beta_feedback'");
    if (empty($columns_beta)) {
        $wpdb->query("ALTER TABLE $chatlog_table ADD COLUMN beta_feedback LONGTEXT NULL");
    }
    // Add psychedelics.com guarantee tracking columns
    $psychedelics_columns = [
        'psychedelics_com_included' => 'TINYINT(1) DEFAULT 0',
        'psychedelics_com_count' => 'INT DEFAULT 0',
        'psychedelics_com_guarantee_status' => 'VARCHAR(50) DEFAULT "Unknown"',
        'psychedelics_com_guarantee_details' => 'TEXT NULL'
    ];
    
    foreach ($psychedelics_columns as $column => $definition) {
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $chatlog_table LIKE '$column'");
        if (empty($column_exists)) {
            $wpdb->query("ALTER TABLE $chatlog_table ADD COLUMN $column $definition");
        }
    }
    
    // Add tier column to domains table if not exists
    $tier_column = $wpdb->get_results("SHOW COLUMNS FROM $domains_table LIKE 'tier'");
    if (empty($tier_column)) {
        $wpdb->query("ALTER TABLE $domains_table ADD COLUMN tier INT DEFAULT 3");
        
        // Set default tiers for existing domains based on user specifications
        $default_tiers = [
            // Tier 1 (Highest Priority)
            'psychedelics.com' => 1,
            'doubleblindmag.com' => 1,
            'psychedelicstoday.com' => 1,
            'lucid.news' => 1,
            'chacruna.net' => 1,
            'realitysandwich.com' => 1,
            
            // Tier 2 (High Priority)
            'dancesafe.org' => 2,
            'blossomanalysis.com' => 2,
            'erowid.org' => 2,
            'shroomery.org' => 2,
            
            // Tier 3 (Medium Priority)
            'psychedelicspotlight.com' => 3,
            'psychedelicalpha.com' => 3,
        ];
        
        foreach ($default_tiers as $domain => $tier) {
            $wpdb->update(
                $wpdb->prefix . 'ai_allowed_domains',
                ['tier' => $tier],
                ['domain' => $domain]
            );
        }
    }

});

add_action('admin_menu', function () {
    add_menu_page('AI Trainer', 'AI Trainer', 'manage_options', 'ai-trainer', 'ai_trainer_admin_page', '', 80);
    add_submenu_page('ai-trainer', 'Chat Log', 'Chat Log', 'manage_options', 'ai-trainer-chatlog', 'ai_trainer_chatlog_page');
    add_submenu_page('ai-trainer', 'Psychedelics.com Monitor', 'Psychedelics.com Monitor', 'manage_options', 'ai-trainer-psychedelics-monitor', 'ai_trainer_psychedelics_monitor_page');
});

function ai_trainer_admin_page() {
    include AI_TRAINER_PATH . 'admin/admin-ui.php';
}

function ai_trainer_chatlog_page() {
    include AI_TRAINER_PATH . 'admin/tabs/chatlog.php';
}

function ai_trainer_psychedelics_monitor_page() {
    include AI_TRAINER_PATH . 'admin/tabs/psychedelics-monitor.php';
}

function ai_trainer_insert_chat_log($user_id, $question, $answer) {
    global $wpdb;
    $wpdb->insert(
        $wpdb->prefix . 'ai_chat_log',
        [
            'user_id' => $user_id,
            'question' => $question,
            'answer' => $answer,
            'created_at' => current_time('mysql')
        ]
    );
}

function ai_trainer_get_chat_logs($limit = 100, $offset = 0) {
    global $wpdb;
    return $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_chat_log ORDER BY created_at DESC LIMIT $limit OFFSET $offset", ARRAY_A);
}

add_action('admin_enqueue_scripts', function ($hook) {
    if (strpos($hook, 'ai-trainer') === false) return;
    
    wp_enqueue_style('ai-trainer-css', plugin_dir_url(__FILE__) . 'assets/css/admin.css');
    wp_enqueue_script('ai-trainer-js', plugin_dir_url(__FILE__) . 'assets/js/admin.js', ['jquery'], null, true);

    wp_enqueue_script('tinymce-vendor', plugin_dir_url(__FILE__) . 'vendor/tinymce/tinymce/tinymce.min.js', array(), '5.10.0', true);
    
    // Enqueue TinyMCE editor with all plugins
    // wp_enqueue_editor();
    
    wp_localize_script('ai-trainer-js', 'ai_trainer_ajax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('ai_trainer_nonce')
    ));
    wp_localize_script('ai-trainer-js', 'tinymcePaths', [
        'baseUrl'  => plugin_dir_url(__FILE__) . 'vendor/tinymce/tinymce',
        'skinUrl'  => plugin_dir_url(__FILE__) . 'vendor/tinymce/tinymce/skins/ui/oxide',
        // 'themeUrl' => plugin_dir_url(__FILE__) . 'vendor/tinymce/tinymce/themes/silver',
    ]);
});

function ai_editor_styles()
{
    add_theme_support('editor-styles');
    add_theme_support('wp-block-styles');
    wp_enqueue_style('core-style', plugin_dir_url(__FILE__) . '/build/index.css'); 
}
add_action('admin_init', 'ai_editor_styles');

// Global TinyMCE configuration to disable superscript and subscript
function ai_tinymce_config($init) {
    // Remove superscript and subscript formats
    $init['formats'] = isset($init['formats']) ? $init['formats'] : '';
    $init['formats'] .= 'superscript: { inline: "sup", remove: "all" },subscript: { inline: "sub", remove: "all" },';
    
    // Add to extended valid elements to exclude sup and sub tags
    $init['extended_valid_elements'] = isset($init['extended_valid_elements']) ? $init['extended_valid_elements'] : '';
    $init['extended_valid_elements'] .= ',-sup,-sub';
    
    // Add to invalid elements
    $init['invalid_elements'] = isset($init['invalid_elements']) ? $init['invalid_elements'] : '';
    $init['invalid_elements'] .= ',sup,sub';
    
    return $init;
}
add_filter('tiny_mce_before_init', 'ai_tinymce_config');

// AJAX handlers for text operations
add_action('wp_ajax_ai_add_text', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    $title = sanitize_text_field($_POST['text_title']);
    $content = wp_kses_post($_POST['text_content']);
    if (empty($title) || empty($content)) {
        wp_send_json_error(['message' => 'Title and content are required.']);
        return;
    }
    $embedding = ai_trainer_generate_embedding($content);
    $result = ai_trainer_save_to_db($title, 'text', $content, $embedding);
    global $wpdb;
    $parent_id = $wpdb->insert_id;
    if (function_exists('ai_trainer_save_chunks_to_db')) {
        ai_trainer_save_chunks_to_db($parent_id, 'text', $content);
    }
    wp_send_json_success(['message' => 'Text added successfully.']);
});

add_action('wp_ajax_ai_delete_text', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    $id = intval($_POST['id']);
    if ($id <= 0) {
        wp_send_json_error(['message' => 'Invalid text ID.']);
        return;
    }
    
    ai_trainer_delete($id);
    wp_send_json_success(['message' => 'Text deleted successfully.']);
});

add_action('wp_ajax_ai_update_text_inline', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    $id = intval($_POST['text_id']);
    $title = sanitize_text_field($_POST['text_title']);
    $content = wp_kses_post($_POST['text_content']);
    if (empty($title) || empty($content)) {
        wp_send_json_error(['message' => 'Title and content are required.']);
        return;
    }
    $embedding = ai_trainer_generate_embedding($content);
    global $wpdb;
    $wpdb->update(
        $wpdb->prefix . 'ai_knowledge',
        [
            'title' => $title,
            'content' => $content,
            'embedding' => $embedding
        ],
        ['id' => $id]
    );
    // Remove old chunks and add new ones
    $chunk_table = $wpdb->prefix . 'ai_knowledge_chunks';
    $wpdb->delete($chunk_table, ['parent_id' => $id, 'source_type' => 'text']);
    if (function_exists('ai_trainer_save_chunks_to_db')) {
        ai_trainer_save_chunks_to_db($id, 'text', $content);
    }
    wp_send_json_success(['message' => 'Text updated successfully.']);
});

add_action('wp_ajax_ai_get_text_sources', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    global $wpdb;
    
    // Pagination settings
    $items_per_page = 10;
    $current_page = isset($_POST['page']) ? max(1, intval($_POST['page'])) : 1;
    $offset = ($current_page - 1) * $items_per_page;
    
    // Get total count
    $total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'text'");
    $total_pages = ceil($total_items / $items_per_page);
    
    // Get paginated results
    $rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'text' ORDER BY created_at DESC LIMIT $items_per_page OFFSET $offset", ARRAY_A);
    
    $html = '<table class="widefat striped">
        <thead><tr><th>Title</th><th>Content</th><th>Size</th><th>Actions</th></tr></thead>
        <tbody>';
    
    foreach ($rows as $row) {
        $html .= "<tr data-id='{$row['id']}'>
            <td class='text-title'>" . esc_html($row['title']) . "</td>
            <td class='text-content'>" . esc_html(substr($row['content'], 0, 100)) . (strlen($row['content']) > 100 ? '...' : '') . "</td>
            <td>" . size_format(strlen($row['content'])) . "</td>
            <td>
                <button type='button' class='button button-small edit-text-inline' data-id='{$row['id']}' data-title='" . esc_attr($row['title']) . "' data-content='" . esc_attr($row['content']) . "'>Edit</button>
                <a href='#' class='button button-small button-link-delete delete-text' data-id='{$row['id']}'>Delete</a>
            </td>
        </tr>";
    }
    
    $html .= '</tbody></table>';
    
    // Add pagination if needed
    if ($total_pages > 1) {
        $html .= '<div class="tablenav-pages">
            <span class="displaying-num">' . $total_items . ' items</span>
            <span class="pagination-links">';
        
        // Previous page
        if ($current_page > 1) {
            $html .= '<a class="prev-page" href="#" data-page="' . ($current_page - 1) . '">‹</a>';
        }
        
        // Page numbers
        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);
        
        if ($start_page > 1) {
            $html .= '<a href="#" data-page="1">1</a>';
            if ($start_page > 2) {
                $html .= '<span class="paging-input">…</span>';
            }
        }
        
        for ($i = $start_page; $i <= $end_page; $i++) {
            if ($i == $current_page) {
                $html .= '<span class="paging-input"><span class="tablenav-paging-text">' . $i . '</span></span>';
            } else {
                $html .= '<a href="#" data-page="' . $i . '">' . $i . '</a>';
            }
        }
        
        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                $html .= '<span class="paging-input">…</span>';
            }
            $html .= '<a href="#" data-page="' . $total_pages . '">' . $total_pages . '</a>';
        }
        
        // Next page
        if ($current_page < $total_pages) {
            $html .= '<a class="next-page" href="#" data-page="' . ($current_page + 1) . '">›</a>';
        }
        
        $html .= '</span></div>';
    }
    
    wp_send_json_success(['html' => $html, 'current_page' => $current_page, 'total_pages' => $total_pages]);
});

// AJAX handlers for Q&A operations
add_action('wp_ajax_ai_add_qna', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    $title = sanitize_text_field($_POST['qa_title']);
    $questions = isset($_POST['qna_questions']) ? array_map('sanitize_text_field', (array)$_POST['qna_questions']) : [];
    $answer = wp_kses_post($_POST['qa_answer']);
    if (empty($title) || empty($questions) || empty($answer)) {
        wp_send_json_error(['message' => 'Title, at least one question, and answer are required.']);
        return;
    }
    $main_question = $questions[0];
    $relative_questions = array_slice($questions, 1);
    $text = implode(' ', $questions) . ' ' . $answer;
    $embedding = ai_trainer_generate_embedding($text);
    $meta = [ 'question' => $main_question, 'relative_questions' => $relative_questions, 'answer' => $answer ];
    $result = ai_trainer_save_to_db($title, 'qa', $text, $embedding, $meta);
    global $wpdb;
    $parent_id = $wpdb->insert_id;
    if (function_exists('ai_trainer_save_chunks_to_db')) {
        ai_trainer_save_chunks_to_db($parent_id, 'qa', $text, $meta);
    }
    wp_send_json_success(['message' => 'Q&A added successfully.']);
});

add_action('wp_ajax_ai_delete_qna', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    $id = intval($_POST['id']);
    if ($id <= 0) {
        wp_send_json_error(['message' => 'Invalid Q&A ID.']);
        return;
    }
    
    global $wpdb;
    $wpdb->delete($wpdb->prefix . 'ai_knowledge', ['id' => $id]);
    wp_send_json_success(['message' => 'Q&A deleted successfully.']);
});

add_action('wp_ajax_ai_get_qna_sources', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    global $wpdb;
    
    // Pagination settings
    $items_per_page = 10;
    $current_page = isset($_POST['page']) ? max(1, intval($_POST['page'])) : 1;
    $offset = ($current_page - 1) * $items_per_page;
    
    // Get total count
    $total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa'");
    $total_pages = ceil($total_items / $items_per_page);
    
    // Get paginated results
    $rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa' ORDER BY created_at DESC LIMIT $items_per_page OFFSET $offset", ARRAY_A);
    
    $html = '<table class="widefat striped">
        <thead>
            <tr>
                <th>Title</th><th>Main Question</th><th>Relative Questions</th><th>Answer</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>';
    
    foreach ($rows as $row) {
        $meta = json_decode($row['metadata'], true);
        $main_question = esc_html($meta['question'] ?? '');
        $relative_questions = isset($meta['relative_questions']) && is_array($meta['relative_questions']) ? implode(', ', array_map('esc_html', $meta['relative_questions'])) : '';
        $answer = wp_kses_post($meta['answer'] ?? '');
        $title = esc_html($row['title'] ?? '');
        $html .= "<tr data-id='{$row['id']}'
            data-main-question='" . esc_attr($meta['question'] ?? '') . "'
            data-relative-questions='" . esc_attr(json_encode($meta['relative_questions'] ?? [])) . "'
            data-answer='" . esc_attr($meta['answer'] ?? '') . "'
            data-title='" . esc_attr($row['title']) . "'>
            <td class='qa-title'>{$title}</td>
            <td class='qa-main-question'>{$main_question}</td>
            <td class='qa-relative-questions'>{$relative_questions}</td>
            <td class='qa-answer'>{$answer}</td>
            <td class='actionsWrapper'>
                <button type='button' class='button button-small edit-qna-inline' data-id='{$row['id']}' data-title='" . esc_attr($row['title']) . "' data-main-question='" . esc_attr($meta['question'] ?? '') . "' data-relative-questions='" . esc_attr(json_encode($meta['relative_questions'] ?? [])) . "' data-answer='" . esc_attr($meta['answer'] ?? '') . "'>Edit</button>
                <a href='#' class='button button-small button-link-delete delete-qna' data-id='{$row['id']}'>Delete</a>
            </td>
        </tr>";
    }
    
    $html .= '</tbody></table>';
    
    // Add pagination if needed
    if ($total_pages > 1) {
        $html .= '<div class="tablenav-pages">
            <span class="displaying-num">' . $total_items . ' items</span>
            <span class="pagination-links">';
        
        // Previous page
        if ($current_page > 1) {
            $html .= '<a class="prev-page" href="#" data-page="' . ($current_page - 1) . '">‹</a>';
        }
        
        // Page numbers
        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);
        
        if ($start_page > 1) {
            $html .= '<a href="#" data-page="1">1</a>';
            if ($start_page > 2) {
                $html .= '<span class="paging-input">…</span>';
            }
        }
        
        for ($i = $start_page; $i <= $end_page; $i++) {
            if ($i == $current_page) {
                $html .= '<span class="paging-input"><span class="tablenav-paging-text">' . $i . '</span></span>';
            } else {
                $html .= '<a href="#" data-page="' . $i . '">' . $i . '</a>';
            }
        }
        
        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                $html .= '<span class="paging-input">…</span>';
            }
            $html .= '<a href="#" data-page="' . $total_pages . '">' . $total_pages . '</a>';
        }
        
        // Next page
        if ($current_page < $total_pages) {
            $html .= '<a class="next-page" href="#" data-page="' . ($current_page + 1) . '">›</a>';
        }
        
        $html .= '</span></div>';
    }
    
    wp_send_json_success(['html' => $html, 'current_page' => $current_page, 'total_pages' => $total_pages]);
});

add_action('wp_ajax_ai_update_qna_inline', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    $id = intval($_POST['qa_id']);
    $title = sanitize_text_field($_POST['qa_title']);
    $questions = isset($_POST['qna_questions']) ? array_map('sanitize_text_field', (array)$_POST['qna_questions']) : [];
    $answer = wp_kses_post($_POST['qa_answer']);
    
    if (empty($title) || empty($questions) || empty($answer)) {
        wp_send_json_error(['message' => 'Title, at least one question, and answer are required.']);
        return;
    }
    
    $main_question = $questions[0];
    $relative_questions = array_slice($questions, 1);
    $text = implode(' ', $questions) . ' ' . $answer;
    $embedding = ai_trainer_generate_embedding($text);
    
    global $wpdb;
    $wpdb->update(
        $wpdb->prefix . 'ai_knowledge',
        [
            'title' => $title,
            'content' => $text,
            'embedding' => $embedding,
            'metadata' => json_encode([
                'question' => $main_question,
                'relative_questions' => $relative_questions,
                'answer' => $answer,
            ])
        ],
        ['id' => $id]
    );
    
    wp_send_json_success(['message' => 'Q&A updated successfully.']);
});

// AJAX handlers for file operations
add_action('wp_ajax_ai_upload_files', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    if (!isset($_FILES['training_files']) || empty($_FILES['training_files']['name'][0])) {
        wp_send_json_error(['message' => 'No files were uploaded.']);
        return;
    }
    $processed_count = 0;
    $error_count = 0;
    global $wpdb;
    foreach ($_FILES['training_files']['name'] as $i => $name) {
        $tmp = $_FILES['training_files']['tmp_name'][$i];
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $text = '';
        if ($ext === 'txt') {
            $text = file_get_contents($tmp);
        } elseif ($ext === 'pdf') {
            require_once AI_TRAINER_PATH . 'vendor/autoload.php';
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($tmp);
            $text = $pdf->getText();
        } elseif ($ext === 'docx') {
            $zip = new ZipArchive;
            if ($zip->open($tmp)) {
                $xml = $zip->getFromName('word/document.xml');
                $text = strip_tags($xml);
                $zip->close();
            }
        }
        if ($text) {
            $embedding = ai_trainer_generate_embedding($text);
            ai_trainer_save_to_db($name, 'file', $text, $embedding, ['filetype' => $ext]);
            $parent_id = $wpdb->insert_id;
            if (function_exists('ai_trainer_save_chunks_to_db')) {
                ai_trainer_save_chunks_to_db($parent_id, 'file', $text, ['filetype' => $ext]);
            }
            $processed_count++;
        } else {
            $error_count++;
        }
    }
    if ($processed_count > 0) {
        $message = "{$processed_count} file(s) processed and embedded successfully.";
        if ($error_count > 0) {
            $message .= " {$error_count} file(s) failed to process.";
        }
        wp_send_json_success(['message' => $message]);
    } else {
        wp_send_json_error(['message' => 'No files could be processed.']);
    }
});

add_action('wp_ajax_ai_delete_file', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    $id = intval($_POST['id']);
    if ($id <= 0) {
        wp_send_json_error(['message' => 'Invalid file ID.']);
        return;
    }
    
    ai_trainer_delete($id);
    wp_send_json_success(['message' => 'File deleted successfully.']);
});

add_action('wp_ajax_ai_update_file_inline', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    $id = intval($_POST['file_id']);
    $title = sanitize_text_field($_POST['file_title']);
    $content = wp_kses_post($_POST['file_content']);
    if (empty($title) || empty($content)) {
        wp_send_json_error(['message' => 'Title and content are required.']);
        return;
    }
    $embedding = ai_trainer_generate_embedding($content);
    global $wpdb;
    $wpdb->update(
        $wpdb->prefix . 'ai_knowledge',
        [
            'title' => $title,
            'content' => $content,
            'embedding' => $embedding
        ],
        ['id' => $id]
    );
    // Remove old chunks and add new ones
    $chunk_table = $wpdb->prefix . 'ai_knowledge_chunks';
    $wpdb->delete($chunk_table, ['parent_id' => $id, 'source_type' => 'file']);
    if (function_exists('ai_trainer_save_chunks_to_db')) {
        ai_trainer_save_chunks_to_db($id, 'file', $content);
    }
    wp_send_json_success(['message' => 'File content updated successfully.']);
});

add_action('wp_ajax_ai_upload_new_file_inline', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    if (!isset($_FILES['new_file']) || $_FILES['new_file']['error'] !== UPLOAD_ERR_OK) {
        wp_send_json_error(['message' => 'No file was uploaded or upload failed.']);
        return;
    }
    
    $id = intval($_POST['file_id']);
    $title = sanitize_text_field($_POST['file_title']);
    
    $tmp = $_FILES['new_file']['tmp_name'];
    $name = $_FILES['new_file']['name'];
    $ext = pathinfo($name, PATHINFO_EXTENSION);
    $text = '';

    // Process the new file
    if ($ext === 'txt') {
        $text = file_get_contents($tmp);
    } elseif ($ext === 'pdf') {
        require_once AI_TRAINER_PATH . 'vendor/autoload.php';
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($tmp);
        $text = $pdf->getText();
    } elseif ($ext === 'docx') {
        $zip = new ZipArchive;
        if ($zip->open($tmp)) {
            $xml = $zip->getFromName('word/document.xml');
            $text = strip_tags($xml);
            $zip->close();
        }
    }

    if ($text) {
        $embedding = ai_trainer_generate_embedding($text);
        
        global $wpdb;
        $wpdb->update(
            $wpdb->prefix . 'ai_knowledge',
            [
                'title' => $title,
                'content' => $text,
                'embedding' => $embedding,
                'metadata' => json_encode(['filetype' => $ext])
            ],
            ['id' => $id]
        );
        
        wp_send_json_success(['message' => 'New file uploaded and processed successfully.']);
    } else {
        wp_send_json_error(['message' => 'Failed to process the uploaded file.']);
    }
});

add_action('wp_ajax_ai_get_files_sources', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    
    global $wpdb;
    
    // Pagination settings
    $items_per_page = 10;
    $current_page = isset($_POST['page']) ? max(1, intval($_POST['page'])) : 1;
    $offset = ($current_page - 1) * $items_per_page;
    
    // Get total count
    $total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'file'");
    $total_pages = ceil($total_items / $items_per_page);
    
    // Get paginated results
    $rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'file' ORDER BY created_at DESC LIMIT $items_per_page OFFSET $offset", ARRAY_A);
    
    $html = '<table class="widefat striped">
        <thead><tr><th>File Name</th><th>Type</th><th>Size</th><th>Actions</th></tr></thead>
        <tbody>';
    
    foreach ($rows as $row) {
        $meta = json_decode($row['metadata'], true);
        $html .= "<tr data-id='{$row['id']}'>
            <td class='file-title'>" . esc_html($row['title']) . "</td>
            <td class='file-type'>" . esc_html($meta['filetype']) . "</td>
            <td>" . size_format(strlen($row['content'])) . "</td>
            <td>
                <button type='button' class='button button-small edit-file-inline' data-id='{$row['id']}' data-title='" . esc_attr($row['title']) . "' data-content='" . esc_attr($row['content']) . "' data-filetype='" . esc_attr($meta['filetype']) . "'>Edit</button>
                <a href='#' class='button button-small button-link-delete delete-file' data-id='{$row['id']}'>Delete</a>
            </td>
        </tr>";
    }
    
    $html .= '</tbody></table>';
    
    // Add pagination if needed
    if ($total_pages > 1) {
        $html .= '<div class="tablenav-pages">
            <span class="displaying-num">' . $total_items . ' items</span>
            <span class="pagination-links">';
        
        // Previous page
        if ($current_page > 1) {
            $html .= '<a class="prev-page" href="#" data-page="' . ($current_page - 1) . '">‹</a>';
        }
        
        // Page numbers
        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);
        
        if ($start_page > 1) {
            $html .= '<a href="#" data-page="1">1</a>';
            if ($start_page > 2) {
                $html .= '<span class="paging-input">…</span>';
            }
        }
        
        for ($i = $start_page; $i <= $end_page; $i++) {
            if ($i == $current_page) {
                $html .= '<span class="paging-input"><span class="tablenav-paging-text">' . $i . '</span></span>';
            } else {
                $html .= '<a href="#" data-page="' . $i . '">' . $i . '</a>';
            }
        }
        
        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                $html .= '<span class="paging-input">…</span>';
            }
            $html .= '<a href="#" data-page="' . $total_pages . '">' . $total_pages . '</a>';
        }
        
        // Next page
        if ($current_page < $total_pages) {
            $html .= '<a class="next-page" href="#" data-page="' . ($current_page + 1) . '">›</a>';
        }
        
        $html .= '</span></div>';
    }
    
    wp_send_json_success(['html' => $html, 'current_page' => $current_page, 'total_pages' => $total_pages]);
});

// Register admin_post handlers for Q&A and Text CSV export
add_action('admin_post_ai_export_qna_csv', 'ai_trainer_export_qna_csv');
add_action('admin_post_ai_export_text_csv', 'ai_trainer_export_text_csv');

function ai_trainer_export_qna_csv() {
    if (!current_user_can('manage_options')) wp_die('Unauthorized');
    check_admin_referer('ai_export_qna_csv');
    global $wpdb;
    $rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa'", ARRAY_A);
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="qna_export_'.date('Ymd_His').'.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Title', 'Question', 'Answer']);
    foreach ($rows as $row) {
        $meta = json_decode($row['metadata'], true);
        fputcsv($output, [
            $row['title'],
            $meta['question'] ?? '',
            $meta['answer'] ?? ''
        ]);
    }
    fclose($output);
    exit;
}

function ai_trainer_export_text_csv() {
    if (!current_user_can('manage_options')) wp_die('Unauthorized');
    check_admin_referer('ai_export_text_csv');
    global $wpdb;
    $rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'text'", ARRAY_A);
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="text_export_'.date('Ymd_His').'.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Title', 'Content']);
    foreach ($rows as $row) {
        fputcsv($output, [
            $row['title'],
            $row['content']
        ]);
    }
    fclose($output);
    exit;
}

// Helper to extract main domain
function ai_trainer_extract_domain($url) {
    $host = parse_url(trim($url), PHP_URL_HOST);
    if (!$host) {
        // Try to add scheme if missing
        $url = 'https://' . ltrim($url, '/');
        $host = parse_url($url, PHP_URL_HOST);
    }
    // Remove www. for consistency
    $host = preg_replace('/^www\./', '', strtolower($host));
    return $host;
}

// --- AJAX handlers for Website tab ---
add_action('wp_ajax_ai_add_website', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $title = sanitize_text_field($_POST['title'] ?? '');
    $url = esc_url_raw($_POST['url'] ?? '');
    $tier = intval($_POST['tier'] ?? 3); // Default to tier 3 if not specified
    
    if (empty($title) || empty($url)) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Title and URL are required.</p></div>']);
    }
    
    if ($tier < 1 || $tier > 4) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Tier must be between 1 and 4.</p></div>']);
    }
    
    $domain = ai_trainer_extract_domain($url);
    $wpdb->insert($wpdb->prefix . 'ai_allowed_domains', [
        'title' => $title,
        'url' => $url,
        'domain' => $domain,
        'tier' => $tier,
        'created_at' => current_time('mysql')
    ]);
    wp_send_json(['notice' => '<div class="notice notice-success"><p>Website added with tier ' . $tier . '.</p></div>']);
});

add_action('wp_ajax_ai_edit_website', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $id = intval($_POST['id']);
    $title = sanitize_text_field($_POST['title'] ?? '');
    $url = esc_url_raw($_POST['url'] ?? '');
    $tier = intval($_POST['tier'] ?? 3);
    
    if ($id <= 0 || empty($title) || empty($url)) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Invalid data.</p></div>']);
    }
    
    if ($tier < 1 || $tier > 4) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Tier must be between 1 and 4.</p></div>']);
    }
    
    $domain = ai_trainer_extract_domain($url);
    $wpdb->update($wpdb->prefix . 'ai_allowed_domains', [
        'title' => $title,
        'url' => $url,
        'domain' => $domain,
        'tier' => $tier
    ], ['id' => $id]);
    wp_send_json(['notice' => '<div class="notice notice-success"><p>Website updated with tier ' . $tier . '.</p></div>']);
});

add_action('wp_ajax_ai_delete_website', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $id = intval($_POST['id']);
    if ($id <= 0) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Invalid website ID.</p></div>']);
    }
    $wpdb->delete($wpdb->prefix . 'ai_allowed_domains', ['id' => $id]);
    wp_send_json(['notice' => '<div class="notice notice-success"><p>Website deleted.</p></div>']);
});

add_action('wp_ajax_ai_get_website_table', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $websites = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_allowed_domains ORDER BY tier ASC, domain ASC", ARRAY_A);
    ob_start();
    echo '<table class="widefat striped">';
    echo '<thead><tr><th>Title</th><th>URL</th><th>Domain</th><th>Tier</th><th>Actions</th></tr></thead><tbody>';
    foreach ($websites as $site) {
        $tier = isset($site['tier']) ? intval($site['tier']) : 3;
        echo '<tr data-id="' . esc_attr($site['id']) . '">';
        echo '<td class="website-title">' . esc_html($site['title']) . '</td>';
        echo '<td class="website-url"><a href="' . esc_url($site['url']) . '" target="_blank">' . esc_html($site['url']) . '</a></td>';
        echo '<td class="website-domain">' . esc_html($site['domain']) . '</td>';
        echo '<td class="website-tier">';
        $tier_labels = [
            1 => 'Tier 1 (Highest)',
            2 => 'Tier 2 (High)', 
            3 => 'Tier 3 (Medium)',
            4 => 'Tier 4 (Low)'
        ];
        echo '<span class="tier-' . $tier . '">' . $tier_labels[$tier] . '</span>';
        echo '</td>';
        echo '<td class="actionsWrapper">';
        echo '<button type="button" class="button button-small edit-website-inline" data-id="' . esc_attr($site['id']) . '" data-title="' . esc_attr($site['title']) . '" data-url="' . esc_attr($site['url']) . '" data-tier="' . esc_attr($tier) . '">Edit</button> ';
        echo '<a href="#" class="button button-small button-link-delete delete-website" data-id="' . esc_attr($site['id']) . '">Delete</a>';
        echo '</td></tr>';
    }
    echo '</tbody></table>';
    $html = ob_get_clean();
    $notice = isset($_GET['notice']) ? $_GET['notice'] : '';
    wp_send_json(['html' => $html, 'notice' => $notice]);
});

// --- AJAX handlers for Block Website tab ---
add_action('wp_ajax_ai_add_block_website', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $title = sanitize_text_field($_POST['title'] ?? '');
    $url = esc_url_raw($_POST['url'] ?? '');
    if (empty($title) || empty($url)) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Title and URL are required.</p></div>']);
    }
    $domain = ai_trainer_extract_domain($url);
    $wpdb->insert($wpdb->prefix . 'ai_blocked_domains', [
        'title' => $title,
        'url' => $url,
        'domain' => $domain,
        'created_at' => current_time('mysql')
    ]);
    wp_send_json(['notice' => '<div class="notice notice-success"><p>Blocked website added.</p></div>']);
});

add_action('wp_ajax_ai_edit_block_website', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $id = intval($_POST['id']);
    $title = sanitize_text_field($_POST['title'] ?? '');
    $url = esc_url_raw($_POST['url'] ?? '');
    if ($id <= 0 || empty($title) || empty($url)) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Invalid data.</p></div>']);
    }
    $domain = ai_trainer_extract_domain($url);
    $wpdb->update($wpdb->prefix . 'ai_blocked_domains', [
        'title' => $title,
        'url' => $url,
        'domain' => $domain
    ], ['id' => $id]);
    wp_send_json(['notice' => '<div class="notice notice-success"><p>Blocked website updated.</p></div>']);
});

add_action('wp_ajax_ai_delete_block_website', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $id = intval($_POST['id']);
    if ($id <= 0) {
        wp_send_json(['notice' => '<div class="notice notice-error"><p>Invalid blocked website ID.</p></div>']);
    }
    $wpdb->delete($wpdb->prefix . 'ai_blocked_domains', ['id' => $id]);
    wp_send_json(['notice' => '<div class="notice notice-success"><p>Blocked website deleted.</p></div>']);
});

add_action('wp_ajax_ai_get_block_website_table', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    $blocked_websites = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_blocked_domains ORDER BY created_at DESC", ARRAY_A);
    ob_start();
    echo '<table class="widefat striped">';
    echo '<thead><tr><th>Title</th><th>URL</th><th>Domain</th><th>Actions</th></tr></thead><tbody>';
    foreach ($blocked_websites as $site) {
        echo '<tr data-id="' . esc_attr($site['id']) . '">';
        echo '<td class="block-website-title">' . esc_html($site['title']) . '</td>';
        echo '<td class="block-website-url"><a href="' . esc_url($site['url']) . '" target="_blank">' . esc_html($site['url']) . '</a></td>';
        echo '<td class="block-website-domain">' . esc_html($site['domain']) . '</td>';
        echo '<td class="actionsWrapper">';
        echo '<button type="button" class="button button-small edit-block-website-inline" data-id="' . esc_attr($site['id']) . '" data-title="' . esc_attr($site['title']) . '" data-url="' . esc_attr($site['url']) . '">Edit</button> ';
        echo '<a href="#" class="button button-small button-link-delete delete-block-website" data-id="' . esc_attr($site['id']) . '">Delete</a>';
        echo '</td></tr>';
    }
    echo '</tbody></table>';
    $html = ob_get_clean();
    $notice = isset($_GET['notice']) ? $_GET['notice'] : '';
    wp_send_json(['html' => $html, 'notice' => $notice]);
});

// Helper to get blocked domains for Exa search
function ai_trainer_get_blocked_domains() {
    global $wpdb;
    $domains = $wpdb->get_col("SELECT DISTINCT domain FROM {$wpdb->prefix}ai_blocked_domains WHERE domain IS NOT NULL AND domain != ''");
    $main_domains = [];
    foreach ($domains as $d) {
        $d = strtolower($d);
        $main_domains[] = preg_replace('/^www\./', '', $d);
    }
    return array_values(array_unique($main_domains));
}

// Helper to get allowed domains for Exa search
function ai_trainer_get_allowed_domains() {
    global $wpdb;
    $domains = $wpdb->get_results("SELECT domain, tier FROM {$wpdb->prefix}ai_allowed_domains WHERE domain IS NOT NULL AND domain != '' ORDER BY tier ASC, domain ASC");
    
    // Only return domains from the database - no hardcoded fallbacks
    $main_domains = [];
    foreach ($domains as $d) {
        $domain = strtolower($d->domain);
        $domain = preg_replace('/^www\./', '', $domain);
        $main_domains[] = $domain;
    }
    return array_values(array_unique($main_domains));
}

// Helper to get domains with tier information for EXA search
function ai_trainer_get_domains_with_tiers() {
    global $wpdb;
    $domains = $wpdb->get_results("SELECT domain, tier FROM {$wpdb->prefix}ai_allowed_domains WHERE domain IS NOT NULL AND domain != '' ORDER BY tier ASC, domain ASC");
    
    $tiered_domains = [];
    foreach ($domains as $d) {
        $domain = strtolower($d->domain);
        $domain = preg_replace('/^www\./', '', $domain);
        $tiered_domains[$domain] = $d->tier;
    }
    
    // Debug logging
    error_log('ai_trainer_get_domains_with_tiers() returned: ' . print_r($tiered_domains, true));
    
    return $tiered_domains;
}

//  AJAX handler to update chatlog answer
add_action('wp_ajax_ai_update_chatlog_answer', function() {
    check_ajax_referer('ai_update_chatlog_answer');
    global $wpdb;
    $id = intval($_POST['id']);
    $answer = sanitize_text_field($_POST['answer']);
    $updated = $wpdb->update(
        $wpdb->prefix . 'ai_chat_log',
        ['answer' => $answer],
        ['id' => $id]
    );
    if ($updated !== false) {
        wp_send_json_success();
    } else {
        wp_send_json_error();
    }
});

add_action('wp_ajax_ai_add_chatlog_to_training', function() {
    check_ajax_referer('ai_add_chatlog_to_training');
    global $wpdb;
    $question = sanitize_text_field($_POST['question']);
    $answer = wp_kses_post($_POST['answer']);
    $title = mb_substr($question, 0, 100);
    $text = $question . ' ' . $answer;
    // Always re-embed with the latest answer
    $embedding = ai_trainer_generate_embedding($text);
    $meta = json_encode(['question' => $question, 'answer' => $answer]);
    // Check if question exists
    $row = $wpdb->get_row("SELECT id FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa' AND metadata LIKE '%" . esc_sql($question) . "%' ");
    if ($row) {
        // Update
        $wpdb->update(
            $wpdb->prefix . 'ai_knowledge',
            [
                'title' => $title,
                'content' => $text,
                'embedding' => $embedding,
                'metadata' => $meta
            ],
            ['id' => $row->id]
        );
    } else {
        // Insert
        ai_trainer_save_to_db($title, 'qa', $text, $embedding, [
            'question' => $question,
            'answer' => $answer,
        ]);
    }
    wp_send_json_success();
});

add_action('wp_ajax_ai_delete_chatlog', function() {
    check_ajax_referer('ai_update_chatlog_answer');
    global $wpdb;
    $id = intval($_POST['id']);
    $deleted = $wpdb->delete($wpdb->prefix . 'ai_chat_log', ['id' => $id]);
    if ($deleted) {
        wp_send_json_success();
    } else {
        wp_send_json_error();
    }
});

add_action('wp_ajax_nopriv_ai_update_chatlog_answer_by_question', function() {
    global $wpdb;
    $question = sanitize_text_field($_POST['question']);
    $answer = wp_kses_post($_POST['answer']);
    // Update the most recent chat log for this question
    $wpdb->update(
        $wpdb->prefix . 'ai_chat_log',
        ['answer' => $answer],
        ['question' => $question]
    );
    wp_send_json_success();
});

// AJAX handler for beta feedback
add_action('wp_ajax_ai_update_chatlog_beta_feedback', 'ai_trainer_handle_chatlog_beta_feedback');
add_action('wp_ajax_nopriv_ai_update_chatlog_beta_feedback', 'ai_trainer_handle_chatlog_beta_feedback');
function ai_trainer_handle_chatlog_beta_feedback() {
    global $wpdb;
    $id = intval($_POST['id']);
    $beta_feedback = isset($_POST['beta_feedback']) ? sanitize_text_field($_POST['beta_feedback']) : '';
    if (!$id || !$beta_feedback) {
        wp_send_json_error(['message' => 'Missing ID or feedback']);
    }
    $result = $wpdb->update(
        $wpdb->prefix . 'ai_chat_log',
        [ 'beta_feedback' => $beta_feedback ],
        [ 'id' => $id ]
    );
    if ($result !== false) {
        wp_send_json_success();
    } else {
        wp_send_json_error(['message' => 'DB update failed']);
    }
}

// Add AJAX handler to update chatlog answer by ID
add_action('wp_ajax_ai_update_chatlog_answer_by_id', function() {
    global $wpdb;
    $id = intval($_POST['id']);
    $answer = wp_kses_post($_POST['answer']);
    error_log('ai_update_chatlog_answer_by_id called: id=' . $id . ', answer_length=' . strlen($answer) . ', answer_preview=' . substr($answer, 0, 200));
    $updated = $wpdb->update($wpdb->prefix . 'ai_chat_log', ['answer' => $answer], ['id' => $id]);
    error_log('ai_update_chatlog_answer_by_id update result: ' . var_export($updated, true));
    wp_send_json_success();
});

add_action('wp_ajax_nopriv_ai_update_chatlog_answer_by_id', function() {
    global $wpdb;
    $id = intval($_POST['id']);
    $answer = wp_kses_post($_POST['answer']);
    error_log('ai_update_chatlog_answer_by_id (nopriv) called: id=' . $id . ', answer_length=' . strlen($answer) . ', answer_preview=' . substr($answer, 0, 200));
    $updated = $wpdb->update($wpdb->prefix . 'ai_chat_log', ['answer' => $answer], ['id' => $id]);
    error_log('ai_update_chatlog_answer_by_id (nopriv) update result: ' . var_export($updated, true));
    wp_send_json_success();
});

add_action('wp_ajax_ai_delete_chatlog_bulk', function() {
    check_ajax_referer('ai_update_chatlog_answer');
    global $wpdb;
    $ids = isset($_POST['ids']) ? (array)$_POST['ids'] : [];
    $all_deleted = true;
    foreach ($ids as $id) {
        $deleted = $wpdb->delete($wpdb->prefix . 'ai_chat_log', ['id' => intval($id)]);
        if (!$deleted) $all_deleted = false;
    }
    if ($all_deleted) {
        wp_send_json_success();
    } else {
        wp_send_json_error();
    }
});

// AJAX handler to get chatlog edit view
add_action('wp_ajax_ai_get_chatlog_edit_view', function() {
    check_ajax_referer('ai_update_chatlog_answer');
    global $wpdb;
    $id = intval($_POST['id']);
    
    $log = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}ai_chat_log WHERE id = %d", $id), ARRAY_A);
    if (!$log) {
        wp_send_json_error(['message' => 'Chat log not found']);
    }
    
    // Helper function for chatlog edit view
    function chatlog_question_in_training($question) {
        global $wpdb;
        $rows = $wpdb->get_results("SELECT metadata FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa'");
        foreach ($rows as $row) {
            $meta = json_decode($row->metadata, true);
            if (isset($meta['question']) && $meta['question'] === $question) {
                return true;
            }
        }
        return false;
    }
    
    $in_training = chatlog_question_in_training($log['question']);
    $reactions = isset($log['reaction']) ? json_decode($log['reaction'], true) : ['like' => 0, 'dislike' => 0];
    
    ob_start();
    ?>
    <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 15px;">
            <label for="edit-chatlog-question" style="display: block; font-weight: bold; margin-bottom: 5px;">Question:</label>
            <input type="text" id="edit-chatlog-question" value="<?php echo esc_attr($log['question']); ?>" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" />
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="edit-chatlog-answer" style="display: block; font-weight: bold; margin-bottom: 5px;">Answer:</label>
            <textarea id="edit-chatlog-answer" style="width: 100%; min-height: 300px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical;"><?php echo esc_textarea($log['answer']); ?></textarea>
        </div>
    </div>
    <input type="hidden" id="edit-chatlog-id" value="<?php echo esc_attr($log['id']); ?>" />
    <?php
    $html = ob_get_clean();
    
    wp_send_json_success(['html' => $html]);
});

// AJAX handler to update chatlog with full data
add_action('wp_ajax_ai_update_chatlog_full', function() {
    check_ajax_referer('ai_update_chatlog_answer');
    global $wpdb;
    $id = intval($_POST['id']);
    $question = sanitize_text_field($_POST['question']);
    $answer = wp_kses_post($_POST['answer']);
    
    $updated = $wpdb->update(
        $wpdb->prefix . 'ai_chat_log',
        [
            'question' => $question,
            'answer' => $answer
        ],
        ['id' => $id]
    );
    
    if ($updated !== false) {
        wp_send_json_success();
    } else {
        wp_send_json_error();
    }
});

// AJAX handler for updating chatlog reaction
function ai_trainer_handle_chatlog_reaction() {
    global $wpdb;
    $id = intval($_POST['id']);
    if (!$id) { error_log('Reaction: Invalid ID'); wp_send_json_error(['message' => 'Invalid ID']); }
    $reaction = $_POST['reaction'] === 'like' ? 'like' : 'dislike';
    $single = isset($_POST['single']) && $_POST['single'] == 1;
    $row = $wpdb->get_row($wpdb->prepare("SELECT reaction FROM {$wpdb->prefix}ai_chat_log WHERE id = %d", $id));
    $counts = ['like' => 0, 'dislike' => 0];
    if ($row && $row->reaction) {
        $counts = json_decode($row->reaction, true);
        if (!is_array($counts)) $counts = ['like' => 0, 'dislike' => 0];
    }
    if ($single) {
        $counts = ['like' => 0, 'dislike' => 0];
        $counts[$reaction] = 1;
    } else {
        $counts[$reaction] = isset($counts[$reaction]) ? $counts[$reaction] + 1 : 1;
    }
    // Get reaction_detail from AJAX
    $reaction_detail = isset($_POST['reaction_detail']) ? sanitize_text_field($_POST['reaction_detail']) : '';
    $result = $wpdb->update(
        $wpdb->prefix . 'ai_chat_log',
        [
            'reaction' => json_encode($counts),
            'reaction_detail' => $reaction_detail ? $reaction_detail : null
        ],
        ['id' => $id]
    );
    error_log('Reaction update for ID ' . $id . ': ' . var_export($result, true) . ' | New counts: ' . json_encode($counts));
    if ($result !== false) {
        wp_send_json_success($counts);
    } else {
        wp_send_json_error(['message' => 'DB update failed']);
    }
}
add_action('wp_ajax_ai_update_chatlog_reaction', 'ai_trainer_handle_chatlog_reaction');
add_action('wp_ajax_nopriv_ai_update_chatlog_reaction', 'ai_trainer_handle_chatlog_reaction');

// AJAX handler to fetch reaction counts for a chatlog ID
add_action('wp_ajax_ai_get_chatlog_reaction_counts', 'ai_trainer_handle_get_reaction_counts');
add_action('wp_ajax_nopriv_ai_get_chatlog_reaction_counts', 'ai_trainer_handle_get_reaction_counts');
function ai_trainer_handle_get_reaction_counts() {
    global $wpdb;
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    if (!$id) {
        wp_send_json_error(['message' => 'Invalid ID']);
    }

    $row = $wpdb->get_row($wpdb->prepare("SELECT reaction FROM {$wpdb->prefix}ai_chat_log WHERE id = %d", $id));
    $counts = ['like' => 0, 'dislike' => 0];
    if ($row && !empty($row->reaction)) {
        $decoded = json_decode($row->reaction, true);
        if (is_array($decoded)) {
            $counts['like'] = isset($decoded['like']) ? intval($decoded['like']) : 0;
            $counts['dislike'] = isset($decoded['dislike']) ? intval($decoded['dislike']) : 0;
        }
    }

    wp_send_json_success($counts);
}

add_action('wp_ajax_ai_get_chatlog_by_id', function() {
    global $wpdb;
    $id = intval($_POST['id']);
    
    error_log("ai_get_chatlog_by_id called with ID: " . $id);
    
    $row = $wpdb->get_row($wpdb->prepare("SELECT question, answer FROM {$wpdb->prefix}ai_chat_log WHERE id = %d", $id), ARRAY_A);
    
    error_log("Database query result: " . print_r($row, true));
    
    if ($row) {
        error_log("Sending success response for chatlog ID: " . $id);
        wp_send_json_success($row);
    } else {
        error_log("Chatlog not found for ID: " . $id);
        wp_send_json_error(['message' => 'Not found', 'id' => $id]);
    }
});
add_action('wp_ajax_nopriv_ai_get_chatlog_by_id', function() {
    global $wpdb;
    $id = intval($_POST['id']);
    
    error_log("ai_get_chatlog_by_id (nopriv) called with ID: " . $id);
    
    $row = $wpdb->get_row($wpdb->prepare("SELECT question, answer FROM {$wpdb->prefix}ai_chat_log WHERE id = %d", $id), ARRAY_A);
    
    error_log("Database query result (nopriv): " . print_r($row, true));
    
    if ($row) {
        error_log("Sending success response for chatlog ID (nopriv): " . $id);
        wp_send_json_success($row);
    } else {
        error_log("Chatlog not found for ID (nopriv): " . $id);
        wp_send_json_error(['message' => 'Not found', 'id' => $id]);
    }
});


class Exa_AI_Integration {
    private $exa_api_key = EXA_API_KEY;
    private $openai_api_key = OPENAI_API_KEY;

    public function __construct() {
        add_shortcode('exa_search', [$this, 'render_shortcode']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('wp_ajax_exa_query', [$this, 'handle_exa_ajax']);
        add_action('wp_ajax_nopriv_exa_query', [$this, 'handle_exa_ajax']);
        add_action('wp_ajax_openai_stream', [$this, 'handle_openai_stream']);
        add_action('wp_ajax_nopriv_openai_stream', [$this, 'handle_openai_stream']);
    }

    public function enqueue_scripts() {
        wp_enqueue_script('exa-script', plugin_dir_url(__FILE__) . '/assets/js/exa.js', ['jquery'], null, true);
        wp_localize_script('exa-script', 'exa_ajax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'streamurl' => plugin_dir_url(__FILE__) . '/assets/js/stream-openai.php'
        ]);
        wp_localize_script('exa-script', 'exaSettings', [
            'fallbackIcon' => plugin_dir_url(__FILE__) . '/assets/images/Globe.png',
        ]);
        // wp_localize_script('exa-script', 'exaBlockedDomains', [
        //     'domains' => ai_trainer_get_blocked_domains(),
        // ]);
        wp_enqueue_style('exa-style', plugin_dir_url(__FILE__) . '/assets/css/style.css');  
        wp_enqueue_style('core-style', plugin_dir_url(__FILE__) . '/build/index.css');    
    }

    public function render_shortcode($atts) {
        ob_start();
        ?>
        <div class="psy-search-ai-wrapper">
            <div class="psy-search-ai-container">
                <div id="exa-question"></div>
                <!-- <div id="exa-results">Disclaimer - By submitting your question, you ackowledge that the Psybrarian may make mistakes. Double-check important info and consult a medical professional before making health decisions.</div> -->
                <div id="exa-answer"></div>
                <div id="exa-loading" style="display:none;">Thinking...</div>
                <div class="exa-box-wrapper">
                    <div id="exa-search-box">
                        <input type="text" id="exa-input" placeholder="Ask anything about psychedelics" />
                        <button id="exa-submit">➜</button>
                        <!-- <button id="exa-voice">🎤</button> -->
                    </div>
                    <p class="exa-search-box-notice">By submitting your question, you acknowledge that the Psybrarian can make mistakes. Double-check important info.</p>
                </div>
                <div id="ticket-wrapper">
                    <div class="psy-ticket-form">
                        <h2>Submit a Ticket</h2>
                        <hr />
                        <p>👋 <strong>Want some human attention?</strong></p>
                        <p>Want more support? - submit a ticket, and someone who specializes in psychedelics will follow up to discuss this AI-curated answer.</p>
                        <?php 
                            echo do_shortcode('[fluentform id="7"]'); 
                        ?>
                    </div>
                </div>

            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function handle_openai_stream() {
        error_log('openai_stream called');
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no'); // disable buffering for Nginx
        header('Content-Encoding: none'); // avoid compression
        error_log('openai_stream: headers sent');

        while (ob_get_level()) ob_end_clean();
        @ini_set('output_buffering', 'off');
        @ini_set('zlib.output_compression', 0);
        @ini_set('implicit_flush', 1);
        ob_implicit_flush(true);
        echo ": streaming initialized\n\n";
        @ob_flush(); flush();
        error_log('openai_stream: after flush');

        $api_key = defined('OPENAI_API_KEY') ? $this->openai_api_key : get_option('openai_api_key');
        $prompt = isset($_POST['prompt']) ? trim($_POST['prompt']) : '';

        if (!$prompt) {
            error_log('openai_stream: missing prompt');
            echo "event: error\ndata: Missing prompt\n\n";
            flush();
            exit;
        }

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $api_key,
                'Content-Type: application/json'
            ],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'model' => 'gpt-4.1-mini',
                'stream' => true,
                'temperature' => 0.7,
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a psychedelic expert and clean HTML content generator. Only return valid HTML using tags like <h3>, <p>, <ul>, <li>, <a>. Never use Markdown, never wrap content in <html>, <body>, or <head>. Do not add any extra characters like >, 3>, <>, or ```html. Only return raw HTML tags and content, nothing else.'],
                    ['role' => 'user', 'content' => $prompt],
                ]
            ]),
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_HEADER => false,
            CURLOPT_NOPROGRESS => false,
            CURLOPT_BUFFERSIZE => 2048,
            CURLOPT_TIMEOUT => 100,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_WRITEFUNCTION => function ($ch, $data) {
                $lines = explode("\n", $data);
                foreach ($lines as $line) {
                    if (strpos($line, 'data: ') === 0) {
                        $json = trim(substr($line, 6));

                        if ($json === '[DONE]') {
                            echo "event: done\ndata: [DONE]\n\n";
                            @ob_flush(); flush();
                            continue;
                        }

                        $payload = json_decode($json, true);
                        if (!empty($payload['choices'][0]['delta']['content'])) {
                            $text = $payload['choices'][0]['delta']['content'];
                            echo "data: {$text}\n\n";
                            @ob_flush(); flush();
                        }
                    }
                }
                return strlen($data);
            }
        ]);

        $result = curl_exec($ch);
        $err = curl_error($ch);
        error_log('openai_stream: curl_exec finished, error: ' . $err);
        curl_close($ch);
        error_log('openai_stream: curl closed');
        exit;
    }

    public function handle_exa_ajax() {
        $data = [];
        $sources = [];
        $cache_key = '';
        $query = sanitize_text_field($_POST['query'] ?? '');
        $conversation_history = isset($_POST['conversation_history']) ? json_decode(stripslashes($_POST['conversation_history']), true) : [];
        // Build conversational prompt for OpenAI if context is present
        $conversational_prompt = '';
        if (!empty($conversation_history) && is_array($conversation_history)) {
            foreach ($conversation_history as $idx => $pair) {
                $q = isset($pair['q']) ? $pair['q'] : '';
                $conversational_prompt .= "Q" . ($idx+1) . ": " . $q . "\n";
            }
        }
        $conversational_prompt .= "Q" . (count($conversation_history)+1) . ": " . $query . "\n";
        
        
        // Use $conversational_prompt for OpenAI embedding and answer generation
        $embedding = $this->get_openai_embedding($conversational_prompt);
        if (!$embedding) {
            error_log('Exa AJAX: Embedding failed for query: ' . $query);
            wp_send_json_error(['message' => 'Embedding failed']);
        }
        if (!function_exists('ai_trainer_normalize_embedding')) require_once AI_TRAINER_PATH . 'includes/openai.php';
        $embedding = ai_trainer_normalize_embedding($embedding);

        global $wpdb;
        // First, check for exact Q&A question match (case-insensitive)
        $rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa'", ARRAY_A);
        $exact_match = null;
        foreach ($rows as $row) {
            $meta = json_decode($row['metadata'], true);
            $all_questions = [];
            if (isset($meta['question'])) {
                $all_questions[] = $meta['question'];
            }
            if (isset($meta['relative_questions']) && is_array($meta['relative_questions'])) {
                $all_questions = array_merge($all_questions, $meta['relative_questions']);
            }
            foreach ($all_questions as $q) {
                if (mb_strtolower(trim($q)) === mb_strtolower(trim($query))) {
                    $exact_match = $row;
                    break 2;
                }
            }
        }
        // Always insert a chat log row with placeholder answer
        $user_id = get_current_user_id() ?: 0;
        $wpdb->insert($wpdb->prefix . 'ai_chat_log', [
            'user_id' => $user_id,
            'question' => $query,
            'created_at' => current_time('mysql')
        ]);
        $chatlog_id = $wpdb->insert_id;
        // 2. Search in chunked embeddings
        $chunk_table = $wpdb->prefix . 'ai_knowledge_chunks';
        $chunks = $wpdb->get_results("SELECT * FROM $chunk_table", ARRAY_A);
        $chunk_scores = [];
        foreach ($chunks as $chunk) {
            $stored = json_decode($chunk['embedding'], true);
            if (!is_array($stored)) continue;
            $stored = ai_trainer_normalize_embedding($stored);
            $score = $this->cosine_similarity($embedding, $stored);
            $chunk_scores[] = [
                'score' => $score,
                'chunk' => $chunk
            ];
        }
        usort($chunk_scores, function($a, $b) { return $b['score'] <=> $a['score']; });
        $threshold = 0.90; // Back to 90% for higher quality filtering
        $top_chunks = array_filter(array_slice($chunk_scores, 0, 5), function($x) use ($threshold) { return $x['score'] >= $threshold; });
        $best_match = null;
        if (!empty($top_chunks)) {
            $best_match = $top_chunks[0]['chunk'];
        }
        
        // ENHANCED: Dual-query strategy to ensure psychedelics.com content
        $all_results = [];
        $psychedelics_com_results = [];
        
        // Primary Query: Current EXA search with domain priorities
        $primary_results = $this->execute_exa_search($conversational_prompt, $query);
        if (!empty($primary_results)) {
            $all_results = array_merge($all_results, $primary_results);
        }
        
        // Check if we have psychedelics.com results in primary search
        $has_psychedelics_com = $this->has_domain_results($all_results, 'psychedelics.com');
        
        // ENHANCED: Apply relevance filtering to primary search psychedelics.com results
        if ($has_psychedelics_com) {
            $primary_psychedelics = $this->extract_psychedelics_com_results($all_results);
            $filtered_primary_psychedelics = $this->filter_psychedelics_com_by_relevance($primary_psychedelics, $query);
            
            // Replace primary results with filtered psychedelics.com results
            $all_results = $this->replace_psychedelics_com_results($all_results, $filtered_primary_psychedelics);
            
            error_log('Primary search psychedelics.com results filtered by relevance: ' . count($filtered_primary_psychedelics) . ' relevant results');
        }
        
        // Fallback Query: If no psychedelics.com results, run specific search
        if (!$has_psychedelics_com) {
            error_log('No psychedelics.com results found in primary search, running fallback query');
            $fallback_results = $this->execute_psychedelics_com_fallback($conversational_prompt, $query);
            if (!empty($fallback_results)) {
                $psychedelics_com_results = $fallback_results;
                // Merge fallback results with primary results, prioritizing psychedelics.com
                $all_results = $this->merge_results_with_psychedelics_priority($all_results, $psychedelics_com_results);
            }
        }
        
        // Enhanced tier-based reordering with psychedelics.com guarantee
        if (!empty($all_results)) {
            $all_results = $this->enhanced_reorder_with_psychedelics_guarantee($all_results);
        }
        
        // ENHANCED: Verify psychedelics.com guarantee compliance
        $final_psychedelics_count = $this->count_domain_results($all_results, 'psychedelics.com');
        $guarantee_status = $this->check_psychedelics_com_guarantee($all_results, $final_psychedelics_count);
        
        error_log('Psychedelics.com guarantee status: ' . $guarantee_status['status'] . ' - ' . $final_psychedelics_count . ' results included');
        
        // Filter and prepare final sources
        $sources = [];
        if (!empty($all_results) && is_array($all_results)) {
            foreach (array_slice($all_results, 0, 100) as $result) {
                if (isset($result['url'])) {
                    $sources[] = esc_url_raw($result['url']);
                }
            }
        }
        
        // Debug logging for final sources
        error_log('Final sources count: ' . count($sources));
        error_log('Final sources URLs: ' . implode(', ', array_slice($sources, 0, 5)));
        error_log('Psychedelics.com results included: ' . $this->count_domain_results($all_results, 'psychedelics.com'));
        
        // Update conversation history with current question
        $updated_conversation_history = $conversation_history;
        $updated_conversation_history[] = ['q' => $query, 'a' => ''];
        
        // Limit conversation history to last 5 exchanges
        if (count($updated_conversation_history) > 5) {
            $updated_conversation_history = array_slice($updated_conversation_history, -5);
        }
        
        $result = [
            'search' => ['results' => $all_results], // Wrap results in expected format
            'sources' => is_array($sources) ? implode("\n", $sources) : '',
            'block_domains' => ai_trainer_get_blocked_domains(),
            'chatlog_id' => $chatlog_id,
            'include_domains' => ai_trainer_get_allowed_domains(), // for debugging
            'conversation_history' => $updated_conversation_history,
            'psychedelics_com_included' => $this->has_domain_results($all_results, 'psychedelics.com'),
            'psychedelics_com_count' => $final_psychedelics_count,
            'psychedelics_com_guarantee_status' => $guarantee_status
        ];
        
        if ($exact_match) {
            $meta = json_decode($exact_match['metadata'], true);
            $answer = $meta['answer'] ?? $exact_match['content'];
            $result['local_answer'] = [
                'title' => $exact_match['title'],
                'content' => $answer,
                'score' => 1.0,
            ];
            // Update chat log with the actual answer and psychedelics.com guarantee status
            $wpdb->update($wpdb->prefix . 'ai_chat_log', [
                'answer' => $answer,
                'psychedelics_com_included' => $this->has_domain_results($all_results, 'psychedelics.com') ? 1 : 0,
                'psychedelics_com_count' => $final_psychedelics_count,
                'psychedelics_com_guarantee_status' => $guarantee_status['status'],
                'psychedelics_com_guarantee_details' => $guarantee_status['details']
            ], ['id' => $chatlog_id]);
        } elseif ($best_match) {
            $result['local_answer'] = [
                'title' => $best_match['parent_id'],
                'content' => $best_match['content'],
                'score' => $top_chunks[0]['score'],
            ];
            // Update chat log with the best match content and psychedelics.com guarantee status
            $wpdb->update($wpdb->prefix . 'ai_chat_log', [
                'answer' => $best_match['content'],
                'psychedelics_com_included' => $this->has_domain_results($all_results, 'psychedelics.com') ? 1 : 0,
                'psychedelics_com_count' => $final_psychedelics_count,
                'psychedelics_com_guarantee_status' => $guarantee_status['status'],
                'psychedelics_com_guarantee_details' => $guarantee_status['details']
            ], ['id' => $chatlog_id]);
        } else {
            // No local answer found, still update the psychedelics.com guarantee status
            $wpdb->update($wpdb->prefix . 'ai_chat_log', [
                'psychedelics_com_included' => $this->has_domain_results($all_results, 'psychedelics.com') ? 1 : 0,
                'psychedelics_com_count' => $final_psychedelics_count,
                'psychedelics_com_guarantee_status' => $guarantee_status['status'],
                'psychedelics_com_guarantee_details' => $guarantee_status['details']
            ], ['id' => $chatlog_id]);
        }
        
        set_transient('exa_stream_' . md5($query), $result, HOUR_IN_SECONDS);
        wp_send_json_success($result);
    }
    
    // NEW: Execute primary EXA search with domain priorities
    private function execute_exa_search($conversational_prompt, $query) {
        $headers = [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $this->exa_api_key
        ];
        
        $allowed_domains = ai_trainer_get_allowed_domains();
        $tiered_domains = ai_trainer_get_domains_with_tiers();
        $blocked_domains = ai_trainer_get_blocked_domains();
        
        error_log('Tiered domains from database: ' . print_r($tiered_domains, true));
        
        // Clean allowed domains: trim spaces and filter out invalid ones
        $cleaned_domains = array_filter(array_map('trim', $allowed_domains), function($domain) {
            return !empty($domain) && filter_var('http://' . $domain, FILTER_VALIDATE_URL);
        });
        
        // Build domain priorities based on tiers (1 = highest priority, 4 = lowest)
        $domain_priorities = [];
        foreach ($tiered_domains as $domain => $tier) {
            // Convert tier to priority: tier 1 = priority 20, tier 4 = priority 17
            $priority = 21 - $tier; // This gives tier 1 = 20, tier 2 = 19, tier 3 = 18, tier 4 = 17
            $domain_priorities[$domain] = $priority;
        }
        
        // Clean blocked domains: trim spaces and filter out invalid ones
        $cleaned_blocked_domains = array_filter(array_map('trim', $blocked_domains), function($domain) {
            return !empty($domain) && filter_var('http://' . $domain, FILTER_VALIDATE_URL);
        });
        
        error_log('Exa include_domains (cleaned): ' . print_r($cleaned_domains, true));
        error_log('Exa exclude_domains (cleaned): ' . print_r($cleaned_blocked_domains, true));
        error_log('Domain priorities being sent to EXA: ' . print_r($domain_priorities, true));
        
        $body = json_encode([
            'query' => $conversational_prompt,
            'contents' => [ 'text' => true ],
            'numResults' => defined('MAIN_SEARCH_MAX_RESULTS') ? MAIN_SEARCH_MAX_RESULTS : 100, // Request results based on configuration
            'include_domains' => array_values($cleaned_domains),
            // 'exclude_domains' => array_values($cleaned_blocked_domains),
            'domainPriorities' => $domain_priorities,
            'type' => 'neural'
        ]);
        
        $response = wp_remote_post('https://api.exa.ai/search', [
            'headers' => $headers,
            'body' => $body,
            'timeout' => 20
        ]);
        
        error_log('Exa request sent to: https://api.exa.ai/search');
        if (is_wp_error($response)) {
            error_log('Exa API error: ' . $response->get_error_message());
            return [];
        }
        
        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($data) || empty($data['results'])) {
            return [];
        }
        
        // Debug logging
        error_log('Exa API response - Total results: ' . count($data['results']));
        if (is_array($data['results'])) {
            error_log('Exa API results URLs: ' . implode(', ', array_slice(array_column($data['results'], 'url'), 0, 5)));
        }
        
            // Filter to allowed domains only
        $filtered_results = array_filter($data['results'], function($result) use ($cleaned_domains) {
                if (empty($result['url'])) return false;
                $host = parse_url($result['url'], PHP_URL_HOST);
                $host = strtolower($host);
                $host_nw = preg_replace('/^www\./', '', $host);
                return in_array($host, $cleaned_domains) || in_array($host_nw, $cleaned_domains);
            });
            
        return array_values($filtered_results);
    }
    
    // NEW: Execute fallback search specifically for psychedelics.com
    private function execute_psychedelics_com_fallback($conversational_prompt, $query) {
        // Check if fallback is enabled
        if (!defined('PSYCHEDELICS_COM_FALLBACK_ENABLED') || !PSYCHEDELICS_COM_FALLBACK_ENABLED) {
            error_log('Psychedelics.com fallback search is disabled');
            return [];
        }
        
        $headers = [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $this->exa_api_key
        ];
        
        // Create a more specific query for psychedelics.com
        $enhanced_query = $conversational_prompt . " site:psychedelics.com";
        
        $body = json_encode([
            'query' => $enhanced_query,
            'contents' => [ 'text' => true ],
            'numResults' => PSYCHEDELICS_COM_MAX_RESULTS * 3, // Request more to ensure quality
            'include_domains' => ['psychedelics.com'],
            'type' => 'neural'
        ]);
        
        error_log('Executing psychedelics.com fallback search with query: ' . substr($enhanced_query, 0, 100) . '...');
        
        $response = wp_remote_post('https://api.exa.ai/search', [
            'headers' => $headers,
            'body' => $body,
            'timeout' => 15
        ]);
        
        if (is_wp_error($response)) {
            error_log('Psychedelics.com fallback search failed: ' . $response->get_error_message());
            return [];
        }
        
        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($data) || empty($data['results'])) {
            error_log('Psychedelics.com fallback search returned no results');
            return [];
        }
        
        error_log('Psychedelics.com fallback search returned ' . count($data['results']) . ' results');
        
        // Filter to only psychedelics.com results
        $psychedelics_results = array_filter($data['results'], function($result) {
            if (empty($result['url'])) return false;
                        $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            return $host === 'psychedelics.com' || $host_nw === 'psychedelics.com';
        });
        
        $filtered_count = count($psychedelics_results);
        error_log('Psychedelics.com fallback search filtered to ' . $filtered_count . ' valid results');
        
        // ENHANCED: Score and filter results by relevance to the original query
        $relevant_results = $this->filter_psychedelics_com_by_relevance($psychedelics_results, $query);
        
        return array_values($relevant_results);
    }
    
    // NEW: Filter psychedelics.com results by relevance to the query
    private function filter_psychedelics_com_by_relevance($results, $original_query) {
        if (empty($results)) return [];
        
        // Score each result for relevance
        $scored_results = [];
        foreach ($results as $result) {
            $relevance_score = $this->calculate_relevance_score($result, $original_query);
            $scored_results[] = [
                'result' => $result,
                'relevance_score' => $relevance_score
            ];
        }
        
        // Sort by relevance score (highest first)
        usort($scored_results, function($a, $b) {
            return $b['relevance_score'] <=> $a['relevance_score'];
        });
        
        // Get minimum relevance threshold from configuration
        $min_relevance = defined('PSYCHEDELICS_COM_MIN_RELEVANCE') ? PSYCHEDELICS_COM_MIN_RELEVANCE : 0.2;
        $max_results = defined('PSYCHEDELICS_COM_MAX_RESULTS') ? PSYCHEDELICS_COM_MAX_RESULTS : 8;
        
        // Filter by relevance threshold and limit results
        $filtered_results = [];
        $total_scored = count($scored_results);
        $passed_threshold = 0;
        
        foreach ($scored_results as $scored_result) {
            if ($scored_result['relevance_score'] >= $min_relevance && count($filtered_results) < $max_results) {
                $filtered_results[] = $scored_result['result'];
                $passed_threshold++;
            }
        }
        
        // Log relevance filtering results
        error_log("Relevance filtering: {$total_scored} total results, {$passed_threshold} passed threshold ({$min_relevance})");
        
        // Log top 3 relevance scores for debugging
        if (!empty($scored_results)) {
            $top_scores = array_slice($scored_results, 0, 3);
            $score_log = [];
            foreach ($top_scores as $item) {
                $title = substr($item['result']['title'] ?? 'No Title', 0, 40);
                $score_log[] = round($item['relevance_score'], 3) . " ({$title}...)";
            }
            error_log('Top 3 relevance scores: ' . implode(', ', $score_log));
        }
        
        return $filtered_results;
    }
    
    // NEW: Calculate relevance score for a psychedelics.com result
    private function calculate_relevance_score($result, $original_query) {
        $score = 0.0;
        
        // Extract text content for analysis
        $title = strtolower($result['title'] ?? '');
        $text = strtolower($result['text'] ?? '');
        $url = strtolower($result['url'] ?? '');
        
        // Normalize the original query
        $query_terms = $this->extract_query_terms($original_query);
        
        if (empty($query_terms)) return 0.0;
        
        // 1. Title relevance (highest weight - 40%)
        $title_score = $this->calculate_term_overlap_score($title, $query_terms);
        $score += $title_score * 0.4;
        
        // 2. Text content relevance (medium weight - 35%)
        $text_score = $this->calculate_term_overlap_score($text, $query_terms);
        $score += $text_score * 0.35;
        
        // 3. URL path relevance (lower weight - 15%)
        $url_score = $this->calculate_url_relevance_score($url, $query_terms);
        $score += $url_score * 0.15;
        
        // 4. EXA's neural score if available (medium weight - 10%)
        if (isset($result['score'])) {
            $neural_score = floatval($result['score']);
            $score += $neural_score * 0.1;
        }
        
        // Ensure score is between 0 and 1
        $score = max(0.0, min(1.0, $score));
        
        return $score;
    }
    
    // NEW: Extract meaningful terms from the query
    private function extract_query_terms($query) {
        // Remove common stop words and normalize
        $stop_words = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'that', 'this', 'these', 'those'];
        
        // Clean and split the query
        $clean_query = preg_replace('/[^\w\s]/', ' ', strtolower($query));
        $terms = preg_split('/\s+/', trim($clean_query));
        
        // Filter out stop words and short terms
        $filtered_terms = array_filter($terms, function($term) use ($stop_words) {
            return strlen($term) > 2 && !in_array($term, $stop_words);
        });
        
        return array_values($filtered_terms);
    }
    
    // NEW: Calculate term overlap score between content and query
    private function calculate_term_overlap_score($content, $query_terms) {
        if (empty($query_terms) || empty($content)) return 0.0;
        
        $content_terms = preg_split('/\s+/', preg_replace('/[^\w\s]/', ' ', $content));
        $content_terms = array_map('strtolower', $content_terms);
        
        $matches = 0;
        $total_terms = count($query_terms);
        
        foreach ($query_terms as $query_term) {
            if (in_array($query_term, $content_terms)) {
                $matches++;
            }
        }
        
        // Calculate base overlap score
        $overlap_score = $matches / $total_terms;
        
        // Bonus for multiple occurrences of the same term
        $frequency_bonus = 0.0;
        foreach ($query_terms as $query_term) {
            $term_count = substr_count($content, $query_term);
            if ($term_count > 1) {
                $frequency_bonus += min(0.2, ($term_count - 1) * 0.05);
            }
        }
        
        return min(1.0, $overlap_score + $frequency_bonus);
    }
    
    // NEW: Calculate URL relevance score
    private function calculate_url_relevance_score($url, $query_terms) {
        if (empty($query_terms)) return 0.0;
        
        // Extract path and query parameters
        $parsed_url = parse_url($url);
        $path = strtolower($parsed_url['path'] ?? '');
        $query = strtolower($parsed_url['query'] ?? '');
        
        $url_content = $path . ' ' . $query;
        
        return $this->calculate_term_overlap_score($url_content, $query_terms);
    }
    
    // NEW: Check if results contain specific domain
    private function has_domain_results($results, $domain) {
        if (empty($results) || !is_array($results)) return false;
        
        foreach ($results as $result) {
            if (empty($result['url'])) continue;
            $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            if ($host === $domain || $host_nw === $domain) {
                return true;
            }
        }
        return false;
    }
    
    // NEW: Count results from specific domain
    private function count_domain_results($results, $domain) {
        if (empty($results) || !is_array($results)) return 0;
        
        $count = 0;
        foreach ($results as $result) {
            if (empty($result['url'])) continue;
            $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            if ($host === $domain || $host_nw === $domain) {
                $count++;
            }
        }
        return $count;
    }
    
    // NEW: Merge results with psychedelics.com priority
    private function merge_results_with_psychedelics_priority($primary_results, $psychedelics_results) {
        if (empty($psychedelics_results)) {
            return $primary_results;
        }
        
        // Use configuration constants for result limits
        $min_results = defined('PSYCHEDELICS_COM_MIN_RESULTS') ? PSYCHEDELICS_COM_MIN_RESULTS : 3;
        $max_results = defined('PSYCHEDELICS_COM_MAX_RESULTS') ? PSYCHEDELICS_COM_MAX_RESULTS : 8;
        
        // Ensure we have at least the minimum number of psychedelics.com results
        $psychedelics_count = count($psychedelics_results);
        if ($psychedelics_count < $min_results) {
            error_log('Warning: Only ' . $psychedelics_count . ' psychedelics.com results available (minimum: ' . $min_results . ')');
        }
        
        // Take top psychedelics.com results within the configured range
        $top_psychedelics = array_slice($psychedelics_results, 0, $max_results);
        
        // Merge: psychedelics.com results first, then primary results
        $merged_results = array_merge($top_psychedelics, $primary_results);
        
        // Remove duplicates based on URL
        $seen_urls = [];
        $deduplicated_results = [];
        
        foreach ($merged_results as $result) {
            if (empty($result['url'])) continue;
            $url = $result['url'];
            if (!in_array($url, $seen_urls)) {
                $seen_urls[] = $url;
                $deduplicated_results[] = $result;
            }
        }
        
        error_log('Merged results: ' . count($top_psychedelics) . ' psychedelics.com + ' . count($primary_results) . ' primary = ' . count($deduplicated_results) . ' total');
        
        return $deduplicated_results;
    }
    
    // ENHANCED: Reorder results with psychedelics.com guarantee
    private function enhanced_reorder_with_psychedelics_guarantee($results) {
        if (empty($results)) return $results;
        
        $tiered_domains = ai_trainer_get_domains_with_tiers();
        
        // Group results by tier
        $tiered_results = [
            1 => [], // Highest priority (psychedelics.com, etc.)
            2 => [],
            3 => [],
            4 => []
        ];
        
        foreach ($results as $result) {
            if (empty($result['url'])) continue;
            
            $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            
            // Find the tier for this domain
            $tier = 4; // Default to lowest tier
            if (isset($tiered_domains[$host])) {
                $tier = $tiered_domains[$host];
            } elseif (isset($tiered_domains[$host_nw])) {
                $tier = $tiered_domains[$host_nw];
            }
            
            $tiered_results[$tier][] = $result;
        }
        
        // ENHANCED: Ensure psychedelics.com results are always at the very top
        $psychedelics_com_results = [];
        $other_tier1_results = [];
        
        // Separate psychedelics.com from other tier 1 results
        foreach ($tiered_results[1] as $result) {
            $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            
            if ($host === 'psychedelics.com' || $host_nw === 'psychedelics.com') {
                $psychedelics_com_results[] = $result;
            } else {
                $other_tier1_results[] = $result;
            }
        }
        
        // Reorder results: psychedelics.com first, then other tier 1, then tier 2, etc.
        $reordered_results = [];
        
        // 1. Psychedelics.com results first (guaranteed)
        $reordered_results = array_merge($reordered_results, $psychedelics_com_results);
        
        // 2. Other tier 1 results
        $reordered_results = array_merge($reordered_results, $other_tier1_results);
        
        // 3. Tier 2, 3, 4 results
        for ($tier = 2; $tier <= 4; $tier++) {
            $reordered_results = array_merge($reordered_results, $tiered_results[$tier]);
        }
        
        // Log the enhanced reordering for debugging
        error_log('Enhanced reordering - Psychedelics.com: ' . count($psychedelics_com_results) . 
                 ', Other Tier 1: ' . count($other_tier1_results) . 
                 ', Tier 2: ' . count($tiered_results[2]) . 
                 ', Tier 3: ' . count($tiered_results[3]) . 
                 ', Tier 4: ' . count($tiered_results[4]));
        
        return $reordered_results;
    }

    //Getting Embedding of query
    private function get_openai_embedding($text) {
        $api_key = $this->openai_api_key;
        $response = wp_remote_post('https://api.openai.com/v1/embeddings', [
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ],
            'body' => json_encode([
                'model' => 'text-embedding-ada-002',
                'input' => $text
            ]),
            'timeout' => 15
        ]);

        if (is_wp_error($response)) return null;

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return $body['data'][0]['embedding'] ?? null;
    }

    //Checking similarity
    private function cosine_similarity(array $a, array $b) {
        $dot = 0; $magA = 0; $magB = 0;
        foreach ($a as $i => $v) {
            $dot += $v * $b[$i];
            $magA += $v ** 2;
            $magB += $b[$i] ** 2;
        }
        return $dot / (sqrt($magA) * sqrt($magB) + 1e-8);
    }
    
    // Check psychedelics.com guarantee compliance
    private function check_psychedelics_com_guarantee($results, $final_psychedelics_count) {
        if (!defined('PSYCHEDELICS_COM_GUARANTEE') || !PSYCHEDELICS_COM_GUARANTEE) {
            return ['status' => 'Disabled', 'message' => 'Psychedelics.com guarantee is disabled'];
        }
        
        $min_results = defined('PSYCHEDELICS_COM_MIN_RESULTS') ? PSYCHEDELICS_COM_MIN_RESULTS : 3;
        $max_results = defined('PSYCHEDELICS_COM_MAX_RESULTS') ? PSYCHEDELICS_COM_MAX_RESULTS : 8;
        
        // Check if we have any psychedelics.com results
        if ($final_psychedelics_count === 0) {
            return [
                'status' => 'Failed', 
                'message' => 'No psychedelics.com results found',
                'details' => 'Primary search and fallback search both failed to return psychedelics.com content'
            ];
        }
        
        // Check if we have the minimum required results
        if ($final_psychedelics_count < $min_results) {
            return [
                'status' => 'Warning', 
                'message' => 'Below minimum psychedelics.com results',
                'details' => "Found {$final_psychedelics_count} results, minimum required: {$min_results}"
            ];
        }
        
        // Check if we're within the acceptable range
        if ($final_psychedelics_count > $max_results) {
            return [
                'status' => 'Warning', 
                'message' => 'Above maximum psychedelics.com results',
                'details' => "Found {$final_psychedelics_count} results, maximum allowed: {$max_results}"
            ];
        }
        
        // Check if psychedelics.com results are properly positioned
        $psychedelics_positions = [];
        foreach ($results as $index => $result) {
            if (empty($result['url'])) continue;
            $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            if ($host === 'psychedelics.com' || $host_nw === 'psychedelics.com') {
                $psychedelics_positions[] = $index;
            }
        }
        
        // Check if psychedelics.com results are in the top positions
        $top_positions = array_slice($psychedelics_positions, 0, 3);
        $all_in_top_10 = true;
        foreach ($top_positions as $pos) {
            if ($pos >= 10) {
                $all_in_top_10 = false;
                break;
            }
        }
        
        if (!$all_in_top_10) {
            return [
                'status' => 'Warning', 
                'message' => 'Psychedelics.com results not optimally positioned',
                'details' => "Top psychedelics.com results at positions: " . implode(', ', $top_positions)
            ];
        }
        
        return [
            'status' => 'Passed', 
            'message' => 'Psychedelics.com guarantee fully met',
            'details' => "Found {$final_psychedelics_count} results, properly positioned in top results"
        ];
    }

    // Extract psychedelics.com results from the primary search
    private function extract_psychedelics_com_results($results) {
        if (empty($results) || !is_array($results)) return [];
        
        $psychedelics_results = [];
        foreach ($results as $result) {
            if (empty($result['url'])) continue;
            $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            if ($host === 'psychedelics.com' || $host_nw === 'psychedelics.com') {
                $psychedelics_results[] = $result;
            }
        }
        
        return $psychedelics_results;
    }

    // Replace psychedelics.com results in the primary search with filtered results
    private function replace_psychedelics_com_results($all_results, $filtered_psychedelics) {
        if (empty($all_results) || !is_array($all_results)) return $all_results;
        
        // Remove all psychedelics.com results from all_results
        $non_psychedelics_results = array_filter($all_results, function($result) {
            if (empty($result['url'])) return true;
            $host = parse_url($result['url'], PHP_URL_HOST);
            $host = strtolower($host);
            $host_nw = preg_replace('/^www\./', '', $host);
            return !($host === 'psychedelics.com' || $host_nw === 'psychedelics.com');
        });
        
        // Merge filtered psychedelics.com results with non-psychedelics results
        $merged_results = array_merge($filtered_psychedelics, $non_psychedelics_results);
        
        error_log('Replaced psychedelics.com results: ' . count($filtered_psychedelics) . ' relevant + ' . count($non_psychedelics_results) . ' other = ' . count($merged_results) . ' total');
        
        return $merged_results;
    }
}

new Exa_AI_Integration();

// AJAX handler to update domain tier
add_action('wp_ajax_ai_update_domain_tier', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    
    $id = intval($_POST['id']);
    $tier = intval($_POST['tier']);
    
    // Validate tier is between 1 and 4
    if ($tier < 1 || $tier > 4) {
        wp_send_json_error(['message' => 'Tier must be between 1 and 4.']);
        return;
    }
    
    $updated = $wpdb->update(
        $wpdb->prefix . 'ai_allowed_domains',
        ['tier' => $tier],
        ['id' => $id]
    );
    
    if ($updated !== false) {
        wp_send_json_success(['message' => 'Tier updated successfully.']);
    } else {
        wp_send_json_error(['message' => 'Failed to update tier.']);
    }
});

// AJAX handler to add domain with tier
add_action('wp_ajax_ai_add_domain_with_tier', function() {
    check_ajax_referer('ai_trainer_nonce', 'nonce');
    global $wpdb;
    
    $title = sanitize_text_field($_POST['title']);
    $url = esc_url_raw($_POST['url']);
    $tier = intval($_POST['tier']);
    
    if (empty($title) || empty($url) || $tier < 1 || $tier > 4) {
        wp_send_json_error(['message' => 'Title, URL, and valid tier (1-4) are required.']);
        return;
    }
    
    $domain = parse_url($url, PHP_URL_HOST);
    if (empty($domain)) {
        wp_send_json_error(['message' => 'Invalid URL provided.']);
        return;
    }
    
    $result = $wpdb->insert(
        $wpdb->prefix . 'ai_allowed_domains',
        [
            'title' => $title,
            'url' => $url,
            'domain' => $domain,
            'tier' => $tier,
            'created_at' => current_time('mysql')
        ]
    );
    
    if ($result !== false) {
        wp_send_json_success([
            'message' => 'Domain added successfully.',
            'id' => $wpdb->insert_id
        ]);
    } else {
        wp_send_json_error(['message' => 'Failed to add domain.']);
    }
});

// NEW: Test endpoint for psychedelics.com relevance scoring
add_action('wp_ajax_ai_test_relevance_scoring', 'ai_trainer_test_relevance_scoring');
add_action('wp_ajax_nopriv_ai_test_relevance_scoring', 'ai_trainer_test_relevance_scoring');

function ai_trainer_test_relevance_scoring() {
    echo "=== PSYCHEDELICS.COM RELEVANCE SCORING TEST ===\n\n";
    
    // Test query
    $test_query = "What are the benefits of microdosing psilocybin?";
    echo "Test Query: {$test_query}\n\n";
    
    // Mock psychedelics.com results
    $mock_results = [
        [
            'title' => 'Microdosing Psilocybin: Complete Guide to Benefits and Risks',
            'text' => 'Microdosing psilocybin mushrooms has shown promising results for mental health, creativity, and emotional well-being. Studies indicate benefits for depression, anxiety, and PTSD.',
            'url' => 'https://psychedelics.com/microdosing-psilocybin-guide',
            'score' => 0.85
        ],
        [
            'title' => 'Psychedelic Therapy for Depression Treatment',
            'text' => 'Research shows that psychedelic substances like psilocybin can be effective in treating treatment-resistant depression.',
            'url' => 'https://psychedelics.com/psychedelic-therapy-depression',
            'score' => 0.72
        ],
        [
            'title' => 'History of Psychedelics in Ancient Cultures',
            'text' => 'Ancient civilizations used psychedelic substances for spiritual ceremonies and healing practices.',
            'url' => 'https://psychedelics.com/ancient-cultures-psychedelics',
            'score' => 0.45
        ],
        [
            'title' => 'Legal Status of Psychedelics Worldwide',
            'text' => 'Current legal status of psychedelic substances varies by country and region.',
            'url' => 'https://psychedelics.com/legal-status-worldwide',
            'score' => 0.38
        ]
    ];
    
    echo "Mock Results (before relevance scoring):\n";
    foreach ($mock_results as $i => $result) {
        echo ($i + 1) . ". {$result['title']}\n";
    }
    
    echo "\n=== RELEVANCE SCORING ANALYSIS ===\n";
    
    // Create instance to test the relevance scoring
    $ai_trainer = new Exa_AI_Integration();
    
    // Use reflection to access private methods for testing
    $reflection = new ReflectionClass($ai_trainer);
    
    try {
        $extract_method = $reflection->getMethod('extract_query_terms');
        $extract_method->setAccessible(true);
        $query_terms = $extract_method->invoke($ai_trainer, $test_query);
        
        echo "Extracted Query Terms: " . implode(', ', $query_terms) . "\n\n";
        
        $score_method = $reflection->getMethod('calculate_relevance_score');
        $score_method->setAccessible(true);
        
        $overlap_method = $reflection->getMethod('calculate_term_overlap_score');
        $overlap_method->setAccessible(true);
        
        echo "Individual Relevance Scores:\n";
        foreach ($mock_results as $i => $result) {
            $relevance_score = $score_method->invoke($ai_trainer, $result, $test_query);
            $title_score = $overlap_method->invoke($ai_trainer, $result['title'], $query_terms);
            $text_score = $overlap_method->invoke($ai_trainer, $result['text'], $query_terms);
            
            echo ($i + 1) . ". {$result['title']}\n";
            echo "   - Overall Relevance: " . round($relevance_score, 3) . "\n";
            echo "   - Title Score: " . round($title_score, 3) . "\n";
            echo "   - Text Score: " . round($text_score, 3) . "\n";
            echo "   - EXA Score: " . round($result['score'], 3) . "\n\n";
        }
        
        // Test filtering
        $filter_method = $reflection->getMethod('filter_psychedelics_com_by_relevance');
        $filter_method->setAccessible(true);
        
        $filtered_results = $filter_method->invoke($ai_trainer, $mock_results, $test_query);
        
        echo "=== FILTERED RESULTS ===\n";
        echo "Total results: " . count($mock_results) . "\n";
        echo "Results after relevance filtering: " . count($filtered_results) . "\n\n";
        
        echo "Final Relevant Results:\n";
        foreach ($filtered_results as $i => $result) {
            echo ($i + 1) . ". {$result['title']}\n";
        }
        
    } catch (Exception $e) {
        echo "Error during testing: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== TEST END ===\n";
    wp_die();
}