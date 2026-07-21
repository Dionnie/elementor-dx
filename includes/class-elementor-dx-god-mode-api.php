<?php
if (! defined('ABSPATH')) {
    exit;
}

class Elementor_DX_God_Mode_API
{
    public function __construct()
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes()
    {
        register_rest_route('elementordx/v1', '/kit', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_active_kit'],
                'permission_callback' => '__return_true', // Open for pre-viz (adjust for security if needed)
            ]
        ]);
    }

    public function get_active_kit(WP_REST_Request $request)
    {
        $kit_id = get_option('elementor_active_kit');

        if (! $kit_id) {
            return new WP_Error('no_kit', 'Active Elementor Kit not found.', ['status' => 404]);
        }

        $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true);

        return rest_ensure_response([
            'system_colors'     => $page_settings['system_colors'] ?? [],
            'custom_colors'     => $page_settings['custom_colors'] ?? [],
            'system_typography' => $page_settings['system_typography'] ?? [],
            'custom_typography' => $page_settings['custom_typography'] ?? [],
        ]);
    }
}

new Elementor_DX_God_Mode_API();
