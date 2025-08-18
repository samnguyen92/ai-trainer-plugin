<?php
if (!defined('ABSPATH')) exit;

// Pagination
$items_per_page = 20;
$current_page = isset($_GET['chatlog_page']) ? max(1, intval($_GET['chatlog_page'])) : 1;
$offset = ($current_page - 1) * $items_per_page;

$logs = ai_trainer_get_chat_logs($items_per_page, $offset);

global $wpdb;
$total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_chat_log");
$total_pages = ceil($total_items / $items_per_page);

// Helper: optimized check if question exists in ai_knowledge
function chatlog_question_in_training($question) {
    global $wpdb;
    
    // Use prepared statement for security and performance
    $query = $wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}ai_knowledge 
         WHERE source_type = 'qa' AND metadata LIKE %s",
        '%' . $wpdb->esc_like($question) . '%'
    );
    
    return (int) $wpdb->get_var($query) > 0;
}

// Cache training status for better performance
$training_status_cache = [];
if (!empty($logs)) {
    $questions = array_column($logs, 'question');
    $placeholders = implode(',', array_fill(0, count($questions), '%s'));
    
    $training_query = $wpdb->prepare(
        "SELECT metadata FROM {$wpdb->prefix}ai_knowledge 
         WHERE source_type = 'qa' AND metadata IN ($placeholders)",
        ...$questions
    );
    
    $training_results = $wpdb->get_results($training_query);
    foreach ($training_results as $result) {
        $meta = json_decode($result->metadata, true);
        if (isset($meta['question'])) {
            $training_status_cache[$meta['question']] = true;
        }
    }
}
?>
<div class="wrap">
    <h1>AI Chat Log</h1>
    <div id="chatlog-notices"></div>
    <button id="delete-selected-chatlogs" class="button" style="margin-bottom:10px;">Delete Selected</button>
    <table class="widefat striped">
        <thead>
            <tr>
                <th><input type="checkbox" id="select-all-chatlogs"></th>
                <th>User</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Date</th>
                <th>Training Status</th>
                <th>Reaction</th>
                <th>Reaction Detail</th>
                <th>Beta Feedback</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($logs)): ?>
                <tr><td colspan="8">No chat logs found.</td></tr>
            <?php else: ?>
                <?php foreach ($logs as $log):
                    $in_training = isset($training_status_cache[$log['question']]);
                    $reactions = isset($log['reaction']) ? json_decode($log['reaction'], true) : ['like' => 0, 'dislike' => 0];
                ?>
                    <tr data-id="<?php echo esc_attr($log['id']); ?>">
                        <td><input type="checkbox" class="select-chatlog" value="<?php echo esc_attr($log['id']); ?>"></td>
                        <td><?php echo $log['user_id'] ? esc_html(get_userdata($log['user_id'])->user_login ?? 'User #'.$log['user_id']) : 'Guest'; ?></td>
                        <td class="chatlog-question"><?php echo esc_html($log['question']); ?></td>
                        <td class="chatlog-answer"><?php echo wp_kses_post($log['answer']); ?></td>
                        <td><?php echo esc_html($log['created_at']); ?></td>
                        <td class="training-status" style="text-align:center;"><?php if ($in_training): ?><span style="color:green;font-size:18px;">&#10003;</span><?php endif; ?></td>
                        <td class="chatlog-reaction">
                            <span class="reaction-like" data-id="<?php echo esc_attr($log['id']); ?>" style="cursor:pointer;">&#128077;</span>
                            <span class="like-count" id="like-count-<?php echo esc_attr($log['id']); ?>"><?php echo intval($reactions['like']); ?></span>
                            &nbsp;&nbsp;
                            <span class="reaction-dislike" data-id="<?php echo esc_attr($log['id']); ?>" style="cursor:pointer;">&#128078;</span>
                            <span class="dislike-count" id="dislike-count-<?php echo esc_attr($log['id']); ?>"><?php echo intval($reactions['dislike']); ?></span>
                        </td>
                        <td class="chatlog-reaction-detail">
                            <?php 
                                if (!empty($log['reaction_detail'])) {
                                    $detail = json_decode($log['reaction_detail'], true);
                                    if (is_array($detail) && isset($detail['option'])) {
                                        if ($detail['option'] === 'Other' && !empty($detail['feedback'])) {
                                            echo '<strong>Other:</strong> ' . esc_html($detail['feedback']);
                                        } else {
                                            echo esc_html($detail['option']);
                                        }
                                    } else {
                                        echo esc_html($log['reaction_detail']);
                                    }
                                }
                            ?>
                        </td>
                        <td class="chatlog-beta-feedback">
                            <?php 
                                if (!empty($log['beta_feedback'])) {
                                    echo esc_html($log['beta_feedback']);
                                }
                            ?>
                        </td>
                        <td>
                            <button class="button edit-chatlog" data-id="<?php echo esc_attr($log['id']); ?>">Edit</button>
                            <button class="button add-to-training" data-id="<?php echo esc_attr($log['id']); ?>">Add to Training</button>
                            <button class="button delete-chatlog" data-id="<?php echo esc_attr($log['id']); ?>">Delete</button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
    <?php if ($total_pages > 1): ?>
        <div class="tablenav"><span class="pagination-links">
            <?php
            $base_url = remove_query_arg('chatlog_page');
            for ($i = 1; $i <= $total_pages; $i++) {
                $url = add_query_arg('chatlog_page', $i, $base_url);
                if ($i == $current_page) {
                    echo '<span class="current-page">' . $i . '</span> ';
                } else {
                    echo '<a href="' . esc_url($url) . '">' . $i . '</a> ';
                }
            }
            ?>
        </span></div>
    <?php endif; ?>
</div>

<!-- Edit Modal -->
<div id="chatlog-edit-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000;">
    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; padding:20px; border-radius:5px; min-width:600px; max-width:800px; max-height:90%; overflow-y:auto;">
        <h3>Edit Chat Log Entry</h3>
        <div id="chatlog-edit-content">
            <!-- Full table view will be loaded here via AJAX -->
        </div>
        <div style="margin-top:20px; text-align:right;">
            <button type="button" class="button button-primary" id="save-chatlog-edit">Save Changes</button>
            <button type="button" class="button close-chatlog-modal" style="margin-left:10px;">Cancel</button>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($){
    // Constants and configuration
    const CONFIG = {
        NOTICE_TIMEOUT: 3000,
        TINYMCE_DELAY: 100,
        MODAL_SELECTOR: '#chatlog-edit-modal',
        CONTENT_SELECTOR: '#chatlog-edit-content'
    };
    
    // Utility functions
    const utils = {
        showNotice: function(message, type = 'success') {
            const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
            $('#chatlog-notices').html(`<div class="notice ${noticeClass}"><p>${message}</p></div>`).show();
            setTimeout(() => $('#chatlog-notices').fadeOut(), CONFIG.NOTICE_TIMEOUT);
        },
        
        closeModal: function() {
            $(CONFIG.MODAL_SELECTOR).hide();
            if (typeof tinymce !== 'undefined' && tinymce.get('edit-chatlog-answer')) {
                tinymce.get('edit-chatlog-answer').remove();
            }
            $(CONFIG.CONTENT_SELECTOR).empty();
        },
        
        initTinyMCE: function() {
            if (typeof tinymce === 'undefined') return;
            
            setTimeout(() => {
                tinymce.init({
                    selector: '#edit-chatlog-answer',
                    height: 500,
                    menubar: 'file edit view insert format tools table help',
                    plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
                    toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                    license_key: 'gpl',
                    base_url: tinymcePaths.baseUrl,
                    skin_url: tinymcePaths.skinUrl,
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                });
            }, CONFIG.TINYMCE_DELAY);
        }
    };
    
    // Event handlers
    const handlers = {
        editChatlog: function() {
            const id = $(this).data('id');
            $(CONFIG.MODAL_SELECTOR).show();
            
            $.post(ajaxurl, {
                action: 'ai_get_chatlog_edit_view',
                id: id,
                _wpnonce: '<?php echo wp_create_nonce('ai_update_chatlog_answer'); ?>'
            })
            .done(function(resp) {
                if (resp.success) {
                    $(CONFIG.CONTENT_SELECTOR).html(resp.data.html);
                    utils.initTinyMCE();
                } else {
                    $(CONFIG.CONTENT_SELECTOR).html('<p>Error loading edit view.</p>');
                }
            })
            .fail(function() {
                $(CONFIG.CONTENT_SELECTOR).html('<p>Error loading edit view.</p>');
            });
        },
        
        saveEdit: function() {
            const id = $('#edit-chatlog-id').val();
            const question = $('#edit-chatlog-question').val();
            const answer = tinymce.get('edit-chatlog-answer') ? 
                tinymce.get('edit-chatlog-answer').getContent() : 
                $('#edit-chatlog-answer').val();
            
            $.post(ajaxurl, {
                action: 'ai_update_chatlog_full',
                id: id,
                question: question,
                answer: answer,
                _wpnonce: '<?php echo wp_create_nonce('ai_update_chatlog_answer'); ?>'
            })
            .done(function(resp) {
                if (resp.success) {
                    const row = $(`tr[data-id="${id}"]`);
                    row.find('.chatlog-question').text(question);
                    row.find('.chatlog-answer').html(answer);
                    utils.closeModal();
                    utils.showNotice('Chat log updated successfully.');
                } else {
                    utils.showNotice('Failed to update chat log.', 'error');
                }
            })
            .fail(function() {
                utils.showNotice('Failed to update chat log.', 'error');
            });
        },
        
        addToTraining: function() {
            const row = $(this).closest('tr');
            const question = row.find('.chatlog-question').text();
            const answer = row.find('.chatlog-answer').html();
            
            $.post(ajaxurl, {
                action: 'ai_add_chatlog_to_training',
                question: question,
                answer: answer,
                _wpnonce: '<?php echo wp_create_nonce('ai_add_chatlog_to_training'); ?>'
            })
            .done(function(resp) {
                if (resp.success) {
                    row.find('.training-status').html('<span style="color:green;">&#10003;</span>');
                    utils.showNotice('Added to training successfully.');
                } else {
                    utils.showNotice('Failed to add to training.', 'error');
                }
            })
            .fail(function() {
                utils.showNotice('Failed to add to training.', 'error');
            });
        },
        
        deleteChatlog: function() {
            if (!confirm('Are you sure you want to delete this chat log entry?')) return;
            
            const btn = $(this);
            const id = btn.data('id');
            
            $.post(ajaxurl, {
                action: 'ai_delete_chatlog',
                id: id,
                _wpnonce: '<?php echo wp_create_nonce('ai_update_chatlog_answer'); ?>'
            })
            .done(function(resp) {
                if (resp.success) {
                    btn.closest('tr').fadeOut(() => $(this).remove());
                    utils.showNotice('Chat log entry deleted successfully.');
                } else {
                    utils.showNotice('Failed to delete chat log entry.', 'error');
                }
            })
            .fail(function() {
                utils.showNotice('Failed to delete chat log entry.', 'error');
            });
        },
        
        deleteSelected: function() {
            const ids = $('.select-chatlog:checked').map(function() { 
                return $(this).val(); 
            }).get();
            
            if (ids.length === 0) {
                alert('No chat logs selected.');
                return;
            }
            
            if (!confirm('Are you sure you want to delete the selected chat logs?')) return;
            
            $.post(ajaxurl, {
                action: 'ai_delete_chatlog_bulk',
                ids: ids,
                _wpnonce: '<?php echo wp_create_nonce('ai_update_chatlog_answer'); ?>'
            })
            .done(function(resp) {
                if (resp.success) {
                    ids.forEach(function(id) {
                        $(`tr[data-id="${id}"]`).remove();
                    });
                    utils.showNotice('Selected chat logs deleted successfully.');
                } else {
                    utils.showNotice('Failed to delete selected chat logs.', 'error');
                }
            })
            .fail(function() {
                utils.showNotice('Failed to delete selected chat logs.', 'error');
            });
        },
        
        updateReaction: function() {
            const btn = $(this);
            const id = btn.data('id');
            const type = btn.hasClass('reaction-like') ? 'like' : 'dislike';
            
            $.post(ajaxurl, {
                action: 'ai_update_chatlog_reaction',
                id: id,
                reaction: type,
                _wpnonce: '<?php echo wp_create_nonce('ai_update_chatlog_answer'); ?>'
            })
            .done(function(resp) {
                if (resp.success && resp.data) {
                    $(`#like-count-${id}`).text(resp.data.like);
                    $(`#dislike-count-${id}`).text(resp.data.dislike);
                } else {
                    alert('Failed to update reaction.');
                }
            })
            .fail(function() {
                alert('Failed to update reaction.');
            });
        },
        
        handleSelectAll: function() {
            $('.select-chatlog').prop('checked', $(this).prop('checked'));
        },
        
        handleIndividualSelect: function() {
            const totalCheckboxes = $('.select-chatlog').length;
            const checkedCheckboxes = $('.select-chatlog:checked').length;
            
            if (!$(this).prop('checked')) {
                $('#select-all-chatlogs').prop('checked', false);
            } else if (checkedCheckboxes === totalCheckboxes) {
                $('#select-all-chatlogs').prop('checked', true);
            }
        }
    };
    
    // Event bindings
    $('.edit-chatlog').on('click', handlers.editChatlog);
    $('.close-chatlog-modal').on('click', utils.closeModal);
    $('#save-chatlog-edit').on('click', handlers.saveEdit);
    $('.add-to-training').on('click', handlers.addToTraining);
    $('.delete-chatlog').on('click', handlers.deleteChatlog);
    $('#select-all-chatlogs').on('change', handlers.handleSelectAll);
    $(document).on('change', '.select-chatlog', handlers.handleIndividualSelect);
    $('#delete-selected-chatlogs').on('click', handlers.deleteSelected);
    $(document).on('click', '.reaction-like, .reaction-dislike', handlers.updateReaction);
    
    // Global function for streaming answer updates
    window.saveStreamingAnswerToChatlog = function(question, answer) {
        $.post(ajaxurl, {
            action: 'ai_update_chatlog_answer_by_question',
            question: question,
            answer: answer
        });
    };
});
</script> 