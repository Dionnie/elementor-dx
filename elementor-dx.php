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

        // 7. CH Ruler (NEW)
        wp_enqueue_script('elementor-dx-em-ruler', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-em-ruler.js', [], '1.0.0', true);
        // 8. Grid Menu (Main Trigger UI) - MUST BE LOADED LAST
        wp_enqueue_script('elementor-dx-menu', ELEMENTOR_DX_URL . 'assets/js/elementor-dx-menu.js', [], '1.0.0', true);
    }
}

Elementor_DX_Core::get_instance();



add_filter('rest_request_after_callbacks', function ($response, $handler, $request) {
    $route = $request->get_route();

    // Only intercept Elementor global styling REST requests
    if (strpos($route, '/elementor/v1/globals/') !== false) {

        $is_404 = false;

        // Safely check if WordPress returned a WP_Error
        if (is_wp_error($response)) {
            $error_data = $response->get_error_data();
            if (is_array($error_data) && isset($error_data['status']) && $error_data['status'] == 404) {
                $is_404 = true;
            }
        }
        // Safely check if it is a standard REST response with a 404 status
        elseif (method_exists($response, 'get_status') && $response->get_status() == 404) {
            $is_404 = true;
        }

        // Intercept and inject the robust fake values
        if ($is_404) {
            $parts = explode('/', trim($route, '/'));
            $requested_id = end($parts);
            $type = isset($parts[count($parts) - 2]) ? $parts[count($parts) - 2] : 'colors';

            if ($type === 'typography') {
                // Typography mock nested inside the 'value' key to satisfy Object.entries()
                $fake_payload = [
                    'id'    => $requested_id,
                    'title' => 'Fallback Typography (' . $requested_id . ')',
                    'value' => [
                        'typography_typography'  => 'custom',
                        'typography_font_family' => 'sans-serif',
                        'typography_font_weight' => '400',
                        'typography_font_size'   => [
                            'unit'  => 'px',
                            'size'  => 16,
                            'sizes' => []
                        ],
                        'typography_line_height' => [
                            'unit'  => 'em',
                            'size'  => 1.5,
                            'sizes' => []
                        ]
                    ]
                ];
            } else {
                // Standard color mock
                $fake_payload = [
                    'id'    => $requested_id,
                    'title' => 'Fallback Color (' . $requested_id . ')',
                    'value' => 'transparent',
                ];
            }

            return new WP_REST_Response($fake_payload, 200);
        }
    }

    return $response;
}, 10, 3);
