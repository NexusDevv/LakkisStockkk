/* Edit products and prices here. No build step is required. */
window.LAKKIS_STORE = {
  name: 'LakkisStock',
  whatsapp: '96170708025',
  email: 'lakkisstockinquiry@gmail.com',
  instagram: 'https://www.instagram.com/lakkisstock/',
  feedback: 'https://www.instagram.com/stories/highlights/18015522128034327/',
  // Retains the conversion used in the original site. This is a store estimate,
  // not a live exchange-rate feed. Confirm the final payable amount on WhatsApp.
  lbpPerUsd: 90000,
  products: [
    {id:'netflix', name:'Netflix', category:'streaming', mark:'NETFLIX', theme:'netflix', popular:true, tagline:'Your next great watch starts here.', description:'Movies, series, and a little something for every mood. Choose the account type and duration that work for you.', plans:[
      {id:'u1',type:'User Account',label:'1 month',price:3.5},
      {id:'u3',type:'User Account',label:'3 months',price:9},
      {id:'u6',type:'User Account',label:'6 months',price:15},
      {id:'u12',type:'User Account',label:'1 year',price:25},
      {id:'f1',type:'Full Account',label:'1 month',price:14},
      {id:'f3',type:'Full Account',label:'3 months',price:25},
      {id:'f12',type:'Full Account',label:'1 year',price:90}
    ]},
    {id:'shahid', name:'Shahid', category:'streaming', mark:'shahid', theme:'shahid', tagline:'Arabic stories. Your kind of entertainment.', description:'Explore Arabic series, movies, and originals. Confirm the available package and access details before payment.', plans:[
      {id:'u1',type:'User Account',label:'1 month',price:5},
      {id:'u3',type:'User Account',label:'3 months',price:12},
      {id:'u12',type:'User Account',label:'1 year',price:35},
      {id:'f1',type:'Full Account',label:'1 month',price:10},
      {id:'f3',type:'Full Account',label:'3 months',price:22}
    ]},
    {id:'disney', name:'Disney+', category:'streaming', mark:'Disney+', theme:'disney', popular:true, tagline:'A whole world of favorites.', description:'Disney, Pixar, Marvel, and Star Wars in one place. Choose your subscription duration below.', plans:[
      {id:'u1',type:'User Account',label:'1 month',price:5},
      {id:'u3',type:'User Account',label:'3 months',price:10}
    ]},
    {id:'anghami', name:'Anghami', category:'music', mark:'anghami', theme:'anghami', popular:true, tagline:'More music. Fewer interruptions.', description:'Choose a music subscription for your everyday soundtrack. Confirm account and activation details with our team.', plans:[
      {id:'s3',type:'Subscription',label:'3 months',price:9},
      {id:'s6',type:'Subscription',label:'6 months',price:15},
      {id:'s12',type:'Subscription',label:'1 year',price:20}
    ]},
    {id:'osn', name:'OSN+', category:'streaming', mark:'osn+', theme:'osn', tagline:'Make your next night in a good one.', description:'Blockbusters, series, and originals. User and full account options are available.', plans:[
      {id:'u1',type:'User Account',label:'1 month',price:4.99},
      {id:'u12',type:'User Account',label:'1 year',price:39.99},
      {id:'f1',type:'Full Account',label:'1 month',price:9.99},
      {id:'f12',type:'Full Account',label:'1 year',price:89.99}
    ]},
    {id:'amazon-prime', name:'Amazon Prime', category:'streaming', mark:'prime video', theme:'prime', tagline:'Press play on something new.', description:'Prime Video access for movies, series, and originals. Ask us about availability for your device and location.', plans:[
      {id:'p1',type:'Prime Account',label:'1 month',price:7},
      {id:'p12',type:'Prime Account',label:'1 year',price:18}
    ]},
    {id:'watchit', name:'WATCH IT', category:'streaming', mark:'WATCH IT', theme:'watchit', tagline:'Arabic originals, on your schedule.', description:'Premium entertainment with movies, series, and Arabic originals. Select a monthly or yearly plan.', plans:[
      {id:'p1',type:'Premium',label:'1 month',price:5.99},
      {id:'p12',type:'Premium',label:'1 year',price:39.99}
    ]},
    {id:'ps-usa', name:'PlayStation USA', category:'gaming', mark:'PlayStation', theme:'playstation', tagline:'Your next game is waiting.', description:'Digital gift cards for a USA PlayStation account. The card region must match your account region. The amount on the card differs from the purchase price.', plans:[
      {id:'v10',type:'USA gift card',label:'$10 card',price:12},
      {id:'v25',type:'USA gift card',label:'$25 card',price:27},
      {id:'v50',type:'USA gift card',label:'$50 card',price:52},
      {id:'v75',type:'USA gift card',label:'$75 card',price:78},
      {id:'v100',type:'USA gift card',label:'$100 card',price:105}
    ]},
    {id:'ps-lebanon', name:'PlayStation Lebanon', category:'gaming', mark:'PlayStation', theme:'playstation-lb', tagline:'Top up. Download. Play.', description:'Digital gift cards for a Lebanon PlayStation account. Confirm your account region before purchase. The amount on the card differs from the purchase price.', plans:[
      {id:'v10',type:'Lebanon gift card',label:'$10 card',price:12},
      {id:'v20',type:'Lebanon gift card',label:'$20 card',price:22},
      {id:'v40',type:'Lebanon gift card',label:'$40 card',price:42},
      {id:'v50',type:'Lebanon gift card',label:'$50 card',price:53},
      {id:'v100',type:'Lebanon gift card',label:'$100 card',price:105}
    ]},
    {id:'alfa', name:'Alfa Ushare', category:'data', mark:'alfa', theme:'alfa', tagline:'Stay connected, wherever the day goes.', description:'Mobile data packages for Alfa Ushare. Send your Alfa number privately to our team and confirm eligibility and validity before payment.', plans:[
      {id:'d5',type:'Data package',label:'5.5 GB',price:6.99},
      {id:'d7',type:'Data package',label:'7.5 GB',price:7.99},
      {id:'d11',type:'Data package',label:'11 GB',price:9.49},
      {id:'d16',type:'Data package',label:'16.5 GB',price:10.99},
      {id:'d22',type:'Data package',label:'22 GB',price:12.99},
      {id:'d25',type:'Data package',label:'25.5 GB',price:14.49},
      {id:'d33',type:'Data package',label:'33 GB',price:16.99},
      {id:'d44',type:'Data package',label:'44 GB',price:20.99},
      {id:'d55',type:'Data package',label:'55 GB',price:24.99},
      {id:'d66',type:'Data package',label:'66 GB',price:28.99}
    ]},
    {id:'shein', name:'SHEIN Orders', category:'shopping', mark:'SHEIN', theme:'shein', quote:true, tagline:'Your wishlist. We handle the order.', description:'Send your SHEIN links, sizes, colors, and quantities. Get a confirmed quote before you pay with Whish Money.'},
    {id:'amazon-shopping', name:'Amazon Orders', category:'shopping', mark:'amazon', theme:'amazon', quote:true, tagline:'Found it on Amazon? Let’s get it.', description:'Send your product links and delivery location. We confirm product, shipping, service, and any applicable extra costs before payment.'}
  ]
};

/* Emits explicit Product + Offer structured data for every fixed-price item,
   so Google Search Console's Merchant listings / Product snippets checks have
   real price, currency and availability to validate instead of guessing. */
(function () {
  var store = window.LAKKIS_STORE;
  var baseUrl = 'https://nexusdevv.github.io/LakkisStockkk/';

  var items = store.products
    .filter(function (p) { return Array.isArray(p.plans) && p.plans.length; })
    .map(function (p, i) {
      var prices = p.plans.map(function (pl) { return pl.price; });
      var minPrice = Math.min.apply(null, prices);
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          description: p.description,
          image: baseUrl + 'logo.png',
          url: baseUrl + '#product-' + p.id,
          brand: { '@type': 'Brand', name: p.name },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: minPrice.toFixed(2),
            availability: 'https://schema.org/InStock',
            url: baseUrl + '#product-' + p.id
          }
        }
      };
    });

  var ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
})();
