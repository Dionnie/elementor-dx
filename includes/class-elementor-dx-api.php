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
        // Register both GET (read) and POST (update) on the same endpoint
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
    }

    public function check_permissions()
    {
        //return current_user_can( 'edit_posts' );
        return true;
    }

    public function get_colors(WP_REST_Request $request)
    {
        $kit_id = get_option('elementor_active_kit');

        if (! $kit_id) {
            return new WP_Error('no_kit', 'Active Elementor Kit not found.', ['status' => 404]);
        }

        $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true);

        $colors_structure = [
            'system_colors' => $page_settings['system_colors'] ?? [],
            'custom_colors' => $page_settings['custom_colors'] ?? [],
        ];

        return rest_ensure_response($colors_structure);
    }

    /**
     * Handles POST requests to update the color arrays.
     */
    public function update_colors(WP_REST_Request $request)
    {
        $kit_id = get_option('elementor_active_kit');

        if (! $kit_id) {
            return new WP_Error('no_kit', 'Active Elementor Kit not found.', ['status' => 404]);
        }

        // 1. Fetch the existing settings so we don't destroy typography and layout settings
        $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true);
        if (! is_array($page_settings)) {
            $page_settings = [];
        }

        // 2. Parse the incoming JSON payload
        $parameters = $request->get_json_params();

        // 3. Selectively update only the keys provided in the payload
        if (isset($parameters['system_colors']) && is_array($parameters['system_colors'])) {
            $page_settings['system_colors'] = $parameters['system_colors'];
        }

        if (isset($parameters['custom_colors']) && is_array($parameters['custom_colors'])) {
            $page_settings['custom_colors'] = $parameters['custom_colors'];
        }

        // 4. Save the merged data safely back to the database
        update_post_meta($kit_id, '_elementor_page_settings', $page_settings);

        // 5. Force Elementor to regenerate the global CSS file so changes are visible on the frontend
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Colors successfully updated and CSS cache cleared.'
        ]);
    }
}

new Elementor_DX_API();
