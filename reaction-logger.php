<?php
/**
 * Reaction Logger - Handles like/dislike reactions via AJAX
 * Place this file in your WordPress plugin directory or theme
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

// Handle AJAX requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'log_reaction') {
    
    // Get the reaction data
    $reaction_data = json_decode(file_get_contents('php://input'), true);
    
    if ($reaction_data && isset($reaction_data['data'])) {
        $data = $reaction_data['data'];
        
        // Log the reaction to a file
        $log_entry = sprintf(
            "[%s] QuestionID: %s | Action: %s | Count: %d | UserAgent: %s | URL: %s\n",
            $data['timestamp'],
            $data['questionID'],
            $data['action'],
            $data['count'],
            $data['userAgent'],
            $data['url']
        );
        
        // Write to log file
        $log_file = dirname(__FILE__) . '/reactions.log';
        file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
        
        // Also log to WordPress error log if available
        if (function_exists('error_log')) {
            error_log('Reaction logged: ' . json_encode($data));
        }
        
        // Return success response
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Reaction logged successfully',
            'timestamp' => date('Y-m-d H:i:s'),
            'logged_data' => $data
        ]);
        
    } else {
        // Return error response
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid reaction data',
            'received' => $_POST
        ]);
    }
    
    exit;
}

// If accessed directly, show usage info
if (!defined('ABSPATH')) {
    echo '<h1>Reaction Logger</h1>';
    echo '<p>This file handles AJAX requests for logging user reactions.</p>';
    echo '<p>It should be called via POST request with action=log_reaction</p>';
    echo '<p>Place this file in your WordPress installation and update the fetch URL in your JavaScript.</p>';
}
?>
