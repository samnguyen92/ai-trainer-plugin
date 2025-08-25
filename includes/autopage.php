<?php

if (!defined('ABSPATH')) exit;

if (!class_exists('AI_Trainer_Auto_Page')) {

class AI_Trainer_Auto_Page {
    const PAGE_SLUG   = 'psybrarian-assistant';
    const PAGE_TITLE  = "Psybrarian's Assistant";

    const TEMPLATE_SLUG  = 'psybrarian';                
    const TEMPLATE_TITLE = 'Psybrarian Template';

    private static $main_file;

    public static function boot($main_plugin_file) {
        self::$main_file = $main_plugin_file;

        register_activation_hook(self::$main_file, [__CLASS__, 'on_activate']);
        add_action('init', [__CLASS__, 'ensure_page_exists']);
        add_filter('plugin_action_links_' . plugin_basename(self::$main_file), [__CLASS__, 'action_links']);
        add_action('admin_notices', [__CLASS__, 'soft_notices']);
        
        add_filter('template_include', [__CLASS__, 'force_template'], 999);
        
        add_filter('get_block_templates', [__CLASS__, 'register_block_template'], 10, 3);
        add_filter('pre_get_block_file_template', [__CLASS__, 'override_block_template'], 10, 3);
        
        add_filter('get_page_template', [__CLASS__, 'get_page_template_override'], 10, 2);
        
        if (is_admin()) {
            add_action('wp_ajax_refresh_psybrarian_template', [__CLASS__, 'ajax_refresh_template']);
        }
    }

    public static function on_activate() {
        self::ensure_block_template();
        $page_id = self::create_or_update_page();  
        self::assign_block_template_to_page($page_id);
    }

    public static function ensure_page_exists() {
        self::ensure_block_template();

        $page = get_page_by_path(self::PAGE_SLUG);
        if (!$page) {
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

            $page_id = self::create_or_update_page();   
            self::assign_block_template_to_page($page_id);
        } else {
            self::assign_block_template_to_page($page->ID);
        }
    }


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

    public static function action_links($links) {
        $page = get_page_by_path(self::PAGE_SLUG);
        if ($page) {
            $links[] = '<a href="'.esc_url(get_permalink($page->ID)).'" target="_blank">View Page</a>';
            $links[] = '<a href="'.esc_url(get_edit_post_link($page->ID)).'">Edit Page</a>';
        }
        return $links;
    }

    public static function soft_notices() {
        if (!shortcode_exists('exa_search')) {
            echo '<div class="notice notice-warning is-dismissible"><p><strong>AI Trainer:</strong> <code>[exa_search]</code> shortcode missing. Activate the component that provides it.</p></div>';
        }
    }
    
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
    
    public static function force_template($template) {
        return $template;
    }
    
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