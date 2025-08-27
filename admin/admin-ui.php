<?php

/**
 * Admin UI - AI Trainer Plugin
 * 
 * This file provides the main administrative interface for the AI Trainer plugin.
 * It creates a tabbed interface that allows administrators to manage different
 * aspects of the knowledge base system.
 * 
 * INTERFACE STRUCTURE:
 * - Main wrapper with header and container
 * - Left sidebar with navigation tabs
 * - Right content area that loads tab content
 * - Tabbed navigation for different functionality areas
 * 
 * AVAILABLE TABS:
 * - Q&A: Manage question-answer pairs for training
 * - Files: Upload and process documents (PDFs, etc.)
 * - Text: Add custom text content to knowledge base
 * - Website: Configure domain priorities and sources
 * - Block Website: Manage blocked content sources
 * 
 * TECHNICAL DETAILS:
 * - Uses WordPress GET parameters for tab switching
 * - Includes tab content files dynamically
 * - Responsive design with CSS classes
 * - AJAX-enabled for dynamic content updates
 * 
 * @package AI_Trainer
 * @since 1.0
 */

if (!defined('ABSPATH')) exit;

// ============================================================================
// SECURITY AND CLEANUP
// ============================================================================
// Handle deletion requests from admin interface
// These are triggered by delete buttons in the various tab interfaces

// Delete file entries (triggered by delete_file GET parameter)
if (isset($_GET['delete_file'])) {
    $file_id = intval($_GET['delete_file']);
    if ($file_id > 0) {
        ai_trainer_delete($file_id);
        // Redirect to remove the delete parameter from URL
        wp_redirect(remove_query_arg('delete_file'));
        exit;
    }
}

// Delete text entries (triggered by delete_text GET parameter)
if (isset($_GET['delete_text'])) {
    $text_id = intval($_GET['delete_text']);
    if ($text_id > 0) {
        ai_trainer_delete($text_id);
        wp_redirect(remove_query_arg('delete_text'));
        exit;
    }
}

// Delete Q&A entries (triggered by delete_qna GET parameter)
if (isset($_GET['delete_qna'])) {
    $qna_id = intval($_GET['delete_qna']);
    if ($qna_id > 0) {
        ai_trainer_delete($qna_id);
        wp_redirect(remove_query_arg('delete_qna'));
        exit;
    }
}

?>

<!-- ============================================================================
     MAIN ADMIN INTERFACE STRUCTURE
     ============================================================================
     This creates the overall layout for the AI Trainer admin dashboard.
     The interface uses a tabbed design for easy navigation between different
     functionality areas.
-->

<div class="ai-trainer-wrapper">
    <!-- Main header for the admin interface -->
    <h1>AI Trainer Dashboard</h1>
    
    <div class="ai-trainer-container">
        <!-- ============================================================================
             LEFT SIDEBAR - TAB NAVIGATION
             ============================================================================
             The sidebar contains clickable tabs that switch between different
             content areas. Each tab corresponds to a different aspect of
             knowledge base management.
        -->
        <aside class="ai-sidebar">
            <ul>
                <!-- Q&A Tab - Default active tab for managing question-answer pairs -->
                <li data-tab="qna" class="<?php echo (!isset($_GET['tab']) || $_GET['tab'] === 'qna') ? 'active' : ''; ?>">
                    Q&A
                </li>
                
                <!-- Files Tab - For managing uploaded documents and files -->
                <li data-tab="files" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'files') ? 'active' : ''; ?>">
                    Files
                </li>
                
                <!-- Text Tab - For adding custom text content -->
                <li data-tab="text" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'text') ? 'active' : ''; ?>">
                    Text
                </li>
                
                <!-- Website Tab - For managing domain priorities and sources -->
                <li data-tab="website" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'website') ? 'active' : ''; ?>">
                    Website
                </li>
                
                <!-- Block Website Tab - For managing blocked content sources -->
                <li data-tab="block-website" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'block-website') ? 'active' : ''; ?>">
                    Block Website
                </li>
            </ul>
        </aside>
        
        <!-- ============================================================================
             RIGHT CONTENT AREA - TAB CONTENT
             ============================================================================
             This section dynamically loads the content for each tab based on
             the current selection. Each tab's content is stored in separate
             PHP files for maintainability.
        -->
        <section class="ai-content">
            <!-- Q&A Tab Content - Default active tab -->
            <div id="tab-qna" class="ai-tab <?php echo (!isset($_GET['tab']) || $_GET['tab'] === 'qna') ? 'active' : ''; ?>">
                <?php include __DIR__ . '/tabs/qna.php'; ?>
            </div>
            
            <!-- Files Tab Content -->
            <div id="tab-files" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'files') ? 'active' : ''; ?>">
                <?php include __DIR__ . '/tabs/files.php'; ?>
            </div>
            
            <!-- Text Tab Content -->
            <div id="tab-text" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'text') ? 'active' : ''; ?>">
                <?php include __DIR__ . '/tabs/text.php'; ?>
            </div>
            
            <!-- Website Tab Content -->
            <div id="tab-website" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'website') ? 'active' : ''; ?>">
                <?php include __DIR__ . '/tabs/website.php'; ?>
            </div>
            
            <!-- Block Website Tab Content -->
            <div id="tab-block-website" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'block-website') ? 'active' : ''; ?>">
                <?php include __DIR__ . '/tabs/block-website.php'; ?>
            </div>
        </section>
    </div>
</div>

<!-- ============================================================================
     JAVASCRIPT FUNCTIONALITY
     ============================================================================
     The JavaScript for tab switching and dynamic content loading is handled
     in the admin.js file. This includes:
     - Tab switching functionality
     - AJAX form submissions
     - Dynamic content updates
     - Form validation
-->

<script>
// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabLinks = document.querySelectorAll('.ai-sidebar li[data-tab]');
    const tabContents = document.querySelectorAll('.ai-tab');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update URL without page reload
            const url = new URL(window.location);
            url.searchParams.set('tab', targetTab);
            window.history.pushState({}, '', url);
            
            // Update active states
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById('tab-' + targetTab).classList.add('active');
        });
    });
});
</script>
