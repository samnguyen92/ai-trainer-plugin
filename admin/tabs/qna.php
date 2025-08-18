<?php
// Ensure ABSPATH is defined for includes
if (!defined('ABSPATH')) define('ABSPATH', dirname(__FILE__, 5) . '/');
// Ensure WordPress sanitization functions are available
if (!function_exists('sanitize_text_field')) require_once(ABSPATH . 'wp-includes/formatting.php');
if (!function_exists('wp_kses_post')) require_once(ABSPATH . 'wp-includes/kses.php');

if (isset($_POST['add_qna'])) {
    $title = sanitize_text_field($_POST['qa_title']);
    $question = sanitize_text_field($_POST['qa_question']);
    $answer = wp_kses_post($_POST['qa_answer']);
    $text = $question . ' ' . $answer;

    $embedding = ai_trainer_generate_embedding($text);
    ai_trainer_save_to_db($title, 'qa', $text, $embedding, [
        'question' => $question,
        'answer' => $answer,
    ]);

    echo '<div class="notice notice-success"><p>Q&A added successfully.</p></div>';
}

if (isset($_GET['delete_qna'])) {
    $id = intval($_GET['delete_qna']);
    global $wpdb;
    $wpdb->delete($wpdb->prefix . 'ai_knowledge', ['id' => $id]);
    echo '<div class="notice notice-success"><p>Q&A deleted.</p></div>';
}

// Handle inline edit form submission
if (isset($_POST['update_qna_inline'])) {
    $id = intval($_POST['qa_id']);
    $title = sanitize_text_field($_POST['qa_title']);
    $question = sanitize_text_field($_POST['qa_question']);
    $answer = wp_kses_post($_POST['qa_answer']);
    $text = $question . ' ' . $answer;

    $embedding = ai_trainer_generate_embedding($text);
    
    global $wpdb;
    $wpdb->update(
        $wpdb->prefix . 'ai_knowledge',
        [
            'title' => $title,
            'content' => $text,
            'embedding' => $embedding,
            'metadata' => json_encode([
                'question' => $question,
                'answer' => $answer,
            ])
        ],
        ['id' => $id]
    );

    echo '<div class="notice notice-success"><p>Q&A updated successfully.</p></div>';
}

// --- Q&A Import CSV Handler ---
if (isset($_POST['import_qna_csv']) && isset($_FILES['import_qna_csv_file'])) {
    $file = $_FILES['import_qna_csv_file']['tmp_name'];
    if (($handle = fopen($file, 'r')) !== false) {
        $header = fgetcsv($handle); // skip header
        global $wpdb;
        $imported = 0;
        while (($data = fgetcsv($handle)) !== false) {
            // Use htmlspecialchars as a fallback for sanitization in admin context
            $title = htmlspecialchars($data[0] ?? '', ENT_QUOTES, 'UTF-8');
            $question = htmlspecialchars($data[1] ?? '', ENT_QUOTES, 'UTF-8');
            $answer = htmlspecialchars($data[2] ?? '', ENT_QUOTES, 'UTF-8');
            if ($title && $question && $answer) {
                $text = $question . ' ' . $answer;
                $embedding = ai_trainer_generate_embedding($text);
                ai_trainer_save_to_db($title, 'qa', $text, $embedding, [
                    'question' => $question,
                    'answer' => $answer,
                ]);
                $imported++;
            }
        }
        fclose($handle);
        echo '<div class="notice notice-success"><p>Imported ' . $imported . ' Q&A entries from CSV.</p></div>';
    }
}
?>

<h2>Add Q&A</h2>
<div id="qna-notices"></div>

<form method="post" id="add-qna-form">
    <input type="text" name="qa_title" placeholder="Title" style="width: 100%; margin-bottom: 10px;" required>
    <div id="question-container">
        <div class="question-input">
            <input type="text" name="qna_questions[]" placeholder="Ex: How do I request a refund?" required />
            <button type="button" class="remove-question">×</button>
        </div>
    </div>
    <button type="button" id="add-question">+ Add another question</button>

    <h2>Answer</h2>
    <p>
        <label for="qa-answer">Answer:</label>
        <textarea id="qa-answer" name="qa_answer" rows="6" style="width: 100%;"></textarea>
    </p>
    <br><button type="submit" class="button button-primary" name="add_qna">Add Q&A</button>
</form>


<h3 style="margin-top: 30px;">Q&A Sources</h3>
<div id="qna-notices"></div>
<div id="qna-sources-table">
<?php
global $wpdb;
// Pagination settings
$items_per_page = 10;
$current_page = isset($_GET['qna_page']) ? max(1, intval($_GET['qna_page'])) : 1;
$offset = ($current_page - 1) * $items_per_page;
// Get total count
$total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa'");
$total_pages = ceil($total_items / $items_per_page);
// Get paginated results
$rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ai_knowledge WHERE source_type = 'qa' ORDER BY created_at DESC LIMIT $items_per_page OFFSET $offset", ARRAY_A);
?>
<table class="widefat striped">
    <thead>
        <tr>
            <th>Title</th><th>Main Question</th><th>Relative Questions</th><th>Answer</th><th>Actions</th>
        </tr>
    </thead>
    <tbody>
    <?php
    foreach ($rows as $row) {
        $meta = json_decode($row['metadata'], true);
        $main_question = esc_html($meta['question'] ?? '');
        $relative_questions = isset($meta['relative_questions']) && is_array($meta['relative_questions']) ? implode(', ', array_map('esc_html', $meta['relative_questions'])) : '';
        $answer = wp_kses_post($meta['answer'] ?? '');
        $title = esc_html($row['title'] ?? '');
        $size = strlen($row['content']);
        echo "<tr data-id='{$row['id']}'>
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
            $query_params['qna_page'] = $current_page - 1;
            $prev_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a class="prev-page" href="' . esc_url($prev_url) . '">‹</a>';
        }
        // Page numbers
        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);
        if ($start_page > 1) {
            $query_params['qna_page'] = 1;
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
                $query_params['qna_page'] = $i;
                $page_url = $url_parts['path'] . '?' . http_build_query($query_params);
                echo '<a href="' . esc_url($page_url) . '">' . $i . '</a>';
            }
        }
        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                echo '<span class="paging-input">…</span>';
            }
            $query_params['qna_page'] = $total_pages;
            $last_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a href="' . esc_url($last_url) . '">' . $total_pages . '</a>';
        }
        // Next page
        if ($current_page < $total_pages) {
            $query_params['qna_page'] = $current_page + 1;
            $next_url = $url_parts['path'] . '?' . http_build_query($query_params);
            echo '<a class="next-page" href="' . esc_url($next_url) . '">›</a>';
        }
        ?>
    </span>
</div>
<?php endif; ?>
</div>

<div style="margin-bottom: 16px;">
    <form method="get" action="<?php echo admin_url('admin-post.php'); ?>" style="display:inline; margin-right: 10px;">
        <input type="hidden" name="action" value="ai_export_qna_csv">
        <?php wp_nonce_field('ai_export_qna_csv'); ?>
        <button type="submit" class="button">Export Q&A CSV</button>
    </form>
    <form method="post" enctype="multipart/form-data" action="" style="display:inline;">
        <input type="file" name="import_qna_csv_file" accept=".csv" required>
        <button type="submit" name="import_qna_csv" class="button">Import Q&A CSV</button>
    </form>
</div>

<!-- Inline Edit Modal -->
<div id="qna-edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 5px; min-width: 500px; max-width: 80%; max-height: 80%; overflow-y: auto;">
        <h3>Edit Q&A</h3>
        <form method="post" id="edit-qna-form">
            <input type="hidden" name="qa_id" id="edit-qa-id">
            <input type="hidden" name="update_qna_inline" value="1">
            
            <p>
                <label for="edit-qa-title">Title:</label>
                <input type="text" id="edit-qa-title" name="qa_title" style="width: 100%; margin-bottom: 10px;">
            </p>
            <p>
                <label for="edit-main-question">Main Question:</label>
                <input type="text" id="edit-main-question" name="qna_questions[]" style="width: 100%; margin-bottom: 10px;" required>
            </p>
            <div id="edit-relative-questions-container">
                <!-- Relative questions will be inserted here -->
            </div>
            <button type="button" id="add-relative-question">+ Add relative question</button>
            <p>
                <label for="edit-qa-answer">Answer:</label>
                <textarea id="edit-qa-answer" name="qa_answer" rows="6" style="width: 100%;"></textarea>
            </p>
            <p>
                <button type="submit" class="button button-primary">Save Changes</button>
                <button type="button" class="button close-qna-modal">Cancel</button>
            </p>
        </form>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // Constants and configuration
    const CONFIG = {
        NOTICE_TIMEOUT: 3000,
        TINYMCE_DELAY: 100,
        TINYMCE_CONTENT_DELAY: 200,
        MODAL_SHOW_DELAY: 100,
        REBIND_DELAY: 500,
        TINYMCE_HEIGHT: 500,
        TINYMCE_PLUGINS: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
        TINYMCE_TOOLBAR: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
        TINYMCE_CONTENT_STYLE: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
    };
    
    // AJAX configuration
    const ajaxConfig = {
        url: typeof ai_trainer_ajax !== 'undefined' ? ai_trainer_ajax.ajaxurl : ajaxurl,
        nonce: typeof ai_trainer_ajax !== 'undefined' ? ai_trainer_ajax.nonce : ''
    };
    
    // Debug logging
    console.log('AJAX URL:', ajaxConfig.url);
    console.log('Nonce:', ajaxConfig.nonce);
    
    // Utility functions
    const utils = {
        showNotice: function(message, type = 'success') {
            const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
            $('#qna-notices').html(`<div class="notice ${noticeClass}"><p>${message}</p></div>`);
            setTimeout(() => $('#qna-notices').fadeOut(), CONFIG.NOTICE_TIMEOUT);
        },
        
        closeModal: function() {
            $('#qna-edit-modal').hide();
            if (typeof tinymce !== 'undefined' && tinymce.get('edit-qa-answer')) {
                tinymce.get('edit-qa-answer').remove();
            }
        },
        
        getTinyMCEContent: function(editorId, fallbackSelector) {
            if (tinymce.get(editorId)) {
                return tinymce.get(editorId).getContent();
            }
            return $(fallbackSelector).val();
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
        
        escapeHtml: function(text) {
            return $('<div>').text(text).html();
        }
    };
    
    // TinyMCE management
    const tinyMCEManager = {
        initAddForm: function() {
            if (typeof tinymce === 'undefined') return;
            
            tinymce.init({
                selector: '#qa-answer',
                height: CONFIG.TINYMCE_HEIGHT,
                menubar: 'file edit view insert format tools table help',
                plugins: CONFIG.TINYMCE_PLUGINS,
                toolbar: CONFIG.TINYMCE_TOOLBAR,
                license_key: 'gpl',
                base_url: tinymcePaths.baseUrl,
                skin_url: tinymcePaths.skinUrl,
                content_style: CONFIG.TINYMCE_CONTENT_STYLE
            });
        },
        
        initEditModal: function() {
            if (typeof tinymce === 'undefined') return;
            
            tinymce.init({
                selector: '#edit-qa-answer',
                height: CONFIG.TINYMCE_HEIGHT,
                menubar: 'file edit view insert format tools table help',
                plugins: CONFIG.TINYMCE_PLUGINS,
                toolbar: CONFIG.TINYMCE_TOOLBAR,
                license_key: 'gpl',
                base_url: tinymcePaths.baseUrl,
                skin_url: tinymcePaths.skinUrl,
                content_style: CONFIG.TINYMCE_CONTENT_STYLE
            });
        },
        
        initEditModalWithDelay: function() {
            setTimeout(() => {
                if (!tinymce.get('edit-qa-answer')) {
                    this.initEditModal();
                }
                
                setTimeout(() => {
                    if (tinymce.get('edit-qa-answer')) {
                        const answer = $('#edit-qa-answer').data('pending-content');
                        if (answer) {
                            tinymce.get('edit-qa-answer').setContent(answer);
                            $('#edit-qa-answer').removeData('pending-content');
                        }
                    }
                }, CONFIG.TINYMCE_CONTENT_DELAY);
            }, CONFIG.TINYMCE_DELAY);
        }
    };
    
    // Form handlers
    const formHandlers = {
        addQna: function(e) {
            e.preventDefault();
            console.log('Add Q&A form submitted');
            
            const question = $('#qa-question').val();
            const answer = utils.getTinyMCEContent('qa-answer', '#qa-answer').trim();
            
            if (!answer) {
                alert('Answer is required.');
                if (tinymce.get('qa-answer')) tinymce.get('qa-answer').focus();
                return false;
            }
            
            const formData = new FormData(this);
            formData.set('qa_question', question);
            formData.set('qa_answer', answer);
            formData.append('action', 'ai_add_qna');
            formData.append('nonce', ajaxConfig.nonce);
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function(response) {
                console.log('Add Q&A response:', response);
                if (response.success) {
                    utils.showNotice(response.data.message);
                    utils.resetForm('#add-qna-form', 'qa-answer');
                    reloadQnaSourcesAndRebind();
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function(xhr, status, error) {
                console.log('Add Q&A error:', xhr, status, error);
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        },
        
        editQna: function(e) {
            e.preventDefault();
            console.log('Edit Q&A form submitted');
            
            const question = $('#edit-main-question').val();
            const answer = utils.getTinyMCEContent('edit-qa-answer', '#edit-qa-answer');
            
            const formData = new FormData(this);
            formData.set('qa_question', question);
            formData.set('qa_answer', answer);
            formData.append('action', 'ai_update_qna_inline');
            formData.append('nonce', ajaxConfig.nonce);
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function(response) {
                console.log('Edit Q&A response:', response);
                if (response.success) {
                    utils.showNotice(response.data.message);
                    utils.closeModal();
                    reloadQnaSourcesAndRebind();
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function(xhr, status, error) {
                console.log('Edit Q&A error:', xhr, status, error);
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        }
    };
    
    // Action handlers
    const actionHandlers = {
        editQnaInline: function() {
            const id = $(this).data('id');
            const title = $(this).data('title');
            const mainQuestion = $(this).data('main-question');
            const answer = $(this).data('answer');
            
            let relativeQuestions = [];
            try {
                relativeQuestions = JSON.parse($(this).attr('data-relative-questions'));
            } catch (e) { 
                relativeQuestions = []; 
            }
            
            // Set form values
            $('#edit-qa-id').val(id);
            $('#edit-qa-title').val(title);
            $('#edit-main-question').val(mainQuestion);
            
            // Store answer for TinyMCE initialization
            $('#edit-qa-answer').data('pending-content', answer);
            
            // Populate relative questions
            const $container = $('#edit-relative-questions-container');
            $container.empty();
            
            if (Array.isArray(relativeQuestions) && relativeQuestions.length > 0) {
                relativeQuestions.forEach(function(q) {
                    $container.append(`
                        <div class="relative-question-input">
                            <input type="text" name="qna_questions[]" value="${utils.escapeHtml(q)}" style="width: 90%; margin-bottom: 5px;" required />
                            <button type="button" class="remove-relative-question">×</button>
                        </div>
                    `);
                });
            }
            
            // Bind remove handler
            $container.off('click').on('click', '.remove-relative-question', function() {
                $(this).parent().remove();
            });
            
            // Show modal and initialize TinyMCE
            $('#qna-edit-modal').show();
            tinyMCEManager.initEditModalWithDelay();
        },
        
        deleteQna: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this Q&A?')) {
                return;
            }
            
            const id = $(this).data('id');
            const row = $(this).closest('tr');
            
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: {
                    action: 'ai_delete_qna',
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
                    reloadQnaSourcesAndRebind();
                } else {
                    utils.showNotice(response.data.message, 'error');
                }
            })
            .fail(function() {
                utils.showNotice('An error occurred. Please try again.', 'error');
            });
        },
        
        addQuestion: function() {
            $('#question-container').append(`
                <div class="question-input">
                    <input type="text" name="qna_questions[]" placeholder="Another question..." required />
                    <button type="button" class="remove-question">×</button>
                </div>
            `);
            console.log("add-question clicked");
        },
        
        removeQuestion: function() {
            if ($('#question-container .question-input').length > 1) {
                $(this).parent().remove();
            }
        },
        
        addRelativeQuestion: function(e) {
            e.preventDefault();
            $('#edit-relative-questions-container').append(`
                <div class="relative-question-input">
                    <input type="text" name="qna_questions[]" style="width: 90%; margin-bottom: 5px;" required />
                    <button type="button" class="remove-relative-question">×</button>
                </div>
            `);
        }
    };
    
    // Modal handlers
    const modalHandlers = {
        closeModal: function() {
            utils.closeModal();
        },
        
        closeOnOutsideClick: function(e) {
            if (e.target === this) {
                utils.closeModal();
            }
        }
    };
    
    // Data management
    const dataManager = {
        loadQnaSources: function() {
            $.ajax({
                url: ajaxConfig.url,
                type: 'POST',
                data: {
                    action: 'ai_get_qna_sources',
                    nonce: ajaxConfig.nonce
                }
            })
            .done(function(response) {
                if (response.success) {
                    $('#qna-sources-table').html(response.data.html);
                }
            });
        },
        
        reloadQnaSourcesAndRebind: function() {
            this.loadQnaSources();
            
            setTimeout(() => {
                $(document).off('click', '.edit-qna-inline').on('click', '.edit-qna-inline', actionHandlers.editQnaInline);
            }, CONFIG.REBIND_DELAY);
        }
    };
    
    // Initialize TinyMCE for add form
    tinyMCEManager.initAddForm();
    
    // Event bindings
    $('#add-qna-form').on('submit', formHandlers.addQna);
    $('#edit-qna-form').on('submit', formHandlers.editQna);
    
    $(document).on('click', '.close-qna-modal', modalHandlers.closeModal);
    $(document).on('click', '#qna-edit-modal', modalHandlers.closeOnOutsideClick);
    $(document).on('click', '.edit-qna-inline', actionHandlers.editQnaInline);
    $(document).on('click', '.delete-qna', actionHandlers.deleteQna);
    
    $('#add-question').off('click').on('click', actionHandlers.addQuestion);
    $('#question-container').on('click', '.remove-question', actionHandlers.removeQuestion);
    $('#add-relative-question').off('click').on('click', actionHandlers.addRelativeQuestion);
    
    // Make functions available globally
    window.closeQnaEditModal = utils.closeModal;
    window.reloadQnaSourcesAndRebind = dataManager.reloadQnaSourcesAndRebind.bind(dataManager);
});

</script>