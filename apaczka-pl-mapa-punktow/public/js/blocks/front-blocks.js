var apaczkaMap;
var apaczka_geowidget_supplier;
var geowidget_only_cod = false;
var apaczka_only_cod = false;

function apaczka_wait_fo_element(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}


function apaczka_change_react_input(input,value){
    if (typeof input != 'undefined' && input !== null) {
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        ).set;
        nativeInputValueSetter.call(input, value);
        var inputEvent = new Event("input", { bubbles: true });
        input.dispatchEvent(inputEvent);
    }
}


function apaczka_set_apm_data(record) {

    let visible_point_id = '';
    let visible_point_desc = '';
    let visible_city = '';
    let visible_street = '';
    let visible_house = '';
    let apaczka_point_data = {};

    if ('foreign_access_point_id' in record) {
        apaczka_point_data.apm_access_point_id = record.foreign_access_point_id;
        visible_point_id = '<div id="selected-parcel-machine-id">' + record.foreign_access_point_id + '</div>\n';
    }

    if ('supplier' in record) {
        apaczka_point_data.apm_supplier =  record.supplier;
    }

    if ('name' in record) {
        apaczka_point_data.apm_name =  record.name;
        visible_point_desc += record.name;
    }

    if ('foreign_access_point_id' in record) {
        apaczka_point_data.apm_foreign_access_point_id =  record.foreign_access_point_id;
    }

    if ('street' in record) {
        apaczka_point_data.apm_street = record.street;
        visible_point_desc += '<br>' + record.street;
    }

    if ('city' in record) {
        apaczka_point_data.apm_city =  record.city;
        visible_point_desc += '<br>' + record.city;
    }

    if ('postal_code' in record) {
        apaczka_point_data.apm_postal_code =  record.postal_code;
        visible_point_desc += '<br>' + record.postal_code;
    }

    if ('country_code' in record) {
        apaczka_point_data.apm_country_code =  record.country_code;
    }

    apaczka_change_react_input(document.getElementById('apaczka-point'), JSON.stringify(apaczka_point_data));

    jQuery('#geowidget_show_map').text(apaczka_block.button_text2);

    let point_desc = '<span id="selected-parcel-machine-desc">' + visible_point_desc + '</span>';

    let apaczka_point = '<div class="apaczka_selected_point_data" id="apaczka_selected_point_data">\n'
        + visible_point_id
        + point_desc + '</div>';

    jQuery('#apaczka_selected_point_data_wrap').html(apaczka_point);
    jQuery('#apaczka_selected_point_data_wrap').show();

    jQuery('#shipping-phone').prop('required', true);
    jQuery('label[for="shipping-phone"]').text('Telefon (wymagany)');

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


document.addEventListener('change', function (e) {
    e = e || window.event;
    var target = e.target || e.srcElement;

    if ( target.classList.contains( 'wc-block-components-radio-control__input' ) ) {
        apaczkaMap = new ApaczkaMap({
            app_id: 'apaczka-woo-checkout',
            onChange: function (record) {
                if (record) {
                    apaczka_set_apm_data(record);
                }
            }
        });

        let hidden_input = document.getElementById('apaczka-point');
        if (typeof hidden_input != 'undefined' && hidden_input !== null) {
            apaczka_change_react_input(document.getElementById('apaczka-point'), '');
        }

        jQuery('#apaczka_selected_point_data').each(function(ind, elem) {
            jQuery(elem).remove();
        });
    }
});


document.addEventListener('click', function (e) {
    e = e || window.event;
    var target = e.target || e.srcElement;

    if ( target.hasAttribute('id') )  {


        if (target.getAttribute('id') === 'geowidget_show_map') {
            e.preventDefault();

            let checked_radio_control = jQuery('input[name^="radio-control-"]:checked');
            if( typeof checked_radio_control != 'undefined' && checked_radio_control !== null) {
                let id = jQuery(checked_radio_control).attr('id');
                let instance_id = null;
                let method_data = null;
                if (typeof id != 'undefined' && id !== null) {
                    method_data = id.split(":");
                    instance_id = method_data[method_data.length - 1];
                }

                if ( instance_id ) {
                    if( ! jQuery.isEmptyObject(apaczka_block.map_config) ) {
                        if (apaczka_block.map_config.hasOwnProperty(instance_id)) {

                            let shipping_country = jQuery('#shipping-country');
                            if (typeof shipping_country != 'undefined' && shipping_country !== null) {
                                let shipping_country_code = jQuery(shipping_country).val();
                                if (typeof shipping_country_code != 'undefined' && shipping_country_code !== null) {
                                    apaczkaMap.setCountryCode(shipping_country_code);
                                }
                            }

                            var key = instance_id;
                            var shipping_config = apaczka_block.map_config[key];
                            apaczka_geowidget_supplier = shipping_config.hasOwnProperty("geowidget_supplier") ? shipping_config.geowidget_supplier : null;
                            if( apaczka_geowidget_supplier !== null) {
                                apaczkaMap.setFilterSupplierAllowed(apaczka_geowidget_supplier);
                            }
                            geowidget_only_cod = shipping_config.hasOwnProperty("geowidget_only_cod") ? shipping_config.geowidget_only_cod : null;
                            if (geowidget_only_cod && 'yes' === geowidget_only_cod) {
                                apaczka_only_cod = true;
                            } else {
                                apaczka_only_cod = false;
                            }
                        }
                    }
                }
            }

            apaczkaMap.show();

            apaczka_wait_fo_element( '.apaczkaMapFilterCod' ).then(
                (elm) => {
                    if( apaczka_only_cod ) {
                        apaczkaMap.filter_services_cod = true;
                        jQuery(elm).addClass('selected');
                    } else {
                        apaczkaMap.filter_services_cod = false;
                        jQuery(elm).removeClass('selected');
                    }
                }
            );
        }
    }

    if ( target.classList.contains( 'wc-block-components-checkout-place-order-button' )
        || target.classList.contains( 'wc-block-checkout__actions_row' )
        || target.classList.contains( 'wc-block-components-button__text' ) )
    {

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
        console.log('Change shipping method button');
        let hidden_input = document.getElementById('is-apaczka-method');
        if (typeof hidden_input != 'undefined' && hidden_input !== null) {
            apaczka_change_react_input(document.getElementById('is-apaczka-method'), '');
        }
    }

});




jQuery(document).ready(function() {

    // console.log("wcSettings");
    // console.log(wcSettings );
	
	
	jQuery('.wc-block-components-checkout-place-order-button__text').on(
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
	

    apaczkaMap = new ApaczkaMap({
        app_id: 'apaczka-woo-checkout',
        onChange: function (record) {
            if (record) {
                //console.log(record);
                apaczka_set_apm_data(record);
            }
        }
    });


    let modal       = document.createElement( 'div' );
    modal.innerHTML = `
		<div id="apaczka_pl_checkout_validation_modal" style="
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			width: 100%; 
			height: 100%; 
			background-color: rgba( 0, 0, 0, 0.5 );
			justify-content: center;
			align-items: center;
			z-index: 1000;">
			<div style="
			background-color: white;
			width: 90%; 
			max-width: 300px;
			padding: 20px;
			position: relative;
			text-align: center;
			border-radius: 10px;
			box-shadow: 0px 4px 10px rgba( 0, 0, 0, 0.1 );">
			<span id="apaczka_pl_close_modal_cross" style="
				position: absolute;
				top: 10px;
				right: 15px;
				font-size: 20px;
				cursor: pointer;">&times;</span>
			<div style="margin:20px 0; font-size:18px;">`
        + apaczka_block.alert_text +
        `</div>
			<button id="apaczka_pl_close_modal_button" style="
				padding: 10px 20px;
				background-color: #007BFF;
				color: white;
				border: none;
				border-radius: 5px;
				cursor: pointer;
				font-size: 16px;">
				Ok
			</button>
			</div>
		</div>
		`;

    document.body.appendChild( modal );
    document.getElementById( 'apaczka_pl_close_modal_cross' ).addEventListener( 'click', apaczka_pl_close_modal );
    document.getElementById( 'apaczka_pl_close_modal_button' ).addEventListener( 'click', apaczka_pl_close_modal );

});



