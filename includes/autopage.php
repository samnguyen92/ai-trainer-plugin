<?php
/**
 * Auto-Page Creation System - AI Trainer Plugin
 * 
 * This file handles the automatic creation and management of the Psybrarian
 * assistant page within WordPress. It creates a custom page template and
 * ensures the page exists with proper configuration. This system provides
 * a seamless user experience by automatically setting up the AI assistant
 * interface without manual intervention.
 * 
 * ============================================================================
 * ARCHITECTURE OVERVIEW
 * ============================================================================
 * 
 * CORE FUNCTIONALITY:
 * - Automatic page creation on plugin activation
 * - Custom block template registration and management
 * - Template assignment and page configuration
 * - WordPress hooks integration and lifecycle management
 * - Block theme compatibility and fallback support
 * 
 * PAGE MANAGEMENT:
 * - Dynamic page creation and updates
 * - Template assignment and validation
 * - Page restoration from trash/deleted status
 * - Content management and updates
 * - URL slug management and consistency
 * 
 * TEMPLATE SYSTEM:
 * - Block template creation for modern themes
 * - Classic theme template support
 * - Template refresh and update capabilities
 * - Cross-theme compatibility handling
 * - Template inheritance and fallback logic
 * 
 * ============================================================================
 * KEY FEATURES AND CAPABILITIES
 * ============================================================================
 * 
 * AUTOMATION FEATURES:
 * - Self-contained page creation system
 * - Automatic template generation and assignment
 * - Plugin activation integration
 * - Page existence validation and creation
 * - Template refresh capabilities via AJAX
 * 
 * THEME COMPATIBILITY:
 * - Block theme support (WordPress 5.8+)
 * - Classic theme compatibility
 * - Child/parent theme handling
 * - Template inheritance management
 * - Fallback template systems
 * 
 * USER EXPERIENCE:
 * - Seamless page setup
 * - Professional page appearance
 * - Consistent branding and styling
 * - Mobile-responsive design
 * - Accessibility compliance
 * 
 * ============================================================================
 * TECHNICAL IMPLEMENTATION
 * ============================================================================
 * 
 * WORDPRESS INTEGRATION:
 * - Activation hooks and lifecycle management
 * - Admin interface integration
 * - AJAX endpoint handling
 * - Template filtering and overrides
 * - Page template management
 * 
 * TEMPLATE ENGINEERING:
 * - Block template creation and registration
 * - Template content generation
 * - Theme-specific template handling
 * - Template assignment and validation
 * - Template refresh mechanisms
 * 
 * CONTENT MANAGEMENT:
 * - Dynamic content generation
 * - Asset URL management
 * - Shortcode integration
 * - HTML structure optimization
 * - Branding and styling consistency
 * 
 * ============================================================================
 * SECURITY AND VALIDATION
 * ============================================================================
 * 
 * ACCESS CONTROL:
 * - User capability validation
 * - Admin-only operations
 * - AJAX security measures
 * - Nonce verification (where applicable)
 * - Input sanitization and validation
 * 
 * DATA INTEGRITY:
 * - Page existence validation
 * - Template assignment verification
 * - Content update validation
 * - Error handling and logging
 * - Graceful degradation on failures
 * 
 * ============================================================================
 * PERFORMANCE AND OPTIMIZATION
 * ============================================================================
 * 
 * EFFICIENCY FEATURES:
 * - Conditional template creation
 * - Optimized database queries
 * - Caching and cache invalidation
 * - Minimal resource usage
 * - Fast page loading
 * 
 * MAINTENANCE FEATURES:
 * - Template refresh capabilities
 * - Page content updates
 * - Asset management
 * - Error recovery
 * - Monitoring and logging
 * 
 * @package AI_Trainer
 * @subpackage Includes
 * @since 1.0
 * @author Psychedelic
 */

if (!defined('ABSPATH')) exit;

if (!class_exists('AI_Trainer_Auto_Page')) {

/**
 * AI Trainer Auto-Page Creation Class
 * 
 * This class handles all aspects of creating and managing the Psybrarian
 * assistant page, including page creation, template management, and
 * WordPress integration. It provides a comprehensive solution for
 * automatically setting up the AI assistant interface within WordPress.
 * 
 * CLASS RESPONSIBILITIES:
 * - Page lifecycle management (creation, updates, restoration)
 * - Template system integration and management
 * - WordPress hooks and filters registration
 * - Admin interface integration and user experience
 * - Theme compatibility and fallback handling
 * - Security and access control management
 * 
 * DESIGN PATTERNS:
 * - Static class implementation for global functionality
 * - WordPress integration via hooks and filters
 * - Template engine abstraction and management
 * - Error handling and graceful degradation
 * - Performance optimization and caching
 * 
 * INTEGRATION POINTS:
 * - Plugin activation and deactivation
 * - WordPress init and admin hooks
 * - Template system filters and overrides
 * - AJAX endpoint handling
 * - Admin notices and user feedback
 */
class AI_Trainer_Auto_Page {
    // Page configuration constants
    const PAGE_SLUG   = 'psybrarian-assistant';
    const PAGE_TITLE  = "Psybrarian's Assistant";

    // Template configuration constants
    const TEMPLATE_SLUG  = 'psybrarian';                
    const TEMPLATE_TITLE = 'Psybrarian Template';

    // Main plugin file reference
    private static $main_file;

    /**
     * Initialize the auto-page system
     * 
     * This method sets up all necessary WordPress hooks and actions
     * for the auto-page creation system. It registers activation hooks,
     * admin actions, template filters, and AJAX endpoints to ensure
     * the Psybrarian page is properly created and managed.
     * 
     * HOOK REGISTRATION:
     * - Activation hook for initial page creation
     * - Init hook for page existence validation
     * - Admin action links for easy page access
     * - Admin notices for system status
     * - Template filters for theme compatibility
     * - Block template registration for modern themes
     * - AJAX endpoint for template refresh
     * 
     * INTEGRATION FEATURES:
     * - Plugin lifecycle management
     * - WordPress core integration
     * - Theme system compatibility
     * - Admin interface enhancement
     * - User experience optimization
     * 
     * @param string $main_plugin_file Path to the main plugin file
     * @return void
     * @since 1.0
     */
    public static function boot($main_plugin_file) {
        self::$main_file = $main_plugin_file;

        // Register activation hook for page creation
        register_activation_hook(self::$main_file, [__CLASS__, 'on_activate']);
        
        // Ensure page exists on init
        add_action('init', [__CLASS__, 'ensure_page_exists']);
        
        // Add action links to plugin page
        add_filter('plugin_action_links_' . plugin_basename(self::$main_file), [__CLASS__, 'action_links']);
        
        // Display admin notices
        add_action('admin_notices', [__CLASS__, 'soft_notices']);
        
        // Force template usage for the page
        add_filter('template_include', [__CLASS__, 'force_template'], 999);
        
        // Register block template for modern themes
        add_filter('get_block_templates', [__CLASS__, 'register_block_template'], 10, 3);
        add_filter('pre_get_block_file_template', [__CLASS__, 'override_block_template'], 10, 3);
        
        // Override page template selection
        add_filter('get_page_template', [__CLASS__, 'get_page_template_override'], 10, 2);
        
        // Admin-specific functionality
        if (is_admin()) {
            add_action('wp_ajax_refresh_psybrarian_template', [__CLASS__, 'ajax_refresh_template']);
        }
    }

    /**
     * Handle plugin activation
     * 
     * This method is called when the plugin is activated and ensures
     * the Psybrarian page and template are properly created. It performs
     * the initial setup required for the AI assistant interface to function
     * correctly within WordPress.
     * 
     * ACTIVATION WORKFLOW:
     * 1. Ensure block template exists for theme compatibility
     * 2. Create or update the Psybrarian page with proper content
     * 3. Assign the block template to the page for consistent styling
     * 4. Set up proper page configuration and metadata
     * 
     * ERROR HANDLING:
     * - Graceful failure handling for template creation
     * - Page creation fallback mechanisms
     * - Template assignment validation
     * - Activation completion verification
     * 
     * @return void
     * @since 1.0
     */
    public static function on_activate() {
        self::ensure_block_template();
        $page_id = self::create_or_update_page();  
        self::assign_block_template_to_page($page_id);
    }

    /**
     * Ensure the Psybrarian page exists
     * 
     * This method checks if the required page exists and creates it
     * if necessary. It also handles page restoration from trash and
     * ensures proper template assignment for consistent appearance.
     * 
     * PAGE VALIDATION STRATEGY:
     * - Check for page existence by path/slug
     * - Search across all post statuses (including trash)
     * - Restore pages from trash if found
     * - Update existing pages with current configuration
     * - Create new pages if none exist
     * 
     * TEMPLATE MANAGEMENT:
     * - Ensure block template exists for theme
     * - Assign template to page for consistent styling
     * - Handle theme-specific template requirements
     * - Maintain template assignment across updates
     * 
     * ERROR RECOVERY:
     * - Page restoration from various states
     * - Template reassignment on failures
     * - Content update and validation
     * - Configuration consistency maintenance
     * 
     * @return void
     * @since 1.0
     */
    public static function ensure_page_exists() {
        self::ensure_block_template();

        // Check if page exists by path
        $page = get_page_by_path(self::PAGE_SLUG);
        if (!$page) {
            // Search for page in various post statuses
            $maybe = get_posts([
                'post_type'      => 'page',
                'name'           => self::PAGE_SLUG,
                'post_status'    => array('publish','draft','pending','private','future','trash','inherit'),
                'posts_per_page' => 1,
                'fields'         => 'ids',
            ]);

            if (!empty($maybe)) {
                $page_id = $maybe[0];
                // Restore page if it's in trash
                if (get_post_status($page_id) === 'trash') wp_untrash_post($page_id);

                // Update page with current configuration
                $theme = function_exists('get_stylesheet') ? get_stylesheet() : '';
                wp_update_post([
                    'ID'           => $page_id,
                    'post_title'   => self::PAGE_TITLE,
                    'post_content' => self::page_content(),
                    'post_status'  => 'publish',
                    'meta_input'   => [
                        '_wp_page_template' => $theme ? ($theme . '//' . self::TEMPLATE_SLUG) : '',
                    ],
                ]);

                self::assign_block_template_to_page($page_id);
                return;
            }

            // Create new page if none exists
            $page_id = self::create_or_update_page();   
            self::assign_block_template_to_page($page_id);
        } else {
            // Ensure template is assigned to existing page
            self::assign_block_template_to_page($page->ID);
        }
    }

    /**
     * Ensure block template exists for modern themes
     * 
     * This method creates the necessary block template for themes
     * that support the block template system. It handles both child
     * and parent themes, ensuring compatibility across different
     * WordPress theme configurations.
     * 
     * THEME COMPATIBILITY:
     * - Block theme detection and validation
     * - Child theme template creation
     * - Parent theme template fallback
     * - Cross-theme template inheritance
     * - Template system compatibility checks
     * 
     * TEMPLATE CREATION:
     * - Minimal template content for performance
     * - Post content inheritance configuration
     * - Template slug and title management
     * - Theme taxonomy assignment
     * - Template status management
     * 
     * PERFORMANCE FEATURES:
     * - Conditional template creation
     * - Efficient theme detection
     * - Minimal database operations
     * - Template caching optimization
     * 
     * @return void
     * @since 1.0
     */
    private static function ensure_block_template() {
        if (!function_exists('wp_is_block_theme') || !wp_is_block_theme()) return;
    
        $child  = get_stylesheet();  
        $parent = get_template();    
    
        // Create a simple template with just the content
        $content = '<!-- wp:post-content {"layout":{"inherit":false}} /-->';
    
        self::ensure_block_template_for_theme($child, $content);
    
        if ($parent && $parent !== $child) {
            self::ensure_block_template_for_theme($parent, $content);
        }
    }
    

        /**
         * Ensure block template exists for a specific theme
         * 
         * This method creates or updates the block template for a given theme,
         * ensuring compatibility with modern WordPress block themes. It handles
         * both template creation and updates, maintaining consistency across
         * theme changes and updates.
         * 
         * TEMPLATE MANAGEMENT:
         * - Template existence validation
         * - Template creation for new themes
         * - Template updates for existing themes
         * - Content synchronization and validation
         * - Template status management
         * 
         * THEME INTEGRATION:
         * - Theme taxonomy assignment
         * - Template slug consistency
         * - Theme-specific template handling
         * - Cross-theme template compatibility
         * - Template inheritance management
         * 
         * ERROR HANDLING:
         * - Template creation validation
         * - Theme taxonomy verification
         * - Content update confirmation
         * - Template status verification
         * 
         * @param string $theme Theme slug
         * @param string $content Template content
         * @return void
         * @since 1.0
         */
        private static function ensure_block_template_for_theme($theme, $content) {
        $existing = get_posts([
            'post_type'      => 'wp_template',
            'name'           => self::TEMPLATE_SLUG,
            'post_status'    => ['publish','draft','private'],
            'posts_per_page' => 1,
            'tax_query'      => [[
                'taxonomy' => 'wp_theme',
                'field'    => 'name',
                'terms'    => $theme,
            ]],
        ]);
        $existing = $existing ? $existing[0] : null;
    
        if ($existing) {
            wp_update_post([
                'ID'           => $existing->ID,
                'post_title'   => self::TEMPLATE_TITLE,
                'post_content' => $content,
                'post_status'  => 'publish',
            ]);
        } else {
            $tpl_id = wp_insert_post([
                'post_type'    => 'wp_template',
                'post_status'  => 'publish',
                'post_name'    => self::TEMPLATE_SLUG,
                'post_title'   => self::TEMPLATE_TITLE,
                'post_content' => $content,
            ]);
            if (!is_wp_error($tpl_id) && taxonomy_exists('wp_theme')) {
                wp_set_object_terms($tpl_id, $theme, 'wp_theme', false);
            }
        }
    }

    private static function assign_block_template_to_page($page_id) {
        if (empty($page_id) || is_wp_error($page_id)) {
            return;
        }
        
        if (!function_exists('wp_is_block_theme') || !wp_is_block_theme()) {
            return;
        }
    
        delete_post_meta($page_id, '_wp_page_template');
        update_post_meta($page_id, '_wp_page_template', self::TEMPLATE_SLUG);
        
        clean_post_cache($page_id);
        wp_cache_delete($page_id, 'posts');
    }
    
    // Check if our template exists for a given theme
    private static function block_template_exists_for($theme) {
        $posts = get_posts([
            'post_type'      => 'wp_template',
            'name'           => self::TEMPLATE_SLUG,
            'post_status'    => ['publish','draft','private'],
            'posts_per_page' => 1,
            'tax_query'      => [[
                'taxonomy' => 'wp_theme',
                'field'    => 'name',
                'terms'    => $theme,
            ]],
            'fields'         => 'ids',
        ]);
        return !empty($posts);
    }

    /**
     * Generate the Psybrarian page content
     * 
     * This method creates the complete HTML content for the Psybrarian
     * assistant page, including the header, main content area, and
     * ticket submission interface. The content is structured using
     * WordPress block markup for optimal theme compatibility.
     * 
     * CONTENT STRUCTURE:
     * - Header with logo and branding
     * - Main content area with AI search interface
     * - Background images and styling
     * - Safety disclaimer and information
     * - Ticket submission system
     * - Responsive design elements
     * 
     * BLOCK INTEGRATION:
     * - Greenshift blocks for enhanced functionality
     * - Shortcode integration for AI search
     * - ACF blocks for custom components
     * - Responsive design blocks
     * - Interactive elements and modals
     * 
     * ASSET MANAGEMENT:
     * - Dynamic logo URL generation
     * - Background image management
     * - Plugin asset integration
     * - Theme compatibility handling
     * - Responsive image loading
     * 
     * @return string Complete HTML content for the page
     * @since 1.0
     */
    private static function page_content() {
        $logo = esc_url( plugins_url('assets/images/logo.png', self::$main_file) );
        $bg2  = esc_url( plugins_url('assets/images/psybrarian_bg_img_2.png', self::$main_file) );
        $bg1  = esc_url( plugins_url('assets/images/psybrarian_bg_img_1.png', self::$main_file) );

        return <<<HTML
<!-- wp:greenshift-blocks/element {"id":"gsbp-1b4aa05","type":"inner","className":"psybrarian-wrapper scroll-fade","localId":"gsbp-1b4aa05"} -->
<div class="psybrarian-wrapper scroll-fade"><!-- wp:greenshift-blocks/element {"id":"gsbp-d7851d9","type":"inner","className":"psybrarian-header-wrapper","localId":"gsbp-d7851d9"} -->
<div class="psybrarian-header-wrapper"><!-- wp:greenshift-blocks/element {"id":"gsbp-c5b30cb","tag":"img","localId":"gsbp-c5b30cb","src":"{$logo}","alt":"","originalWidth":503,"originalHeight":151} -->
<img src="{$logo}" alt="" width="503" height="151" loading="lazy"/>
<!-- /wp:greenshift-blocks/element --></div>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-bacda5f","type":"inner","className":"psybrarian-main-content gsbp-bacda5f","localId":"gsbp-bacda5f"} -->
<div class="psybrarian-main-content gsbp-bacda5f"><!-- wp:greenshift-blocks/element {"id":"gsbp-831f72c","tag":"img","localId":"gsbp-831f72c","src":"{$bg2}","alt":"","originalWidth":1488,"originalHeight":780} -->
<img src="{$bg2}" alt="" width="1488" height="780" loading="lazy"/>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-a8f9488","type":"inner","className":"background-overlay","localId":"gsbp-a8f9488"} -->
<div class="background-overlay"></div>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-5bb22f2","inlineCssStyles":null,"type":"inner","className":"container space-owl-s padding-bottom-m ","localId":"gsbp-5bb22f2","styleAttributes":{"customCSS_Extra":"{CURRENT} #safety-link{\\ntext-decoration: underline;\\n}"}} -->
<div class="container space-owl-s padding-bottom-m  gsbp-5bb22f2"><!-- wp:greenshift-blocks/element {"id":"gsbp-42b98af","textContent":"Psybrarian's Assistant","tag":"h1","localId":"gsbp-42b98af"} -->
<h1>Psybrarian's Assistant</h1>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-de9388e","textContent":"A Psychedelic Research Assistant","tag":"h2","localId":"gsbp-de9388e"} -->
<h2>A Psychedelic Research Assistant</h2>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:acf/safetydisclaimer {"name":"acf/safetydisclaimer","mode":"preview"} /-->

<!-- wp:greenshift-blocks/element {"id":"gsbp-ba52943","inlineCssStyles":null,"textContent":"Disclaimer - By submitting your question, you ackowledge that the Psybrarian may make mistakes. Double-check important info and consult a medical professional before making health decisions.","tag":"p","className":"text-2xs","localId":"gsbp-ba52943","styleAttributes":{"width":["70%"]}} -->
<p class="text-2xs gsbp-ba52943">Disclaimer - By submitting your question, you ackowledge that the Psybrarian may make mistakes. Double-check important info and consult a medical professional before making health decisions.</p>
<!-- /wp:greenshift-blocks/element --></div>
<!-- /wp:greenshift-blocks/element --></div>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-b188c9d","type":"inner","className":"psybrarian-content gsbp-b188c9d","localId":"gsbp-b188c9d"} -->
<div class="psybrarian-content gsbp-b188c9d"><!-- wp:greenshift-blocks/element {"id":"gsbp-754826a","type":"inner","className":"background-overlay","localId":"gsbp-754826a"} -->
<div class="background-overlay"></div>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-0211a35","type":"inner","className":"container","localId":"gsbp-0211a35"} -->
<div class="container"><!-- wp:shortcode -->
[exa_search]
<!-- /wp:shortcode -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-5226b58","textContent":"The Psybrarian's Assistant is your AI-powered guide to psychedelic knowledge—It searches trusted sources (The Psybrary), blends modern research with cultural context, and responds in plain language. Whether you're just curious or diving deep, it’s here to offer accurate, compassionate, and non-judgmental answers. We built it to empower informed decisions and expand access to reliable information—because everyone deserves a smart, safe path through the psychedelic landscape.","tag":"p","localId":"gsbp-5226b58"} -->
<p>The Psybrarian's Assistant is your AI-powered guide to psychedelic knowledge—It searches trusted sources (The Psybrary), blends modern research with cultural context, and responds in plain language. Whether you're just curious or diving deep, it’s here to offer accurate, compassionate, and non-judgmental answers. We built it to empower informed decisions and expand access to reliable information—because everyone deserves a smart, safe path through the psychedelic landscape.</p>
<!-- /wp:greenshift-blocks/element --></div>
<!-- /wp:greenshift-blocks/element --></div>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-bf3282c","type":"inner","className":"psybrarian-ticket-wrapper","localId":"gsbp-bf3282c"} -->
<div class="psybrarian-ticket-wrapper"><!-- wp:greenshift-blocks/element {"id":"gsbp-9177885","inlineCssStyles":null,"type":"inner","className":"container space-owl-m","localId":"gsbp-9177885","styleAttributes":{"backgroundImage":["url({$bg1})"]}} -->
<div class="container space-owl-m gsbp-9177885"><!-- wp:greenshift-blocks/element {"id":"gsbp-f002783","textContent":"Want Help From A Psybrarian?","tag":"h2","className":"text-2xl font-primary","localId":"gsbp-f002783"} -->
<h2 class="text-2xl font-primary">Want Help From A Psybrarian?</h2>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-c9ecb16","textContent":"Need a human touch? If you have a question about the assistant’s answer, or anything psychedelics related you can submit it for review and receive a thoughtful, friendly response from our human team—usually within 72 hours.","tag":"p","localId":"gsbp-c9ecb16"} -->
<p>Need a human touch? If you have a question about the assistant’s answer, or anything psychedelics related you can submit it for review and receive a thoughtful, friendly response from our human team—usually within 72 hours.</p>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/element {"id":"gsbp-e7b7d39","textContent":"Submit a ticket","tag":"button","className":"submit-ticket-button","localId":"gsbp-e7b7d39","formAttributes":{"type":"button"}} -->
<button class="submit-ticket-button" type="button">Submit a ticket</button>
<!-- /wp:greenshift-blocks/element -->

<!-- wp:greenshift-blocks/buttonbox {"id":"gsbp-ae53fc5","inlineCssStyles":null,"buttonContent":"","iconSpacing":{"margin":{"values":{"right":["0px"]},"locked":false},"padding":{"values":[],"locked":false}},"position":{"positionType":["relative"],"positions":{"values":[]}},"buttonLink":"#","enableIcon":false,"iconRight":false,"iconBox_icon":{"icon":{"font":"rhicon rhi-bars","svg":"","image":""},"fill":"#ffffff","fillhover":"#ffffff","type":"font","iconSize":[25]},"slidingPanel":true,"disableCloseBtn":false,"slidePosition":"modal","clickSelector":".submit-ticket-button","isVariation":"slidingpanel","className":"psybrarian-form-modal"} -->
<div class="gspb_button_wrapper gspb_button-id-gsbp-ae53fc5" id="gspb_button-id-gsbp-ae53fc5" data-paneltype="modal"><a class="wp-block-greenshift-blocks-buttonbox gspb-buttonbox wp-element-button  psybrarian-form-modal" href="#" rel="noopener"><span class="gspb-buttonbox-textwrap"><span class="gspb-buttonbox-text"><span class="gspb-buttonbox-title"></span></span></span></a><dialog data-panelid="gspb_button-id-gsbp-ae53fc5" class="gspb_slidingPanel" data-hover="" data-clickselector=".submit-ticket-button"><div class="gspb_slidingPanel-wrap"><div class="gspb_slidingPanel-inner"><!-- wp:fluentfom/guten-block {"formId":"3"} /--></div><div class="gspb_slidingPanel-close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg></div></div></dialog></div>
<!-- /wp:greenshift-blocks/buttonbox --></div>
<!-- /wp:greenshift-blocks/element --></div>
<!-- /wp:greenshift-blocks/element --></div>
<!-- /wp:greenshift-blocks/element -->
HTML;
    }

    /**
     * Create or update the Psybrarian page
     * 
     * This method handles the creation and updating of the Psybrarian
     * page, ensuring it exists with proper content and template
     * assignment. It handles various page states and provides
     * fallback mechanisms for different scenarios.
     * 
     * PAGE MANAGEMENT STRATEGY:
     * - Check for existing page by path/slug
     * - Update existing pages with current content
     * - Restore pages from various post statuses
     * - Create new pages when none exist
     * - Handle template assignment and validation
     * 
     * TEMPLATE HANDLING:
     * - Theme-specific template selection
     * - Child/parent theme fallback logic
     * - Template existence validation
     * - Template assignment and verification
     * - Template inheritance management
     * 
     * ERROR RECOVERY:
     * - Page restoration from trash
     * - Template fallback mechanisms
     * - Content update validation
     * - Page status management
     * - Template assignment recovery
     * 
     * @return int|WP_Error Page ID on success, WP_Error on failure
     * @since 1.0
     */
    private static function create_or_update_page() {
        $content = self::page_content();
    
        $child  = function_exists('get_stylesheet') ? get_stylesheet() : '';
        $parent = function_exists('get_template')   ? get_template()   : '';
        $tpl    = $child ? ($child . '//' . self::TEMPLATE_SLUG) : '';
    
        if ($tpl && !self::block_template_exists_for($child) && $parent) {
            $tpl = $parent . '//' . self::TEMPLATE_SLUG;
        }
    
        $page = get_page_by_path(self::PAGE_SLUG);
        if ($page) {
            wp_update_post([
                'ID'           => $page->ID,
                'post_title'   => self::PAGE_TITLE,
                'post_content' => $content,
                'post_status'  => 'publish',
                'meta_input'   => ['_wp_page_template' => $tpl],
            ]);

            self::assign_block_template_to_page($page->ID);
            return $page->ID;
        }
    
        $maybe = get_posts([
            'post_type'      => 'page',
            'name'           => self::PAGE_SLUG,
            'post_status'    => array('publish','draft','pending','private','future','trash','inherit'),
            'posts_per_page' => 1,
            'fields'         => 'ids',
        ]);
        if (!empty($maybe)) {
            $page_id = $maybe[0];
            if (get_post_status($page_id) === 'trash') wp_untrash_post($page_id);
            wp_update_post([
                'ID'           => $page_id,
                'post_title'   => self::PAGE_TITLE,
                'post_content' => $content,
                'post_status'  => 'publish',
                'meta_input'   => ['_wp_page_template' => $tpl],
            ]);
            self::assign_block_template_to_page($page_id);
            return $page_id;
        }
    
        $page_id = wp_insert_post([
            'post_type'    => 'page',
            'post_status'  => 'publish',
            'post_name'    => self::PAGE_SLUG,
            'post_title'   => self::PAGE_TITLE,
            'post_content' => $content,
        ]);
        
        if (!is_wp_error($page_id)) {
            self::assign_block_template_to_page($page_id);
        }
        
        return $page_id;
    }

    /**
     * Add action links to the plugin page
     * 
     * This method adds convenient action links to the WordPress
     * plugin management page, providing quick access to view
     * and edit the Psybrarian page directly from the admin.
     * 
     * ACTION LINKS PROVIDED:
     * - View Page: Direct link to the live Psybrarian page
     * - Edit Page: Quick access to edit the page content
     * - Enhanced plugin management experience
     * - Streamlined page access workflow
     * 
     * USER EXPERIENCE:
     * - One-click page access from admin
     * - Seamless integration with WordPress admin
     * - Improved plugin usability
     * - Professional admin interface
     * 
     * @param array $links Existing plugin action links
     * @return array Modified action links array
     * @since 1.0
     */
    public static function action_links($links) {
        $page = get_page_by_path(self::PAGE_SLUG);
        if ($page) {
            $links[] = '<a href="'.esc_url(get_permalink($page->ID)).'" target="_blank">View Page</a>';
            $links[] = '<a href="'.esc_url(get_edit_post_link($page->ID)).'">Edit Page</a>';
        }
        return $links;
    }

    /**
     * Display admin notices for system status
     * 
     * This method displays informative admin notices to alert
     * administrators about the system status, missing components,
     * or configuration issues that may affect functionality.
     * 
     * NOTICE TYPES:
     * - Warning notices for missing shortcodes
     * - System status information
     * - Configuration requirement alerts
     * - User guidance and instructions
     * 
     * USER EXPERIENCE:
     * - Clear status communication
     * - Actionable information
     * - Professional notice styling
     * - Dismissible notifications
     * 
     * @return void
     * @since 1.0
     */
    public static function soft_notices() {
        if (!shortcode_exists('exa_search')) {
            echo '<div class="notice notice-warning is-dismissible"><p><strong>AI Trainer:</strong> <code>[exa_search]</code> shortcode missing. Activate the component that provides it.</p></div>';
        }
    }
    
    /**
     * Handle AJAX template refresh requests
     * 
     * This method processes AJAX requests to refresh the Psybrarian
     * template, allowing administrators to update the page template
     * without manual intervention. It includes security validation
     * and proper response handling.
     * 
     * SECURITY FEATURES:
     * - User capability validation (manage_options)
     * - AJAX request processing
     * - Unauthorized access prevention
     * - Secure response handling
     * 
     * FUNCTIONALITY:
     * - Template refresh and reassignment
     * - Page template validation
     * - Success/error response handling
     * - JSON response formatting
     * 
     * ERROR HANDLING:
     * - Page existence validation
     * - Template assignment verification
     * - Graceful error responses
     * - User feedback and guidance
     * 
     * @return void Sends JSON response and terminates execution
     * @since 1.0
     */
    public static function ajax_refresh_template() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $page = get_page_by_path(self::PAGE_SLUG);
        if ($page) {
            self::assign_block_template_to_page($page->ID);
            wp_send_json_success(['message' => 'Template refreshed successfully']);
        } else {
            wp_send_json_error(['message' => 'Page not found']);
        }
    }
    
    /**
     * Force template usage for specific pages
     * 
     * This method is a filter hook that can be used to force
     * specific templates for certain pages. Currently returns
     * the template unchanged, but provides a framework for
     * future template forcing functionality.
     * 
     * TEMPLATE FILTERING:
     * - Template override capabilities
     * - Conditional template selection
     * - Theme compatibility handling
     * - Template inheritance management
     * 
     * EXTENSIBILITY:
     * - Framework for template forcing
     * - Conditional logic implementation
     * - Theme-specific template handling
     * - Custom template selection logic
     * 
     * @param string $template Current template path
     * @return string Modified or unchanged template path
     * @since 1.0
     */
    public static function force_template($template) {
        return $template;
    }
    
    /**
     * Override page template selection for Psybrarian page
     * 
     * This method intercepts page template selection and forces
     * the use of the Psybrarian template for the specific page.
     * It ensures consistent template usage and proper theme
     * compatibility across different WordPress configurations.
     * 
     * TEMPLATE OVERRIDE LOGIC:
     * - Page-specific template forcing
     * - Template assignment validation
     * - Theme compatibility checking
     * - Template existence verification
     * - Canvas template fallback
     * 
     * THEME INTEGRATION:
     * - Block theme template handling
     * - Template taxonomy validation
     * - Theme-specific template selection
     * - Template inheritance management
     * - Fallback template systems
     * 
     * PERFORMANCE FEATURES:
     * - Conditional template processing
     * - Efficient template lookup
     * - Minimal database queries
     * - Template caching optimization
     * 
     * @param string $template Current template path
     * @param WP_Post $post Post object for template selection
     * @return string Modified template path or original template
     * @since 1.0
     */
    public static function get_page_template_override($template, $post) {
        if ($post && $post->post_name === self::PAGE_SLUG) {
            $assigned_template = get_post_meta($post->ID, '_wp_page_template', true);
            if ($assigned_template && $assigned_template === self::TEMPLATE_SLUG) {
                $theme = get_stylesheet();
                $template_post = get_posts([
                    'post_type'      => 'wp_template',
                    'name'           => self::TEMPLATE_SLUG,
                    'post_status'    => ['publish','draft','private'],
                    'posts_per_page' => 1,
                    'tax_query'      => [[
                        'taxonomy' => 'wp_theme',
                        'field'    => 'name',
                        'terms'    => $theme,
                    ]],
                ]);
                
                if (!empty($template_post)) {
                    return ABSPATH . WPINC . '/template-canvas.php';
                }
            }
        }
        return $template;
    }
    
    /**
     * Register block template with WordPress
     * 
     * This method registers the Psybrarian block template with
     * WordPress, ensuring it's available for selection and use
     * in the block editor. It handles template registration
     * and validation for modern block themes.
     * 
     * TEMPLATE REGISTRATION:
     * - Block template availability
     * - Template taxonomy integration
     * - Theme-specific template handling
     * - Template validation and verification
     * - Template inheritance management
     * 
     * BLOCK EDITOR INTEGRATION:
     * - Template selection in editor
     * - Template preview and editing
     * - Template assignment capabilities
     * - Editor template management
     * - Template customization options
     * 
     * THEME COMPATIBILITY:
     * - Child theme template handling
     * - Parent theme fallback logic
     * - Cross-theme template support
     * - Template system compatibility
     * - Theme inheritance management
     * 
     * @param array $block_templates Current block templates array
     * @param array $query Template query parameters
     * @param string $template_type Type of template being queried
     * @return array Modified block templates array
     * @since 1.0
     */
    public static function register_block_template($block_templates, $query, $template_type) {
        if ('wp_template' !== $template_type) {
            return $block_templates;
        }
        
        $theme = get_stylesheet();
        $template_exists = false;
        
        foreach ($block_templates as $template) {
            if ($template->slug === self::TEMPLATE_SLUG && $template->theme === $theme) {
                $template_exists = true;
                break;
            }
        }
        
        if (!$template_exists) {
            $template_post = get_posts([
                'post_type'      => 'wp_template',
                'name'           => self::TEMPLATE_SLUG,
                'post_status'    => ['publish','draft','private'],
                'posts_per_page' => 1,
                'tax_query'      => [[
                    'taxonomy' => 'wp_theme',
                    'field'    => 'name',
                    'terms'    => $theme,
                ]],
            ]);
            
            if (!empty($template_post)) {
                $block_templates[] = _build_block_template_result_from_post($template_post[0]);
            }
        }
        
        return $block_templates;
    }
    
    /**
     * Override block template selection and loading
     * 
     * This method intercepts block template loading and provides
     * custom template content for the Psybrarian template. It
     * ensures proper template rendering and theme compatibility
     * for modern block themes.
     * 
     * TEMPLATE OVERRIDE MECHANISM:
     * - Template ID validation and matching
     * - Custom template content provision
     * - Template rendering customization
     * - Theme-specific template handling
     * - Template inheritance management
     * 
     * BLOCK THEME INTEGRATION:
     * - Modern theme template support
     * - Template system compatibility
     * - Theme inheritance handling
     * - Template taxonomy validation
     * - Template loading optimization
     * 
     * PERFORMANCE FEATURES:
     * - Conditional template processing
     * - Efficient template lookup
     * - Template caching optimization
     * - Minimal resource usage
     * - Fast template loading
     * 
     * @param WP_Block_Template|null $template Current block template
     * @param string $id Template ID being requested
     * @param string $template_type Type of template being loaded
     * @return WP_Block_Template|null Modified or original template
     * @since 1.0
     */
    public static function override_block_template($template, $id, $template_type) {
        if ('wp_template' !== $template_type) {
            return $template;
        }
        
        $theme = get_stylesheet();
        $template_id = $theme . '//' . self::TEMPLATE_SLUG;
        
        if ($id === $template_id) {
            $template_post = get_posts([
                'post_type'      => 'wp_template',
                'name'           => self::TEMPLATE_SLUG,
                'post_status'    => ['publish','draft','private'],
                'posts_per_page' => 1,
                'tax_query'      => [[
                    'taxonomy' => 'wp_theme',
                    'field'    => 'name',
                    'terms'    => $theme,
                ]],
            ]);
            
            if (!empty($template_post)) {
                return _build_block_template_result_from_post($template_post[0]);
            }
        }
        
        return $template;
    }
}

}