(function ($) {

	let apaczka_mp_initial_map_address = '';
	let apaczka_mp_country = '';

	function apaczka_mp_wait_fo_element(selector) {
		return new Promise(
			function (resolve) {
				if (document.querySelector( selector )) {
					return resolve( document.querySelector( selector ) );
				}

				const observer = new MutationObserver(
					function (mutations) {
						if (document.querySelector( selector )) {
							resolve( document.querySelector( selector ) );
							observer.disconnect();
						}
					}
				);

				observer.observe(
					document.body,
					{
						childList: true,
						subtree: true
					}
				);
			}
		);
	}

	function apaczka_change_react_input(input,value){
		if (typeof input != 'undefined' && input !== null) {
			var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value"
			).set;
			nativeInputValueSetter.call( input, value );
			var inputEvent = new Event( "input", { bubbles: true } );
			input.dispatchEvent( inputEvent );
		}
	}

	window.apaczka_mp_map_callback_blocks = function(record) {

		console.log( 'apaczka_wc_block_point_callback' );
		console.log( record );

		let visible_point_id   = '';
		let visible_point_desc = '';
		let visible_city       = '';
		let visible_street     = '';
		let visible_house      = '';
		let apaczka_point_data = {};

		if ('code' in record) {
			if ('brand' in record) {
				apaczka_point_data.apm_access_point_id = record.code;
				visible_point_id                       = '<div id="selected-parcel-machine-id">' + record.brand + ': ' + record.code + '</div>\n';
			} else {
				apaczka_point_data.apm_access_point_id = record.code;
				visible_point_id                       = '<div id="selected-parcel-machine-id">' + record.code + '</div>\n';
			}
		}

		if ('operator' in record) {
			apaczka_point_data.apm_supplier = record.operator;
		}

		if ('description' in record) {
			apaczka_point_data.apm_name = record.description;
			visible_point_desc         += record.description;
		}

		if ('code' in record) {
			apaczka_point_data.apm_foreign_access_point_id = record.code;
		}

		if ('street' in record) {
			apaczka_point_data.apm_street = record.street;
			visible_point_desc           += '<br>' + record.street;
		}

		if ('city' in record) {
			apaczka_point_data.apm_city = record.city;
			visible_point_desc         += '<br>' + record.city;
		}

		if ('postalCode' in record) {
			apaczka_point_data.apm_postal_code = record.postalCode;
			visible_point_desc                += '<br>' + record.postalCode;
		}

		if ('country_code' in record) {
			apaczka_point_data.apm_country_code = record.country_code;
		} else {

			let wc_block_data = window.wcSettings;
			if (typeof wc_block_data != 'undefined' && wc_block_data !== null) {
				let checkout_data = wc_block_data.checkoutData;
				if (typeof checkout_data != 'undefined' && checkout_data !== null) {
					let country_code = checkout_data.shipping_address.country;
					if (typeof country_code != 'undefined' && country_code !== null) {
						apaczka_point_data.apm_country_code = country_code;
					}
				}
			}
			if ( ! apaczka_point_data.apm_country_code || 'undefined' === typeof apaczka_point_data.apm_country_code ) {
				let shipping_country = $( '#shipping-country' );
				if (typeof shipping_country != 'undefined' && shipping_country !== null) {
					let shipping_country_code = $( shipping_country ).val();
					if (typeof shipping_country_code != 'undefined' && shipping_country_code !== null) {
						apaczka_point_data.apm_country_code = shipping_country_code;
					}
				}
			}

		}



		apaczka_change_react_input(document.getElementById('apaczka-point'), JSON.stringify(apaczka_point_data));

		$('#apaczka_pl_geowidget_block').text(apaczka_block.button_text2);

		let point_desc = '<span id="selected-parcel-machine-desc">' + visible_point_desc + '</span>';

		let apaczka_point = '<div class="apaczka_selected_point_data" id="apaczka_selected_point_data">\n'
			+ visible_point_id
			+ point_desc + '</div>';

		$('#apaczka_selected_point_data_wrap').html(apaczka_point);
		$('#apaczka_selected_point_data_wrap').show();

		$('#shipping-phone').prop('required', true);
		$('label[for="shipping-phone"]').text('Telefon (wymagany)');

	}

	function apaczka_pl_open_modal() {
		document.getElementById( 'apaczka_pl_checkout_validation_modal' ).style.display = 'flex';
	}

	function apaczka_pl_close_modal() {
		document.getElementById( 'apaczka_pl_checkout_validation_modal' ).style.display = 'none';

		// Scroll to map button.
		let scrollToElement = document.getElementById( 'shipping-option' );

		if (scrollToElement) {
			scrollToElement.scrollIntoView( {behavior: 'smooth' } );
		}

	}

	document.addEventListener(
		'change',
		function (e) {
			e          = e || window.event;
			var target = e.target || e.srcElement;

			if ( target.classList.contains( 'wc-block-components-radio-control__input' ) ) {
				let hidden_input = document.getElementById( 'apaczka-point' );
				if (typeof hidden_input != 'undefined' && hidden_input !== null) {
					apaczka_change_react_input( document.getElementById( 'apaczka-point' ), '' );
				}
				$( '#apaczka_selected_point_data' ).each(
					function (ind, elem) {
						$( elem ).remove();
					}
				);
			}

			if ( target.hasAttribute( 'id' ) ) {
				if (target.getAttribute('id') === 'shipping-country') {
					console.log('shipping-country');
					console.log(target.value);
					apaczka_mp_country = target.value;
				}
			}
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

				if (target.getAttribute( 'id' ) === 'apaczka_mp_geowidget_show_map') {
					e.preventDefault();

					if ('' === apaczka_mp_country || typeof apaczka_mp_country === 'undefined' || apaczka_mp_country === null) {
						if ('wcSettings' in window) {
							let wc_settings = window.wcSettings;
							if ('checkoutData' in wc_settings) {
								let checkout_data = wc_settings.checkoutData;
								if ('shipping_address' in checkout_data) {
									let shipping_address = checkout_data.shipping_address;
									console.log('checkout_data');
									console.log(checkout_data);
									if ('country' in shipping_address) {
										apaczka_mp_country = shipping_address.country;
										if ('city' in shipping_address) {
											if ('' === apaczka_mp_initial_map_address ) {
												apaczka_mp_initial_map_address = shipping_address.city;
											}
										}
									}
								}
							}
						}
					}

					let operators             = [];
					let apaczka_only_cod      = false;

					let checked_radio_control = $( 'input[name^="radio-control-"]:checked' );
					if ( typeof checked_radio_control != 'undefined' && checked_radio_control !== null) {
						let id          = $( checked_radio_control ).attr( 'id' );
						let instance_id = null;
						let method_data = null;
						if (typeof id != 'undefined' && id !== null) {
							method_data = id.split( ":" );
							instance_id = method_data[method_data.length - 1];
						}


						if ( instance_id ) {
							if ( ! $.isEmptyObject( apaczka_block.map_config ) ) {
								if ( apaczka_block.map_config.hasOwnProperty( instance_id ) ) {

									let city = $( '#billing_city' ).val();
									if (typeof city != 'undefined' && city !== null) {
										if ('' === apaczka_mp_initial_map_address ) {
											apaczka_mp_initial_map_address = city;
										}
									} else {
										let city_2 = $( '#shipping_city' ).val();
										if (typeof city_2 != 'undefined' && city_2 !== null) {
											if ('' === apaczka_mp_initial_map_address ) {
												apaczka_mp_initial_map_address = city_2;
											}
										}
									}

									if (typeof apaczka_mp_country === 'undefined' || apaczka_mp_country === null || '' === apaczka_mp_country) {
										let shipping_country = $('#shipping_country');
										if (typeof shipping_country != 'undefined' && shipping_country !== null) {
											let country_code_val = $(shipping_country).val();
											if (typeof country_code_val != 'undefined' && country_code_val !== null) {
												apaczka_mp_country = country_code_val;
											} else {
												let billing_country = $('#billing_country');
												if (typeof billing_country != 'undefined' && billing_country !== null) {
													country_code_val = $(billing_country).val();
													if (typeof country_code_val != 'undefined' && country_code_val !== null) {
														apaczka_mp_country = country_code_val;
													}
												}
											}
										}
									}

									let key                        = instance_id;
									let shipping_config            = apaczka_block.map_config[key];
									let apaczka_geowidget_supplier = shipping_config.hasOwnProperty( "geowidget_supplier" ) ? shipping_config.geowidget_supplier : null;
									console.log( 'Apaczka MP: operators' );
									console.log( apaczka_geowidget_supplier );
									console.log( apaczka_mp_country );

									if ( apaczka_geowidget_supplier !== null) {
										operators = apaczka_geowidget_supplier.map(
											function (operator) {
												return apaczka_mp_blocks_create_operator_obj( 'operators-' + operator, operator );
											}
										).filter( Boolean );
										operators = operators.length ? operators : null;

									} else {
										console.log( 'Apaczka MP: no map operators' );
									}
									let geowidget_only_cod = shipping_config.hasOwnProperty( "geowidget_only_cod" ) ? shipping_config.geowidget_only_cod : null;
									if (geowidget_only_cod && 'yes' === geowidget_only_cod) {
										apaczka_only_cod = true;
									} else {
										apaczka_only_cod = false;
									}
								}
							}
						}
					}

					BPWidget.init(
						document.getElementById( 'apaczka_mp_geowidget_modal_inner_content' ),
						{
							callback: function (point) {
								window.apaczka_mp_map_callback_blocks( point );
								let map_modal = document.getElementById( 'apaczka_mp_geowidget_modal_dynamic' );
								if ( typeof map_modal != 'undefined' && map_modal !== null ) {
									map_modal.style.display = 'none';
								}
							},
							posType: 'DELIVERY',
							mapOptions: { zoom: 12 },
							codOnly: apaczka_only_cod,
							operatorMarkers: true,
							countryCodes: apaczka_mp_country,
							initialAddress: apaczka_mp_initial_map_address,
							operators: operators,
							codeSearch: true
						}
					);

					let map_modal = document.getElementById( 'apaczka_mp_geowidget_modal_dynamic' );
					if ( typeof map_modal != 'undefined' && map_modal !== null ) {
						map_modal.style.display = 'flex';
					}

				}
			}

			if ( target.closest( '.wc-block-components-checkout-place-order-button' ) ) {
				let reactjs_input       = document.getElementById( 'apaczka-point' );
				let reactjs_input_lalue = false;
				if (typeof reactjs_input != 'undefined' && reactjs_input !== null) {
					reactjs_input_lalue = reactjs_input.value;
					if ( ! reactjs_input_lalue ) {
						apaczka_pl_open_modal();
					}
				}
			}

			if ( target.classList.contains( 'wc-block-checkout__shipping-method-option' ) ) {
				console.log( 'Change shipping method button' );
				let hidden_input = document.getElementById( 'is-apaczka-method' );
				if (typeof hidden_input != 'undefined' && hidden_input !== null) {
					apaczka_change_react_input( document.getElementById( 'is-apaczka-method' ), '' );
				}
			}

		}
	);

	$( document ).ready(
		function () {

			// console.log("wcSettings");
			// console.log(wcSettings );

			let apaczka_geowidget_modal       = document.createElement( 'div' );
			apaczka_geowidget_modal.innerHTML = '<div ' +
			'class="apaczka_mp_geowidget_modal" style="display:none;"' +
			' id="apaczka_mp_geowidget_modal_dynamic" style="display: none">' +
			'<div class="apaczka_mp_geowidget_modal_inner">' +
			'<span id="apaczka_mp_geowidget_modal_cross">&times;</span>' +
			'<div id="apaczka_mp_geowidget_modal_inner_content"></div>' +
			'</div>' +
			'</div>';
			document.body.appendChild( apaczka_geowidget_modal );

			apaczka_mp_wait_fo_element( '#shipping-city' ).then(
				function (city_input) {
					$(city_input).on(
						'keyup',
						function () {
							apaczka_mp_initial_map_address = $(this).val();
						}
					);
				}
			);

			apaczka_mp_wait_fo_element( '#shipping-country' ).then(
				function (shipping_country) {
					$(shipping_country).on(
						'change',
						function () {
							apaczka_mp_country = $(this).val();
							console.log('apaczka_mp_country');
							console.log(apaczka_mp_country);
						}
					);
				}
			);

			$( '#apaczka_mp_geowidget_modal_cross' ).on(
				'click',
				function () {
					let map_modal = document.getElementById( 'apaczka_mp_geowidget_modal_dynamic' );
					if (typeof map_modal != 'undefined' && map_modal !== null) {
						map_modal.style.display = 'none';
					}
				}
			);

			$( '.wc-block-components-checkout-place-order-button__text' ).on(
				'click',
				function () {
					let reactjs_input       = document.getElementById( 'apaczka-point' );
					let reactjs_input_lalue = false;
					if (typeof reactjs_input != 'undefined' && reactjs_input !== null) {
						reactjs_input_lalue = reactjs_input.value;
						if ( ! reactjs_input_lalue ) {
							apaczka_pl_open_modal();
						}
					}
				}
			);

			let modal       = document.createElement( 'div' );
			modal.innerHTML = '<div id="apaczka_pl_checkout_validation_modal" style="' +
				'display: none;' +
				'position: fixed;' +
				'top: 0;' +
				'left: 0;' +
				'width: 100%;' +
				'height: 100%;' +
				'background-color: rgba(0, 0, 0, 0.5);' +
				'justify-content: center;' +
				'align-items: center;' +
				'z-index: 1000;">' +
				'<div style="' +
				'background-color: white;' +
				'width: 90%;' +
				'max-width: 300px;' +
				'padding: 20px;' +
				'position: relative;' +
				'text-align: center;' +
				'border-radius: 10px;' +
				'box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">' +
				'<span id="apaczka_pl_close_modal_cross" style="' +
				'position: absolute;' +
				'top: 10px;' +
				'right: 15px;' +
				'font-size: 20px;' +
				'cursor: pointer;">&times;</span>' +
				'<div style="margin:20px 0; font-size:18px;">' +
				apaczka_block.alert_text +
				'</div>' +
				'<button id="apaczka_pl_close_modal_button" style="' +
				'padding: 10px 20px;' +
				'background-color: #007BFF;' +
				'color: white;' +
				'border: none;' +
				'border-radius: 5px;' +
				'cursor: pointer;' +
				'font-size: 16px;">' +
				'Ok' +
				'</button>' +
				'</div>' +
				'</div>';

			document.body.appendChild( modal );
			document.getElementById( 'apaczka_pl_close_modal_cross' ).addEventListener( 'click', apaczka_pl_close_modal );
			document.getElementById( 'apaczka_pl_close_modal_button' ).addEventListener( 'click', apaczka_pl_close_modal );

		}
	);

	function apaczka_mp_blocks_create_operator_obj(operatorId, operatorName) {

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

})( jQuery );
