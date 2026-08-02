<?php

/**
 * Plugin Name: Elementor DX
 * Description: Enhances Elementor's developer experience by adding a right-click context menu, global styling importers, and a radial tools menu.
 * Version: 1.0.0
 * Author: DX Enhancements
 * Text Domain: elementor-dx-vars
 */

// Exit if accessed directly to prevent path disclosure
if (! defined('ABSPATH')) {
    exit;
}

// Define paths and URLs properly
define('ELEMENTOR_DX_PATH', plugin_dir_path(__FILE__));
define('ELEMENTOR_DX_URL', plugin_dir_url(__FILE__));

class Elementor_DX_Core
{

    /**
     * Instance of this class.
     * @var Elementor_DX_Core|null
     */
    private static $instance = null;

    /**
     * Returns the singleton instance.
     */
    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor.
     */
    private function __construct()
    {
        // Hook into plugins_loaded to safely initialize
        add_action('plugins_loaded', [$this, 'init']);
    }

    /**
     * Initialize the plugin and include dependencies.
     */
    public function init()
    {
        // Safety check: Ensure Elementor is installed and activated
        if (! did_action('elementor/loaded')) {
            return;
        }

        // Include API endpoints
        require_once ELEMENTOR_DX_PATH . 'includes/class-elementor-dx-api.php';


        // Enqueue hooks
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_scripts']);
        add_action('elementor/editor/after_enqueue_scripts', [$this, 'enqueue_editor_scripts']);
    }

    /**
     * Enqueue scripts for the live Frontend.
     */
    public function enqueue_frontend_scripts()
    {
        // Security: Only load for users who have permission to edit posts
        if (! current_user_can('edit_posts')) {
            return;
        }

        // PREVENT DOUBLE UI: Do not load these scripts inside the Elementor Editor iframe
        if (class_exists('\Elementor\Plugin') && \Elementor\Plugin::$instance->preview->is_preview_mode()) {
            return;
        }

        // Load the floating tools on the live frontend
        $this->enqueue_global_tools();
    }

    /**
     * Enqueue scripts specific to the Elementor Editor parent window.
     */
    public function enqueue_editor_scripts()
    {
        // Security check
        if (! current_user_can('edit_posts')) {
            return;
        }

        // --- Editor Only Enhancements ---
        wp_enqueue_script(
            'elementor-dx-spacing',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-spacing.js',
            ['jquery'],
            '1.0.0',
            true
        );

        wp_enqueue_script(
            'elementor-dx-css-snippets',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-css-snippets.js',
            ['jquery'],
            '1.0.0',
            true
        );

        wp_enqueue_script(
            'elementor-dx-css-classes',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-css-classes.js',
            ['jquery'],
            '1.0.0',
            true
        );

        // Load the floating tools in the parent editor UI
        $this->enqueue_global_tools();
    }

    /**
     * Centralized method to enqueue the major tools and radial menu.
     * Reused by both frontend and editor hooks.
     */
    private function enqueue_global_tools()
    {

        // 1. Color Importer
        wp_enqueue_script(
            'elementor-dx-color-importer',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-color-importer.js',
            [], // Pure JS
            '1.0.0',
            true
        );

        // 2. Typography Importer
        wp_enqueue_script(
            'elementor-dx-typography-importer',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-typography-importer.js',
            [], // Pure JS
            '1.0.0',
            true
        );




        wp_enqueue_script(
            'elementor-dx-grid',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-grid.js',
            [], // Pure JS
            '1.0.0',
            true
        );

        wp_enqueue_script(
            'elementor-dx-wireframe',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-wireframe.js',
            [],
            '1.0.0',
            true
        );

        wp_enqueue_script(
            'elementor-dx-hierarchy',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-hierarchy.js',
            [],
            '1.0.0',
            true
        );

        wp_enqueue_script(
            'elementor-dx-xray',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-xray.js',
            [],
            '1.0.0',
            true
        );

        // 4. Radial Menu (The Main Trigger UI)
        wp_enqueue_script(
            'elementor-dx-menu',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-menu.js',
            [], // Pure JS
            '1.0.0',
            true
        );

        // Pass the REST API root URL and Nonce to the JavaScript files
        // We attach this to 'elementor-dx-color-importer' (first loaded), 
        // making 'elementorDxSettings' available globally to all subsequent scripts.
        wp_localize_script(
            'elementor-dx-color-importer',
            'elementorDxSettings',
            [
                'root'  => esc_url_raw(rest_url()),
                'nonce' => wp_create_nonce('wp_rest'),
            ]
        );
    }
}

// Initialize the plugin safely
Elementor_DX_Core::get_instance();
