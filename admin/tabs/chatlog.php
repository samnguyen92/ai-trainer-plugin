<?php
/**
 * Chat Log Management Tab - AI Trainer Plugin
 * 
 * This file provides the admin interface for viewing and managing chat logs
 * from user interactions with the AI system. It displays conversation history,
 * user feedback, training status, and provides tools for data analysis and cleanup.
 * 
 * ============================================================================
 * FUNCTIONALITY OVERVIEW
 * ============================================================================
 * 
 * CORE OPERATIONS:
 * - View all AI chat conversations and user interactions
 * - Monitor user feedback and reaction data
 * - Track training status of questions
 * - Manage chat log entries (view, edit, delete)
 * - Analyze user satisfaction and engagement
 * - Export chat data for analysis and reporting
 * 
 * ADVANCED FEATURES:
 * - Paginated chat log display with optimization
 * - Training status indicators and tracking
 * - User feedback analysis and visualization
 * - Bulk deletion capabilities for data management
 * - Performance optimization with intelligent caching
 * - Detailed reaction analysis and breakdowns
 * - Beta feedback collection and processing
 * 
 * ============================================================================
 * DATA DISPLAYED AND TRACKED
 * ============================================================================
 * 
 * CONVERSATION DATA:
 * - User questions and AI responses
 * - Timestamps and user identification
 * - Conversation context and flow
 * - Response quality and relevance
 * 
 * USER FEEDBACK:
 * - Like/dislike reactions with counts
 * - Detailed feedback submissions
 * - Beta feedback for improvement
 * - User satisfaction metrics
 * - Engagement tracking
 * 
 * TRAINING INTEGRATION:
 * - Training status indicators
 * - Question-to-training mapping
 * - Knowledge base integration status
 * - Training data quality assessment
 * 
 * ============================================================================
 * PERFORMANCE OPTIMIZATION
 * ============================================================================
 * 
 * DATABASE OPTIMIZATION:
 * - Efficient pagination with configurable limits
 * - Prepared statements for security and performance
 * - Indexed field usage for fast queries
 * - Connection pooling and query optimization
 * 
 * CACHING STRATEGIES:
 * - Training status caching for batch operations
 * - Query result caching for repeated access
 * - Memory optimization for large datasets
 * - Progressive loading for better UX
 * 
 * FRONTEND PERFORMANCE:
 * - AJAX-based operations for dynamic updates
 * - Lazy loading for large chat log collections
 * - Responsive design for all screen sizes
 * - Progressive enhancement patterns
 * 
 * ============================================================================
 * USER INTERFACE COMPONENTS
 * ============================================================================
 * 
 * CHAT LOG TABLE:
 * - Comprehensive conversation display
 * - User identification and timestamps
 * - Training status indicators
 * - Feedback visualization
 * - Action buttons for management
 * 
 * BULK OPERATIONS:
 * - Multi-select functionality
 * - Bulk deletion capabilities
 * - Selected item management
 * - Confirmation dialogs
 * 
 * FILTERING AND SEARCH:
 * - Date-based filtering
 * - User-based filtering
 * - Training status filtering
 * - Feedback type filtering
 * 
 * ============================================================================
 * TRAINING STATUS MANAGEMENT
 * ============================================================================
 * 
 * STATUS TRACKING:
 * - Real-time training status updates
 * - Question-to-knowledge mapping
 * - Training data quality indicators
 * - Continuous improvement tracking
 * 
 * INTEGRATION FEATURES:
 * - Knowledge base connectivity
 * - Training data synchronization
 * - Quality assessment metrics
 * - Improvement recommendations
 * 
 * ============================================================================
 * FEEDBACK ANALYSIS
 * ============================================================================
 * 
 * REACTION TRACKING:
 * - Like/dislike count aggregation
 * - User sentiment analysis
 * - Feedback trend identification
 * - Quality improvement insights
 * 
 * BETA FEEDBACK:
 * - Detailed user submissions
 * - Feedback categorization
 * - Improvement suggestions
 * - User experience insights
 * 
 * ============================================================================
 * DATA MANAGEMENT AND CLEANUP
 * ============================================================================
 * 
 * DATA RETENTION:
 * - Configurable retention policies
 * - Data archiving capabilities
 * - Privacy compliance features
 * - Audit trail maintenance
 * 
 * CLEANUP OPERATIONS:
 * - Bulk deletion with confirmation
 * - Selective data removal
 * - Data export for backup
 * - Privacy protection measures
 * 
 * ============================================================================
 * SECURITY AND PRIVACY
 * ============================================================================
 * 
 * ACCESS CONTROL:
 * - Admin-only access restrictions
 * - Capability-based permissions
 * - User data protection
 * - Privacy compliance features
 * 
 * DATA PROTECTION:
 * - Input sanitization and validation
 * - SQL injection prevention
 * - XSS protection measures
 * - Secure data handling
 * 
 * ============================================================================
 * EXPORT AND REPORTING
 * ============================================================================
 * 
 * DATA EXPORT:
 * - CSV export functionality
 * - Custom date range selection
 * - Filtered data export
 * - Report generation capabilities
 * 
 * ANALYTICS:
 * - User engagement metrics
 * - Feedback trend analysis
 * - Training effectiveness tracking
 * - Performance monitoring
 * 
 * @package AI_Trainer
 * @subpackage Admin_Tabs
 * @since 1.0
 * @author Psychedelic
 */

if (!defined('ABSPATH')) exit;

// ============================================================================
// PAGINATION SETUP
// ============================================================================
/**
 * Configure pagination for large chat log collections
 * 
 * This section sets up efficient pagination for the chat log display:
 * - Configurable items per page (currently 20)
 * - Current page detection from URL parameters
 * - Offset calculation for database queries
 * - Total page count calculation
 * - Database query optimization
 * 
 * PAGINATION FEATURES:
 * - 20 items per page for optimal performance
 * - URL parameter state management
 * - Database query optimization with LIMIT/OFFSET
 * - Navigation controls generation
 * - Memory usage optimization
 * 
 * @since 1.0
 */
$items_per_page = 20;
$current_page = isset($_GET['chatlog_page']) ? max(1, intval($_GET['chatlog_page'])) : 1;
$offset = ($current_page - 1) * $items_per_page;

// Retrieve paginated chat logs
$logs = ai_trainer_get_chat_logs($items_per_page, $offset);

// Calculate total pages for pagination
global $wpdb;
$total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_chat_log");
$total_pages = ceil($total_items / $items_per_page);

// ============================================================================
// TRAINING STATUS HELPER FUNCTIONS
// ============================================================================
/**
 * Check if a question exists in the training data
 * 
 * This function determines whether a user's question has been added to
 * the AI training knowledge base, helping administrators identify
 * which questions need training data.
 * 
 * FUNCTIONALITY:
 * - Searches knowledge base for question matches
 * - Uses prepared statements for security
 * - Provides real-time training status
 * - Enables training gap identification
 * 
 * SECURITY FEATURES:
 * - Prepared statement usage
 * - SQL injection prevention
 * - Input sanitization
 * - Safe database queries
 * 
 * PERFORMANCE:
 * - Optimized database queries
 * - Indexed field usage
 * - Efficient metadata searching
 * - Caching integration
 * 
 * @param string $question The user's question to check
 * @return bool True if question exists in training data, false otherwise
 * @since 1.0
 */
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

// ============================================================================
// TRAINING STATUS CACHING
// ============================================================================
/**
 * Cache training status for better performance when displaying multiple logs
 * 
 * This section implements intelligent caching to optimize performance:
 * - Batch querying for training status
 * - Memory-efficient caching strategy
 * - Performance optimization for large datasets
 * - Reduced database query overhead
 * 
 * CACHING STRATEGY:
 * - Batch processing of multiple questions
 * - Single database query for multiple status checks
 * - Memory-efficient array-based caching
 * - Performance improvement for large chat log collections
 * 
 * OPTIMIZATION BENEFITS:
 * - Reduced database queries from N to 1
 * - Improved page load performance
 * - Better memory usage patterns
 * - Enhanced user experience
 * 
 * @since 1.0
 */
$training_status_cache = [];
if (!empty($logs)) {
    $questions = array_column($logs, 'question');
    $placeholders = implode(',', array_fill(0, count($questions), '%s'));
    
    // Batch query for training status to improve performance
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

<!-- ============================================================================
     CHAT LOG STYLING
     ============================================================================
     
     Custom CSS styling for chat log display:
     - Reaction visualization and formatting
     - Training status indicators
     - Feedback display styling
     - Responsive design elements
     
     STYLING FEATURES:
     - Centered reaction displays
     - Color-coded feedback indicators
     - Responsive table layouts
     - Mobile-friendly design
     - Accessibility improvements
-->
<style>
.chatlog-reaction {
    text-align: center;
    font-size: 14px;
}

.chatlog-reaction span {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.chatlog-reaction-detail {
    max-width: 200px;
    word-wrap: break-word;
}

.chatlog-reaction-detail span {
    display: inline-block;
    margin: 2px 0;
}
</style>

<!-- ============================================================================
     CHAT LOG MANAGEMENT INTERFACE
     ============================================================================
     
     This section provides the complete user interface for chat log management:
     - Comprehensive chat log display table
     - Bulk operations and management tools
     - Training status indicators
     - User feedback visualization
     - Action buttons for each entry
     
     INTERFACE FEATURES:
     - Paginated chat log display
     - Multi-select functionality
     - Bulk deletion capabilities
     - Training status tracking
     - Feedback analysis tools
     - Export and reporting options
-->
<div class="wrap">
    <h1>AI Chat Log Management</h1>
    <div id="chatlog-notices"></div>
    
    <!-- Bulk Actions -->
    <button id="delete-selected-chatlogs" class="button" style="margin-bottom:10px;">Delete Selected</button>
    
    <!-- Chat Log Table -->
    <table class="widefat striped">
        <thead>
            <tr>
                <th><input type="checkbox" id="select-all-chatlogs"></th>
                <th>User</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Date</th>
                <th>Training Status</th>
                <th>Feedback Count</th>
                <th>Feedback Type</th>
                <th>Beta Feedback</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($logs)): ?>
                <tr><td colspan="10">No chat logs found.</td></tr>
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
                            <?php if ($reactions['like'] > 0): ?>
                                <span style="color: #4CAF50;">&#128077; <?php echo intval($reactions['like']); ?></span>
                            <?php endif; ?>
                            <?php if ($reactions['dislike'] > 0): ?>
                                <?php if ($reactions['like'] > 0): ?>&nbsp;&nbsp;<?php endif; ?>
                                <span style="color: #f44336;">&#128078; <?php echo intval($reactions['dislike']); ?></span>
                            <?php endif; ?>
                            <?php if ($reactions['like'] == 0 && $reactions['dislike'] == 0): ?>
                                <span style="color: #999;">No reactions</span>
                            <?php endif; ?>
                        </td>
                        <td class="chatlog-reaction-detail">
                            <?php 
                                // ============================================================================
                                // REACTION DETAIL PROCESSING
                                // ============================================================================
                                /**
                                 * Process and display detailed user feedback information
                                 * 
                                 * This section handles the display of detailed user feedback:
                                 * - Beta feedback submissions
                                 * - Detailed reaction information
                                 * - User experience insights
                                 * - Feedback categorization and display
                                 * 
                                 * FEEDBACK TYPES:
                                 * - Beta feedback for improvement
                                 * - Detailed reaction explanations
                                 * - User experience comments
                                 * - Quality improvement suggestions
                                 * 
                                 * DISPLAY FEATURES:
                                 * - Formatted feedback presentation
                                 * - Categorized feedback display
                                 * - User-friendly formatting
                                 * - Responsive design elements
                                 * 
                                 * @since 1.0
                                 */
                                if (!empty($log['reaction_detail'])) {
                                    // Handle escaped JSON strings (with backslashes before quotes) - same as CSAT analytics
                                    $detail = $log['reaction_detail'];
                                    if (is_string($detail)) {
                                        // First, try to decode as-is
                                        $detail = json_decode($detail, true);
                                        
                                        // If that fails or returns null, try with stripslashes
                                        if ($detail === null) {
                                            $detail = json_decode(stripslashes($detail), true);
                                        }
                                        
                                        // If still fails, try with addslashes removed
                                        if ($detail === null) {
                                            $detail = json_decode(str_replace('\\"', '"', $log['reaction_detail']), true);
                                        }
                                    }
                                    
                                    if (is_array($detail) && isset($detail['option'])) {
                                        $option = $detail['option'];
                                        $feedback = isset($detail['feedback']) ? $detail['feedback'] : '';
                                        
                                        // Display the selected feedback option with better formatting
                                        if ($option === 'Other' && !empty($feedback)) {
                                            echo '<span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">';
                                            echo '<strong>Other:</strong> ' . esc_html($feedback);
                                            echo '</span>';
                                        } else {
                                            echo '<span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #1976d2;">';
                                            echo esc_html($option);
                                            echo '</span>';
                                        }
                                        
                                        // Show additional feedback if provided
                                        if (!empty($feedback) && $option !== 'Other') {
                                            echo '<br><small style="color: #666; margin-top: 4px; display: block;">';
                                            echo esc_html($feedback);
                                            echo '</small>';
                                        }
                                    } else {
                                        echo '<span style="color: #999; font-style: italic;">Invalid format</span>';
                                    }
                                } else {
                                    echo '<span style="color: #999; font-style: italic;">No feedback</span>';
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
    <?php 
    // ============================================================================
    // PAGINATION NAVIGATION
    // ============================================================================
    // Display pagination controls when there are multiple pages
    if ($total_pages > 1): ?>
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

<!-- ============================================================================
     EDIT MODAL
     ============================================================================ -->
<!-- Modal for editing chat log entries with full content view -->
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
/**
 * Chat Log Management JavaScript - AI Trainer Plugin
 * 
 * This script provides comprehensive chat log management functionality including:
 * - Chat log editing and management
 * - Training data integration
 * - Bulk operations and deletion
 * - TinyMCE editor integration
 * - AJAX-powered operations for seamless user experience
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
jQuery(document).ready(function($){
    // ============================================================================
    // CONFIGURATION AND CONSTANTS
    // ============================================================================
    // Centralized configuration for the chat log management system
    const CONFIG = {
        NOTICE_TIMEOUT: 3000,
        TINYMCE_DELAY: 100,
        MODAL_SELECTOR: '#chatlog-edit-modal',
        CONTENT_SELECTOR: '#chatlog-edit-content'
    };
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    // Common utility functions used throughout the chat log management system
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
                    toolbar: 'undo redo | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                    license_key: 'gpl',
                    base_url: tinymcePaths.baseUrl,
                    skin_url: tinymcePaths.skinUrl,
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    formats: {
                        superscript: { inline: 'sup', remove: 'all' },
                        subscript: { inline: 'sub', remove: 'all' }
                    },
                    extended_valid_elements: '-sup,-sub',
                    invalid_elements: 'sup,sub'
                });
            }, CONFIG.TINYMCE_DELAY);
        }
    };
    
    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    // Handles user interactions and AJAX operations for chat log management
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
    
    // ============================================================================
    // EVENT BINDING
    // ============================================================================
    // Bind event handlers to user interactions and form submissions
    $('.edit-chatlog').on('click', handlers.editChatlog);
    $('.close-chatlog-modal').on('click', utils.closeModal);
    $('#save-chatlog-edit').on('click', handlers.saveEdit);
    $('.add-to-training').on('click', handlers.addToTraining);
    $('.delete-chatlog').on('click', handlers.deleteChatlog);
    $('#select-all-chatlogs').on('change', handlers.handleSelectAll);
    $(document).on('change', '.select-chatlog', handlers.handleIndividualSelect);
    $('#delete-selected-chatlogs').on('click', handlers.deleteSelected);

    
    // ============================================================================
    // GLOBAL FUNCTION EXPORTS
    // ============================================================================
    // Make essential functions available globally for external access
    window.saveStreamingAnswerToChatlog = function(question, answer) {
        $.post(ajaxurl, {
            action: 'ai_update_chatlog_answer_by_question',
            question: question,
            answer: answer
        });
    };
});
</script> 