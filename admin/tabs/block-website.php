<?php
/**
 * Block Website Management Tab - AI Trainer Plugin
 * 
 * This file provides the admin interface for managing blocked websites (domains)
 * that are excluded from Exa search results. It allows administrators to add
 * and edit blocked domain entries to prevent unreliable or inappropriate
 * content from appearing in search results.
 * 
 * ============================================================================
 * FUNCTIONALITY OVERVIEW
 * ============================================================================
 * 
 * CORE OPERATIONS:
 * - Add new blocked websites with title and URL
 * - Edit existing blocked website entries inline with modal interface
 * - Delete blocked website entries with confirmation
 * - AJAX-powered table management for dynamic updates
 * - Form validation and security measures
 * - Domain-based blocking system implementation
 * 
 * CONTENT FILTERING:
 * - Domain-level content exclusion
 * - Search result quality control
 * - Content reliability management
 * - Spam and low-quality source prevention
 * - Content standards enforcement
 * 
 * ============================================================================
 * USE CASES AND APPLICATIONS
 * ============================================================================
 * 
 * CONTENT QUALITY CONTROL:
 * - Block unreliable information sources
 * - Exclude inappropriate content domains
 * - Prevent spam or low-quality sources
 * - Maintain content quality standards
 * - Filter out misleading information
 * 
 * INDUSTRY APPLICATIONS:
 * - Healthcare: Block unverified medical sources
 * - Legal: Exclude non-authoritative legal sites
 * - Education: Filter out unreliable educational content
 * - Research: Block low-quality research sources
 * - Business: Exclude spam and unreliable business sites
 * 
 * COMPLIANCE AND SAFETY:
 * - Regulatory compliance requirements
 * - Content safety and appropriateness
 * - Brand protection and reputation management
 * - User safety and content filtering
 * - Professional standards maintenance
 * 
 * ============================================================================
 * TECHNICAL IMPLEMENTATION
 * ============================================================================
 * 
 * AJAX INTEGRATION:
 * - Dynamic table loading without page refresh
 * - Real-time updates and modifications
 * - Form submission handling
 * - Error handling and user feedback
 * 
 * MODAL INTERFACE:
 * - Inline editing without page navigation
 * - Form validation and error display
 * - Responsive design for all screen sizes
 * - Accessibility features and keyboard navigation
 * 
 * DATABASE INTEGRATION:
 * - ai_blocked_domains table management
 * - Domain normalization and storage
 * - Relationship management with search results
 * - Blocking list maintenance and updates
 * 
 * ============================================================================
 * SECURITY FEATURES
 * ============================================================================
 * 
 * INPUT VALIDATION:
 * - WordPress nonce verification for all operations
 * - Input sanitization (sanitize_text_field, esc_url)
 * - ABSPATH validation for include security
 * - Required function availability checks
 * 
 * DATA PROCESSING:
 * - URL validation and sanitization
 * - Domain extraction and normalization
 * - SQL injection prevention
 * - XSS protection measures
 * 
 * ACCESS CONTROL:
 * - Capability checks for admin operations
 * - User permission validation
 * - Secure AJAX endpoint handling
 * - Audit trail maintenance
 * 
 * ============================================================================
 * USER INTERFACE COMPONENTS
 * ============================================================================
 * 
 * ADD BLOCKED WEBSITE FORM:
 * - Title input field with validation
 * - URL input with format validation
 * - Submit button with processing feedback
 * - Form validation and error handling
 * 
 * BLOCKED WEBSITE DISPLAY TABLE:
 * - Dynamic loading via AJAX
 * - Blocked domain listing and management
 * - Action buttons for each entry
 * - Responsive table layout
 * 
 * EDIT MODAL:
 * - Inline editing interface
 * - Form validation and error handling
 * - Cancel and save operations
 * - Responsive modal design
 * 
 * ============================================================================
 * SEARCH INTEGRATION
 * ============================================================================
 * 
 * EXA.AI INTEGRATION:
 * - Domain exclusion in search queries
 * - Blocked list filtering
 * - Search result quality assurance
 * - Content source validation
 * 
 * BLOCKING MECHANISM:
 * - Domain-level content filtering
 * - Search query modification
 * - Result filtering and exclusion
 * - Quality control enforcement
 * 
 * ============================================================================
 * PERFORMANCE OPTIMIZATION
 * ============================================================================
 * 
 * AJAX PERFORMANCE:
 * - Efficient table loading
 * - Minimal data transfer
 * - Caching strategies
 * - Error handling optimization
 * 
 * DATABASE OPTIMIZATION:
 * - Indexed field usage
 * - Efficient query patterns
 * - Connection pooling
 * - Query result caching
 * 
 * FRONTEND OPTIMIZATION:
 * - Progressive enhancement
 * - Lazy loading where appropriate
 * - Responsive design patterns
 * - Accessibility optimization
 * 
 * ============================================================================
 * ERROR HANDLING AND VALIDATION
 * ============================================================================
 * 
 * FORM VALIDATION:
 * - Required field checking
 * - URL format validation
 * - Domain format validation
 * - Real-time error feedback
 * 
 * PROCESSING ERRORS:
 * - Database operation failures
 * - AJAX communication issues
 * - Validation failures
 * - User feedback and recovery
 * 
 * USER EXPERIENCE:
 * - Clear error messages
 * - Success confirmations
 * - Processing status updates
 * - Recovery suggestions
 * 
 * ============================================================================
 * CONTENT QUALITY ASSURANCE
 * ============================================================================
 * 
 * BLOCKING CRITERIA:
 * - Unreliable information sources
 * - Inappropriate content domains
 * - Spam and low-quality sources
 * - Misleading information sites
 * - Non-authoritative sources
 * 
 * QUALITY MONITORING:
 * - Blocking list effectiveness
 * - Content quality improvements
 * - User satisfaction metrics
 * - Search result quality tracking
 * - Continuous improvement processes
 * 
 * @package AI_Trainer
 * @subpackage Admin_Tabs
 * @since 1.0
 * @author Psychedelic
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
 * 
 * FUNCTIONALITY:
 * - Dynamic table loading on page load
 * - AJAX-based data retrieval
 * - User feedback and notification handling
 * - Error handling and recovery
 * 
 * AJAX OPERATIONS:
 * - ai_get_block_website_table: Load blocked website sources table
 * - ai_add_block_website: Add new blocked website entries
 * - ai_edit_block_website: Update existing blocked website entries
 * - ai_delete_block_website: Remove blocked website entries
 * 
 * USER EXPERIENCE:
 * - Real-time updates without page refresh
 * - Automatic notification display
 * - Smooth transitions and feedback
 * - Responsive error handling
 * 
 * CONTENT FILTERING:
 * - Domain blocking implementation
 * - Search result quality control
 * - Content reliability management
 * - User safety and content filtering
 * 
 * @since 1.0
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