<?php
/**
 * Plugin Name: Apaczka.pl Mapa Punktów
 * Description: Wtyczka pozwoli Ci w prosty sposób skonfigurować i wyświetlić mapę punktów dla twoich metod dostawy tak aby twój Klient mógł wybrać punkt, z którego chce odebrać przesyłkę.
 * Version:     1.4.1
 * Text Domain: apaczka-pl-mapa-punktow
 * Author:      Inspire Labs
 * Author URI:  https://inspirelabs.pl/

 * Domain Path: /languages
 *
 * WC tested up to: 9.9.5
 *
 * Copyright 2020 Inspire Labs sp. z o.o.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * @package Mapa Punktów WooCommerce
 */

namespace Apaczka_Points_Map;

// If this file is called directly, abort.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 *
 */
define( 'APACZKA_POINTS_MAP_DIR_URL', plugin_dir_url( __FILE__ ) );
define( 'APACZKA_POINTS_MAP_DIR', plugin_dir_path( __FILE__ ) );

/**
 * Main plugin helper.
 */
class Points_Map_Plugin {
	/**
	 * Maps_Plugin constructor.
	 */
	public function __construct() {
		$this->init_hooks();
	}

	/**
	 * Init Hooks.
	 */
	public function init_hooks() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_front_scripts' ) );
		add_action( 'woocommerce_integrations_init', array( $this, 'include_wc_integration_class' ) );
		add_filter( 'woocommerce_integrations', array( $this, 'add_integration_filter' ) );
		add_action( 'init', array( $this, 'include_class' ) );
		add_action( 'after_setup_theme', array( $this, 'include_translations' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( $this, 'plugin_action_links' ) );

		// integration with Woocommerce blocks start.
		add_action(
			'woocommerce_blocks_checkout_block_registration',
			function ( $integration_registry ) {
				require_once APACZKA_POINTS_MAP_DIR . 'includes/class-woo-blocks-integration.php';
				$integration_registry->register( new ApaczkaMP_Woo_Blocks_Integration() );
			}
		);
		add_action(
			'woocommerce_store_api_checkout_update_order_from_request',
			array( $this, 'save_shipping_point_in_order_meta' ),
			10,
			2
		);
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_blocks_scripts' ) );
		// integration with Woocommerce blocks end.
	}

	/**
	 * Includes front scripts.
	 */
	public function enqueue_front_scripts() {

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_data = get_plugin_data( __FILE__ );

		if ( $this->is_enable() && ( is_checkout() || has_block( 'woocommerce/checkout' ) ) ) {

			wp_enqueue_style(
				'apaczka-points-map-style',
				APACZKA_POINTS_MAP_DIR_URL . 'public/css/apaczka-points-map.css',
				'',
				$plugin_data['Version']
			);
			wp_enqueue_style(
				'apaczka-points-map-bliskapaczka-style',
				APACZKA_POINTS_MAP_DIR_URL . 'public/css/bliskapaczka-map.css',
				'',
				$plugin_data['Version']
			);
			wp_enqueue_script(
				'bliskpaczka-client-map',
				APACZKA_POINTS_MAP_DIR_URL . 'public/js/bliskapaczka-map.js',
				array( 'jquery' ),
				$plugin_data['Version'],
				array( 'in_footer' => true )
			);
		}

		$enqueue_script_classic_checkout = false;
		if ( is_checkout() && ! has_block( 'woocommerce/checkout' ) ) {
			$enqueue_script_classic_checkout = true;
		}
		if ( is_checkout() && class_exists( 'FluidCheckout' ) ) {
			$enqueue_script_classic_checkout = true;
		}

		if ( $this->is_enable() && $enqueue_script_classic_checkout ) {

			wp_enqueue_script(
				'apaczka-points-map-handler',
				APACZKA_POINTS_MAP_DIR_URL . 'public/js/apaczka-points-map.js',
				array( 'bliskpaczka-client-map', 'jquery', 'wc-checkout' ),
				$plugin_data['Version'],
				false
			);

			$app_id = isset( WC()->integrations->integrations['woocommerce-maps-apaczka']->settings['app_id'] ) ? WC()->integrations->integrations['woocommerce-maps-apaczka']->settings['app_id'] : null;

			$map_config = $this->get_map_config();

			wp_localize_script(
				'apaczka-points-map-handler',
				'apaczka_points_map',
				array(
					'translation' => array(
						'delivery_point' => esc_html__( 'Delivery Point', 'apaczka-pl-mapa-punktow' ),
					),
					'app_id'      => $app_id,
					'map_config'  => $map_config,
				)
			);
		}
	}


	/**
	 * Include class integration with WooCommerce.
	 */
	public function include_wc_integration_class() {
		if ( ! class_exists( 'Maps_Integration' ) ) {
			require_once APACZKA_POINTS_MAP_DIR . 'includes/class-wc-settings-integration.php';
		}
	}

	/**
	 * WooCommerce integration init.
	 *
	 * @param array $integrations .
	 * @return mixed
	 */
	public function add_integration_filter( $integrations ) {
		$integrations[] = 'Apaczka_Points_Map\WC_Settings_Integration';
		return $integrations;
	}

	/**
	 * Include required class.
	 */
	public function include_class() {
		require_once APACZKA_POINTS_MAP_DIR . 'includes/sdk/api.class.php';
	}

	/**
	 * Include translations.
	 */
	public function include_translations() {
		load_plugin_textdomain( 'apaczka-pl-mapa-punktow', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}

	/**
	 * Display plugin action links.
	 *
	 * @param array $links .
	 * @return array
	 */
	public function plugin_action_links( $links ) {
		$plugin_links = array(
			'<a href="' . admin_url( 'admin.php?page=wc-settings&tab=integration&section=woocommerce-maps-apaczka' ) . '">' . __( 'Settings', 'apaczka-pl-mapa-punktow' ) . '</a>',
		);

		return array_merge( $plugin_links, $links );
	}


	/**
	 * Save delivery point data to order meta
	 *
	 * @param \WC_Order        $order order object.
	 * @param \WP_REST_Request $request request.
	 * @return void
	 */
	public function save_shipping_point_in_order_meta( $order, $request ) {

		if ( ! $order ) {
			return;
		}

		$request_body = json_decode( $request->get_body(), true );

		if ( isset( $request_body['extensions']['apaczka']['apaczka-point'] )
			&& ! empty( $request_body['extensions']['apaczka']['apaczka-point'] ) ) {

			$apaczka_delivery_point = json_decode( $request_body['extensions']['apaczka']['apaczka-point'], true );

			$apaczka_delivery_point = array_map( 'sanitize_text_field', $apaczka_delivery_point );

			update_post_meta( $order->get_ID(), 'apaczka_delivery_point', $apaczka_delivery_point );

			if ( 'yes' === get_option( 'woocommerce_custom_orders_table_enabled' ) ) {
				$order->update_meta_data( 'apaczka_delivery_point', $apaczka_delivery_point );
				$order->save();
			}
		}
	}


	/**
	 * Enqueue frontend script for Checkout Block
	 *
	 * @return void
	 */
	public function enqueue_frontend_blocks_scripts() {

		if ( $this->is_enable() && has_block( 'woocommerce/checkout' ) ) {

			if ( has_block( 'woocommerce/checkout' ) ) {
				$map_config = $this->get_map_config();

				$front_blocks_js_path = APACZKA_POINTS_MAP_DIR_URL . 'public/js/blocks/front-blocks.js';
				wp_enqueue_script(
					'apaczka-mp-front-blocks',
					APACZKA_POINTS_MAP_DIR_URL . 'public/js/blocks/front-blocks.js',
					array( 'jquery' ),
					file_exists( $front_blocks_js_path ) ? filemtime( $front_blocks_js_path ) : '1.4.1',
					array(
						'in_footer' => true,
					)
				);
				wp_localize_script(
					'apaczka-mp-front-blocks',
					'apaczka_block',
					array(
						'button_text1'  => __( 'Select a Delivery Point', 'apaczka-pl-mapa-punktow' ),
						'button_text2'  => __( 'Change a Delivery Point', 'apaczka-pl-mapa-punktow' ),
						'selected_text' => __( 'Selected Parcel Locker:', 'apaczka-pl-mapa-punktow' ),
						'alert_text'    => __( 'Delivery point must be chosen!', 'apaczka-pl-mapa-punktow' ),
						'map_config'    => $map_config,
					)
				);
			}
		}
	}


	/**
	 * Get map config
	 *
	 * @return array
	 */
	private function get_map_config(): array {
		$config = array();
		// Get all your existing shipping zones IDS.
		$zone_ids = array_keys( array( '' ) + \WC_Shipping_Zones::get_zones() );

		foreach ( $zone_ids as $zone_id ) {

			$shipping_zone = new \WC_Shipping_Zone( $zone_id );

			$shipping_methods = $shipping_zone->get_shipping_methods( true, 'values' );

			foreach ( $shipping_methods as $instance_id => $shipping_method ) {
				if ( isset( $shipping_method->instance_settings['display_apaczka_map'] ) && 'yes' === $shipping_method->instance_settings['display_apaczka_map'] ) {
					$geowidget_supplier = $shipping_method->instance_settings['supplier_apaczka_map'];

					if ( 'all' === $geowidget_supplier || 'ALL' === $geowidget_supplier ) {
						$config[ $instance_id ]['geowidget_supplier'] = array( 'DHL', 'DPD', 'INPOST', 'POCZTA', 'UPS', 'RUCH' );
					} else {
						$single_carrier                               = $shipping_method->instance_settings['supplier_apaczka_map'];
						$config[ $instance_id ]['geowidget_supplier'] = array( $single_carrier );
					}

					$config[ $instance_id ]['geowidget_only_cod'] = $shipping_method->instance_settings['only_cod_apaczka_map'];
				}
			}
		}

		return $config;
	}


	/**
	 * Checks if the plugin is to be enabled.
	 *
	 * @return bool
	 */
	private function is_enable() {

		$is_active = true;

		if ( is_object( \WC() ) ) {
			if ( ! isset( \WC()->integrations->integrations['woocommerce-maps-apaczka']->settings['correct_api_connection'] ) ||
				'no' === \WC()->integrations->integrations['woocommerce-maps-apaczka']->settings['correct_api_connection']
			) {
				$is_active = false;
			}
		}

		return $is_active;
	}
}

add_action(
	'after_setup_theme',
	function () {
		if (
			( function_exists( 'is_plugin_active' ) && is_plugin_active( 'woocommerce/woocommerce.php' ) )
			|| in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) )
			|| ( defined( 'WC_PLUGIN_FILE' ) && defined( 'WC_VERSION' ) )
		) {
			new Points_Map_Plugin();
			require_once APACZKA_POINTS_MAP_DIR . 'includes/class-shipping-integration-helper.php';
			require_once APACZKA_POINTS_MAP_DIR . 'includes/class-wc-shipping-integration.php';
			require_once APACZKA_POINTS_MAP_DIR . 'includes/class-delivery-points-map.php';

			if ( in_array( 'flexible-shipping/flexible-shipping.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ), true ) ) {
				require_once APACZKA_POINTS_MAP_DIR . 'includes/class-flexible-shipping-integration.php';
			}
		} else {
			add_action(
				'admin_notices',
				function () {
					$message = sprintf(
					/* translators: Placeholders: %1$s and %3$s are <strong> tags. %2$s and %4$s are text */
						'%1$s %2$s %3$s %4$s',
						'<strong>',
						esc_html__( 'Apaczka.pl Mapa Punktów', 'apaczka-pl-mapa-punktow' ),
						'</strong>',
						esc_html__( 'requires WooCommerce to function.', 'apaczka-pl-mapa-punktow' )
					);
					printf( '<div class="error"><p>%s</p></div>', wp_kses_post( $message ) );
				}
			);
			return;
		}
	}
);


add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);
