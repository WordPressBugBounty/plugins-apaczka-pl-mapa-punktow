(function ($) {

	let apaczka_mp_country_code        = '';

	window.apaczka_mp_map_callback = function (point) {
		console.log( point );

		$( '.apaczka_mp_pl_after_rate_description' ).each(
			function (i, elem) {
				$( elem ).remove();
			}
		);

		let point_brand = '';
		if ( 'brand' in point ) {
			point_brand = point.brand + ' ' + point.code;
		} else {
			point_brand = point.code;
		}

		let mp_country_code = apaczka_mp_get_country_code( point.code );

		let visible_point_desc = point_brand;
		if ('description' in point) {
			visible_point_desc += '<br>' + point.description;
		}
		let pointstreet = '';
		if ('street' in point) {
			visible_point_desc += '<br>' + point.street;
			pointstreet = point.street;
		} else if ('description' in point ) {
			pointstreet = point.description;
		}
		if ('city' in point) {
			visible_point_desc += '<br>' + point.city;
		}
		if ('postalCode' in point) {
			visible_point_desc += '<br>' + point.postalCode;
		}

		$( '#apm_name' ).each(
			function (i, elem) {
				$( elem ).val( point.description );
			}
		);
		$( '#apm_city' ).each(
			function (i, elem) {
				$( elem ).val( point.city );
			}
		);
		$( '#apm_street' ).each(
			function (i, elem) {
				$( elem ).val( pointstreet );
			}
		);
		$( '#apm_postal_code' ).each(
			function (i, elem) {
				$( elem ).val( point.postalCode );
			}
		);
		$( '#apm_country_code' ).each(
			function (i, elem) {
				$( elem ).val( mp_country_code );
			}
		);
		$( '#apm_supplier' ).each(
			function (i, elem) {
				$( elem ).val( point.operator );
			}
		);
		$( '#apm_access_point_id' ).each(
			function (i, elem) {
				$( elem ).val( point.code );
			}
		);
		$( '#apm_foreign_access_point_id' ).each(
			function (i, elem) {
				$( elem ).val( point.code );
			}
		);

		$( '#amp-delivery-point-desc' ).html(
			apaczka_points_map.translation.delivery_point + ' : ' +
			visible_point_desc
		);
		$( '#amp-delivery-point-desc' ).show();

		let map_modal = document.getElementById( 'apaczka_mp_geowidget_modal_dynamic' );
		if ( typeof map_modal != 'undefined' && map_modal !== null ) {
			map_modal.style.display = 'none';
		}

		if ($( '.apaczka_mp_pl_after_rate_btn' ).length > 0) {
			console.log( 'apaczka_mp_pl alternative btn' );

			$( '#amp-delivery-point-desc' ).each(
				function (i, elem) {
					$( elem ).hide();
				}
			);

			let wrap_open = '<span id="amp-delivery-point-desc" class="apaczka_mp_pl_after_rate_description" style="display:block;margin-top: 0px;">';

			visible_point_desc += '<input type="hidden" id="apm_access_point_id" name="apm_access_point_id" value="' + point.code + '"/>\n' +
				'<input type="hidden" id="apm_supplier" name="apm_supplier" value="' + point.operator + '"/>\n' +
				'<input type="hidden" id="apm_name" name="apm_name" value="' + point.description + '"/>\n' +
				'<input type="hidden" id="apm_foreign_access_point_id" name="apm_foreign_access_point_id" value="' + point.code + '"/>\n' +
				'<input type="hidden" id="apm_street" name="apm_street" value="' + pointstreet + '"/>\n' +
				'<input type="hidden" id="apm_city" name="apm_city" value="' + point.city + '"/>\n' +
				'<input type="hidden" id="apm_postal_code" name="apm_postal_code" value="' + point.postalCode + '"/>\n' +
				'<input type="hidden" id="apm_country_code" name="apm_country_code" value="' + mp_country_code + '"/>';

			let wrap_close = '</span>';

			let after_rate_btn_point_desc = wrap_open + visible_point_desc + wrap_close;

			$( '.apaczka_mp_pl_after_rate_btn' ).after( after_rate_btn_point_desc );
		}

	}

	$( document ).ready(
		function () {

			console.log( 'Apaczka MP: classic checkout' );
			// console.log( window );

			let initial_map_address = '';

			$( document.body ).on(
				'updated_checkout',
				function (evt, data) {

					let apaczka_geowidget_modal       = document.createElement( 'div' );
					let modal_html                    = '<div ' +
						'class="apaczka_mp_geowidget_modal" style="display:none;"' +
						' id="apaczka_mp_geowidget_modal_dynamic" style="display: none">' +
						'<div class="apaczka_mp_geowidget_modal_inner">' +
						'<span id="apaczka_mp_geowidget_modal_cross">&times;</span>' +
						'<div id="apaczka_mp_geowidget_modal_inner_content"></div>' +
						'</div>' +
						'</div>';
					apaczka_geowidget_modal.innerHTML = modal_html;

					document.body.appendChild( apaczka_geowidget_modal );

					$( '#apaczka_mp_geowidget_modal_cross' ).on(
						'click',
						function () {

							let map_modal = document.getElementById( 'apaczka_mp_geowidget_modal_dynamic' );
							if (typeof map_modal != 'undefined' && map_modal !== null) {
								map_modal.style.display = 'none';
							}
						}
					);

					$( '#amp-map-button' ).on(
						"click",
						function () {
							let map_config         = apaczka_points_map.map_config;
							let bp_only_code_param = false;
							let data_supplier      = null;
							let operators          = [];

							let checked_shipping_input = $( '#shipping_method' ).find( 'input[name^="shipping_method["]:checked' );
							if ( typeof checked_shipping_input != 'undefined' && checked_shipping_input !== null) {
								let id          = $( checked_shipping_input ).val();
								let instance_id = null;
								let method_data = null;
								if (typeof id != 'undefined' && id !== null) {
									method_data = id.split( ":" );
									instance_id = method_data[method_data.length - 1];
								}

								if ( typeof map_config != 'undefined' && map_config !== null) {
									let map_config_settings = map_config[instance_id];
									if ( typeof map_config_settings != 'undefined' && map_config_settings !== null) {
										if ( 'yes' === map_config_settings.geowidget_only_cod ) {
											bp_only_code_param = true;
										}
										data_supplier = map_config_settings.geowidget_supplier;
										console.log( 'Apczka MP operator config:' );
										console.log( map_config_settings.geowidget_only_cod );
										console.log( map_config_settings );
									}
								}
							}

							function apaczka_mp_create_operator_obj(operatorId, operatorName) {

								operatorName = operatorName.toUpperCase();

								if ( 'DHL_PARCEL' === operatorName ) {
									operatorName = 'DHL';
								}
								if ( 'PWR' === operatorName ) {
									operatorName = 'RUCH';
								}

								return {
									operator: operatorName,
									price: null
								};
							}

							if ( data_supplier ) {
								operators = data_supplier.map(
									function (operator) {
										return apaczka_mp_create_operator_obj( 'operators-' + operator, operator );
									}
								).filter( Boolean );
								operators = operators.length ? operators : null;

							} else {
								operators = [
									{operator: "GLS", price: null},
									{operator: "RUCH", price: null},
									{operator: "INPOST", price: null},
									{operator: "POCZTA", price: null},
									{operator: "DPD", price: null},
									{operator: "UPS", price: null},
									{operator: "DHL", price: null},
									{operator: "INPOST_INTERNATIONAL", price: null}
								]
							}

							if ('' === apaczka_mp_country_code || typeof apaczka_mp_country_code === 'undefined' || apaczka_mp_country_code === null) {
								let shipping_country = $( '#shipping_country' );
								if (typeof shipping_country != 'undefined' && shipping_country !== null) {
									let country_code_val = $( shipping_country ).val();
									if (typeof country_code_val != 'undefined' && country_code_val !== null) {
										apaczka_mp_country_code = country_code_val;
									} else {
										let billing_country = $( '#billing_country' );
										if (typeof billing_country != 'undefined' && billing_country !== null) {
											country_code_val = $( billing_country ).val();
											if (typeof country_code_val != 'undefined' && country_code_val !== null) {
												apaczka_mp_country_code = country_code_val;
											}
										}
									}
								}
							}

							let city = $( '#billing_city' ).val();
							if (typeof city != 'undefined' && city !== null) {
								initial_map_address = city;
							} else {
								let city_2 = $( '#shipping_city' ).val();
								if (typeof city_2 != 'undefined' && city_2 !== null) {
									initial_map_address = city_2;
								}
							}

							console.log( 'BPWidget.init' );
							console.log( operators );
							console.log( apaczka_mp_country_code );
							console.log( 'COD only: ' + bp_only_code_param );

							BPWidget.init(
								document.getElementById( 'apaczka_mp_geowidget_modal_inner_content' ),
								{
									callback: function (point) {
										window.apaczka_mp_map_callback( point );
									},
									posType: 'DELIVERY',
									mapOptions: { zoom: 12 },
									codOnly: bp_only_code_param,
									operatorMarkers: true,
									countryCodes: apaczka_mp_country_code,
									initialAddress: initial_map_address,
									operators: operators,
									codeSearch: true
								}
							);

							let map_modal = document.getElementById( 'apaczka_mp_geowidget_modal_dynamic' );
							if ( typeof map_modal != 'undefined' && map_modal !== null ) {
								map_modal.style.display = 'flex';
							}

						}
					);

					$( 'input.shipping_method' ).on(
						"click",
						function () {
							$( '#amp-delivery-point-desc' ).html( '' );
							$( '#amp-delivery-point-desc' ).hide();
							$( '#apm_access_point_id' ).val( '' );

							let id = $( this ).val();
							console.log( 'input.shipping_method' );
							console.log( id );
							let instance_id = null;
							let method_data = null;
							if (typeof id != 'undefined' && id !== null) {
								method_data = id.split( ":" );
								instance_id = method_data[method_data.length - 1];
							}
							let map_config = apaczka_points_map.map_config;
							if ( typeof map_config != 'undefined' && map_config !== null) {
								let map_config_settings = map_config[instance_id];
								console.log( 'AMP map_config_settings' );
								console.log( map_config_settings );
								if ( typeof map_config_settings != 'undefined' && map_config_settings !== null) {
									$( '#amp-map-button' ).removeClass( 'hidden' );
								} else {
									$( '#amp-map-button' ).addClass( 'hidden' );
								}
							}
						}
					);
				}
			);

			document.addEventListener(
				'click',
				function (e) {
					e          = e || window.event;
					var target = e.target || e.srcElement;
					if ( target.hasAttribute( 'id' ) ) {
						if (target.getAttribute( 'id' ) === 'apaczka_mp_geowidget_modal_cross') {
							let map_modal = document.getElementById( 'apaczka_mp_geowidget_modal_dynamic' );
							if (typeof map_modal != 'undefined' && map_modal !== null) {
								map_modal.style.display = 'none';
							}
						}
					}
				}
			);

			$( '#billing_country' ).on(
				'change',
				function () {
					apaczka_mp_country_code = $( this ).val();
				}
			);
			$( '#shipping_country' ).on(
				'change',
				function () {
					apaczka_mp_country_code = $( this ).val();
				}
			);
			$( '#billing_country' ).on(
				'change select2:select',
				function (e) {
					if (e.type === 'select2:select') {
						apaczka_mp_country_code = e.params.data.id;
					} else {
						apaczka_mp_country_code = $( this ).val();
					}
				}
			);
			$( '#shipping_country' ).on(
				'change select2:select',
				function (e) {
					if (e.type === 'select2:select') {
						apaczka_mp_country_code = e.params.data.id;
					} else {
						apaczka_mp_country_code = $( this ).val();
					}
				}
			);

		}
	);


	function apaczka_mp_get_country_code( code ) {
		let mp_country_code = 'PL';
		// 1. Check if input is valid
		if (typeof code !== 'string') return null;

		// 2. Define Regex Pattern
		// ^GLS_      = Starts with "GLS_"
		// ([A-Z]{2}) = Capture exactly 2 Uppercase letters (The Country Code)
		// -          = Followed immediately by a hyphen
		let regex = /^GLS_([A-Z]{2})-/;

		// 3. Execute match
		let match = code.match(regex);

		// 4. Return result
		if (match) {
			return match[1]; // Returns the captured "XX" (e.g., "CZ")
		} else {

			if ('' === apaczka_mp_country_code || typeof apaczka_mp_country_code === 'undefined' || apaczka_mp_country_code === null ) {
				let shipping_country = $( '#shipping_country' );
				if (typeof shipping_country != 'undefined' && shipping_country !== null) {
					let country_code_val = $( shipping_country ).val();
					if (typeof country_code_val != 'undefined' && country_code_val !== null) {
						mp_country_code = country_code_val;
					} else {
						let billing_country = $( '#billing_country' );
						if (typeof billing_country != 'undefined' && billing_country !== null) {
							country_code_val = $( billing_country ).val();
							if (typeof country_code_val != 'undefined' && country_code_val !== null) {
								mp_country_code = country_code_val;
							}
						}
					}
				}
			} else {
				return apaczka_mp_country_code;
			}

		}

		return mp_country_code;
	}

})( jQuery );
