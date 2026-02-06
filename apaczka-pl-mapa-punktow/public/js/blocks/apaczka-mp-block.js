(() => {
    "use strict";
    const e = window.wc.blocksCheckout, t = window.wp.element, a = window.wp.i18n,
        n = window.wp.data, {ExperimentalOrderMeta: o} = wc.blocksCheckout;

    function l({handleDeliveryPointChange: e, apaczkaDeliveryPoint: a}) {
        return (0, t.createElement)("div", {
            className: "apaczka-delivery-point-wrap",
            style: {display: "none"}
        }, (0, t.createElement)("input", {value: a, type: "text", id: "apaczka-point", onChange: e}))
    }

    const c = JSON.parse('{"apiVersion":2,"name":"apaczka-mapa-punktow/apaczka-mapa-punktow-block","version":"2.0.0","title":"Apaczka Mapa Punktow Shipping Options Block","category":"woocommerce","description":"Adds map button and input to save delivery point data.","supports":{"html":false,"align":false,"multiple":false,"reusable":false},"parent":["woocommerce/checkout-shipping-methods-block"],"attributes":{"lock":{"type":"object","default":{"remove":true,"move":true}},"text":{"type":"string","source":"html","selector":".wp-block-apaczka-mapa-punktow","default":""}},"textdomain":"apaczka-pl-mapa-punktow","editorStyle":""}');
    (0, e.registerCheckoutBlock)({
        metadata: c, component: ({checkoutExtensionData: e, extensions: c}) => {
            let i = !1, p = null;
            const [s, r] = (0, t.useState)(""), {setExtensionData: u} = e, d = "apaczka-delivery-point-error", {
                setValidationErrors: k,
                clearValidationError: m
            } = (0, n.useDispatch)("wc/store/validation");
            let w = (0, n.useSelect)((e => e("wc/store/cart").getShippingRates()));
            const g = (0, t.useCallback)((() => {
                i && !s && k({
                    [d]: {
                        message: (0, a.__)("Delivery point must be chosen!", "apaczka-pl-mapa-punktow"),
                        hidden: !0
                    }
                })
            }), [s, k, m, i]);
            if (null != w) {
                let e = w[Object.keys(w)[0]];
                if (null != e && e.hasOwnProperty("shipping_rates")) {
                    const t = e.shipping_rates, a = [];
                    if (null != t) {
                        for (let e of t) "pickup_location" !== e.method_id && (!0 === e.selected && (p = e.instance_id), a.push(e));
                        if (!p && a.length > 0) {
                            const e = document.getElementsByClassName("wc-block-components-shipping-rates-control")[0];
                            if (null != e) {
                                const t = e.querySelector('input[name^="radio-control-"]:checked');
                                if (null != t) {
                                    let e = t.getAttribute("id");
                                    if (console.log(e), null != e) {
                                        let t = e.split(":");
                                        p = t[t.length - 1], g()
                                    }
                                }
                            }
                        }
                    }
                }
            }
            const h = window.apaczka_block && window.apaczka_block.map_config ? window.apaczka_block.map_config : {};
            /*console.log("selectedShippingInstanceID"), console.log(p),*/ /*console.log("mapConfig"), console.log(h),*/ null != h && 0 !== Object.keys(h).length && h.hasOwnProperty(p) && (i = !0);
            const _ = (0, t.useCallback)((() => {
                if (s || !i) return m(d), !0;
                i && k({
                    [d]: {
                        message: (0, a.__)("Delivery point must be chosen!", "apaczka-pl-mapa-punktow"),
                        hidden: !0
                    }
                })
            }), [s, k, m, i]);
            return (0, t.useEffect)((() => {
                g(), _(), u("apaczka", "apaczka-point", s)
            }), [s, u, _]), (0, t.createElement)(t.Fragment, null, i && (0, t.createElement)(t.Fragment, null, (0, t.createElement)("div", {
                className: "button alt geowidget_show_map checkout-block",
                id: "apaczka_mp_geowidget_show_map"
            }, (0, a.__)("Wybierz punkt dostawy", "apaczka-pl-mapa-punktow")), (0, t.createElement)("div", {
                id: "apaczka_selected_point_data_wrap",
                className: "apaczka_selected_point_data_wrap",
                style: {display: "none"}
            }), (0, t.createElement)(o, null, (0, t.createElement)(l, {
                apaczkaDeliveryPoint: s,
                handleDeliveryPointChange: e => {
                    const t = e.target.value;
                    r(t)
                }
            }))))
        }
    })
})();