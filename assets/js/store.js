(() => {
  'use strict';
  const store = window.LAKKIS_STORE;
  if (!store) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${name}"/></svg>`;
  const keys = {cart:'lakkisstock.bag.v2', currency:'lakkisstock.currency.v2'};
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* The current tab still works if storage is disabled. */ } };
  const categories = {all:'products',popular:'popular picks',streaming:'streaming services',music:'music service',gaming:'gaming products',data:'data service',shopping:'shopping services'};
  const typeLabels = {streaming:'Streaming',music:'Music',gaming:'Gaming',data:'Mobile data',shopping:'Shopping'};
  let currency = read(keys.currency) === 'lbp' ? 'lbp' : 'usd';
  let category = 'all';
  let query = '';
  let sort = 'featured';
  let activeProduct = null;
  let activeType = '';
  let activePlan = null;
  let shoppingProduct = null;
  let toastTimer;
  const productById = id => store.products.find(p => p.id === id);
  const minPlan = p => p.plans?.reduce((a,b) => a.price <= b.price ? a : b);
  const usd = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
  const money = value => currency === 'lbp' ? Math.round(value * store.lbpPerUsd).toLocaleString('en-US') + ' LBP' : usd(value);
  const wa = text => `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`;
  const validateBag = raw => {
    try {
      const parsed = JSON.parse(raw || '[]');
      if (!Array.isArray(parsed)) return [];
      const merged = new Map();
      for (const item of parsed.slice(0,100)) {
        const product = productById(item?.productId);
        if (!product?.plans?.some(p => p.id === item?.planId)) continue;
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) continue;
        const key = `${product.id}:${item.planId}`;
        const previous = merged.get(key)?.quantity || 0;
        merged.set(key,{productId:product.id,planId:item.planId,quantity:Math.min(20,previous+quantity)});
      }
      return [...merged.values()];
    } catch { return []; }
  };
  let bag = validateBag(read(keys.cart));
  const persistBag = () => write(keys.cart, JSON.stringify(bag));
  function closeDialog(dialog) { if (dialog?.open) dialog.close(); }
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    $$('dialog[open]').forEach(closeDialog);
    setMenu(false);
    dialog.showModal();
  }
  function toast(message, bagAction = false) {
    clearTimeout(toastTimer);
    const el = $('#toast');
    el.innerHTML = `<span>${escape(message)}</span>${bagAction ? '<button data-open-cart>View bag →</button>' : ''}`;
    el.hidden = false;
    toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
  }
  function setMenu(open) {
    $('#mobile-menu').hidden = !open;
    $('#menu-button').setAttribute('aria-expanded', String(open));
    $('#menu-button').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  function renderCatalog() {
    let products = store.products.filter(p => {
      const categoryMatch = category === 'all' || (category === 'popular' ? p.popular : p.category === category);
      const terms = `${p.name} ${p.tagline} ${p.category} ${typeLabels[p.category]} ${p.description} ${p.plans?.map(v => `${v.type} ${v.label}`).join(' ') || ''}`.toLowerCase();
      return categoryMatch && query.toLowerCase().trim().split(/\s+/).every(word => terms.includes(word));
    });
    if (sort === 'name') products.sort((a,b) => a.name.localeCompare(b.name));
    if (sort.startsWith('price')) products.sort((a,b) => {
      if (a.quote || b.quote) return a.quote === b.quote ? 0 : a.quote ? 1 : -1;
      return (minPlan(a).price - minPlan(b).price) * (sort === 'price-asc' ? 1 : -1);
    });
    $('#product-grid').innerHTML = products.map(p => {
      const plan = minPlan(p);
      const plansLabel = p.quote ? 'Order assistance' : `${p.plans.length} plans`;
      const price = p.quote ? 'Let’s get a quote' : money(plan.price);
      const unit = p.quote ? 'Final price confirmed with you' : p.category === 'gaming' ? `for a ${plan.label}` : p.category === 'data' ? `for ${plan.label}` : `/ ${plan.label}`;
      return `<article class="product-card theme-${p.theme}" id="product-${p.id}">
        <button class="product-art" data-product="${p.id}" aria-label="${p.quote ? 'Request a quote for' : 'View plans for'} ${escape(p.name)}">
          ${p.popular ? '<span class="product-badge">✧ Popular pick</span>' : ''}
          <span class="wordmark">${escape(p.mark)}</span><span class="art-category">${typeLabels[p.category]}${p.category === 'gaming' ? (p.id === 'ps-usa' ? ' · USA' : ' · LEBANON') : ''}</span><span class="art-arrow">${icon('diagonal')}</span>
        </button>
        <div class="product-body"><div class="product-meta"><h3>${escape(p.name)}</h3><span>${plansLabel}</span></div><p>${escape(p.tagline)}</p>
          <div class="price-row"><div class="price-info"><small>${p.quote ? 'SHOPPING MADE SIMPLE' : 'STARTING FROM'}</small><strong class="${p.quote ? 'quote-price' : ''}">${price}</strong><span class="price-unit">${escape(unit)}</span></div><button class="choose-button" data-product="${p.id}" aria-label="Choose ${escape(p.name)}">${icon('plus')}</button></div>
          <button class="view-plans" data-product="${p.id}">${p.quote ? 'Request a quote' : 'Explore plans'} ${icon('arrow')}</button>
        </div></article>`;
    }).join('');
    $('#product-grid').hidden = !products.length;
    $('#empty-results').hidden = !!products.length;
    $('#result-count').textContent = `${products.length} ${products.length === 1 ? 'result' : 'results'}${query.trim() ? ` for “${query.trim()}”` : category !== 'all' ? ` · ${typeLabels[category] || categories[category]}` : ' · Find something you’ll love'}`;
    $$('.category-tab').forEach(button => {const active = button.dataset.category === category;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  }
  function updateUrl() {
    try {
      const url = new URL(location.href);
      for (const [key,value,defaultValue] of [['category',category,'all'],['q',query,''],['sort',sort,'featured']]) {
        if (value === defaultValue) url.searchParams.delete(key); else url.searchParams.set(key,value);
      }
      history.replaceState({},'',url);
    } catch { /* Opening index.html directly still works. */ }
  }
  function readUrl() {
    const params = new URLSearchParams(location.search);
    category = Object.hasOwn(categories,params.get('category')) ? params.get('category') : 'all';
    query = (params.get('q') || '').slice(0,200);
    sort = ['featured','price-asc','price-desc','name'].includes(params.get('sort')) ? params.get('sort') : 'featured';
    $('#product-search').value = query;
    $('#product-sort').value = sort;
  }
  function applyCurrency() {
    document.body.classList.toggle('lbp-mode',currency === 'lbp');
    $('#currency').value = currency;
    $('#currency-note').hidden = currency !== 'lbp';
    $('#currency-note').textContent = `Estimated LBP prices · Store conversion: $1 = ${store.lbpPerUsd.toLocaleString('en-US')} LBP. Confirm the final amount with us before payment.`;
    $$('[data-hero-price]').forEach(el => {const p = productById(el.dataset.heroPrice);el.textContent = money(minPlan(p).price);});
    renderCatalog();
    renderBag();
    if ($('#product-dialog').open && activeProduct) renderProduct();
  }
  function openProduct(id) {
    const product = productById(id);
    if (!product) return;
    if (product.quote) {
      shoppingProduct = product;
      $('#shopping-dialog-title').textContent = `${product.name} — get a quote`;
      $('#shopping-description').textContent = product.description;
      $('#shopping-form').reset();
      $('#shopping-links').setCustomValidity('');
      openDialog($('#shopping-dialog'));
      return;
    }
    activeProduct = product;
    activePlan = minPlan(product);
    activeType = activePlan.type;
    renderProduct();
    openDialog($('#product-dialog'));
  }
  function selectedMessage() {
    return `Hi LakkisStock! I’d like to order:\n\n${activeProduct.name}\n${activePlan.type} — ${activePlan.label}\nListed price: ${usd(activePlan.price)}${currency === 'lbp' ? `\nEstimated equivalent: ${money(activePlan.price)} (store rate: $1 = ${store.lbpPerUsd.toLocaleString('en-US')} LBP)` : ''}\n\nPlease confirm availability, account/region requirements, the final total, and Whish Money payment details before I pay.`;
  }
  function renderProduct() {
    const p = activeProduct;
    const types = [...new Set(p.plans.map(plan => plan.type))];
    $('#product-detail').innerHTML = `<div class="detail-art theme-${p.theme}" aria-hidden="true">${escape(p.mark)}</div><div class="product-detail-body"><span class="eyebrow">${typeLabels[p.category].toUpperCase()} · CHOOSE YOUR PLAN</span><h2 id="product-title">${escape(p.name)}</h2><p>${escape(p.description)}</p>
      ${types.length > 1 ? `<div class="segmented" role="group" aria-label="Account type">${types.map(type => `<button data-plan-type="${escape(type)}" class="${type === activeType ? 'active' : ''}" aria-pressed="${type === activeType}">${escape(type)}</button>`).join('')}</div>` : ''}
      <fieldset class="plan-options"><legend>${escape(activeType)} · total plan prices</legend>${p.plans.filter(plan => plan.type === activeType).map(plan => `<label class="plan-option"><input type="radio" name="plan" value="${plan.id}" ${plan.id === activePlan.id ? 'checked' : ''}><span><strong>${escape(plan.label)}</strong><b>${money(plan.price)}</b></span></label>`).join('')}</fieldset>
      <div class="selected-total"><span id="selected-label">${escape(activePlan.type)} · ${escape(activePlan.label)}</span><strong id="selected-price" aria-live="polite">${money(activePlan.price)}</strong></div><div class="detail-actions"><button class="button button-primary" id="add-to-bag">${icon('bag')} Add to bag</button><a class="button button-secondary" id="order-plan" data-analytics-item="${p.id}" href="${escape(wa(selectedMessage()))}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')} Order this plan</a></div>
      <p class="form-note">${currency === 'lbp' ? `LBP prices are estimates at $1 = ${store.lbpPerUsd.toLocaleString('en-US')} LBP. ` : ''}Availability and access details are confirmed on WhatsApp. Please wait for confirmation before paying with Whish Money.</p></div>`;
  }
  function addToBag() {
    const item = bag.find(x => x.productId === activeProduct.id && x.planId === activePlan.id);
    if (item?.quantity >= 20) { toast('You already have 20 of this plan in your bag.'); return; }
    if (item) item.quantity++; else bag.push({productId:activeProduct.id,planId:activePlan.id,quantity:1});
    persistBag();renderBag();closeDialog($('#product-dialog'));
    toast(`${activeProduct.name} · ${activePlan.label} added`,true);
  }
  function renderBag() {
    const count = bag.reduce((sum,item) => sum+item.quantity,0);
    $$('.cart-count,.dock-count').forEach(el => { el.textContent = count;el.hidden = count === 0; });
    $$('[data-open-cart]').forEach(el => {el.setAttribute('aria-label',`Open order bag, ${count} ${count === 1 ? 'item' : 'items'}`);el.setAttribute('aria-haspopup','dialog');});
    if (!bag.length) {
      $('#cart-items').innerHTML = `<div class="cart-empty">${icon('bag')}<h3>A little room for your favorites.</h3><p>Choose a plan and add it here.<br>We’ll put your order into one WhatsApp message.</p><button class="button button-primary" id="continue-shopping">Explore the store ${icon('arrow')}</button></div>`;
      $('#cart-summary').innerHTML = '';return;
    }
    let totalCents = 0;
    const lines = [];
    $('#cart-items').innerHTML = bag.map(item => {
      const p = productById(item.productId);
      const plan = p.plans.find(plan => plan.id === item.planId);
      const subtotal = Math.round(plan.price * 100) * item.quantity;
      totalCents += subtotal;
      lines.push(`• ${p.name} — ${plan.type}, ${plan.label}\n  Qty: ${item.quantity} × ${usd(plan.price)} = ${usd(subtotal / 100)}`);
      return `<article class="cart-line" data-product-id="${p.id}" data-plan-id="${plan.id}"><span class="cart-mark theme-${p.theme}">${escape(p.name.charAt(0))}</span><div class="cart-line-info"><h3>${escape(p.name)}</h3><p>${escape(plan.type)} · ${escape(plan.label)}</p><div class="quantity-control"><button data-quantity="-1" aria-label="Decrease quantity of ${escape(p.name)} ${escape(plan.label)}">${icon('minus')}</button><span aria-label="Quantity">${item.quantity}</span><button data-quantity="1" ${item.quantity >= 20 ? 'disabled' : ''} aria-label="Increase quantity of ${escape(p.name)} ${escape(plan.label)}">${icon('plus')}</button><button class="remove-item" data-remove aria-label="Remove ${escape(p.name)} ${escape(plan.type)} ${escape(plan.label)}">${icon('trash')}Remove</button></div></div><strong class="line-price">${money(subtotal/100)}</strong></article>`;
    }).join('');
    const total = totalCents / 100;
    const message = `Hi LakkisStock! I’d like to order:\n\n${lines.join('\n\n')}\n\nListed total: ${usd(total)}${currency === 'lbp' ? `\nEstimated equivalent: ${money(total)}\nStore conversion: $1 = ${store.lbpPerUsd.toLocaleString('en-US')} LBP` : ''}\n\nPlease confirm availability, account/region requirements, the final total, and Whish Money payment details before I pay.`;
    $('#cart-summary').innerHTML = `<div class="cart-total"><span>${currency === 'lbp' ? 'Estimated total' : 'Listed total'} · ${count} ${count === 1 ? 'item' : 'items'}</span><strong>${money(total)}</strong></div>${currency === 'lbp' ? `<p class="cart-usd">${usd(total)} USD · Store estimate: $1 = ${store.lbpPerUsd.toLocaleString('en-US')} LBP</p>` : ''}<p class="form-note">Ready when you are. Send your bag to WhatsApp and we’ll confirm availability and the final total before payment.</p><a class="button button-primary full-width" id="checkout-whatsapp" data-order-value="${total}" href="${escape(wa(message))}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')} Send order on WhatsApp ${icon('arrow')}</a><button class="text-button full-width" id="continue-shopping">Keep exploring</button>`;
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button,a');
    if (!button) return;
    if (button.matches('[data-close]')) { closeDialog(button.closest('dialog'));return; }
    if (button.matches('[data-open-cart]')) { $('#toast').hidden = true;openDialog($('#cart-dialog'));return; }
    if (button.dataset.product) { openProduct(button.dataset.product);return; }
    if (button.dataset.category) { category = button.dataset.category;renderCatalog();updateUrl();return; }
    if (button.dataset.planType) {
      activeType = button.dataset.planType;
      activePlan = activeProduct.plans.find(p => p.type === activeType);
      renderProduct();
      $$('[data-plan-type]',$('#product-dialog')).find(b => b.dataset.planType === activeType)?.focus();
      return;
    }
    if (button.id === 'add-to-bag') { addToBag();return; }
    if (button.matches('[data-quantity],[data-remove]')) {
      const line = button.closest('.cart-line');
      const item = bag.find(x => x.productId === line.dataset.productId && x.planId === line.dataset.planId);
      if (!item) return;
      item.quantity = button.hasAttribute('data-remove') ? 0 : Math.min(20,item.quantity+Number(button.dataset.quantity));
      bag = bag.filter(item => item.quantity > 0);
      persistBag();renderBag();
      const replacement = $$('.cart-line').find(el => el.dataset.productId === line.dataset.productId && el.dataset.planId === line.dataset.planId);
      (replacement?.querySelector(`[data-quantity="${button.dataset.quantity}"]`) || $('#cart-dialog [data-close]')).focus();
      return;
    }
    if (button.id === 'continue-shopping') {closeDialog($('#cart-dialog'));$('#products').scrollIntoView({behavior:'smooth'});$('#product-search').focus({preventScroll:true});return;}
    if (button.id === 'reset-filters') {category='all';query='';sort='featured';$('#product-search').value='';$('#product-sort').value=sort;renderCatalog();updateUrl();$('#product-search').focus();return;}
    if (button.dataset.policy) {
      const policy = window.LAKKIS_POLICIES?.[button.dataset.policy];
      if (policy) {$('#policy-title').textContent=policy.title;$('#policy-content').innerHTML=policy.body;openDialog($('#policy-dialog'));}
      return;
    }
    if (button.closest('#mobile-menu') && button.tagName === 'A') setMenu(false);
  });
  $('#product-detail').addEventListener('change', event => {
    if (event.target.name !== 'plan') return;
    activePlan = activeProduct.plans.find(p => p.id === event.target.value);
    $('#selected-label').textContent = `${activePlan.type} · ${activePlan.label}`;
    $('#selected-price').textContent = money(activePlan.price);
    $('#order-plan').href = wa(selectedMessage());
  });
  $('#product-search').addEventListener('input', event => {query=event.target.value.slice(0,200);renderCatalog();updateUrl();});
  $('#product-sort').addEventListener('change', event => {sort=event.target.value;renderCatalog();updateUrl();});
  $('#currency').addEventListener('change', event => {currency=event.target.value === 'lbp' ? 'lbp' : 'usd';write(keys.currency,currency);applyCurrency();});
  $('#menu-button').addEventListener('click', () => setMenu($('#mobile-menu').hidden));
  document.addEventListener('click', event => {if (!event.target.closest('#navbar')) setMenu(false);});
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input,textarea,select,[contenteditable="true"]') && !$('dialog[open]')) {event.preventDefault();$('#product-search').focus();}
  });
  $$('dialog').forEach(dialog => {
    let downOnBackdrop = false;
    const outside = event => {const r=dialog.getBoundingClientRect();return event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom;};
    dialog.addEventListener('pointerdown', event => { downOnBackdrop = event.target === dialog && outside(event); });
    dialog.addEventListener('click', event => { if (downOnBackdrop && event.target === dialog && outside(event)) closeDialog(dialog);downOnBackdrop=false; });
  });
  $('#shopping-links').addEventListener('input', () => $('#shopping-links').setCustomValidity(''));
  $('#shopping-form').addEventListener('submit', event => {
    event.preventDefault();
    const field = $('#shopping-links');
    const links = field.value.split('\n').map(s=>s.trim()).filter(Boolean);
    const valid = links.length && links.every(link => {try {return ['https:','http:'].includes(new URL(link).protocol);} catch {return false;}});
    if (!valid) {field.setCustomValidity('Please enter complete product links, one per line (starting with https://).');field.reportValidity();return;}
    const message = `Hi LakkisStock! I’d like a quote for ${shoppingProduct.name}.\n\nProduct links:\n${links.join('\n')}\n\nOptions and quantities:\n${$('#shopping-options').value.trim()}\n\nDelivery area:\n${$('#shopping-location').value.trim()}\n\nPlease confirm product availability, the full cost including applicable shipping, service and extra charges, delivery estimate, and Whish Money payment details before I pay.`;
    window.open(wa(message),'_blank','noopener,noreferrer');
  });
  window.addEventListener('storage', event => {if(event.key === keys.cart){bag=validateBag(event.newValue);renderBag();}if(event.key === keys.currency){currency=event.newValue==='lbp'?'lbp':'usd';applyCurrency();}});
  window.addEventListener('popstate', () => {readUrl();renderCatalog();});
  function openLegacyProduct() { const id=location.hash.replace(/^#product-/,'');if(location.hash.startsWith('#product-') && productById(id)) openProduct(id); }
  window.addEventListener('hashchange',openLegacyProduct);
  $('#current-year').textContent = new Date().getFullYear();
  readUrl();applyCurrency();openLegacyProduct();
  window.StoreUI = {openDialog,closeDialog,toast,escape,icon};
})();
