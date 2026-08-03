<?php

/**
 * Plugin Name: Elementor DX
 * Description: Enhances Elementor's developer experience by adding a right-click context menu, global styling importers, and a radial tools menu.
 * Version: 1.0.0
 * Author: DX Enhancements
 * Text Domain: elementor-dx-vars
 */

if (! defined('ABSPATH')) {
    exit;
}

define('ELEMENTOR_DX_PATH', plugin_dir_path(__FILE__));
define('ELEMENTOR_DX_URL', plugin_dir_url(__FILE__));

class Elementor_DX_Core
{

    private static $instance = null;

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        add_action('plugins_loaded', [$this, 'init']);
    }

    public function init()
    {
        if (! did_action('elementor/loaded')) {
            return;
        }

        require_once ELEMENTOR_DX_PATH . 'includes/class-elementor-dx-api.php';

        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_scripts']);
        add_action('elementor/editor/after_enqueue_scripts', [$this, 'enqueue_editor_scripts']);
    }

    public function enqueue_frontend_scripts()
    {
        if (! current_user_can('edit_posts')) {
            return;
        }
        if (class_exists('\Elementor\Plugin') && \Elementor\Plugin::$instance->preview->is_preview_mode()) {
            return;
        }
        $this->enqueue_global_tools();
    }

    public function enqueue_editor_scripts()
    {
        if (! current_user_can('edit_posts')) {
            return;
        }

        // Legacy tools
        wp_enqueue_script('elementor-dx-spacing', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-spacing.js', ['jquery'], '1.0.0', true);
        wp_enqueue_script('elementor-dx-css-snippets', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-css-snippets.js', ['jquery'], '1.0.0', true);
        wp_enqueue_script('elementor-dx-css-classes', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-css-classes.js', ['jquery'], '1.0.0', true);

        $this->enqueue_global_tools();
    }

    private function enqueue_global_tools()
    {
        // 1. Color Importer
        wp_enqueue_script('elementor-dx-color-importer', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-color-importer.js', [], '1.0.0', true);
        wp_localize_script('elementor-dx-color-importer', 'elementorDxSettings', [
            'root'  => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        // 2. Typography Importer
        wp_enqueue_script('elementor-dx-typography-importer', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-typography-importer.js', [], '1.0.0', true);

        // 3. 8pt Blueprint Grid Overlay
        wp_enqueue_script('elementor-dx-grid', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-grid.js', [], '1.0.0', true);

        // 4. Hierarchy Lens
        wp_enqueue_script('elementor-dx-hierarchy', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-hierarchy.js', [], '1.0.0', true);

        // 5. Naked Wireframe
        wp_enqueue_script('elementor-dx-wireframe', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-wireframe.js', [], '1.0.0', true);

        // 6. Class Finder
        wp_enqueue_script('elementor-dx-class-finder', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-class-finder.js', [], '1.0.0', true);

        // 7. Grid Menu (Main Trigger UI) - MUST BE LOADED LAST
        wp_enqueue_script('elementor-dx-menu', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-menu.js', [], '1.0.0', true);
    }
}

Elementor_DX_Core::get_instance();
