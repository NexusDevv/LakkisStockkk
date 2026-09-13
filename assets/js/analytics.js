/* Keeps the original Google Analytics measurement ID. Loading is asynchronous
   and never required for browsing, account access, or WhatsApp ordering. */
(() => {
  'use strict';
  const id = window.LAKKIS_FIREBASE_CONFIG?.measurementId;
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return;
  window.dataLayer = window.dataLayer || [];
  function track(){ window.dataLayer.push(arguments); }
  track('js',new Date());
  track('config',id);
  const start = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(start,{timeout:4000});
  else setTimeout(start,1500);
  document.addEventListener('click',event => {
    const link = event.target.closest('a[href]');
    if (!link || !/^https:\/\/wa\.me\//.test(link.href)) return;
    // Never send WhatsApp message bodies or customer support text to analytics.
    if (link.id === 'checkout-whatsapp') {
      track('event','begin_checkout',{currency:'USD',value:Number(link.dataset.orderValue)||0});
    } else {
      track('event','select_item',{item_list_name:'Storefront',items:[{item_id:link.dataset.analyticsItem || 'whatsapp-inquiry'}]});
    }
  });
})();
