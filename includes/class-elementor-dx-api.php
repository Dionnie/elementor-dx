<?php
if (! defined('ABSPATH')) {
    exit;
}

class Elementor_DX_API
{

    public function __construct()
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes()
    {
        // Colors Route
        register_rest_route('elementordx/v1', '/colors', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_colors'],
                'permission_callback' => [$this, 'check_permissions'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'update_colors'],
                'permission_callback' => [$this, 'check_permissions'],
            ]
        ]);

        // Typography Route
        register_rest_route('elementordx/v1', '/typography', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_typography'],
                'permission_callback' => [$this, 'check_permissions'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'update_typography'],
                'permission_callback' => [$this, 'check_permissions'],
            ]
        ]);
    }

    public function check_permissions()
    {
        return true; // Use current_user_can('edit_posts') in production
    }

    // ==========================================
    // COLORS ENDPOINTS
    // ==========================================

    public function get_colors(WP_REST_Request $request)
    {
        $kit_id = get_option('elementor_active_kit');

        if (! $kit_id) {
            return new WP_Error('no_kit', 'Active Elementor Kit not found.', ['status' => 404]);
        }

        $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true);

        // Return current active kit custom colors
        $response = [
            'custom_colors' => $page_settings['custom_colors'] ?? []
        ];

        return rest_ensure_response($response);
    }

    public function update_colors(WP_REST_Request $request)
    {
        $parameters = $request->get_json_params();
        $saved_live = false;

        // Update Live Kit Custom Colors if provided
        if (isset($parameters['custom_colors']) && is_array($parameters['custom_colors'])) {
            $kit_id = get_option('elementor_active_kit');
            if ($kit_id) {
                $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true) ?: [];
                $page_settings['custom_colors'] = $parameters['custom_colors'];

                update_post_meta($kit_id, '_elementor_page_settings', $page_settings);

                // Clear Elementor CSS Cache to show changes
                if (class_exists('\Elementor\Plugin')) {
                    \Elementor\Plugin::$instance->files_manager->clear_cache();
                }
                $saved_live = true;
            }
        }

        return rest_ensure_response([
            'success'     => true,
            'message'     => 'Processed color updates.',
            'kit_updated' => $saved_live
        ]);
    }

    // ==========================================
    // TYPOGRAPHY ENDPOINTS
    // ==========================================

    public function get_typography(WP_REST_Request $request)
    {
        $kit_id = get_option('elementor_active_kit');

        if (! $kit_id) {
            return new WP_Error('no_kit', 'Active Elementor Kit not found.', ['status' => 404]);
        }

        $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true);

        // Return current active kit custom typography
        $response = [
            'custom_typography' => $page_settings['custom_typography'] ?? []
        ];

        return rest_ensure_response($response);
    }

    public function update_typography(WP_REST_Request $request)
    {
        $parameters = $request->get_json_params();
        $saved_live = false;

        // Update Live Kit Custom Typography if provided
        if (isset($parameters['custom_typography']) && is_array($parameters['custom_typography'])) {
            $kit_id = get_option('elementor_active_kit');
            if ($kit_id) {
                $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true) ?: [];
                $page_settings['custom_typography'] = $parameters['custom_typography'];

                update_post_meta($kit_id, '_elementor_page_settings', $page_settings);

                // Clear Elementor CSS Cache to show changes
                if (class_exists('\Elementor\Plugin')) {
                    \Elementor\Plugin::$instance->files_manager->clear_cache();
                }
                $saved_live = true;
            }
        }

        return rest_ensure_response([
            'success'     => true,
            'message'     => 'Processed typography updates.',
            'kit_updated' => $saved_live
        ]);
    }
}

new Elementor_DX_API();
