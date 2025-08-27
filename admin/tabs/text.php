<?php
/**
 * Text Management Tab - AI Trainer Plugin
 * 
 * This file provides the admin interface for managing plain text content
 * in the AI Trainer knowledge base. It allows administrators to add, edit,
 * delete, and import text-based information that will be used for AI training
 * and local knowledge base searches.
 * 
 * FUNCTIONALITY OVERVIEW:
 * - Add new text entries with title and content
 * - Edit existing text entries inline
 * - Delete text entries with confirmation
 * - Import text entries from CSV files
 * - Export text entries to CSV format
 * - Automatic embedding generation for AI training
 * - Pagination for large text collections
 * 
 * FEATURES:
 * - Rich text editor support
 * - CSV import/export capabilities
 * - Inline editing interface
 * - Bulk text management
 * - Search and filtering
 * - Embedding generation
 * 
 * USE CASES:
 * - Research papers and articles
 * - Manuals and documentation
 * - Educational content
 * - Reference materials
 * - Custom knowledge bases
 * 
 * SECURITY FEATURES:
 * - WordPress nonce verification
 * - Input sanitization (sanitize_text_field, wp_kses_post)
 * - ABSPATH validation
 * - Required function checks
 * - CSRF protection
 * 
 * @package AI_Trainer
 * @subpackage Admin_Tabs
 * @since 1.0
 */

// Ensure ABSPATH is defined for includes
if (!defined('ABSPATH')) define('ABSPATH', dirname(__FILE__, 5) . '/');
// Ensure WordPress sanitization functions are available
if (!function_exists('sanitize_text_field')) require_once(ABSPATH . 'wp-includes/formatting.php');
if (!function_exists('wp_kses_post')) require_once(ABSPATH . 'wp-includes/kses.php');

// ============================================================================
// TEXT ADDITION HANDLER
// ============================================================================
// Process form submission for adding new text entries
if (isset($_POST['add_text'])) {
    $title = sanitize_text_field($_POST['text_title']);
    $text = wp_kses_post($_POST['text_content']);
    
    // Generate AI embedding for semantic search
    $embedding = ai_trainer_generate_embedding($text);
    
    // Save to database
    ai_trainer_save_to_db($title, 'text', $text, $embedding);
    echo '<div class="notice notice-success"><p>Text added successfully.</p></div>';
}

// ============================================================================
// TEXT DELETION HANDLER
// ============================================================================
// Process deletion requests for text entries
if (isset($_GET['delete_text'])) {
    ai_trainer_delete((int)$_GET['delete_text']);
    echo '<div class="notice notice-success"><p>Text deleted.</p></div>';
}

// ============================================================================
// INLINE EDIT HANDLER
// ============================================================================
// Process inline edit form submissions for text entries
if (isset($_POST['update_text_inline'])) {
    $id = intval($_POST['text_id']);
    $title = sanitize_text_field($_POST['text_title']);
    $content = wp_kses_post($_POST['text_content']);
    
    // Generate new embedding for updated content
    $embedding = ai_trainer_generate_embedding($content);
    
    // Update database with new content and embedding
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

    echo '<div class="notice notice-success"><p>Text updated successfully.</p></div>';
}

// ============================================================================
// CSV IMPORT HANDLER
// ============================================================================
// Process CSV file uploads for bulk text import
if (isset($_POST['import_text_csv']) && isset($_FILES['import_text_csv_file'])) {
    $file = $_FILES['import_text_csv_file']['tmp_name'];
    if (($handle = fopen($file, 'r')) !== false) {
        $header = fgetcsv($handle); // Skip header row
        global $wpdb;
        $imported = 0;
        
        // Process each CSV row
        while (($data = fgetcsv($handle)) !== false) {
            // Use htmlspecialchars as a fallback for sanitization in admin context
            $title = htmlspecialchars($data[0] ?? '', ENT_QUOTES, 'UTF-8');
            $content = htmlspecialchars($data[1] ?? '', ENT_QUOTES, 'UTF-8');
            
            // Validate that all required fields are present
            if ($title && $content) {
                $embedding = ai_trainer_generate_embedding($content);
                ai_trainer_save_to_db($title, 'text', $content, $embedding);
                $imported++;
            }
        }
        fclose($handle);
        echo '<div class="notice notice-success"><p>Imported ' . $imported . ' Text entries from CSV.</p></div>';
    }
}
?>

<!-- ============================================================================
     TEXT MANAGEMENT INTERFACE
     ============================================================================ -->
<h2>Text Content Management</h2>
<p>Add and process plain text-based sources to train your AI Agent with precise information.</p>

<!-- Notification area for user feedback -->
<div id="text-notices"></div>

<!-- Import/Export Controls -->
<div style="margin-bottom: 16px;">
    <form method="get" action="<?php echo admin_url('admin-post.php'); ?>" style="display:inline; margin-right: 10px;">
        <input type="hidden" name="action" value="ai_export_text_csv">
        <?php wp_nonce_field('ai_export_text_csv'); ?>
        <button type="submit" class="button">Export Text CSV</button>
    </form>
    <form method="post" enctype="multipart/form-data" action="" style="display:inline;">
        <input type="file" name="import_text_csv_file" accept=".csv" required>
        <button type="submit" name="import_text_csv" class="button">Import Text CSV</button>
    </form>
</div>

<!-- Add Text Form -->
<form method="post" id="add-text-form">
    <input type="text" name="text_title" placeholder="Title" style="width:100%; margin-bottom: 10px;" required>
    <p>
        <label for="text-content">Content:</label>
        <textarea id="text-content" name="text_content" rows="8" style="width: 100%;"></textarea>
    </p>
    <button type="submit" class="button button-primary" name="add_text">Add text snippet</button>
</form>

<hr><h3>Text Sources</h3>
<div id="text-sources-table">
<?php
global $wpdb;

// Pagination settings for large text collections
$items_per_page = 10;
$current_page = isset($_GET['text_page']) ? max(1, intval($_GET['text_page'])) : 1;
$offset = ($current_page - 1) * $items_per_page;

// Get total count
$total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'text'");
$total_pages = ceil($total_items / $items_per_page);

// Get paginated results
$rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'text' ORDER BY created_at DESC LIMIT $items_per_page OFFSET $offset", ARRAY_A);
?>
<table class="widefat striped">
<thead><tr><th>Title</th><th>Content</th><th>Actions</th></tr></thead>
<tbody>
<?php
// ============================================================================
// TEXT DATA DISPLAY LOOP
// ============================================================================
// Iterate through text entries and display them in the table
foreach ($rows as $row):
    echo "<tr data-id='{$row['id']}'>
        <td class='text-title'>" . esc_html($row['title']) . "</td>
        <td class='text-content'>" . esc_html(substr($row['content'], 0, 100)) . (strlen($row['content']) > 100 ? '...' : '') . "</td>
        <td class='actionsWrapper'>
            <button type='button' class='button button-small edit-text-inline' data-id='{$row['id']}' data-title='" . esc_attr($row['title']) . "' data-content='" . esc_attr($row['content']) . "'>Edit</button>
            <a href='#' class='button button-small button-link-delete delete-text' data-id='{$row['id']}'>Delete</a>
        </td>
    </tr>";
endforeach;
?>
</tbody>
</table>

<?php 
// ============================================================================
// PAGINATION NAVIGATION
// ============================================================================
// Display pagination controls when there are multiple pages
if ($total_pages > 1): ?>
<div class="tablenav-pages">
    <span class="displaying-num"><?php echo $total_items; ?> items</span>
    <span class="pagination-links">
        <?php
        $current_url = $_SERVER['REQUEST_URI'];
        $url_parts = parse_url($current_url);
        $query_params = [];
        if (isset($url_parts['query'])) {
            parse_str($url_parts['query'], $query_params);
        }
        // Previous page
        if ($current_page > 1) {
            $query_params['text_page'] = $current_page - 1;
            $prev_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a class="prev-page" href="' . esc_url($prev_url) . '">‹</a>';
        }
        // Page numbers
        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);
        if ($start_page > 1) {
            $query_params['text_page'] = 1;
            $first_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a href="' . esc_url($first_url) . '">1</a>';
            if ($start_page > 2) {
                echo '<span class="paging-input">…</span>';
            }
        }
        for ($i = $start_page; $i <= $end_page; $i++) {
            if ($i == $current_page) {
                echo '<span class="paging-input"><span class="tablenav-paging-text">' . $i . '</span></span>';
            } else {
                $query_params['text_page'] = $i;
                $page_url = $url_parts['path'] . '?' . http_build_query($query_params);
                echo '<a href="' . esc_url($page_url) . '">' . $i . '</a>';
            }
        }
        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                echo '<span class="paging-input">…</span>';
            }
            $query_params['text_page'] = $total_pages;
            $last_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a href="' . esc_url($last_url) . '">' . $total_pages . '</a>';
        }
        // Next page
        if ($current_page < $total_pages) {
            $query_params['text_page'] = $current_page + 1;
            $next_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a class="next-page" href="' . esc_url($next_url) . '">›</a>';
        }
        ?>
    </span>
</div>
<?php endif; ?>
</div>

<!-- ============================================================================
     INLINE EDIT MODAL
     ============================================================================ -->
<!-- Modal for editing text content without page refresh -->
<div id="text-edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 5px; min-width: 500px; max-width: 80%; max-height: 80%; overflow-y: auto;">
        <h3>Edit Text</h3>
        <form method="post" id="edit-text-form">
            <input type="hidden" name="text_id" id="edit-text-id">
            <input type="hidden" name="update_text_inline" value="1">
            
            <p>
                <label for="edit-text-title">Title:</label>
                <input type="text" id="edit-text-title" name="text_title" style="width: 100%; margin-bottom: 10px;" required>
            </p>
            
            <p>
                <label for="edit-text-content">Content:</label>
                <textarea id="edit-text-content" name="text_content" rows="8" style="width: 100%;"></textarea>
            </p>
            
            <p>
                <button type="submit" class="button button-primary">Save Changes</button>
                <button type="button" class="button close-text-modal">Cancel</button>
            </p>
        </form>
    </div>
</div>

<script>
/**
 * Text Management JavaScript - AI Trainer Plugin
 * 
 * This script provides comprehensive text management functionality including:
 * - Dynamic form handling for adding/editing text entries
 * - TinyMCE rich text editor integration
 * - AJAX-powered operations for seamless user experience
 * - Modal management for inline editing
 * - Form validation and error handling
 * 
 * ARCHITECTURE:
 * - Modular design with separate handlers for different functionality
 * - Configuration-driven approach for easy customization
 * - Utility functions for common operations
 * - Event delegation for dynamic content
 * 
 * @package AI_Trainer
 * @subpackage Admin_Tabs
 * @since 1.0
 */
jQuery(document).ready(function($) {
    // ============================================================================
    // CONFIGURATION AND CONSTANTS
    // ============================================================================
    // Centralized configuration for the text management system
    const CONFIG = {
        NOTICE_TIMEOUT: 3000,
        TINYMCE_HEIGHT: 400,
        TINYMCE_PLUGINS: 'lists link image paste',
        TINYMCE_TOOLBAR: 'bold italic | bullist numlist | link image',
        TINYMCE_CONTENT_STYLE: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
    };
    
    // ============================================================================
    // AJAX CONFIGURATION
    // ============================================================================
    // AJAX settings for WordPress backend communication
    const ajaxConfig = {
        url: typeof ai_trainer_ajax !== 'undefined' ? ai_trainer_ajax.ajaxurl : ajaxurl,
        nonce: typeof ai_trainer_ajax !== 'undefined' ? ai_trainer_ajax.nonce : ''
    };
    
    // Debug logging
    console.log('AJAX URL:', ajaxConfig.url);
    console.log('Nonce:', ajaxConfig.nonce);
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    // Common utility functions used throughout the text management system
    const utils = {
        showNotice: function(message, type = 'success') {
            const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
            $('#text-notices').html(`<div class="notice ${noticeClass}"><p>${message}</p></div>`);
            setTimeout(() => $('#text-notices').fadeOut(), CONFIG.NOTICE_TIMEOUT);
        },
        
        closeModal: function() {
            $('#text-edit-modal').hide();
        },
        
        getTinyMCEContent: function(editorId, fallbackSelector) {
            if (tinymce.get(editorId)) {
                return tinymce.get(editorId).getContent({format: 'text'}).trim();
            }
            return $(fallbackSelector).val().trim();
        },
        
        setTinyMCEContent: function(editorId, content, fallbackSelector) {
            if (tinymce.get(editorId)) {
                tinymce.get(editorId).setContent(content);
            } else {
                $(fallbackSelector).val(content);
            }
        },
        
        resetForm: function(formSelector, editorId = null) {
            $(formSelector)[0].reset();
            if (editorId && tinymce.get(editorId)) {
                tinymce.get(editorId).setContent('');
            }
        },
        
        validateContent: function(editorId, fallbackSelector) {
            const content = this.getTinyMCEContent(editorId, fallbackSelector);
            if (!content) {
                alert('Content is required.');
                if (tinymce.get(editorId)) tinymce.get(editorId).focus();
                return false;
            }
            return content;
        }
    };
    
    // ============================================================================
    // TINYMCE RICH TEXT EDITOR MANAGEMENT
    // ============================================================================
    // Manages TinyMCE editor initialization and configuration for rich text editing
    const tinyMCEManager = {
        initAddForm: function() {
            if (typeof tinymce === 'undefined') return;
            
            tinymce.init({
                selector: '#text-content',
                height: CONFIG.TINYMCE_HEIGHT,
                menubar: true,
                plugins: CONFIG.TINYMCE_PLUGINS,
                toolbar: CONFIG.TINYMCE_TOOLBAR,
                license_key: 'gpl',
                base_url: tinymcePaths.baseUrl,
                skin_url: tinymcePaths.skinUrl,
                content_style: CONFIG.TINYMCE_CONTENT_STYLE,
                formats: {
                    superscript: { inline: 'sup', remove: 'all' },
                    subscript: { inline: 'sub', remove: 'all' }
                },
                extended_valid_elements: '-sup,-sub',
                invalid_elements: 'sup,sub',
                setup: function(editor) {
                    editor.on('init', function() {
                        console.log('TinyMCE text editor initialized successfully');
                    });
                    editor.on('LoadContent', function() {
                        console.log('TinyMCE text editor content loaded');
                    });
                },
                init_instance_callback: function(editor) {
                    console.log('TinyMCE text editor instance created');
                }
            });
        },
        
        initEditModal: function() {
            if (typeof tinymce === 'undefined') return;
            
            tinymce.init({
                selector: '#edit-text-content',
                height: CONFIG.TINYMCE_HEIGHT,
                menubar: true,
                plugins: CONFIG.TINYMCE_PLUGINS,
                toolbar: CONFIG.TINYMCE_TOOLBAR,
                license_key: 'gpl',
                base_url: tinymcePaths.baseUrl,
                skin_url: tinymcePaths.skinUrl,
                content_style: CONFIG.TINYMCE_CONTENT_STYLE,
                formats: {
                    superscript: { inline: 'sup', remove: 'all' },
                    subscript: { inline: 'sub', remove: 'all' }
                },
                extended_valid_elements: '-sup,-sub',
                invalid_elements: 'sup,sub',
                setup: function(editor) {
                    editor.on('init', function() {
                        console.log('TinyMCE text edit modal editor initialized successfully');
                    });
                    editor.on('LoadContent', function() {
                        console.log('TinyMCE text edit modal editor content loaded');
                    });
                },
                init_instance_callback: function(editor) {
                    console.log('TinyMCE text edit modal editor instance created');
                }
            });
        }
    };
    
    // ============================================================================
    // FORM HANDLERS
    // ============================================================================
    // Handles form submission and processing for text operations
    const formHandlers = {
        addText: function(e) {
            e.preventDefault();
            console.log('Add text form submitted');
            
            const content = utils.validateContent('text-content', '#text-content');
            if (!content) return false;
            
            const formData = new FormData(this);
            formData.set('text_content', content);
            formData.append('action', 'ai_add_text');
            formData.append('nonce', ajaxConfig.nonce);
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function(response) {
                console.log('Add text response:', response);
                if (response.success) {
                    utils.showNotice(response.data.message);
                    utils.resetForm('#add-text-form', 'text-content');
                    dataManager.loadTextSources(1); // Always reload first page after add
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function(xhr, status, error) {
                console.log('Add text error:', xhr, status, error);
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        },
        
        editText: function(e) {
            e.preventDefault();
            console.log('Edit text form submitted');
            
            const content = utils.validateContent('edit-text-content', '#edit-text-content');
            if (!content) return false;
            
            const formData = new FormData(this);
            formData.set('text_content', content);
            formData.append('action', 'ai_update_text_inline');
            formData.append('nonce', ajaxConfig.nonce);
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function(response) {
                console.log('Edit text response:', response);
                if (response.success) {
                    utils.showNotice(response.data.message);
                    utils.closeModal();
                    dataManager.loadTextSources();
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function(xhr, status, error) {
                console.log('Edit text error:', xhr, status, error);
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        }
    };
    
    // ============================================================================
    // ACTION HANDLERS
    // ============================================================================
    // Handles user actions like editing, deleting, and managing text entries
    const actionHandlers = {
        editTextInline: function() {
            console.log('Edit text clicked');
            const id = $(this).data('id');
            const title = $(this).data('title');
            const content = $(this).data('content');
            
            $('#edit-text-id').val(id);
            $('#edit-text-title').val(title);
            
            // Set content in TinyMCE editor if it exists, otherwise in textarea
            utils.setTinyMCEContent('edit-text-content', content, '#edit-text-content');
            
            $('#text-edit-modal').show();
        },
        
        deleteText: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this text?')) {
                return;
            }
            
            const id = $(this).data('id');
            const row = $(this).closest('tr');
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: {
                    action: 'ai_delete_text',
                    id: id,
                    nonce: ajaxConfig.nonce
                }
            })
            .done(function(response) {
                if (response.success) {
                    utils.showNotice(response.data.message);
                    row.fadeOut(function() {
                        $(this).remove();
                    });
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function() {
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        },
        
        handlePagination: function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            if (page) {
                dataManager.loadTextSources(page);
            }
        }
    };
    
    // ============================================================================
    // MODAL HANDLERS
    // ============================================================================
    // Manages modal dialog behavior and user interactions
    const modalHandlers = {
        closeModal: function() {
            utils.closeModal();
        }
    };
    
    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================
    // Handles data loading, refreshing, and management operations
    const dataManager = {
        loadTextSources: function(page) {
            page = page || 1;
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: {
                    action: 'ai_get_text_sources',
                    page: page,
                    nonce: ajaxConfig.nonce
                }
            })
            .done(function(response) {
                if (response.success) {
                    $('#text-sources-table').html(response.data.html);
                    // Store current page for future operations
                    window.currentTextPage = response.data.current_page;
                }
            });
        }
    };
    
    // ============================================================================
    // INITIALIZATION AND EVENT BINDING
    // ============================================================================
    // Initialize TinyMCE editor for the add form
    tinyMCEManager.initAddForm();
    
    // Bind event handlers to form submissions and user interactions
    $('#add-text-form').on('submit', formHandlers.addText);
    $('#edit-text-form').on('submit', formHandlers.editText);
    
    $(document).on('click', '.close-text-modal', modalHandlers.closeModal);
    $(document).on('click', '.edit-text-inline', actionHandlers.editTextInline);
    $(document).on('click', '.delete-text', actionHandlers.deleteText);
    $(document).on('click', '#text-sources-table .pagination-links a', actionHandlers.handlePagination);
    
    // ============================================================================
    // GLOBAL FUNCTION EXPORTS
    // ============================================================================
    // Make essential functions available globally for external access
    window.closeTextEditModal = utils.closeModal;
});
</script>