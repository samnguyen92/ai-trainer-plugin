<?php

/**
 * Reaction Logger - AI Trainer Plugin
 * 
 * This file handles user feedback through a reaction system (like/dislike)
 * that allows users to rate AI responses. This feedback is used for:
 * - Customer Satisfaction (CSAT) analytics
 * - Quality improvement of AI responses
 * - User experience monitoring
 * - Content relevance tracking
 * 
 * REACTION SYSTEM OVERVIEW:
 * - Users can like or dislike AI responses
 * - Reactions are stored with detailed feedback categories
 * - Data is used for analytics and reporting
 * - Supports both logged-in and anonymous users
 * 
 * FEEDBACK CATEGORIES:
 * - Like: Accurate responses, clear explanations, useful sources
 * - Dislike: Inaccurate responses, unclear explanations, missing information
 * - Additional context can be provided for detailed analysis
 * 
 * TECHNICAL IMPLEMENTATION:
 * - AJAX-based for seamless user experience
 * - JSON data storage for flexibility
 * - WordPress nonce verification for security
 * - Error logging for debugging
 * 
 * @package AI_Trainer
 * @since 1.0
 */

if (!defined('ABSPATH')) exit;

// ============================================================================
// AJAX HANDLER FOR REACTION LOGGING
// ============================================================================
// This endpoint receives reaction data from the frontend and stores it
// in the database for later analysis and reporting.

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'log_reaction') {
    
    // Verify WordPress nonce for security
    if (!wp_verify_nonce($_POST['nonce'], 'ai_trainer_reaction_nonce')) {
        wp_send_json_error(['message' => 'Security check failed']);
        exit;
    }
    
    // Get the reaction data from the request
    $reaction_data = json_decode(file_get_contents('php://input'), true);
    
    if ($reaction_data && isset($reaction_data['data'])) {
        $data = $reaction_data['data'];
        
        // Extract reaction details
        $chatlog_id = intval($data['chatlog_id'] ?? 0);
        $reaction_type = sanitize_text_field($data['reaction_type'] ?? ''); // 'like' or 'dislike'
        $feedback_category = sanitize_text_field($data['feedback_category'] ?? '');
        $user_id = get_current_user_id(); // 0 for anonymous users
        $timestamp = current_time('mysql');
        
        // Validate required data
        if (empty($chatlog_id) || empty($reaction_type)) {
            wp_send_json_error(['message' => 'Missing required reaction data']);
            exit;
        }
        
        // Store reaction in database
        global $wpdb;
        $table_name = $wpdb->prefix . 'ai_chat_log';
        
        // Get existing reaction data for this chatlog entry
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT reaction FROM $table_name WHERE id = %d",
            $chatlog_id
        ));
        
        if ($existing) {
            $reactions = json_decode($existing, true) ?: ['like' => 0, 'dislike' => 0];
        } else {
            $reactions = ['like' => 0, 'dislike' => 0];
        }
        
        // Increment the appropriate reaction count
        $reactions[$reaction_type]++;
        
        // Prepare reaction detail data
        $reaction_detail = [
            'type' => $reaction_type,
            'category' => $feedback_category,
            'timestamp' => $timestamp,
            'user_id' => $user_id
        ];
        
        // Update the database with new reaction data
        $result = $wpdb->update(
            $table_name,
            [
                'reaction' => json_encode($reactions),
                'reaction_detail' => json_encode($reaction_detail)
            ],
            ['id' => $chatlog_id],
            ['%s', '%s'],
            ['%d']
        );
        
        if ($result !== false) {
            // Log successful reaction for debugging
            $log_file = dirname(__FILE__) . '/reactions.log';
            $log_entry = date('Y-m-d H:i:s') . " - Reaction logged: " . json_encode($data) . "\n";
            file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
            
            // Return success response
            wp_send_json_success([
                'message' => 'Reaction logged successfully',
                'reactions' => $reactions,
                'chatlog_id' => $chatlog_id
            ]);
        } else {
            wp_send_json_error(['message' => 'Failed to save reaction']);
        }
        
    } else {
        wp_send_json_error(['message' => 'Invalid reaction data']);
    }
    
    exit;
}

// ============================================================================
// ADMIN INTERFACE FOR REACTION MONITORING
// ============================================================================
// This section provides a simple admin interface for viewing reaction logs
// and monitoring user feedback patterns.

if (isset($_GET['page']) && $_GET['page'] === 'ai-trainer-reactions') {
    
    // Check user permissions
    if (!current_user_can('manage_options')) {
        wp_die('Insufficient permissions');
    }
    
    // Display the reaction monitoring interface
    ?>
    <div class="wrap">
        <h1>🧪 Reaction Logger</h1>
        <p>This file handles AJAX requests for logging user reactions.</p>
        <p>It should be called via POST request with action=log_reaction</p>
        
        <h2>Recent Reactions</h2>
        <div class="reaction-stats">
            <?php
            // Display recent reaction statistics
            global $wpdb;
            $table_name = $wpdb->prefix . 'ai_chat_log';
            
            $recent_reactions = $wpdb->get_results("
                SELECT id, question, reaction, reaction_detail, created_at 
                FROM $table_name 
                WHERE reaction IS NOT NULL 
                ORDER BY created_at DESC 
                LIMIT 10
            ");
            
            if ($recent_reactions): ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Question</th>
                            <th>Reactions</th>
                            <th>Details</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_reactions as $reaction): ?>
                            <tr>
                                <td><?php echo esc_html($reaction->id); ?></td>
                                <td><?php echo esc_html(substr($reaction->question, 0, 50)) . '...'; ?></td>
                                <td>
                                    <?php 
                                    $reactions = json_decode($reaction->reaction, true);
                                    if ($reactions): ?>
                                        👍 <?php echo intval($reactions['like'] ?? 0); ?> |
                                        👎 <?php echo intval($reactions['dislike'] ?? 0); ?>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php 
                                    $details = json_decode($reaction->reaction_detail, true);
                                    if ($details): ?>
                                        <strong><?php echo esc_html($details['type'] ?? ''); ?></strong><br>
                                        <small><?php echo esc_html($details['category'] ?? ''); ?></small>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html($reaction->created_at); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>No reactions logged yet.</p>
            <?php endif; ?>
        </div>
        
        <h2>Reaction Log File</h2>
        <p>Raw reaction logs are stored in: <code><?php echo esc_html(dirname(__FILE__) . '/reactions.log'); ?></code></p>
        
        <?php
        $log_file = dirname(__FILE__) . '/reactions.log';
        if (file_exists($log_file)) {
            $log_content = file_get_contents($log_file);
            if ($log_content) {
                echo '<pre style="background: #f1f1f1; padding: 10px; max-height: 300px; overflow-y: auto;">';
                echo esc_html($log_content);
                echo '</pre>';
            } else {
                echo '<p>Log file is empty.</p>';
            }
        } else {
            echo '<p>Log file does not exist yet.</p>';
        }
        ?>
    </div>
    <?php
}

// ============================================================================
// HELPER FUNCTIONS FOR REACTION PROCESSING
// ============================================================================
// These functions provide utility methods for working with reaction data
// throughout the plugin system.

/**
 * Get reaction statistics for a specific chatlog entry
 * 
 * @param int $chatlog_id The ID of the chatlog entry
 * @return array Array containing like and dislike counts
 */
function ai_trainer_get_reaction_stats($chatlog_id) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ai_chat_log';
    
    $result = $wpdb->get_var($wpdb->prepare(
        "SELECT reaction FROM $table_name WHERE id = %d",
        $chatlog_id
    ));
    
    if ($result) {
        return json_decode($result, true) ?: ['like' => 0, 'dislike' => 0];
    }
    
    return ['like' => 0, 'dislike' => 0];
}

/**
 * Calculate overall CSAT score from reactions
 * 
 * @param array $reactions Array of reaction data
 * @return float CSAT score as percentage (0-100)
 */
function ai_trainer_calculate_csat_score($reactions) {
    $total = ($reactions['like'] ?? 0) + ($reactions['dislike'] ?? 0);
    
    if ($total === 0) {
        return 0.0;
    }
    
    return round(($reactions['like'] / $total) * 100, 2);
}

/**
 * Log a reaction to the system
 * 
 * This is the main function for logging user reactions. It handles
 * the complete workflow of recording user feedback.
 * 
 * @param int $chatlog_id The chatlog entry ID
 * @param string $reaction_type 'like' or 'dislike'
 * @param string $feedback_category Optional category for detailed feedback
 * @param int $user_id WordPress user ID (0 for anonymous)
 * @return bool Success status
 */
function ai_trainer_log_reaction($chatlog_id, $reaction_type, $feedback_category = '', $user_id = null) {
    if ($user_id === null) {
        $user_id = get_current_user_id();
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'ai_chat_log';
    
    // Get existing reactions
    $existing = $wpdb->get_var($wpdb->prepare(
        "SELECT reaction FROM $table_name WHERE id = %d",
        $chatlog_id
    ));
    
    $reactions = json_decode($existing, true) ?: ['like' => 0, 'dislike' => 0];
    $reactions[$reaction_type]++;
    
    // Prepare reaction detail
    $reaction_detail = [
        'type' => $reaction_type,
        'category' => $feedback_category,
        'timestamp' => current_time('mysql'),
        'user_id' => $user_id
    ];
    
    // Update database
    $result = $wpdb->update(
        $table_name,
        [
            'reaction' => json_encode($reactions),
            'reaction_detail' => json_encode($reaction_detail)
        ],
        ['id' => $chatlog_id],
        ['%s', '%s'],
        ['%d']
    );
    
    if ($result !== false) {
        // Log to file for debugging
        $log_file = dirname(__FILE__) . '/reactions.log';
        $log_entry = date('Y-m-d H:i:s') . " - Reaction logged: " . json_encode([
            'chatlog_id' => $chatlog_id,
            'reaction_type' => $reaction_type,
            'feedback_category' => $feedback_category,
            'user_id' => $user_id
        ]) . "\n";
        file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
        
        return true;
    }
    
    return false;
}
