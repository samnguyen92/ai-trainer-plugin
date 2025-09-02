<?php
/**
 * HTML Tidy Integration Test
 * 
 * This file tests the HTML Tidy integration to ensure it's working correctly.
 * Run this file directly to test the HTML cleaning functionality.
 */

// Load WordPress if not already loaded
if (!defined('ABSPATH')) {
    require_once('../../../wp-load.php');
}

// Include the main plugin file to load the HTML Tidy functions
require_once('ai-trainer.php');

echo "<h1>HTML Tidy Integration Test</h1>\n";

// Test cases with malformed HTML
$test_cases = [
    [
        'name' => 'Unclosed tags',
        'input' => '<p>This is a paragraph<p>Another paragraph</p>',
        'expected' => 'Should close unclosed p tag'
    ],
    [
        'name' => 'Malformed heading',
        'input' => '<h< div="">Malformed heading</h3>',
        'expected' => 'Should fix malformed heading tag'
    ],
    [
        'name' => 'Double anchor tags',
        'input' => '<a <a href="http://example.com">Link</a>',
        'expected' => 'Should fix double anchor tags'
    ],
    [
        'name' => 'Script injection',
        'input' => '<p>Content</p><script>alert("xss")</script><p>More content</p>',
        'expected' => 'Should remove script tags'
    ],
    [
        'name' => 'Orphaned closing tags',
        'input' => '<p>Content</p></div><p>More content</p>',
        'expected' => 'Should remove orphaned div closing tag'
    ]
];

echo "<h2>Testing HTML Tidy Integration</h2>\n";

foreach ($test_cases as $test) {
    echo "<h3>Test: {$test['name']}</h3>\n";
    echo "<p><strong>Expected:</strong> {$test['expected']}</p>\n";
    
    echo "<h4>Input HTML:</h4>\n";
    echo "<pre>" . htmlspecialchars($test['input']) . "</pre>\n";
    
    // Test the HTML Tidy cleaning
    $cleaned = ai_trainer_html_tidy_clean($test['input']);
    
    echo "<h4>Cleaned HTML:</h4>\n";
    echo "<pre>" . htmlspecialchars($cleaned) . "</pre>\n";
    
    // Count issues
    $original_issues = ai_trainer_count_unclosed_tags($test['input']) + 
                      ai_trainer_count_malformed_tags($test['input']) + 
                      ai_trainer_count_unsafe_elements($test['input']);
    
    $cleaned_issues = ai_trainer_count_unclosed_tags($cleaned) + 
                     ai_trainer_count_malformed_tags($cleaned) + 
                     ai_trainer_count_unsafe_elements($cleaned);
    
    echo "<h4>Results:</h4>\n";
    echo "<ul>\n";
    echo "<li>Original issues: $original_issues</li>\n";
    echo "<li>Cleaned issues: $cleaned_issues</li>\n";
    echo "<li>Improvement: " . ($original_issues - $cleaned_issues) . " issues fixed</li>\n";
    echo "</ul>\n";
    
    echo "<hr>\n";
}

// Test the AJAX endpoint
echo "<h2>Testing AJAX Endpoint</h2>\n";

$test_html = '<p>Test content<p>Unclosed tag<script>alert("xss")</script>';
$post_data = [
    'action' => 'ai_clean_html',
    'html' => $test_html,
    'nonce' => wp_create_nonce('ai_trainer_nonce')
];

echo "<h3>AJAX Test</h3>\n";
echo "<p>Testing AJAX endpoint with malformed HTML...</p>\n";

// Simulate AJAX request
$_POST = $post_data;
ob_start();
ai_trainer_handle_html_clean();
$response = ob_get_clean();

echo "<h4>AJAX Response:</h4>\n";
echo "<pre>" . htmlspecialchars($response) . "</pre>\n";

echo "<h2>System Information</h2>\n";
echo "<ul>\n";
echo "<li>HTML Tidy Extension Available: " . (extension_loaded('tidy') ? 'Yes' : 'No') . "</li>\n";
echo "<li>WordPress Version: " . get_bloginfo('version') . "</li>\n";
echo "<li>PHP Version: " . phpversion() . "</li>\n";
echo "</ul>\n";

echo "<h2>Test Complete</h2>\n";
echo "<p>If you see cleaned HTML above with fewer issues than the original, the HTML Tidy integration is working correctly!</p>\n";
?>
