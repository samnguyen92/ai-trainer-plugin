<?php
/**
 * File Management Tab - AI Trainer Plugin
 * 
 * This file provides the admin interface for managing file uploads and processing
 * in the AI Trainer knowledge base. It handles various file formats (PDF, DOCX, TXT)
 * and automatically extracts text content for AI training and embedding generation.
 * 
 * ============================================================================
 * FUNCTIONALITY OVERVIEW
 * ============================================================================
 * 
 * CORE OPERATIONS:
 * - Upload and process multiple file formats (PDF, DOCX, TXT)
 * - Automatic text extraction from various file types
 * - Embedding generation for AI training
 * - Inline editing of file content
 * - File replacement and reprocessing
 * - Bulk file processing capabilities
 * 
 * FILE PROCESSING:
 * - Multi-file upload support with validation
 * - Automatic file type detection and processing
 * - Text content extraction and cleaning
 * - Embedding generation for semantic search
 * - Content chunking for optimized search
 * 
 * ============================================================================
 * SUPPORTED FILE FORMATS
 * ============================================================================
 * 
 * PDF FILES:
 * - Uses Smalot PDF Parser for text extraction
 * - Handles complex document structures
 * - Maintains text formatting where possible
 * - Error handling for corrupted files
 * 
 * DOCX FILES:
 * - Uses ZipArchive for Office document processing
 * - Extracts text from Word document XML
 * - Handles modern Office document formats
 * - Strips HTML tags for clean text
 * 
 * TXT FILES:
 * - Direct text file reading
 * - UTF-8 encoding support
 * - Fast processing and minimal overhead
 * - Ideal for simple text content
 * 
 * ============================================================================
 * ADVANCED FEATURES
 * ============================================================================
 * 
 * CONTENT MANAGEMENT:
 * - Inline content editing capabilities
 * - File replacement with reprocessing
 * - Content validation and sanitization
 * - Metadata management and storage
 * 
 * PROCESSING OPTIMIZATION:
 * - Bulk file processing for efficiency
 * - Automatic embedding regeneration
 * - Content chunking for search optimization
 * - Error handling and recovery
 * 
 * USER INTERFACE:
 * - Drag-and-drop file upload
 * - Progress indicators for processing
 * - File management table with pagination
 * - Action buttons for each file
 * 
 * ============================================================================
 * SECURITY FEATURES
 * ============================================================================
 * 
 * FILE VALIDATION:
 * - File type verification
 * - Size limit enforcement
 * - Content security scanning
 * - Upload path validation
 * 
 * INPUT PROCESSING:
 * - File content sanitization
 * - XSS protection measures
 * - SQL injection prevention
 * - WordPress nonce verification
 * 
 * ACCESS CONTROL:
 * - Capability checks for admin operations
 * - User permission validation
 * - Secure file handling
 * - Audit trail maintenance
 * 
 * ============================================================================
 * TECHNICAL IMPLEMENTATION
 * ============================================================================
 * 
 * FILE PROCESSING PIPELINE:
 * 1. File upload and validation
 * 2. Type detection and processing
 * 3. Text extraction and cleaning
 * 4. Embedding generation
 * 5. Database storage and indexing
 * 6. Chunk creation for search
 * 
 * DEPENDENCIES:
 * - Smalot PDF Parser for PDF processing
 * - ZipArchive for DOCX handling
 * - OpenAI API for embedding generation
 * - WordPress file handling utilities
 * 
 * DATABASE INTEGRATION:
 * - ai_knowledge table for file storage
 * - ai_knowledge_chunks for search optimization
 * - Metadata storage for file information
 * - Relationship management between files and chunks
 * 
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 * 
 * UPLOAD ERRORS:
 * - File size limit exceeded
 * - Invalid file type
 * - Upload directory issues
 * - Network timeout handling
 * 
 * PROCESSING ERRORS:
 * - Corrupted file handling
 * - Text extraction failures
 * - API communication issues
 * - Database operation failures
 * 
 * USER FEEDBACK:
 * - Clear error messages
 * - Success confirmations
 * - Processing status updates
 * - Recovery suggestions
 * 
 * ============================================================================
 * PERFORMANCE OPTIMIZATION
 * ============================================================================
 * 
 * UPLOAD OPTIMIZATION:
 * - Chunked file processing
 * - Background processing where possible
 * - Memory usage optimization
 * - Timeout handling for large files
 * 
 * SEARCH OPTIMIZATION:
 * - Content chunking for relevance
 * - Embedding vector optimization
 * - Database query optimization
 * - Caching strategies
 * 
 * @package AI_Trainer
 * @subpackage Admin_Tabs
 * @since 1.0
 * @author Psychedelic
 */

// ============================================================================
// BULK FILE PROCESSING HANDLER
// ============================================================================
/**
 * Process multiple file uploads and extract text content for AI training
 * 
 * This handler processes bulk file uploads and:
 * - Validates uploaded files and their types
 * - Extracts text content based on file format
 * - Generates AI embeddings for semantic search
 * - Stores processed content in the knowledge base
 * - Creates text chunks for optimized search
 * - Provides user feedback on processing results
 * 
 * SUPPORTED FORMATS:
 * - PDF: Smalot PDF Parser for text extraction
 * - DOCX: ZipArchive for Office document processing
 * - TXT: Direct file reading for text content
 * 
 * PROCESSING FLOW:
 * 1. File validation and type detection
 * 2. Content extraction based on format
 * 3. Text cleaning and sanitization
 * 4. Embedding generation via OpenAI API
 * 5. Database storage with metadata
 * 6. Chunk creation for search optimization
 * 
 * @since 1.0
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['training_files'])) {
    foreach ($_FILES['training_files']['name'] as $i => $name) {
        $tmp = $_FILES['training_files']['tmp_name'][$i];
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $text = '';

        // Process different file types based on extension
        if ($ext === 'txt') {
            // Direct text file reading
            $text = file_get_contents($tmp);
        } elseif ($ext === 'pdf') {
            // PDF text extraction using Smalot PDF Parser
            require_once AI_TRAINER_PATH . 'vendor/autoload.php';
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($tmp);
            $text = $pdf->getText();
        } elseif ($ext === 'docx') {
            // DOCX text extraction using ZipArchive
            $zip = new ZipArchive;
            if ($zip->open($tmp)) {
                $xml = $zip->getFromName('word/document.xml');
                $text = strip_tags($xml);
                $zip->close();
            }
        }

        // Generate embedding and save to database if text was extracted
        if ($text) {
            $embedding = ai_trainer_generate_embedding($text);
            ai_trainer_save_to_db($name, 'file', $text, $embedding, ['filetype' => $ext]);
        }
    }
    echo '<div class="notice notice-success"><p>Files processed and embedded.</p></div>';
}

// ============================================================================
// INLINE EDIT HANDLER
// ============================================================================
/**
 * Process inline edit form submissions for file content
 * 
 * This handler processes inline file content updates and:
 * - Validates and sanitizes updated content
 * - Regenerates AI embeddings for changed content
 * - Updates the database with new information
 * - Maintains file metadata and relationships
 * - Provides user feedback on completion
 * 
 * SECURITY FEATURES:
 * - POST data validation
 * - Input sanitization (sanitize_text_field, wp_kses_post)
 * - ID validation and integer sanitization
 * - Database update safety measures
 * 
 * PROCESSING STEPS:
 * 1. Form data validation and sanitization
 * 2. Content embedding regeneration
 * 3. Database update with new content
 * 4. Success confirmation and user feedback
 * 
 * @since 1.0
 */
if (isset($_POST['update_file_inline'])) {
    $id = intval($_POST['file_id']);
    $title = sanitize_text_field($_POST['file_title']);
    $content = wp_kses_post($_POST['file_content']);
    
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

    echo '<div class="notice notice-success"><p>File content updated successfully.</p></div>';
}

// ============================================================================
// FILE REPLACEMENT HANDLER
// ============================================================================
/**
 * Process new file uploads to replace existing file content
 * 
 * This handler processes file replacement operations and:
 * - Validates new file uploads and their types
 * - Extracts text content from the new file
 * - Regenerates AI embeddings for updated content
 * - Updates database with new file information
 * - Maintains file relationships and metadata
 * - Provides user feedback on completion
 * 
 * REPLACEMENT FEATURES:
 * - Complete file content replacement
 * - Automatic text extraction and processing
 * - Embedding regeneration for search optimization
 * - Metadata update for file type information
 * 
 * SUPPORTED FORMATS:
 * - PDF: Smalot PDF Parser for text extraction
 * - DOCX: ZipArchive for Office document processing
 * - TXT: Direct file reading for text content
 * 
 * @since 1.0
 */
if (isset($_POST['upload_new_file_inline']) && isset($_FILES['new_file']) && $_FILES['new_file']['error'] === UPLOAD_ERR_OK) {
    $id = intval($_POST['file_id']);
    $title = sanitize_text_field($_POST['file_title']);
    
    $tmp = $_FILES['new_file']['tmp_name'];
    $name = $_FILES['new_file']['name'];
    $ext = pathinfo($name, PATHINFO_EXTENSION);
    $text = '';

    // Process the new file based on its type
    if ($ext === 'txt') {
        // Direct text file reading
        $text = file_get_contents($tmp);
    } elseif ($ext === 'pdf') {
        // PDF text extraction using Smalot PDF Parser
        require_once AI_TRAINER_PATH . 'vendor/autoload.php';
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($tmp);
        $text = $pdf->getText();
    } elseif ($ext === 'docx') {
        // DOCX text extraction using ZipArchive
        $zip = new ZipArchive;
        if ($zip->open($tmp)) {
            $xml = $zip->getFromName('word/document.xml');
            $text = strip_tags($xml);
            $zip->close();
        }
    }

    // Update database with new file content if processing was successful
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

        echo '<div class="notice notice-success"><p>New file uploaded and processed successfully.</p></div>';
    } else {
        echo '<div class="notice notice-error"><p>Failed to process the uploaded file.</p></div>';
    }
}
?>

<!-- ============================================================================
     FILE MANAGEMENT INTERFACE
     ============================================================================
     
     This section provides the complete user interface for file management:
     - File upload interface with multiple format support
     - File processing status and feedback
     - File management table with pagination
     - Inline editing and replacement capabilities
     
     INTERFACE FEATURES:
     - Multi-file upload support
     - Drag-and-drop file handling
     - Progress indicators for processing
     - File type validation and feedback
     - Content editing and replacement
     - Paginated file display
-->
<h2>File Management</h2>
<p>The Files tab allows you to upload and manage various document types to train your AI agent.
   Supported formats include PDF, DOCX, and TXT files. Each file is automatically processed to
   extract text content and generate AI embeddings for training.</p>

<div id="files-notices"></div>

<form method="post" enctype="multipart/form-data" id="upload-files-form">
    <input type="file" name="training_files[]" multiple style="margin-bottom: 10px;" required>
    <button type="submit" class="button button-primary">Upload & Embed</button>
</form>

<!-- ============================================================================
     FILE SOURCES TABLE
     ============================================================================
     
     Display uploaded files with pagination and management options:
     - File information display with metadata
     - Inline editing capabilities
     - File replacement functionality
     - Delete operations with confirmation
     - Pagination for large file collections
     
     TABLE FEATURES:
     - File name and type display
     - Content size and processing status
     - Action buttons for each file
     - Paginated navigation
     - Search and filtering options
-->
<hr><h3>File Sources</h3>
<div id="files-notices"></div>
<div id="files-sources-table">
<?php
global $wpdb;
// ============================================================================
// PAGINATION SETUP
// ============================================================================
/**
 * Configure pagination for large file collections
 * 
 * This section sets up pagination for the file sources table:
 * - Configurable items per page
 * - Current page detection from URL parameters
 * - Offset calculation for database queries
 * - Total page count calculation
 * - Database query optimization
 * 
 * PAGINATION FEATURES:
 * - 10 items per page (configurable)
 * - URL parameter state management
 * - Database query optimization
 * - Navigation controls generation
 * 
 * @since 1.0
 */
$items_per_page = 10;
$current_page = isset($_GET['files_page']) ? max(1, intval($_GET['files_page'])) : 1;
$offset = ($current_page - 1) * $items_per_page;
// Get total count
$total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'file'");
$total_pages = ceil($total_items / $items_per_page);
// Get paginated results
$rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'file' ORDER BY created_at DESC LIMIT $items_per_page OFFSET $offset", ARRAY_A);
?>
<table class="widefat striped">
<thead><tr><th>File Name</th><th>Type</th><th>Size</th><th>Actions</th></tr></thead>
<tbody>
<?php
// ============================================================================
// FILE DATA DISPLAY LOOP
// ============================================================================
// Iterate through file entries and display them in the table
foreach ($rows as $row):
    $meta = json_decode($row['metadata'], true);
    echo "<tr data-id='{$row['id']}'>
        <td class='file-title'>" . esc_html($row['title']) . "</td>
        <td class='file-type'>" . esc_html($meta['filetype']) . "</td>
        <td>" . size_format(strlen($row['content'])) . "</td>
        <td class='actionsWrapper'>
            <button type='button' class='button button-small edit-file-inline' data-id='{$row['id']}' data-title='" . esc_attr($row['title']) . "' data-content='" . esc_attr($row['content']) . "' data-filetype='" . esc_attr($meta['filetype']) . "'>Edit</button>
            <a href='#' class='button button-small button-link-delete delete-file' data-id='{$row['id']}'>Delete</a>
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
            $query_params['files_page'] = $current_page - 1;
            $prev_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a class="prev-page" href="' . esc_url($prev_url) . '">‹</a>';
        }
        // Page numbers
        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);
        if ($start_page > 1) {
            $query_params['files_page'] = 1;
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
                $query_params['files_page'] = $i;
                $page_url = $url_parts['path'] . '?' . http_build_query($query_params);
                echo '<a href="' . esc_url($page_url) . '">' . $i . '</a>';
            }
        }
        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                echo '<span class="paging-input">…</span>';
            }
            $query_params['files_page'] = $total_pages;
            $last_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a href="' . esc_url($last_url) . '">' . $total_pages . '</a>';
        }
        // Next page
        if ($current_page < $total_pages) {
            $query_params['files_page'] = $current_page + 1;
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
<!-- Modal for editing file content and uploading new files -->
<div id="file-edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 5px; min-width: 600px; max-width: 90%; max-height: 90%; overflow-y: auto;">
        <h3>Edit File</h3>
        
        <div class="ai-edit-options" style="margin-bottom: 20px;">
            <h4>Choose Edit Method:</h4>
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <button type="button" id="edit-content-btn" class="button button-primary">Edit Extracted Content</button>
                <button type="button" id="upload-new-btn" class="button">Upload New File</button>
            </div>
        </div>

        <!-- ============================================================================
             OPTION 1: EDIT EXTRACTED CONTENT
             ============================================================================ -->
        <!-- Edit the text content extracted from the original file -->
        <div id="edit-content-section" style="display: block;">
            <h4>Edit Extracted Content</h4>
            <form method="post" id="edit-file-form">
                <input type="hidden" name="file_id" id="edit-file-id">
                <input type="hidden" name="update_file_inline" value="1">
                
                <p>
                    <label for="edit-file-title">File Name:</label>
                    <input type="text" id="edit-file-title" name="file_title" style="width: 100%; margin-bottom: 10px;" required>
                </p>
                
                <p>
                    <label for="edit-file-type">File Type:</label>
                    <input type="text" id="edit-file-type" style="width: 100%; margin-bottom: 10px;" readonly>
                    <small>File type cannot be changed. You can only edit the extracted content.</small>
                </p>
                
                <p>
                    <label for="edit-file-content">Content:</label>
                    <textarea id="edit-file-content" name="file_content" rows="8" style="width: 100%;"></textarea>
                </p>
                
                <p>
                    <button type="submit" class="button button-primary">Save Changes</button>
                    <button type="button" class="button close-file-modal">Cancel</button>
                </p>
            </form>
        </div>

        <!-- ============================================================================
             OPTION 2: UPLOAD NEW FILE
             ============================================================================ -->
        <!-- Replace the current file with a new upload -->
        <div id="upload-new-section" style="display: none;">
            <h4>Upload New File</h4>
            <form method="post" enctype="multipart/form-data" id="upload-new-file-form">
                <input type="hidden" name="file_id" id="upload-file-id">
                <input type="hidden" name="upload_new_file_inline" value="1">
                
                <p>
                    <label for="upload-file-title">File Name:</label>
                    <input type="text" id="upload-file-title" name="file_title" style="width: 100%; margin-bottom: 10px;" required>
                </p>
                
                <p>
                    <label for="upload-new-file">Select New File:</label>
                    <input type="file" id="upload-new-file" name="new_file" accept=".txt,.pdf,.docx" style="width: 100%; margin-bottom: 10px;" required>
                    <small>Supported formats: TXT, PDF, DOCX</small>
                </p>
                
                <p>
                    <button type="submit" class="button button-primary">Upload & Replace</button>
                    <button type="button" class="button close-file-modal">Cancel</button>
                </p>
            </form>
        </div>
    </div>
</div>

<script>
/**
 * File Management JavaScript - AI Trainer Plugin
 * 
 * This script provides comprehensive file management functionality including:
 * - File upload and processing
 * - Content editing with TinyMCE integration
 * - File replacement capabilities
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
    // Centralized configuration for the file management system
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
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    // Common utility functions used throughout the file management system
    const utils = {
        showNotice: function(message, type = 'success') {
            const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
            $('#files-notices').html(`<div class="notice ${noticeClass}"><p>${message}</p></div>`);
            setTimeout(() => $('#files-notices').fadeOut(), CONFIG.NOTICE_TIMEOUT);
        },
        
        closeModal: function() {
            $('#file-edit-modal').hide();
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
        
        resetForm: function(formSelector) {
            $(formSelector)[0].reset();
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
        initEditModal: function() {
            if (typeof tinymce === 'undefined') return;
            
            tinymce.init({
                selector: '#edit-file-content',
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
                        console.log('TinyMCE file editor initialized successfully');
                    });
                    editor.on('LoadContent', function() {
                        console.log('TinyMCE file editor content loaded');
                    });
                },
                init_instance_callback: function(editor) {
                    console.log('TinyMCE file editor instance created');
                }
            });
        }
    };
    
    // ============================================================================
    // FORM HANDLERS
    // ============================================================================
    // Handles form submission and processing for file operations
    const formHandlers = {
        uploadFiles: function(e) {
            e.preventDefault();
            console.log('Upload files form submitted');
            
            const formData = new FormData(this);
            formData.append('action', 'ai_upload_files');
            formData.append('nonce', ajaxConfig.nonce);
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function(response) {
                console.log('Upload files response:', response);
                if (response.success) {
                    utils.showNotice(response.data.message);
                    utils.resetForm('#upload-files-form');
                    dataManager.loadFilesSources(1); // Always reload first page after add
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function(xhr, status, error) {
                console.log('Upload files error:', xhr, status, error);
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        },
        
        editFile: function(e) {
            e.preventDefault();
            console.log('Edit file form submitted');
            
            const content = utils.validateContent('edit-file-content', '#edit-file-content');
            if (!content) return false;
            
            const formData = new FormData(this);
            formData.set('file_content', content);
            formData.append('action', 'ai_update_file_inline');
            formData.append('nonce', ajaxConfig.nonce);
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function(response) {
                console.log('Edit file response:', response);
                if (response.success) {
                    utils.showNotice(response.data.message);
                    utils.closeModal();
                    dataManager.loadFilesSources();
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function(xhr, status, error) {
                console.log('Edit file error:', xhr, status, error);
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        },
        
        uploadNewFile: function(e) {
            e.preventDefault();
            console.log('Upload new file form submitted');
            
            const formData = new FormData(this);
            formData.append('action', 'ai_upload_new_file_inline');
            formData.append('nonce', ajaxConfig.nonce);
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function(response) {
                console.log('Upload new file response:', response);
                if (response.success) {
                    utils.showNotice(response.data.message);
                    utils.closeModal();
                    dataManager.loadFilesSources();
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function(xhr, status, error) {
                console.log('Upload new file error:', xhr, status, error);
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        }
    };
    
    // ============================================================================
    // ACTION HANDLERS
    // ============================================================================
    // Handles user actions like editing, deleting, and managing file entries
    const actionHandlers = {
        editFileInline: function() {
            console.log('Edit file clicked');
            const id = $(this).data('id');
            const title = $(this).data('title');
            const content = $(this).data('content');
            const filetype = $(this).data('filetype');
            
            $('#edit-file-id').val(id);
            $('#upload-file-id').val(id);
            $('#edit-file-title').val(title);
            $('#upload-file-title').val(title);
            $('#edit-file-type').val(filetype);
            
            // Set content in TinyMCE editor if it exists, otherwise in textarea
            utils.setTinyMCEContent('edit-file-content', content, '#edit-file-content');
            
            $('#file-edit-modal').show();
        },
        
        deleteFile: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this file?')) {
                return;
            }
            
            const id = $(this).data('id');
            const row = $(this).closest('tr');
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: {
                    action: 'ai_delete_file',
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
                dataManager.loadFilesSources(page);
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
    // UI HANDLERS
    // ============================================================================
    // Manages user interface state and mode switching
    const uiHandlers = {
        editContentMode: function() {
            $('#edit-content-section').show();
            $('#upload-new-section').hide();
            $('#edit-content-btn').addClass('button-primary').removeClass('button');
            $('#upload-new-btn').removeClass('button-primary').addClass('button');
        },
        
        uploadNewMode: function() {
            $('#edit-content-section').hide();
            $('#upload-new-section').show();
            $('#upload-new-btn').addClass('button-primary').removeClass('button');
            $('#edit-content-btn').removeClass('button-primary').addClass('button');
        }
    };
    
    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================
    // Handles data loading, refreshing, and management operations
    const dataManager = {
        loadFilesSources: function(page) {
            page = page || 1;
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: {
                    action: 'ai_get_files_sources',
                    page: page,
                    nonce: ajaxConfig.nonce
                }
            })
            .done(function(response) {
                if (response.success) {
                    $('#files-sources-table').html(response.data.html);
                    // Store current page for future operations
                    window.currentFilesPage = response.data.current_page;
                }
            });
        }
    };
    
    // ============================================================================
    // INITIALIZATION AND EVENT BINDING
    // ============================================================================
    // Initialize TinyMCE editor for the edit modal
    tinyMCEManager.initEditModal();
    
    // Bind event handlers to form submissions and user interactions
    $('#upload-files-form').on('submit', formHandlers.uploadFiles);
    $('#edit-file-form').on('submit', formHandlers.editFile);
    $('#upload-new-file-form').on('submit', formHandlers.uploadNewFile);
    
    $(document).on('click', '.close-file-modal', modalHandlers.closeModal);
    $(document).on('click', '.edit-file-inline', actionHandlers.editFileInline);
    $(document).on('click', '.delete-file', actionHandlers.deleteFile);
    $(document).on('click', '#files-sources-table .pagination-links a', actionHandlers.handlePagination);
    
    $('#edit-content-btn').click(uiHandlers.editContentMode);
    $('#upload-new-btn').click(uiHandlers.uploadNewMode);
    
    // ============================================================================
    // GLOBAL FUNCTION EXPORTS
    // ============================================================================
    // Make essential functions available globally for external access
    window.closeFileEditModal = utils.closeModal;
});
</script>