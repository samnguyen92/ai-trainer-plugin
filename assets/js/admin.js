/**
 * AI Trainer Admin JavaScript - WordPress Admin Interface
 * 
 * This file handles all JavaScript functionality for the WordPress admin interface
 * of the AI Trainer plugin, including tab management, AJAX operations, and
 * dynamic content updates for the knowledge base management system.
 * 
 * ARCHITECTURE OVERVIEW:
 * - Tab Management: URL-based tab switching with browser history support
 * - AJAX Operations: CRUD operations for websites, blocked domains, and Q&A
 * - Dynamic Updates: Real-time table refreshes and notification system
 * - Modal Management: Inline editing modals for various content types
 * - Form Handling: Form submission and validation for admin operations
 * 
 * KEY FEATURES:
 * - Seamless tab navigation with URL state management
 * - Real-time table updates without page refresh
 * - Inline editing modals for quick content management
 * - Notification system for user feedback
 * - Confirmation dialogs for destructive operations
 * - Responsive admin interface
 * 
 * TECHNICAL IMPLEMENTATION:
 * - jQuery-based DOM manipulation and AJAX
 * - WordPress AJAX integration with nonce verification
 * - Browser history API for tab state management
 * - Event delegation for dynamic content
 * - Modular function organization by functionality
 * 
 * @package AI_Trainer
 * @version 1.0
 * @since 2025
 */

// ============================================================================
// MAIN ADMIN INTERFACE INITIALIZATION
// ============================================================================
// Initialize the admin interface when jQuery is ready and DOM is loaded.
// This sets up all the core functionality for the admin dashboard.

jQuery(function ($) {
    
    // ============================================================================
    // TAB MANAGEMENT SYSTEM
    // ============================================================================
    // The tab system provides seamless navigation between different admin sections
    // with URL state management and browser history support.
    
    /**
     * Switch to a specific admin tab and update UI state
     * 
     * This function handles tab switching by:
     * - Updating active tab states
     * - Changing URL parameters
     * - Managing browser history
     * - Ensuring proper tab content display
     * 
     * @param {string} tabName - Name of the tab to activate
     * @returns {void}
     * 
     * @example
     * switchTab('qna');        // Switch to Q&A tab
     * switchTab('files');      // Switch to Files tab
     * switchTab('website');    // Switch to Website tab
     */
    function switchTab(tabName) {
        // Remove active class from all tabs and content areas
        $('.ai-sidebar li').removeClass('active');
        $('.ai-tab').removeClass('active');
        
        // Find and activate the correct tab and content
        $(`[data-tab="${tabName}"]`).addClass('active');
        $(`#tab-${tabName}`).addClass('active');
        
        // Update URL without page reload for bookmarking and sharing
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    }
    
    // ============================================================================
    // TAB EVENT HANDLERS
    // ============================================================================
    // Set up event listeners for tab interactions and browser navigation.
    
    // Handle tab clicks in the sidebar
    $('.ai-sidebar li').click(function () {
        let tab = $(this).data('tab');
        switchTab(tab);
    });
    
    // Handle browser back/forward buttons for tab state
    window.addEventListener('popstate', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'qna';  // Default to Q&A tab
        switchTab(tab);
    });
    
    // ============================================================================
    // INITIAL TAB STATE
    // ============================================================================
    // Set the initial active tab based on URL parameters or default to Q&A.
    
    const urlParams = new URLSearchParams(window.location.search);
    let initialTab = urlParams.get('tab') || 'qna';  // Default tab
    switchTab(initialTab);

    // ============================================================================
    // WEBSITE MANAGEMENT SYSTEM
    // ============================================================================
    // Functions for managing allowed websites and their priority tiers.
    // This system controls which domains are used for AI search results.
    
    /**
     * Reload the website sources table with fresh data from the server
     * 
     * This function fetches the latest website data and updates the table
     * display, including any new entries or modifications made by other users.
     * 
     * @returns {void}
     * 
     * @example
     * reloadWebsiteTable();  // Refresh table after adding/editing websites
     */
    function reloadWebsiteTable() {
        $.post(ai_trainer_ajax.ajaxurl, { 
            action: 'ai_get_website_table', 
            nonce: ai_trainer_ajax.nonce 
        }, function (response) {
            // Update table HTML if provided
            if (response.html) {
                $('#website-sources-table').html(response.html);
            }
            
            // Show notification if provided
            if (response.notice) {
                $('#website-notices').html(response.notice).show();
                // Auto-hide notification after 3 seconds
                setTimeout(function() { 
                    $('#website-notices').fadeOut(); 
                }, 3000);
            }
        }, 'json');
    }

    // ============================================================================
    // WEBSITE FORM HANDLERS
    // ============================================================================
    // Event handlers for website management forms and operations.
    
    /**
     * Handle website addition form submission
     * 
     * Collects form data, sends AJAX request to add new website,
     * and provides user feedback through notifications.
     */
    $(document).on('submit', '#add-website-form', function (e) {
        e.preventDefault();  // Prevent default form submission
        
        // Prepare data for AJAX request
        var data = {
            action: 'ai_add_domain_with_tier',
            title: $(this).find('[name="website_title"]').val(),
            url: $(this).find('[name="website_url"]').val(),
            tier: $(this).find('[name="website_tier"]').val(),
            nonce: ai_trainer_ajax.nonce
        };
        
        // Send AJAX request to add website
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.success) {
                $('#website-notices').html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>').show();
            } else {
                $('#website-notices').html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>').show();
            }
            
            // Auto-hide notification and refresh table
            setTimeout(function() { 
                $('#website-notices').fadeOut(); 
            }, 3000);
            reloadWebsiteTable();
            
            // Reset form for next entry
            $('#add-website-form')[0].reset();
        }, 'json');
    });

    // ============================================================================
    // WEBSITE EDITING MODAL SYSTEM
    // ============================================================================
    // Modal functionality for inline editing of website entries.
    
    /**
     * Open the edit website modal with pre-populated data
     * 
     * Extracts data from the clicked row and populates the edit modal
     * with current values for modification.
     */
    $(document).on('click', '.edit-website-inline', function () {
        // Populate modal fields with current data
        $('#edit-website-id').val($(this).data('id'));
        $('#edit-website-title').val($(this).data('title'));
        $('#edit-website-url').val($(this).data('url'));
        $('#edit-website-tier').val($(this).data('tier'));
        
        // Show the edit modal
        $('#website-edit-modal').show();
    });
    
    /**
     * Close the website edit modal
     * 
     * Hides the modal when the close button is clicked.
     */
    $(document).on('click', '.close-website-modal', function () {
        $('#website-edit-modal').hide();
    });
    
    /**
     * Handle website edit form submission
     * 
     * Processes the edited website data and sends update request
     * to the server, then refreshes the table display.
     */
    $(document).on('submit', '#edit-website-form', function (e) {
        e.preventDefault();
        
        // Prepare updated data
        var data = {
            action: 'ai_edit_website',
            id: $('#edit-website-id').val(),
            title: $('#edit-website-title').val(),
            url: $('#edit-website-url').val(),
            tier: $('#edit-website-tier').val(),
            nonce: ai_trainer_ajax.nonce
        };
        
        // Send update request
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.notice) {
                $('#website-notices').html(response.notice).show();
                setTimeout(function() { 
                    $('#website-notices').fadeOut(); 
                }, 3000);
            }
            
            // Refresh table and hide modal
            reloadWebsiteTable();
            $('#website-edit-modal').hide();
        }, 'json');
    });

    // ============================================================================
    // WEBSITE DELETION SYSTEM
    // ============================================================================
    // Handle website deletion with confirmation and feedback.
    
    /**
     * Handle website deletion with confirmation dialog
     * 
     * Shows confirmation dialog before deleting website entries
     * and provides feedback through the notification system.
     */
    $(document).on('click', '.delete-website', function (e) {
        e.preventDefault();
        
        // Require user confirmation before deletion
        if (!confirm('Are you sure you want to delete this website?')) {
            return;
        }
        
        var id = $(this).data('id');
        
        // Send deletion request
        $.post(ai_trainer_ajax.ajaxurl, { 
            action: 'ai_delete_website', 
            id: id, 
            nonce: ai_trainer_ajax.nonce 
        }, function (response) {
            if (response.notice) {
                $('#website-notices').html(response.notice).show();
                setTimeout(function() { 
                    $('#website-notices').fadeOut(); 
                }, 3000);
            }
            
            // Refresh table to reflect changes
            reloadWebsiteTable();
        }, 'json');
    });

    // ============================================================================
    // BLOCKED WEBSITE MANAGEMENT SYSTEM
    // ============================================================================
    // Functions for managing blocked websites that are excluded from AI search.
    
    /**
     * Reload the blocked websites table with fresh data
     * 
     * Fetches the latest blocked website data and updates the table
     * display to show current blocked domains.
     * 
     * @returns {void}
     */
    function reloadBlockWebsiteTable() {
        $.post(ai_trainer_ajax.ajaxurl, { 
            action: 'ai_get_block_website_table', 
            nonce: ai_trainer_ajax.nonce 
        }, function (response) {
            if (response.html) {
                $('#block-website-sources-table').html(response.html);
            }
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { 
                    $('#block-website-notices').fadeOut(); 
                }, 3000);
            }
        }, 'json');
    }

    // ============================================================================
    // BLOCKED WEBSITE FORM HANDLERS
    // ============================================================================
    // Event handlers for blocked website management operations.
    
    /**
     * Handle blocked website addition form submission
     * 
     * Processes new blocked website entries and adds them to the
     * blocked domains list for exclusion from AI search results.
     */
    $(document).on('submit', '#add-block-website-form', function (e) {
        e.preventDefault();
        
        var data = {
            action: 'ai_add_block_website',
            title: $(this).find('[name="block_website_title"]').val(),
            url: $(this).find('[name="block_website_url"]').val(),
            nonce: ai_trainer_ajax.nonce
        };
        
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { 
                    $('#block-website-notices').fadeOut(); 
                }, 3000);
            }
            
            reloadBlockWebsiteTable();
            $('#add-block-website-form')[0].reset();
        }, 'json');
    });

    // ============================================================================
    // BLOCKED WEBSITE EDITING MODAL SYSTEM
    // ============================================================================
    // Modal functionality for editing blocked website entries.
    
    /**
     * Open the edit blocked website modal with current data
     * 
     * Populates the edit modal with existing blocked website information
     * for modification.
     */
    $(document).on('click', '.edit-block-website-inline', function () {
        $('#edit-block-website-id').val($(this).data('id'));
        $('#edit-block-website-title').val($(this).data('title'));
        $('#edit-block-website-url').val($(this).data('url'));
        $('#block-website-edit-modal').show();
    });
    
    /**
     * Close the blocked website edit modal
     * 
     * Hides the edit modal when close button is clicked.
     */
    $(document).on('click', '.close-block-website-modal', function () {
        $('#block-website-edit-modal').hide();
    });
    
    /**
     * Handle blocked website edit form submission
     * 
     * Processes edited blocked website data and sends update request
     * to modify the blocked domain entry.
     */
    $(document).on('submit', '#edit-block-website-form', function (e) {
        e.preventDefault();
        
        var data = {
            action: 'ai_edit_block_website',
            id: $('#edit-block-website-id').val(),
            title: $('#edit-block-website-title').val(),
            url: $('#edit-block-website-url').val(),
            nonce: ai_trainer_ajax.nonce
        };
        
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { 
                    $('#block-website-notices').fadeOut(); 
                }, 3000);
            }
            
            reloadBlockWebsiteTable();
            $('#block-website-edit-modal').hide();
        }, 'json');
    });
    
    /**
     * Handle blocked website deletion with confirmation
     * 
     * Shows confirmation dialog before removing blocked website entries
     * and provides feedback through notifications.
     */
    $(document).on('click', '.delete-block-website', function (e) {
        e.preventDefault();
        
        if (!confirm('Are you sure you want to delete this blocked website?')) {
            return;
        }
        
        var id = $(this).data('id');
        
        $.post(ai_trainer_ajax.ajaxurl, { 
            action: 'ai_delete_block_website', 
            id: id, 
            nonce: ai_trainer_ajax.nonce 
        }, function (response) {
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { 
                    $('#block-website-notices').fadeOut(); 
                }, 3000);
            }
            
            reloadBlockWebsiteTable();
        }, 'json');
    });
});

// ============================================================================
// Q&A MANAGEMENT SYSTEM
// ============================================================================
// Handle Q&A deletion operations with confirmation dialogs.
// This section uses vanilla JavaScript for broader compatibility.

document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * Handle Q&A entry deletion with confirmation
     * 
     * Sets up event listeners for delete buttons on Q&A entries,
     * showing confirmation dialogs before deletion and handling
     * the removal process through AJAX.
     */
    
    // Find all delete buttons for Q&A entries
    document.querySelectorAll('.delete-qna').forEach(btn => {
        btn.addEventListener('click', () => {
            // Require user confirmation before deletion
            if (!confirm('Are you sure?')) {
                return;
            }
            
            // Get the Q&A entry ID from data attribute
            const id = btn.dataset.id;
            
            // Send deletion request using fetch API
            fetch(ajaxurl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                },
                body: `action=ai_delete_qna&id=${id}`
            }).then(() => {
                // Reload page to reflect changes
                location.reload();
            });
        });
    });
});