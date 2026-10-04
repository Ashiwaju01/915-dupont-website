const body = document.body;
  const toggle = document.getElementById('dayNightToggle');
  const setMode = (night) => {
    body.classList.toggle('night', night);
    toggle.querySelectorAll('span').forEach(s => s.classList.remove('active'));
    toggle.querySelector(`[data-mode="${night ? 'night' : 'day'}"]`).classList.add('active');
  };
  toggle.addEventListener('click', () => setMode(!body.classList.contains('night')));

  const heroSection = document.querySelector('.hero');
  const coffeeSection = document.getElementById('coffee');
  new IntersectionObserver((entries) => { entries.forEach(e => { if(e.isIntersecting) setMode(true); }); }, { rootMargin: '-45% 0px -45% 0px' }).observe(coffeeSection);
  new IntersectionObserver((entries) => { entries.forEach(e => { if(e.isIntersecting) setMode(false); }); }, { rootMargin: '-45% 0px -45% 0px' }).observe(heroSection);

  document.querySelectorAll('.clock-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.clock-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const which = chip.dataset.clock;
      document.querySelectorAll('.clock-panel').forEach(p => p.classList.remove('active'));
      document.querySelector(`.clock-panel[data-panel="${which}"]`).classList.add('active');
    });
  });

  function setupChipGroup(id){
    const group = document.getElementById(id);
    if(!group) return;
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });
  }
  setupChipGroup('serviceChips');

  /* ---------- Reservation date/time controls ---------- */
  (() => {
    const dateInput = document.getElementById('resDate');
    const timeInput = document.getElementById('reservationTime');
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0,10);

    if (dateInput) {
      dateInput.min = localToday;
      dateInput.addEventListener('click', () => {
        try { dateInput.showPicker?.(); } catch (_) {}
      });
    }
    if (timeInput) {
      timeInput.addEventListener('click', () => {
        try { timeInput.showPicker?.(); } catch (_) {}
      });
    }
  })();

  /* ---------- FIX: in-page anchor navigation (prevents full navigation / "new chat" behaviour) ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ---------- Menu tabs (consolidated Menu section) ---------- */
  /* ---------- Mobile navigation ---------- */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
  const closeMobileNav = () => {
    if(!mobileNav || !mobileMenuBtn) return;
    mobileNav.classList.remove('open');
    mobileMenuBtn.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded','false');
    mobileNav.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };
  const openMobileNav = () => {
    if(!mobileNav || !mobileMenuBtn) return;
    mobileNav.classList.add('open');
    mobileMenuBtn.classList.add('open');
    mobileMenuBtn.setAttribute('aria-expanded','true');
    mobileNav.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };
  mobileMenuBtn?.addEventListener('click', () => mobileNav.classList.contains('open') ? closeMobileNav() : openMobileNav());
  mobileNavClose?.addEventListener('click', closeMobileNav);
  mobileNavBackdrop?.addEventListener('click', closeMobileNav);
  mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
  
  document.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.menutab;
      document.querySelectorAll('.menu-list').forEach(p => p.classList.remove('active'));
      document.querySelector(`.menu-list[data-menupanel="${which}"]`).classList.add('active');
    });
  });

  /* ---------- FIX: date input year capped at 4 digits, sensible range ---------- */
  const resDate = document.getElementById('resDate');
  if(resDate){
    const today = new Date();
    const y = today.getFullYear();
    resDate.min = `${y}-01-01`;
    resDate.max = `${y+3}-12-31`;
    resDate.addEventListener('input', function(){
      const parts = this.value.split('-');
      if(parts[0] && parts[0].length > 4){
        parts[0] = parts[0].slice(0,4);
        this.value = parts.join('-');
      }
    });
  }

  /* ---------- Pre-order picker (reservation form) ---------- */
  let preorderItems = [];
  const preorderTotalEl = document.getElementById('preorderTotal');
  function renderPreorderTotal(){
    const total = preorderItems.reduce((s,i) => s + i.price, 0);
    preorderTotalEl.textContent = `Pre-order total: $${total}`;
  }
  document.querySelectorAll('.preorder-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.name;
      const price = parseFloat(item.dataset.price);
      const idx = preorderItems.findIndex(i => i.name === name);
      if(idx > -1){
        preorderItems.splice(idx,1);
        item.classList.remove('selected');
      } else {
        preorderItems.push({name, price});
        item.classList.add('selected');
      }
      renderPreorderTotal();
    });
  });

  document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const dateEl = document.getElementById('resDate');
    const timeEl = document.getElementById('reservationTime');
    const partyEl = document.getElementById('reservationPartySize');
    const confirmBox = document.getElementById('confirmBox');
    const confirmText = confirmBox?.querySelector('p');
    const locationEl = document.getElementById('reservationLocation');

    document.getElementById('formFields').style.display = 'none';
    confirmBox?.classList.add('show');

    if (confirmText) {
      const room = locationEl?.selectedOptions?.[0]?.textContent || 'Rooms';
      const party = partyEl?.value || '';
      const date = dateEl?.value || '';
      const time = timeEl?.value || '';
      confirmText.textContent = `Your reservation details are saved on this device for ${room}: ${party} ${party === '1' ? 'guest' : 'guests'} on ${date} at ${time}. Live submission will be connected to Rooms' booking channel in the production build.`;
    }

    const cp = document.getElementById('confirmPreorder');
    if(preorderItems.length){
      let html = '<div class="mono" style="font-size:11px; opacity:.6; margin-bottom:8px;">Pre-order</div>';
      preorderItems.forEach(i => { html += `<div class="cp-row"><span>${i.name}</span><span>${i.price}</span></div>`; });
      cp.innerHTML = html;
    } else if (cp) {
      cp.innerHTML = '';
    }
  });

  /* ---------- Cart ---------- */
  const ROOMS_STORE = 'https://roomscoffee.online';
  const PRODUCT_CATALOG = {
    "Finca La Playita": { price:32, url:`${ROOMS_STORE}/products/finca-la-playita` },
    "El Paraiso 92": { price:32, url:`${ROOMS_STORE}/products/el-paraiso-92` },
    "Minas Gerais": { price:26, url:`${ROOMS_STORE}/products/minas-gerais` },
    "Eduar Gaviria": { price:32, url:`${ROOMS_STORE}/products/eduar-gaviria` },
    "Halo Beriti": { price:28, url:`${ROOMS_STORE}/products/halo-beriti` },
    "Blue Note Tee": { price:40, url:`${ROOMS_STORE}/products/rooms-blue-note-t-shirt` },
    "Rooms LISTEN Tee": { price:35, url:`${ROOMS_STORE}/products/rooms-coffee-listen-tee` },
    "Indigo Denim Tote": { price:40, url:`${ROOMS_STORE}/products/rooms-indigo-denim-tote-bag` },
    "Indigo Denim Tote Bag": { price:40, url:`${ROOMS_STORE}/products/rooms-indigo-denim-tote-bag` },
    "Snake Mickey Tee": { price:40, url:`${ROOMS_STORE}/products/snake-micky-tee` },
    "Cream Baseball Cap": { price:30, url:`${ROOMS_STORE}/products/rooms-baseball-cap` },
    "Navy Baseball Cap": { price:30, url:`${ROOMS_STORE}/products/rooms-blue-baseball-cap` },
    "Eyes Logo Mug": { price:25, url:`${ROOMS_STORE}/products/rooms-classic-ceramic-mug` },
    "Running Man Glass Cup": { price:25, url:`${ROOMS_STORE}/products/rooms-running-man-glass-cup` },
    "Titanium Camping Mug": { price:45, url:`${ROOMS_STORE}/products/rooms-titanium-camping-mug` },
    "Rooms Titanium Camping Mug": { price:45, url:`${ROOMS_STORE}/products/rooms-titanium-camping-mug` }
  };

  const cartCountEl = document.getElementById('cartCount');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const CART_KEY = 'rooms-demo-cart-v2';

  let cart = [];
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (Array.isArray(saved)) cart = saved.filter(i => i && i.name && Number.isFinite(Number(i.price)));
  } catch (_) {}

  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function saveCart(){
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
  }

  function getProductMeta(name, price){
    const catalog = PRODUCT_CATALOG[name];
    return {
      price: Number(catalog?.price ?? price ?? 0),
      url: catalog?.url || null
    };
  }

  function renderCart(){
    const grouped = {};
    cart.forEach(item => {
      if(!grouped[item.name]) {
        const meta = getProductMeta(item.name, item.price);
        grouped[item.name] = {name:item.name,price:meta.price,url:meta.url,qty:0};
      }
      grouped[item.name].qty += 1;
    });
    const items = Object.values(grouped);
    cartCountEl.textContent = cart.length;

    if(!items.length){
      cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    } else {
      cartItemsEl.innerHTML = items.map(item => {
        const name = escapeHtml(item.name);
        const roomLink = item.url
          ? `<a class="ci-room-link mono" href="${item.url}" target="_blank" rel="noopener">View on Rooms ↗</a>`
          : '';
        return `
        <div class="cart-item">
          <div class="ci-name-wrap">
            <span class="ci-name">${name}</span>
            ${roomLink}
          </div>
          <span class="ci-controls">
            <button class="ci-qty" data-action="minus" data-name="${name}" aria-label="Decrease ${name}">−</button>
            <span class="ci-qty-value">${item.qty}</span>
            <button class="ci-qty" data-action="plus" data-name="${name}" aria-label="Increase ${name}">+</button>
            <span class="mono ci-line-total">${item.price * item.qty}</span>
            <button class="ci-remove" data-name="${name}" aria-label="Remove ${name}">&times;</button>
          </span>
        </div>`;
      }).join('');
    }

    const total = cart.reduce((s,i) => s + Number(i.price || 0), 0);
    cartTotalEl.textContent = `${total}`;

    cartItemsEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        const index = cart.findIndex(i => i.name === name);
        if(btn.dataset.action === 'plus'){
          const item = cart.find(i => i.name === name);
          if(item) cart.push({...item});
        } else if(index > -1) {
          cart.splice(index,1);
        }
        saveCart();
        renderCart();
      });
    });

    cartItemsEl.querySelectorAll('.ci-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        cart = cart.filter(i => i.name !== btn.dataset.name);
        saveCart();
        renderCart();
      });
    });
  }

  window.addToCart = function(name, price){
    const meta = getProductMeta(name, price);
    const existing = cart.find(item => item.name === name);
    if(existing) {
      existing.price = meta.price;
      existing.url = meta.url;
      cart.push({...existing});
    } else {
      cart.push({name, price:meta.price, url:meta.url});
    }
    saveCart();
    renderCart();
    showToast(`${name} added to cart`);
    openCart();
  };

  function openCart(){ cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); }
  function closeCart(){ cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); }
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.addToCart(btn.dataset.name, parseFloat(btn.dataset.price));
      btn.textContent = 'Added ✓';
      btn.classList.add('added');
      setTimeout(() => { btn.textContent = 'Add to Cart'; btn.classList.remove('added'); }, 1200);
    });
  });

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if(!cart.length){ showToast('Your cart is empty'); return; }

      const uniqueNames = [...new Set(cart.map(i => i.name))];
      const urls = uniqueNames
        .map(name => getProductMeta(name, 0).url)
        .filter(Boolean);

      if(uniqueNames.length === 1 && urls[0]){
        window.location.href = urls[0];
        return;
      }

      /*
       * GitHub Pages cannot create a Shopify multi-line cart without the
       * store's live variant IDs. Do not pretend a mixed cart was transferred.
       * Instead, open the first selected product and keep this cart intact so
       * the customer can open the remaining selected products from their links.
       */
      const firstUrl = urls[0];
      if(firstUrl){
        window.open(firstUrl, '_blank', 'noopener');
        showToast('Your cart is saved. Open the other selected items from this cart.');
      } else {
        showToast('Your selections are saved. Open the Rooms store to complete your order.');
      }
    });
  }

  renderCart();

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg){
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ---------- Account ---------- */
  // Real customer accounts require Rooms' own authentication/Shopify integration.
  // The concept intentionally avoids pretending a local form is a real account system.
  /* ---------- PWA: register the service worker ---------- */
  // "if the browser supports service workers" — older browsers don't, so we check first
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service worker registered — offline support active'))
        .catch((err) => console.log('Service worker registration failed:', err));
    });
  }


/* ---------- ROOMS MASTER SITE / LOCATION EXPERIENCE ---------- */
(() => {
  const rooms = {
    ossington: {
      kicker:'01 / OSSINGTON',
      title:'Rooms 135 Ossington',
      text:'Where the Rooms story began — an Asian-inspired neighbourhood café built around warm hospitality, thoughtful coffee and a sense of home.',
      meta:'135 OSSINGTON AVE · 8AM–6:30PM',
      instagram:'https://www.instagram.com/135ossington/',
      images:[
        'https://roomscoffee.online/cdn/shop/files/ECK_0068.00000000.jpg?v=1782836053&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_0216-2.00000000.jpg?v=1782836053&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_0083.00000000.jpg?v=1782836053&width=1800'
      ]
    },
    baldwin: {
      kicker:'02 / BALDWIN',
      title:'Rooms 17 Baldwin',
      text:'A hi-fi coffee room built around exceptional coffee, analog sound and thoughtful hospitality — a place for carefully brewed coffee and quiet connection.',
      meta:'17 BALDWIN ST · 8AM–6:30PM',
      instagram:'https://www.instagram.com/17baldwinst/',
      images:[
        'https://roomscoffee.online/cdn/shop/files/ECK_2976.jpg?v=1784651907&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_3120.jpg?v=1784651934&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_3129.jpg?v=1784651941&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_3078.jpg?v=1784651947&width=1800'
      ]
    },
    dupont: {
      kicker:'03 / DUPONT',
      title:'Rooms 915 Dupont',
      text:'A hi-fi Japanese kissa-inspired café cocktail bar — coffee and daytime service give way to listening, drinks and late nights.',
      meta:'915 DUPONT ST · 8AM–2AM',
      instagram:'https://www.instagram.com/915dupont/',
      images:[
        'https://roomscoffee.online/cdn/shop/files/ECK_8272.jpg?v=1777675337&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_9197.jpg?v=1777675478&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_9279.jpg?v=1777675477&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_9290.jpg?v=1777675477&width=1800',
        'https://roomscoffee.online/cdn/shop/files/ECK_8378.jpg?v=1777675337&width=1800'
      ]
    }
  };

  const image = document.getElementById('roomsPreviewImage');
  const kicker = document.getElementById('roomsPreviewKicker');
  const title = document.getElementById('roomsPreviewTitle');
  const copy = document.getElementById('roomsPreviewText');
  const meta = document.getElementById('roomsPreviewMeta');
  const insta = document.getElementById('roomsPreviewInstagram');

  function selectRoom(key) {
    const room = rooms[key];
    if (!room || !image) return;
    image.src = room.images[0];
    image.alt = room.title;
    kicker.textContent = room.kicker;
    title.textContent = room.title;
    copy.textContent = room.text;
    meta.textContent = room.meta;
    insta.href = room.instagram;
    document.querySelectorAll('.master-room-card').forEach(btn => btn.classList.toggle('active', btn.dataset.masterRoom === key));
    document.querySelectorAll('[data-location-card]').forEach(card => card.classList.toggle('active', card.dataset.locationCard === key));
    const reserve = document.getElementById('reservationLocation');
    if (reserve) reserve.value = key;
  }

  document.querySelectorAll('.master-room-card').forEach(btn => {
    btn.addEventListener('click', () => {
      selectRoom(btn.dataset.masterRoom);
      document.getElementById('rooms-preview')?.scrollIntoView({behavior:'smooth',block:'center'});
    });
  });

  // Location preview modal
  const modal = document.getElementById('locationMediaModal');
  if (modal) {
    const media = modal.querySelector('#locationMediaImage');
    const mk = modal.querySelector('#locationMediaKicker');
    const mt = modal.querySelector('#locationMediaTitle');
    const mx = modal.querySelector('#locationMediaText');
    const mi = modal.querySelector('#locationMediaInstagram');
    let activeRoom = null, activeIndex = 0;

    function renderMedia() {
      const room = rooms[activeRoom];
      if (!room) return;
      activeIndex = (activeIndex + room.images.length) % room.images.length;
      media.src = room.images[activeIndex];
      media.alt = room.title;
    }
    function openMedia(key) {
      const room = rooms[key];
      if (!room) return;
      activeRoom = key; activeIndex = 0;
      mk.textContent = room.kicker;
      mt.textContent = room.title;
      mx.textContent = room.text;
      mi.href = room.instagram;
      renderMedia();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
      document.body.classList.add('location-modal-open');
    }
    function closeMedia() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('location-modal-open');
    }

    document.querySelectorAll('[data-location-preview]').forEach(btn => btn.addEventListener('click', () => openMedia(btn.dataset.locationPreview)));
    modal.querySelectorAll('[data-location-close]').forEach(el => el.addEventListener('click', closeMedia));
    modal.querySelector('.location-gallery-prev')?.addEventListener('click', () => { activeIndex--; renderMedia(); });
    modal.querySelector('.location-gallery-next')?.addEventListener('click', () => { activeIndex++; renderMedia(); });
    modal.querySelector('[data-location-reserve]')?.addEventListener('click', () => {
      closeMedia();
      document.getElementById('reserve')?.scrollIntoView({behavior:'smooth'});
    });
    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') closeMedia();
      if (e.key === 'ArrowLeft') { activeIndex--; renderMedia(); }
      if (e.key === 'ArrowRight') { activeIndex++; renderMedia(); }
    });
  }

  // Location selector in reservation form
  const reservationLocation = document.getElementById('reservationLocation');
  reservationLocation?.addEventListener('change', e => {
    const key = e.target.value;
    if (key && rooms[key]) selectRoom(key);
  });

  // Make the existing reserve form clearly a request, not a fake confirmed booking.
  const bookingForm = document.getElementById('bookingForm');
  bookingForm?.addEventListener('submit', () => {
    const select = document.getElementById('reservationLocation');
    const room = rooms[select?.value];
    const confirm = document.getElementById('confirmBox');
    if (room && confirm) {
      const p = confirm.querySelector('p');
      if (p) p.textContent = `Your reservation details are saved on this device for ${room.title}. Live submission will be connected to Rooms' booking channel in the production build.`;
    }
  });

  selectRoom('ossington');
})();


/* ---------- ROOMS editorial reveal + location-aware CTAs ---------- */
(() => {
  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {rootMargin:'0px 0px -10% 0px', threshold:.08});
    revealItems.forEach(el => revealObserver.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  document.querySelectorAll('[data-room-jump]').forEach(link => {
    link.addEventListener('click', () => {
      const key = link.dataset.roomJump;
      const card = document.querySelector('.master-room-card[data-master-room="' + key + '"]');
      card?.click();
    });
  });
})();

/* ---------- Shared image viewer: menu, shop, coffee, cocktails, locations + editorial media ---------- */
(() => {
  const viewer = document.getElementById('mediaViewer');
  if (!viewer) return;

  const imageEl = document.getElementById('mediaViewerImage');
  const kickerEl = document.getElementById('mediaViewerKicker');
  const titleEl = document.getElementById('mediaViewerTitle');
  const descEl = document.getElementById('mediaViewerDescription');
  const metaEl = document.getElementById('mediaViewerMeta');
  const counterEl = document.getElementById('mediaViewerCounter');
  const prevBtn = viewer.querySelector('.media-viewer-prev');
  const nextBtn = viewer.querySelector('.media-viewer-next');

  let items = [];
  let index = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const clean = value => (value || '').replace(/\s+/g,' ').trim();

  function getDetails(img) {
    const card = img.closest('.menu-card,.shop-card,.bean-card,.cocktail-card,.drink-card,.location-card,.rooms-mood-card,.rooms-editorial-portrait,.rooms-editorial-card,.clock-photo,.matcha-beer,.rooms-sound-image,.coffee-photos,.ig-strip,.hero,.hero-bg,.location-visual');
    if (!card) return { kicker:'ROOMS COFFEE', title:img.alt || 'Rooms Coffee', desc:'', meta:'' };

    const title = clean(
      card.querySelector('h3,h4,.rooms-mood-card h3,.location-copy h3,.rooms-editorial-copy h3')?.textContent ||
      img.alt ||
      'Rooms Coffee'
    );

    const price = clean(card.querySelector('.price,.mp,.price-tag')?.textContent);
    const origin = clean(card.querySelector('.origin,.meta')?.textContent);
    const description = clean(card.querySelector('p')?.textContent);
    const locationMeta = clean(card.querySelector('.location-meta,.rooms-preview-meta')?.textContent);

    let kicker = 'ROOMS COFFEE';
    if (card.classList.contains('shop-card')) kicker = 'TAKE HOME / GIFT SHOP';
    else if (card.classList.contains('menu-card') || card.classList.contains('drink-card')) kicker = 'MENU / 915 DUPONT';
    else if (card.classList.contains('bean-card')) kicker = 'COFFEE / SINGLE ORIGIN';
    else if (card.classList.contains('cocktail-card')) kicker = 'FROM THE BAR';
    else if (card.classList.contains('location-card')) kicker = clean(card.querySelector('.location-number')?.textContent);
    else if (card.classList.contains('rooms-mood-card')) kicker = 'THE ROOMS';
    else if (card.classList.contains('clock-photo')) kicker = '915 DUPONT / DAY & NIGHT';
    else if (card.classList.contains('ig-strip')) kicker = 'ROOMS / GALLERY';
    else if (card.classList.contains('coffee-photos') || card.classList.contains('matcha-beer')) kicker = 'COFFEE & MATCHA';

    return {
      kicker,
      title,
      desc: description,
      meta: [origin, price, locationMeta].filter(Boolean).join(' · ')
    };
  }

  function getGroup(img) {
    const section = img.closest('section');
    if (!section) return [img];
    const candidates = [...section.querySelectorAll('img:not(.no-preview)')];
    return candidates.length ? candidates : [img];
  }

  function render() {
    const img = items[index];
    if (!img) return;
    const details = getDetails(img);
    imageEl.src = img.currentSrc || img.src;
    imageEl.alt = img.alt || details.title;
    kickerEl.textContent = details.kicker;
    titleEl.textContent = details.title;
    descEl.textContent = details.desc;
    metaEl.textContent = details.meta;
    counterEl.textContent = String(index + 1).padStart(2,'0') + ' / ' + String(items.length).padStart(2,'0');
    prevBtn.hidden = items.length < 2;
    nextBtn.hidden = items.length < 2;
  }

  function open(img) {
    items = getGroup(img);
    index = Math.max(0, items.indexOf(img));
    render();
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden','false');
    document.body.classList.add('media-viewer-open');
  }

  function close() {
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden','true');
    document.body.classList.remove('media-viewer-open');
  }

  function step(direction) {
    if (items.length < 2) return;
    index = (index + direction + items.length) % items.length;
    render();
  }

  document.addEventListener('click', e => {
    if (viewer.classList.contains('open')) return;
    const img = e.target.closest('img:not(.no-preview)');
    if (!img || img.closest('.media-viewer') || img.closest('.location-media-modal')) return;
    e.preventDefault();
    open(img);
  });

  viewer.addEventListener('click', e => {
    if (e.target.closest('[data-media-close]')) close();
  });
  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  const stage = viewer.querySelector('.media-viewer-stage');
  stage?.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, {passive:true});
  stage?.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
  }, {passive:true});

  document.addEventListener('keydown', e => {
    if (!viewer.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();
