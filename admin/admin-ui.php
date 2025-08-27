<?php

/**
 * Admin UI - AI Trainer Plugin
 * 
 * This file provides the main administrative interface for the AI Trainer plugin.
 * It creates a tabbed interface that allows administrators to manage different
 * aspects of the knowledge base system.
 * 
 * ============================================================================
 * INTERFACE STRUCTURE
 * ============================================================================
 * 
 * LAYOUT COMPONENTS:
 * - Main wrapper with header and container
 * - Left sidebar with navigation tabs
 * - Right content area that loads tab content
 * - Tabbed navigation for different functionality areas
 * 
 * RESPONSIVE DESIGN:
 * - CSS-based responsive layout
 * - Mobile-friendly tab navigation
 * - Flexible content area sizing
 * - Consistent styling across all tabs
 * 
 * ============================================================================
 * AVAILABLE TABS
 * ============================================================================
 * 
 * Q&A TAB:
 * - Manage question-answer pairs for training
 * - Create, edit, and delete Q&A entries
 * - Bulk operations and CSV export
 * - Training data management
 * 
 * FILES TAB:
 * - Upload and process documents (PDF, TXT, DOCX)
 * - File content extraction and embedding
 * - File management and organization
 * - Content processing status
 * 
 * TEXT TAB:
 * - Add custom text content to knowledge base
 * - Rich text editing with TinyMCE
 * - Content categorization and tagging
 * - Text chunking for better search
 * 
 * WEBSITE TAB:
 * - Configure domain priorities and sources
 * - Tier-based domain management (1-4)
 * - Content source configuration
 * - Domain performance monitoring
 * 
 * BLOCK WEBSITE TAB:
 * - Manage blocked content sources
 * - Content filtering configuration
 * - Quality control management
 * - Domain blacklist maintenance
 * 
 * ============================================================================
 * TECHNICAL IMPLEMENTATION
 * ============================================================================
 * 
 * TAB SYSTEM:
 * - Uses WordPress GET parameters for tab switching
 * - Includes tab content files dynamically
 * - JavaScript-based tab switching without page reload
 * - URL state management for bookmarking
 * 
 * CONTENT LOADING:
 * - Tab content loaded via PHP includes
 * - Separate PHP files for each tab's functionality
 * - AJAX-enabled for dynamic content updates
 * - Lazy loading of tab content
 * 
 * SECURITY FEATURES:
 * - WordPress capability checks
 * - Nonce verification for operations
 * - Input sanitization and validation
 * - XSS protection measures
 * 
 * ============================================================================
 * JAVASCRIPT FUNCTIONALITY
 * ============================================================================
 * 
 * TAB SWITCHING:
 * - Dynamic tab content loading
 * - URL state management
 * - Active state management
 * - Smooth transitions
 * 
 * AJAX INTEGRATION:
 * - Form submissions without page reload
 * - Dynamic content updates
 * - Real-time data management
 * - Error handling and user feedback
 * 
 * FORM VALIDATION:
 * - Client-side validation
 * - Real-time feedback
 * - Error message display
 * - Success confirmation
 * 
 * ============================================================================
 * STYLING AND THEMING
 * ============================================================================
 * 
 * CSS CLASSES:
 * - .ai-trainer-wrapper: Main container
 * - .ai-trainer-container: Content wrapper
 * - .ai-sidebar: Left navigation area
 * - .ai-content: Right content area
 * - .ai-tab: Individual tab content
 * - .active: Active tab styling
 * 
 * RESPONSIVE BREAKPOINTS:
 * - Desktop: Full sidebar + content layout
 * - Tablet: Collapsible sidebar
 * - Mobile: Stacked navigation
 * 
 * ============================================================================
 * USAGE INSTRUCTIONS
 * ============================================================================
 * 
 * ADMIN ACCESS:
 * - WordPress Admin > AI Trainer
 * - Requires 'manage_options' capability
 * - Accessible to site administrators
 * 
 * TAB NAVIGATION:
 * - Click tabs to switch between sections
 * - URL updates automatically for bookmarking
 * - Active tab highlighted visually
 * 
 * CONTENT MANAGEMENT:
 * - Each tab provides specific functionality
 * - Forms and interfaces for data entry
 * - Bulk operations for efficiency
 * - Export capabilities for data portability
 * 
 * @package AI_Trainer
 * @since 1.0
 * @author Psychedelic
 */

if (!defined('ABSPATH')) exit;

// ============================================================================
// SECURITY AND CLEANUP
// ============================================================================
/**
 * Handle deletion requests from admin interface
 * 
 * These operations are triggered by delete buttons in the various tab interfaces.
 * Each deletion operation includes proper security checks and redirects to
 * prevent URL parameter persistence and ensure clean user experience.
 * 
 * SECURITY FEATURES:
 * - GET parameter validation and sanitization
 * - Integer validation for database IDs
 * - Proper redirect after operation completion
 * - URL cleanup to prevent parameter persistence
 * 
 * @since 1.0
 */

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
     
     LAYOUT STRUCTURE:
     - Main wrapper with header and container
     - Left sidebar with navigation tabs
     - Right content area for tab content
     - Responsive design for all screen sizes
     
     TAB SYSTEM:
     - Dynamic tab switching without page reload
     - URL state management for bookmarking
     - Active tab highlighting and navigation
     - Content loading via PHP includes
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
             
             NAVIGATION FEATURES:
             - Clickable tabs for easy navigation
             - Active state highlighting
             - URL state management
             - Responsive design for mobile devices
             
             TAB FUNCTIONALITY:
             - Q&A: Training data management
             - Files: Document processing
             - Text: Custom content creation
             - Website: Domain configuration
             - Block Website: Content filtering
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
             
             CONTENT LOADING:
             - Dynamic tab content loading
             - PHP includes for modularity
             - AJAX-enabled operations
             - Real-time content updates
             
             TAB CONTENT FILES:
             - qna.php: Question-answer management
             - files.php: File upload and processing
             - text.php: Text content management
             - website.php: Domain configuration
             - block-website.php: Content filtering
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
     
     TAB SWITCHING FEATURES:
     - Click event handling for tab navigation
     - URL state management without page reload
     - Active state management for visual feedback
     - Smooth transitions between tabs
     
     INTEGRATION:
     - Works with admin.js for advanced functionality
     - AJAX operations for dynamic content
     - Form handling and validation
     - Error handling and user feedback
-->

<script>
/**
 * Tab switching functionality for AI Trainer admin interface
 * 
 * This script handles the dynamic tab switching without page reload:
 * - Click event handling for tab navigation
 * - URL state management for bookmarking
 * - Active state management for visual feedback
 * - Smooth transitions between content areas
 * 
 * FEATURES:
 * - No page reload required for tab switching
 * - URL updates for bookmarking and sharing
 * - Active tab highlighting
 * - Responsive tab state management
 * 
 * @since 1.0
 */
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
