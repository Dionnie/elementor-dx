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
        return true; // Use current_user_can('edit_posts') in production
    }

    public function get_colors(WP_REST_Request $request)
    {
        $kit_id = get_option('elementor_active_kit');

        if (! $kit_id) {
            return new WP_Error('no_kit', 'Active Elementor Kit not found.', ['status' => 404]);
        }

        $page_settings = get_post_meta($kit_id, '_elementor_page_settings', true);

        // Fetch or Initialize the 8 profiles
        $profiles = get_option('elementor-dx-custom-color-profiles', []);
        if (empty($profiles) || count($profiles) !== 8) {
            $profiles = [];
            for ($i = 1; $i <= 8; $i++) {
                $profiles[] = [
                    'name'   => 'Slot ' . $i,
                    'colors' => null
                ];
            }
        }

        // Return current active kit custom colors + profiles array (system_colors explicitly omitted)
        $response = [
            'custom_colors' => $page_settings['custom_colors'] ?? [],
            'profiles'      => $profiles
        ];

        return rest_ensure_response($response);
    }

    public function update_colors(WP_REST_Request $request)
    {
        $parameters = $request->get_json_params();

        // 1. Update Profiles Option if provided (No Elementor cache clearing needed here)
        if (isset($parameters['profiles']) && is_array($parameters['profiles'])) {
            update_option('elementor-dx-custom-color-profiles', $parameters['profiles']);
            $saved_profiles = true;
        }

        // 2. Update Live Kit Custom Colors if provided
        $saved_live = false;
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
            'success' => true,
            'message' => 'Processed updates.',
            'profile_saved' => isset($saved_profiles),
            'kit_updated' => $saved_live
        ]);
    }
}

new Elementor_DX_API();
