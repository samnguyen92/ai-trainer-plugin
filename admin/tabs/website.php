<?php
// Ensure ABSPATH is defined for includes
if (!defined('ABSPATH')) define('ABSPATH', dirname(__FILE__, 5) . '/');
if (!function_exists('sanitize_text_field')) require_once(ABSPATH . 'wp-includes/formatting.php');
if (!function_exists('esc_url')) require_once(ABSPATH . 'wp-includes/formatting.php');
if (!function_exists('wp_nonce_field')) require_once(ABSPATH . 'wp-includes/functions.php');

?>
<h2>Website</h2>
<p>Add allowed websites (domains) for Exa search. When you add a URL, its domain is added to the allowed list.</p>
<div id="website-notices"></div>
<form id="add-website-form" method="post" style="margin-bottom: 16px;">
    <input type="text" name="website_title" placeholder="Website Title" style="width: 30%; margin-right: 8px;" required>
    <input type="url" name="website_url" placeholder="https://example.com" style="width: 40%; margin-right: 8px;" required>
    <button type="submit" class="button button-primary">Add Website</button>
</form>
<div id="website-sources-table"></div>

<!-- Inline Edit Modal for Website -->
<div id="website-edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 5px; min-width: 400px; max-width: 80%; max-height: 80%; overflow-y: auto;">
        <h3>Edit Website</h3>
        <form id="edit-website-form" method="post">
            <input type="hidden" name="website_id" id="edit-website-id">
            <p>
                <label for="edit-website-title">Title:</label>
                <input type="text" id="edit-website-title" name="website_title" style="width: 100%; margin-bottom: 10px;" required>
            </p>
            <p>
                <label for="edit-website-url">URL:</label>
                <input type="url" id="edit-website-url" name="website_url" style="width: 100%; margin-bottom: 10px;" required>
            </p>
            <button type="submit" class="button button-primary">Save Changes</button>
            <button type="button" class="button close-website-modal" style="margin-left: 8px;">Cancel</button>
        </form>
    </div>
</div>
<script>
jQuery(function($){
    // On page load, load the website table via AJAX
    if ($('#website-sources-table').length) {
        $.post(ai_trainer_ajax.ajaxurl, { action: 'ai_get_website_table', nonce: ai_trainer_ajax.nonce }, function (response) {
            if (response.html) $('#website-sources-table').html(response.html);
            if (response.notice) {
                $('#website-notices').html(response.notice).show();
                setTimeout(function() { $('#website-notices').fadeOut(); }, 3000);
            }
        }, 'json');
    }
});
</script> 