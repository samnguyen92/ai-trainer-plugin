<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['training_files'])) {
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
        }
    }
    echo '<div class="notice notice-success"><p>Files processed and embedded.</p></div>';
}

// Handle inline edit form submission
if (isset($_POST['update_file_inline'])) {
    $id = intval($_POST['file_id']);
    $title = sanitize_text_field($_POST['file_title']);
    $content = wp_kses_post($_POST['file_content']);
    
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

    echo '<div class="notice notice-success"><p>File content updated successfully.</p></div>';
}

// Handle new file upload inline
if (isset($_POST['upload_new_file_inline']) && isset($_FILES['new_file']) && $_FILES['new_file']['error'] === UPLOAD_ERR_OK) {
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

        echo '<div class="notice notice-success"><p>New file uploaded and processed successfully.</p></div>';
    } else {
        echo '<div class="notice notice-error"><p>Failed to process the uploaded file.</p></div>';
    }
}
?>

<h2>Files</h2>
<p>The Files tab allows you to upload and manage various document types to train your AI agent.</p>

<div id="files-notices"></div>

<form method="post" enctype="multipart/form-data" id="upload-files-form">
    <input type="file" name="training_files[]" multiple style="margin-bottom: 10px;" required>
    <button type="submit" class="button button-primary">Upload & Embed</button>
</form>

<hr><h3>File Sources</h3>
<div id="files-notices"></div>
<div id="files-sources-table">
<?php
global $wpdb;
// Pagination settings
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
<?php if ($total_pages > 1): ?>
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

<!-- Inline Edit Modal -->
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

        <!-- Option 1: Edit Extracted Content -->
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

        <!-- Option 2: Upload New File -->
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
jQuery(document).ready(function($) {
    // Constants and configuration
    const CONFIG = {
        NOTICE_TIMEOUT: 3000,
        TINYMCE_HEIGHT: 400,
        TINYMCE_PLUGINS: 'lists link image paste',
        TINYMCE_TOOLBAR: 'bold italic | bullist numlist | link image | formatselect',
        TINYMCE_CONTENT_STYLE: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
    };
    
    // AJAX configuration
    const ajaxConfig = {
        url: typeof ai_trainer_ajax !== 'undefined' ? ai_trainer_ajax.ajaxurl : ajaxurl,
        nonce: typeof ai_trainer_ajax !== 'undefined' ? ai_trainer_ajax.nonce : ''
    };
    
    // Utility functions
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
    
    // TinyMCE management
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
    
    // Form handlers
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
    
    // Action handlers
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
    
    // Modal handlers
    const modalHandlers = {
        closeModal: function() {
            utils.closeModal();
        }
    };
    
    // UI handlers
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
    
    // Data management
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
    
    // Initialize TinyMCE for edit modal
    tinyMCEManager.initEditModal();
    
    // Event bindings
    $('#upload-files-form').on('submit', formHandlers.uploadFiles);
    $('#edit-file-form').on('submit', formHandlers.editFile);
    $('#upload-new-file-form').on('submit', formHandlers.uploadNewFile);
    
    $(document).on('click', '.close-file-modal', modalHandlers.closeModal);
    $(document).on('click', '.edit-file-inline', actionHandlers.editFileInline);
    $(document).on('click', '.delete-file', actionHandlers.deleteFile);
    $(document).on('click', '#files-sources-table .pagination-links a', actionHandlers.handlePagination);
    
    $('#edit-content-btn').click(uiHandlers.editContentMode);
    $('#upload-new-btn').click(uiHandlers.uploadNewMode);
    
    // Make functions available globally
    window.closeFileEditModal = utils.closeModal;
});
</script>