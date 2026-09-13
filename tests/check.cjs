/* No dependencies: node tests/check.cjs
   Source checks and actual storefront script execution against a minimal DOM
   adapter. These are not visual, browser-compatibility, or live Firebase tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
let checks = 0;
function check(name,fn){fn();checks++;}
const decode = s => s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
function harness(initial={},markup=html,bootStore=true) {
  const nodes = new Map(), listeners = {}, storage = new Map(Object.entries(initial)), opened=[];
  const collection = new Map();
  function attrs(text){const result={};for(const m of text.matchAll(/([\w-]+)="([^"]*)"/g))result[m[1]]=decode(m[2]);return result;}
  class Node {
    constructor(tag='div',attributes={}){this.tagName=tag.toUpperCase();this.attributes=attributes;this.id=attributes.id||'';this.value=attributes.value||'';this.dataset={};this.events={};this.style={};this.hidden=false;this.open=false;this.textContent='';this.className=attributes.class||'';this._html='';this.classSet=new Set(this.className.split(' '));this.classList={add:(...items)=>items.forEach(x=>this.classSet.add(x)),remove:(...items)=>items.forEach(x=>this.classSet.delete(x)),contains:x=>this.classSet.has(x),toggle:(x,force)=>{const on=force??!this.classSet.has(x);on?this.classSet.add(x):this.classSet.delete(x);return on;}};for(const [key,value] of Object.entries(attributes))if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;}
    set innerHTML(value){this._html=value;parse(value);}
    get innerHTML(){return this._html;}
    setAttribute(key,value){this.attributes[key]=String(value);}
    getAttribute(key){return this.attributes[key];}
    hasAttribute(key){return key in this.attributes;}
    addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
    fire(name,event={}){for(const fn of this.events[name]||[])fn({target:this,currentTarget:this,preventDefault(){},...event});}
    querySelector(selector){return document.querySelector(selector);}
    querySelectorAll(selector){return document.querySelectorAll(selector);}
    matches(selector){return selector.split(',').some(part=>{part=part.trim();if(part==='button'||part==='a')return this.tagName===part.toUpperCase();if(part.startsWith('#'))return this.id===part.slice(1);if(part.startsWith('.'))return this.classSet.has(part.slice(1));const match=part.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return !!match && (match[2]===undefined?this.hasAttribute(match[1]):this.getAttribute(match[1])===match[2]);});}
    closest(selector){if(this.matches(selector))return this;return this.parent?.closest(selector)||null;}
    showModal(){this.open=true;}
    close(){this.open=false;this.fire('close');}
    reset(){this.wasReset=true;}
    focus(){this.focused=true;}
    scrollIntoView(){this.scrolled=true;}
    setCustomValidity(value){this.validationMessage=value;}
    reportValidity(){return !this.validationMessage;}
    checkValidity(){return true;}
    getBoundingClientRect(){return {left:0,right:500,top:0,bottom:500};}
    replaceChildren(){this._html='';}
    append(){}
    remove(){}
  }
  function parse(markup){for(const m of markup.matchAll(/<([\w-]+)\b([^>]*)>/g)){const a=attrs(m[2]);const n=new Node(m[1],a);if(a.id)nodes.set(a.id,n);for(const key of Object.keys(a).filter(x=>x.startsWith('data-'))){const k=`[${key}]`;if(!collection.has(k))collection.set(k,[]);collection.get(k).push(n);}if(n.classSet.has('category-tab')){if(!collection.has('.category-tab'))collection.set('.category-tab',[]);collection.get('.category-tab').push(n);}if(n.classSet.has('cart-count')||n.classSet.has('dock-count')){if(!collection.has('.cart-count,.dock-count'))collection.set('.cart-count,.dock-count',[]);collection.get('.cart-count,.dock-count').push(n);}}}
  const document = {
    body:new Node('body'),head:{appendChild:script=>queueMicrotask(()=>script.onerror?.())},
    querySelector(selector){if(selector==='dialog[open]')return [...nodes.values()].find(n=>n.tagName==='DIALOG'&&n.open)||null;if(selector.includes(' [data-close]'))return new Node('button',{'data-close':''});if(selector.startsWith('#'))return nodes.get(selector.slice(1))||null;return null;},
    querySelectorAll(selector){if(selector==='dialog'||selector==='dialog[open]')return [...nodes.values()].filter(n=>n.tagName==='DIALOG'&&(selector==='dialog'||n.open));return collection.get(selector)||[];},
    addEventListener(name,fn){(listeners[name]??=[]).push(fn);},
    getElementById:id=>nodes.get(id)||null,
    createElement:tag=>new Node(tag),createDocumentFragment:()=>new Node('fragment')
  };
  parse(markup);
  const context={document,console,Intl,URL,URLSearchParams,Map,Set,Date,Object,Number,Math,JSON,Promise,queueMicrotask,encodeURIComponent,setTimeout:()=>1,clearTimeout:()=>{},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},location:{href:'http://localhost/index.html',search:'',hash:''},history:{replaceState(){}},addEventListener(name,fn){(listeners['window:'+name]??=[]).push(fn);},open:url=>opened.push(url)};
  context.window=context;vm.createContext(context);
  function load(file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});}
  if(bootStore){load('assets/js/catalog.js');load('assets/js/policies.js');load('assets/js/store.js');}
  function click(attributes,extra={}){const n=new Node('button',attributes);Object.assign(n,extra);for(const fn of listeners.click||[])fn({target:n,preventDefault(){}});return n;}
  function input(id,value,event='input'){const n=nodes.get(id);n.value=value;n.fire(event);}
  function node(id){return nodes.get(id);}
  return {context,document,nodes,node,Node,load,click,input,opened,storage,listeners};
}
const h=harness();
const count=()=> (h.node('product-grid').innerHTML.match(/class="product-card /g)||[]).length;
check('Twelve services render',()=>assert.equal(count(),12));
const catalog=h.context.LAKKIS_STORE.products;
check('All 45 original digital prices retained',()=>{
 const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'catalog-baseline.json'),'utf8'));
 assert.equal(catalog.reduce((sum,p)=>sum+(p.plans?.length||0),0),45);
 for(const p of baseline)assert.deepEqual(Array.from(catalog.find(n=>`product-${n.id}`===p.id).plans,p=>p.price),p.prices);
});
check('No duplicate product or plan IDs',()=>{assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);for(const p of catalog)if(p.plans)assert.equal(new Set(p.plans.map(n=>n.id)).size,p.plans.length);});
check('Streaming filter',()=>{h.click({'data-category':'streaming'});assert.equal(count(),6);});
check('Popular filter',()=>{h.click({'data-category':'popular'});assert.equal(count(),3);});
check('Search and category combine',()=>{h.click({'data-category':'gaming'});h.input('product-search','Lebanon');assert.equal(count(),1);assert.match(h.node('product-grid').innerHTML,/PlayStation Lebanon/);});
check('Empty search is explained',()=>{h.input('product-search','no-matching-product');assert.equal(count(),0);assert.equal(h.node('empty-results').hidden,false);});
check('Reset restores the full catalog',()=>{h.click({id:'reset-filters'});assert.equal(count(),12);});
check('Price sorting uses cheapest plan',()=>{h.input('product-sort','price-asc','change');assert.ok(h.node('product-grid').innerHTML.indexOf('id="product-netflix"')<h.node('product-grid').innerHTML.indexOf('id="product-osn"'));});
check('Full account prices use the selected plan',()=>{h.click({'data-product':'netflix'});h.click({'data-plan-type':'Full Account'});h.node('product-detail').fire('change',{target:{name:'plan',value:'f3'}});assert.equal(h.node('selected-price').textContent,'$25.00');assert.match(decodeURIComponent(h.node('order-plan').href),/Full Account — 3 months/);});
check('Add to bag persists the exact selection',()=>{h.click({id:'add-to-bag'});const bag=JSON.parse(h.storage.get('lakkisstock.bag.v2'));assert.deepEqual(bag,[{productId:'netflix',planId:'f3',quantity:1}]);});
check('Quantity updates the total',()=>{const line=new h.Node('article',{'class':'cart-line','data-product-id':'netflix','data-plan-id':'f3'});h.click({'data-quantity':'1'},{parent:line});assert.match(h.node('cart-summary').innerHTML,/\$50\.00/);});
check('Different plans combine without rounding drift',()=>{h.click({'data-product':'disney'});h.node('product-detail').fire('change',{target:{name:'plan',value:'u3'}});h.click({id:'add-to-bag'});assert.match(h.node('cart-summary').innerHTML,/\$60\.00/);});
check('WhatsApp receives itemized order and confirmation request',()=>{const a=h.node('checkout-whatsapp');const url=new URL(a.getAttribute('href'));assert.equal(url.host,'wa.me');assert.equal(url.pathname,'/96170708025');const text=url.searchParams.get('text');assert.match(text,/Netflix — Full Account, 3 months/);assert.match(text,/Qty: 2 × \$25.00 = \$50.00/);assert.match(text,/Disney\+/);assert.match(text,/Listed total: \$60.00/);assert.match(text,/before I pay/);});
check('LBP estimate includes the stored conversion and USD amount',()=>{h.input('currency','lbp','change');assert.match(h.node('cart-summary').innerHTML,/5,400,000 LBP/);assert.match(h.node('currency-note').textContent,/90,000/);const text=new URL(h.node('checkout-whatsapp').getAttribute('href')).searchParams.get('text');assert.match(text,/Listed total: \$60.00/);assert.match(text,/Estimated equivalent: 5,400,000 LBP/);});
check('Bag survives reload using catalog prices',()=>{const restored=harness(Object.fromEntries(h.storage));assert.match(restored.node('cart-summary').innerHTML,/5,400,000 LBP/);});
check('Malformed stored bag cannot crash the storefront',()=>{const bad=harness({'lakkisstock.bag.v2':'{invalid'});assert.match(bad.node('cart-items').innerHTML,/A little room/);});
check('Unknown or negative stored items are discarded; prices cannot be overridden',()=>{const bad=harness({'lakkisstock.bag.v2':JSON.stringify([{productId:'fake',planId:'x',quantity:1},{productId:'netflix',planId:'u1',quantity:-4},{productId:'netflix',planId:'u1',quantity:1,price:0.01}])});assert.match(bad.node('cart-summary').innerHTML,/\$3\.50/);assert.doesNotMatch(bad.node('cart-summary').innerHTML,/\$0\.01/);});
check('Saved quantities are capped',()=>{const bad=harness({'lakkisstock.bag.v2':JSON.stringify([{productId:'netflix',planId:'u1',quantity:999999}])});assert.match(bad.node('cart-summary').innerHTML,/\$70\.00/);});
check('Removing an item recalculates the bag',()=>{const line=new h.Node('article',{'class':'cart-line','data-product-id':'disney','data-plan-id':'u3'});h.click({'data-remove':''},{parent:line});assert.match(h.node('cart-summary').innerHTML,/4,500,000 LBP/);});
check('Shopping request validates complete links',()=>{h.click({'data-product':'shein'});h.input('shopping-links','not a link');h.input('shopping-options','Black / M / 2');h.input('shopping-location','Beirut');h.node('shopping-form').fire('submit');assert.equal(h.opened.length,0);assert.match(h.node('shopping-links').validationMessage,/complete product links/);});
check('Shopping request preserves detailed selections',()=>{h.input('shopping-links','https://www.shein.com/item-one.html\nhttps://www.shein.com/item-two.html');h.input('shopping-options','أسود / M / 2');h.node('shopping-form').fire('submit');assert.equal(h.opened.length,1);const text=new URL(h.opened[0]).searchParams.get('text');assert.match(text,/SHEIN Orders/);assert.match(text,/أسود \/ M \/ 2/);assert.match(text,/Beirut/);assert.match(text,/before I pay/);});
check('Policy content is available',()=>{h.click({'data-policy':'delivery'});assert.equal(h.node('policy-dialog').open,true);assert.match(h.node('policy-content').innerHTML,/after payment confirmation/);});
check('No syntax errors in project scripts',()=>{for(const name of fs.readdirSync(path.join(root,'assets/js')).filter(x=>x.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,'assets/js',name),'utf8'),{filename:name});for(const name of ['index.html','admin.html','marketing-course.html'])for(const m of fs.readFileSync(path.join(root,name),'utf8').matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(!/application\/ld\+json/.test(m[1]||''))new vm.Script(m[2],{filename:name});}});
check('All pages have unique IDs and valid local asset references',()=>{for(const name of ['index.html','admin.html','marketing-course.html']){const text=fs.readFileSync(path.join(root,name),'utf8');const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,`${name}: duplicate ID`);for(const m of text.matchAll(/<(?:script|img|link|use)\b[^>]*?\b(?:src|href)="([^"]+)"/g)){const ref=m[1].split('#')[0];if(ref&&!/^(https?:|data:)/.test(ref))assert.ok(fs.existsSync(path.join(root,ref)),`${name}: missing ${ref}`);}}});
check('All twelve academy units retained',()=>assert.equal((fs.readFileSync(path.join(root,'marketing-course.html'),'utf8').match(/<article><span>\d{2}<\/span>/g)||[]).length,12));
(async()=>{
  const account=harness();account.load('assets/js/firebase-config.js');account.load('assets/js/account.js');account.click({'data-open-account':''});
  await new Promise(resolve=>setImmediate(resolve));
  check('Failed account loading shows a recoverable message',()=>assert.match(account.node('auth-status').textContent,/Couldn’t reach account services/));
  check('Storefront still works after account connection failure',()=>{account.click({'data-category':'streaming'});assert.equal((account.node('product-grid').innerHTML.match(/class="product-card /g)||[]).length,6);});
  const adminHtml=fs.readFileSync(path.join(root,'admin.html'),'utf8');
  const admin=harness({},adminHtml,false);
  let authCallback;
  const mockAuth={currentUser:null,onAuthStateChanged:callback=>{authCallback=callback;},signOut:async()=>{}};
  admin.context.firebase={apps:[{}],auth:()=>mockAuth,firestore:()=>({})};
  for(const match of adminHtml.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)){
    if(!/src=/.test(match[1]||''))vm.runInContext(match[2],admin.context);
  }
  check('Admin inline handlers remain available after bootstrap changes',()=>{assert.equal(typeof admin.context.openThread,'function');assert.equal(typeof admin.context.setStatus,'function');assert.equal(typeof admin.context.removeAdmin,'function');});
  admin.node('threadMessages').innerHTML='<p>Previous account conversation</p>';
  await authCallback(null);
  check('Admin sign-out clears previous ticket conversations',()=>{assert.equal(admin.node('threadMessages').innerHTML,'');assert.ok(!admin.node('loginView').classList.contains('hidden'));});
  console.log(`${checks} source and storefront logic checks passed. No browser or live Firebase requests were used.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
