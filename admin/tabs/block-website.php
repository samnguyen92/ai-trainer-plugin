<?php
/**
 * Block Website Management Tab - AI Trainer Plugin
 * 
 * This file provides the admin interface for managing blocked websites (domains)
 * that are excluded from Exa search results. It allows administrators to add
 * and edit blocked domain entries to prevent unreliable or inappropriate
 * content from appearing in search results.
 * 
 * FUNCTIONALITY OVERVIEW:
 * - Add new blocked websites with title and URL
 * - Edit existing blocked website entries inline
 * - AJAX-powered table management
 * - Form validation and security
 * - Domain-based blocking system
 * 
 * USE CASES:
 * - Block unreliable information sources
 * - Exclude inappropriate content domains
 * - Prevent spam or low-quality sources
 * - Maintain content quality standards
 * 
 * SECURITY FEATURES:
 * - WordPress nonce verification
 * - Input sanitization
 * - ABSPATH validation
 * - Required function checks
 * 
 * @package AI_Trainer
 * @subpackage Admin_Tabs
 * @since 1.0
 */

// Ensure ABSPATH is defined for includes
if (!defined('ABSPATH')) define('ABSPATH', dirname(__FILE__, 5) . '/');
if (!function_exists('sanitize_text_field')) require_once(ABSPATH . 'wp-includes/formatting.php');
if (!function_exists('esc_url')) require_once(ABSPATH . 'wp-includes/formatting.php');
if (!function_exists('wp_nonce_field')) require_once(ABSPATH . 'wp-includes/functions.php');

?>
<h2>Block Website Management</h2>
<p>Add websites (domains) to exclude from Exa search. When you add a URL, its domain is added to the blocked list.
   Blocked domains will not appear in search results, helping maintain content quality and reliability.</p>

<!-- Notification area for user feedback -->
<div id="block-website-notices"></div>

<!-- Add Blocked Website Form -->
<form id="add-block-website-form" method="post" style="margin-bottom: 16px;">
    <input type="text" name="block_website_title" placeholder="Website Title" style="width: 30%; margin-right: 8px;" required>
    <input type="url" name="block_website_url" placeholder="https://example.com" style="width: 40%; margin-right: 8px;" required>
    <button type="submit" class="button button-primary">Add Blocked Website</button>
</form>

<!-- Dynamic table container for blocked website sources -->
<div id="block-website-sources-table"></div>

<!-- Inline Edit Modal for Blocked Website -->
<div id="block-website-edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 5px; min-width: 400px; max-width: 80%; max-height: 80%; overflow-y: auto;">
        <h3>Edit Blocked Website</h3>
        <form id="edit-block-website-form" method="post">
            <input type="hidden" name="block_website_id" id="edit-block-website-id">
            <p>
                <label for="edit-block-website-title">Title:</label>
                <input type="text" id="edit-block-website-title" name="block_website_title" style="width: 100%; margin-bottom: 10px;" required>
            </p>
            <p>
                <label for="edit-block-website-url">URL:</label>
                <input type="url" id="edit-block-website-url" name="block_website_url" style="width: 100%; margin-bottom: 10px;" required>
            </p>
            <button type="submit" class="button button-primary">Save Changes</button>
            <button type="button" class="button close-block-website-modal" style="margin-left: 8px;">Cancel</button>
        </form>
    </div>
</div>

<script>
/**
 * Block Website Management JavaScript
 * 
 * This script handles the dynamic loading and management of the blocked website sources table
 * through AJAX calls to the WordPress backend.
 */
jQuery(function($){
    // On page load, load the blocked website table via AJAX
    if ($('#block-website-sources-table').length) {
        $.post(ai_trainer_ajax.ajaxurl, { 
            action: 'ai_get_block_website_table', 
            nonce: ai_trainer_ajax.nonce 
        }, function (response) {
            if (response.html) $('#block-website-sources-table').html(response.html);
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { $('#block-website-notices').fadeOut(); }, 3000);
            }
        }, 'json');
    }
});
</script> 