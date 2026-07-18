<?php

/**
 * Plugin Name: Elementor DX
 * Description: Enhances Elementor's developer experience by adding a right-click context menu to easily inject CSS variables into numeric settings.
 * Version: 1.0.0
 * Author: DX Enhancements
 * Text Domain: elementor-dx-vars
 */

// Exit if accessed directly to prevent path disclosure
if (! defined('ABSPATH')) {
    exit;
}

// 1. Define paths and URLs properly
define('ELEMENTOR_DX_PATH', plugin_dir_path(__FILE__));
define('ELEMENTOR_DX_URL', plugin_dir_url(__FILE__));

// 2. Wrap everything in a main class to prevent global scope errors
class Elementor_DX_Core
{

    /**
     * Instance of this class.
     * @var mixed $instance
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

        // Explicitly load the files from the includes folder safely
        require_once ELEMENTOR_DX_PATH . 'includes/class-elementor-dx-api.php';

        // Hook into Elementor's editor scripts
        add_action('elementor/editor/after_enqueue_scripts', [$this, 'enqueue_editor_scripts']);
    }

    /**
     * Enqueue scripts and styles only in the Elementor Editor.
     */
    public function enqueue_editor_scripts()
    {

        // --- 1. Main Styles ---
        wp_enqueue_style(
            'elementor-dx',
            ELEMENTOR_DX_URL . 'assets/css/elementor-dx.css',
            [],
            '1.0.0'
        );

        // --- 2. Spacing Context Menu JS ---
        wp_enqueue_script(
            'elementor-dx-spacing',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-spacing.js',
            ['jquery'],
            '1.0.0',
            true
        );

        // --- 3. Main DX Variables / CSS Snippets JS ---
        wp_enqueue_script(
            'elementor-dx-css-snippets',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-css-snippets.js',
            ['jquery'],
            '1.0.0',
            true
        );

        // --- 4. Colors Manager JS ---
        wp_enqueue_script(
            'elementor-dx-color-importer',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-color-importer.js',
            ['jquery'],
            '1.0.0',
            true
        );

        // Pass REST API variables to the Colors Manager JS
        wp_localize_script(
            'elementor-dx-color-importer',
            'elementorDxSettings',
            [
                'root'  => esc_url_raw(rest_url()),
                'nonce' => wp_create_nonce('wp_rest'),
            ]
        );

        // --- 5. CSS Classes UI Enhancer ---
        wp_enqueue_script(
            'elementor-dx-css-classes',
            ELEMENTOR_DX_URL . 'assets/js/elementor-dx-css-classes.js',
            ['jquery'],
            '1.0.0',
            true
        );
    }
}

// Initialize the plugin safely
Elementor_DX_Core::get_instance();
