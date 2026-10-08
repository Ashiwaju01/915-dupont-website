const body = document.body;
  const toggle = document.getElementById('dayNightToggle');

  const applyMode = (night) => {
    body.classList.toggle('night', night);
    if (toggle) {
      toggle.querySelectorAll('span').forEach(s => s.classList.remove('active'));
      toggle.querySelector(`[data-mode="${night ? 'night' : 'day'}"]`)?.classList.add('active');
      toggle.setAttribute('aria-pressed', String(night));
      toggle.setAttribute('aria-label', night ? 'Switch to day mode' : 'Switch to night mode');
    }
  };

  // Manual theme changes get a deliberate reveal from the toggle itself.
  // Scroll-driven day/night changes stay quiet so scrolling never feels animated by force.
  const setMode = (night, animate = false) => {
    if (night === body.classList.contains('night')) {
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(night));
        toggle.setAttribute('aria-label', night ? 'Switch to day mode' : 'Switch to night mode');
      }
      return;
    }

    const update = () => applyMode(night);
    if (!animate) {
      update();
      return;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      update();
      return;
    }

    const rect = toggle?.getBoundingClientRect();
    if (rect) {
      document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`);
      document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`);
    }

    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(update);
    } else {
      document.documentElement.classList.add('theme-switching');
      update();
      window.setTimeout(() => document.documentElement.classList.remove('theme-switching'), 720);
    }
  };

  if (toggle) {
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-pressed', String(body.classList.contains('night')));
    toggle.setAttribute('aria-label', body.classList.contains('night') ? 'Switch to day mode' : 'Switch to night mode');
    toggle.addEventListener('click', () => setMode(!body.classList.contains('night'), true));
    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setMode(!body.classList.contains('night'), true);
      }
    });
  }

  // Theme is user-controlled only. Do not change it while scrolling.
  // This prevents a manual Night selection from snapping back to Day around the
  // 915 Dupont hero and keeps the toggle state consistent with the page.
  
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

  /* ---------- Reservation date bounds ---------- */
  const resDate = document.getElementById('resDate');
  if(resDate){
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0,10);
    const y = today.getFullYear();
    resDate.min = localToday;
    resDate.max = `${y+3}-12-31`;
    resDate.addEventListener('input', function(){
      const parts = this.value.split('-');
      if(parts[0] && parts[0].length > 4){
        parts[0] = parts[0].slice(0,4);
        this.value = parts.join('-');
      }
      if(this.value && this.value < this.min) this.value = this.min;
      if(this.value && this.value > this.max) this.value = this.max;
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

  document.getElementById('bookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = document.getElementById('bookingForm');
    const dateEl = document.getElementById('resDate');
    const timeEl = document.getElementById('reservationTime');
    const partyEl = document.getElementById('reservationPartySize');
    const confirmBox = document.getElementById('confirmBox');
    const confirmText = confirmBox?.querySelector('p');
    const locationEl = document.getElementById('reservationLocation');
    const nameEl = document.getElementById('reservationName');
    const contactEl = document.getElementById('reservationContact');
    const actionsEl = document.getElementById('confirmActions');
    const roomName = locationEl?.selectedOptions?.[0]?.textContent?.trim() || 'Rooms';
    const locationKey = locationEl?.value || '';
    const party = partyEl?.value || '';
    const date = dateEl?.value || '';
    const time = timeEl?.value || '';
    const guestName = nameEl?.value?.trim() || '';
    const guestContact = contactEl?.value?.trim() || '';
    const visitType = document.querySelector('#serviceChips .chip.selected')?.dataset.value || 'Not specified';
    const preorderTotal = preorderItems.reduce((sum, item) => sum + item.price, 0);
    const preorderLines = preorderItems.length
      ? preorderItems.map(item => `- ${item.name}: $${item.price} CAD`).join('\n') + `\nPre-order estimate: $${preorderTotal} CAD`
      : 'No pre-order items selected.';
    const subject = `Reservation request — ${roomName} — ${date}`;
    const body = [
      'Hello Rooms Coffee,',
      '',
      'I would like to request a reservation. Please confirm availability.',
      '',
      `Location: ${roomName}`,
      `Name: ${guestName}`,
      `Contact: ${guestContact}`,
      `Date: ${date}`,
      `Preferred time: ${time}`,
      `Party size: ${party}`,
      `Visit type: ${visitType}`,
      '',
      'Pre-order request:',
      preorderLines,
      '',
      'I understand this is a request and is not confirmed until Rooms replies.',
      'Thank you.'
    ].join('\n');

    const knownEmails = {
      ossington: '135ossington@gmail.com',
      dupont: '915dupontcafe@gmail.com'
    };
    const recipient = knownEmails[locationKey];
    if (actionsEl) {
      if (recipient) {
        const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        actionsEl.innerHTML = `<a class="btn btn-primary confirm-email-btn" href="${mailto}">Open email request ↗</a><p class="confirm-action-note">Your email app will open with the details filled in. The request is not sent until you send the email, and Rooms must confirm availability.</p>`;
      } else {
        actionsEl.innerHTML = '<a class="btn btn-primary confirm-email-btn" href="https://roomscoffee.online/pages/locations" target="_blank" rel="noopener">Find official Rooms contact ↗</a><p class="confirm-action-note">We do not have a verified direct email for 17 Baldwin in this concept, so we have not guessed one. Use Rooms’ official site to reach the right team.</p>';
      }
    }

    const formFields = document.getElementById('formFields');
    if (formFields) formFields.style.display = 'none';
    confirmBox?.classList.add('show');

    if (confirmText) {
      confirmText.textContent = `Your request details are ready for ${roomName}: ${party} ${party === '1' ? 'guest' : 'guests'} on ${date} at ${time}. This is not a confirmed reservation; send the request and wait for Rooms to confirm availability.`;
    }

    const cp = document.getElementById('confirmPreorder');
    if (preorderItems.length && cp) {
      cp.innerHTML = '<div class="mono" style="font-size:11px; opacity:.6; margin-bottom:8px;">Pre-order estimate</div>' +
        preorderItems.map(item => `<div class="cp-row"><span>${item.name}</span><span>$${item.price} CAD</span></div>`).join('') +
        `<div class="cp-row"><strong>Estimated total</strong><strong>$${preorderTotal} CAD</strong></div>`;
    } else if (cp) {
      cp.innerHTML = '';
    }
  });

  document.getElementById('editReservationRequest')?.addEventListener('click', () => {
    document.getElementById('confirmBox')?.classList.remove('show');
    const formFields = document.getElementById('formFields');
    if (formFields) formFields.style.display = '';
    document.getElementById('bookingForm')?.scrollIntoView({behavior:'smooth', block:'center'});
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
    "Eyes Logo Mug": { price:25, url:`${ROOMS_STORE}/products/rooms-classic-ceramic-mug` },
    "News Man Cup": { price:25, url:`${ROOMS_STORE}/products/rooms-news-man-ceramic-to-go-cup` },
    "Running Man Glass Cup": { price:25, url:`${ROOMS_STORE}/products/rooms-running-man-glass-cup` },
    "Titanium Camping Mug": { price:45, url:`${ROOMS_STORE}/products/rooms-titanium-camping-mug` },
    "Rooms Titanium Camping Mug": { price:45, url:`${ROOMS_STORE}/products/rooms-titanium-camping-mug` }
  };
  window.ROOMS_PRODUCT_CATALOG = PRODUCT_CATALOG;

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
      navigator.serviceWorker.register('sw.js?v=32')
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
      address:'135 Ossington Ave, Toronto, ON', hours:'8AM–6:30PM', experience:'Neighbourhood café · coffee · hospitality',
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
      address:'17 Baldwin St, Toronto, ON', hours:'8AM–6:30PM', experience:'Hi-fi coffee room · vinyl · conversation',
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
      address:'915 Dupont St, Toronto, ON M6H 1Z1', hours:'8AM–2AM', experience:'Coffee · listening · cocktails',
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
    image.classList.remove('room-image-ready');
    image.classList.add('room-image-switching');
    image.src = room.images[0];
    image.alt = room.title;
    image.onload = () => {
      image.classList.remove('room-image-switching');
      image.classList.add('room-image-ready');
    };
    kicker.textContent = room.kicker;
    title.textContent = room.title;
    copy.textContent = room.text;
    meta.textContent = room.meta;
    insta.href = room.instagram;
    document.querySelectorAll('.master-room-card').forEach(btn => btn.classList.toggle('active', btn.dataset.masterRoom === key));
    document.querySelectorAll('[data-location-card]').forEach(card => card.classList.toggle('active', card.dataset.locationCard === key));
    const reserve = document.getElementById('reservationLocation');
    if (reserve) reserve.value = key;
    const reservationAddress = document.getElementById('reservationAddress');
    const reservationHours = document.getElementById('reservationHours');
    const reservationExperience = document.getElementById('reservationExperience');
    if (reservationAddress) reservationAddress.textContent = room.address || room.meta;
    if (reservationHours) reservationHours.textContent = room.hours || 'See Rooms for current hours';
    if (reservationExperience) reservationExperience.textContent = room.experience || 'Coffee · hospitality';
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

  // Reservation submission is handled by the single listener above.

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

/* ---------- Shared image viewer: focused media preview + swipe navigation ---------- */
(() => {
  const viewer = document.getElementById('mediaViewer');
  if (!viewer) return;

  const imageEl = document.getElementById('mediaViewerImage');
  const kickerEl = document.getElementById('mediaViewerKicker');
  const titleEl = document.getElementById('mediaViewerTitle');
  const descEl = document.getElementById('mediaViewerDescription');
  const metaEl = document.getElementById('mediaViewerMeta');
  const linkEl = document.getElementById('mediaViewerLink');
  const counterEl = document.getElementById('mediaViewerCounter');
  const prevBtn = viewer.querySelector('.media-viewer-prev');
  const nextBtn = viewer.querySelector('.media-viewer-next');

  let items = [];
  let index = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastFocused = null;

  const clean = value => (value || '').replace(/\s+/g,' ').trim();

  function getDetails(img) {
    const card = img.closest('.menu-card,.shop-card,.cocktail-card,.drink-card,.rooms-mood-card,.rooms-editorial-portrait,.rooms-editorial-card,.clock-photo,.matcha-beer,.rooms-sound-image,.coffee-photos,.ig-strip,.hero,.hero-bg,.rooms-location-preview,.location-visual');
    if (!card) return { kicker:'ROOMS COFFEE', title:img.alt || 'Rooms Coffee', desc:'', meta:'', url:'' };

    const title = clean(
      card.querySelector('h3,h4')?.textContent ||
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
    else if (card.classList.contains('cocktail-card')) kicker = 'FROM THE BAR';
    else if (card.classList.contains('rooms-mood-card')) kicker = 'THE ROOMS';
    else if (card.classList.contains('clock-photo')) kicker = '915 DUPONT / DAY & NIGHT';
    else if (card.classList.contains('ig-strip')) kicker = 'ROOMS / GALLERY';
    else if (card.classList.contains('coffee-photos') || card.classList.contains('matcha-beer')) kicker = 'COFFEE & MATCHA';
    else if (card.classList.contains('rooms-editorial-portrait') || card.classList.contains('rooms-editorial-card')) kicker = 'ROOMS / BALDWIN';

    let url = '';
    if (card.classList.contains('shop-card')) {
      const productName = clean(card.querySelector('.add-cart-btn')?.dataset.name || card.querySelector('h4')?.textContent);
      const catalog = window.ROOMS_PRODUCT_CATALOG || {};
      url = catalog[productName]?.url || '';
    }

    return {
      kicker,
      title,
      desc: description,
      meta: [origin, price, locationMeta].filter(Boolean).join(' · '),
      url
    };
  }

  function getGroup(img) {
    if (img.closest('.shop-card')) {
      return [...document.querySelectorAll('.shop-grid .shop-card img:not(.no-preview)')];
    }
    if (img.closest('.menu-card')) {
      const grid = img.closest('.menu-grid');
      return grid ? [...grid.querySelectorAll('.menu-card img:not(.no-preview)')] : [img];
    }
    if (img.closest('.rooms-mood-card')) {
      const section = img.closest('.rooms-three-moods');
      return section ? [...section.querySelectorAll('.rooms-mood-card img:not(.no-preview)')] : [img];
    }
    if (img.closest('.rooms-editorial-portrait,.rooms-editorial-card,.rooms-sound-image')) {
      const section = img.closest('.rooms-editorial');
      return section ? [...section.querySelectorAll('.rooms-editorial-portrait img,.rooms-editorial-card img,.rooms-sound-image img')] : [img];
    }
    const section = img.closest('section');
    if (!section) return [img];
    return [...section.querySelectorAll('img:not(.no-preview)')].filter(candidate =>
      !candidate.closest('.bean-card,.location-card,.coffee-modal,.location-media-modal')
    );
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
    metaEl.hidden = !details.meta;
    if (details.url) {
      linkEl.href = details.url;
      linkEl.hidden = false;
    } else {
      linkEl.hidden = true;
      linkEl.removeAttribute('href');
    }
    counterEl.textContent = String(index + 1).padStart(2,'0') + ' / ' + String(items.length).padStart(2,'0');
    prevBtn.hidden = items.length < 2;
    nextBtn.hidden = items.length < 2;
  }

  function open(img) {
    items = getGroup(img);
    index = Math.max(0, items.indexOf(img));
    lastFocused = document.activeElement;
    render();
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden','false');
    document.body.classList.add('media-viewer-open');
    viewer.querySelector('.media-viewer-close')?.focus();
  }

  function close() {
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden','true');
    document.body.classList.remove('media-viewer-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function step(direction) {
    if (items.length < 2) return;
    index = (index + direction + items.length) % items.length;
    render();
  }

  // Keep the existing coffee/location modals authoritative. The shared viewer
  // handles standalone media and the menu/shop/editorial experiences.
  // Bind preview directly to each standalone image. This avoids delegated-click
  // conflicts with the shop, menu, location and modal controls.
  function bindPreviewImage(img) {
    if (!img || img.classList.contains('no-preview') || img.dataset.previewBound === 'true') return;
    const interactiveParent = img.closest('a,button,[role="button"],.bean-card,.location-card,.location-media-modal,.coffee-modal,.media-viewer');
    if (interactiveParent) return;

    img.dataset.previewBound = 'true';
    img.tabIndex = 0;
    img.setAttribute('role','button');
    img.setAttribute('aria-label', 'Preview ' + (img.alt || 'image'));

    const preview = e => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') e.preventDefault();
      open(img);
    };

    img.addEventListener('click', preview);
    img.addEventListener('keydown', preview);
  }

  document.querySelectorAll('img:not(.no-preview)').forEach(bindPreviewImage);

  // Explicit fallback for the three location mood cards. Some browsers or
  // overlays can prevent the image-level handler from receiving the tap.
  document.querySelectorAll('.rooms-three-moods .rooms-mood-card').forEach(card => {
    card.style.cursor = 'zoom-in';
    card.querySelector('img:not(.no-preview)')?.style.setProperty('cursor', 'zoom-in');
    card.addEventListener('click', e => {
      if (e.target.closest('a,button')) return;
      const img = card.querySelector('img:not(.no-preview)');
      if (img && e.target !== img) open(img);
    });
  });

  // Delegated fallback: this also makes previews work for images added later,
  // and guarantees a tap on the image itself opens the viewer on touch devices.
  document.addEventListener('click', e => {
    if (viewer.classList.contains('open')) return;
    const img = e.target.closest?.('img:not(.no-preview)');
    if (!img || img.dataset.previewBound === 'true') return;
    bindPreviewImage(img);
    if (!img.closest('a,button,[role="button"],.bean-card,.location-card,.location-media-modal,.coffee-modal,.media-viewer')) {
      open(img);
    }
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
    if (e.key === 'Tab') {
      const focusables = [...viewer.querySelectorAll('button:not([hidden]),a:not([hidden])')].filter(el => !el.hasAttribute('disabled'));
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Native lazy-loading keeps the long image-heavy page lighter without
  // delaying the opening hero imagery.
  const images = [...document.querySelectorAll('img')];
  images.forEach((img, i) => {
    if (i > 3 && !img.loading) img.loading = 'lazy';
    img.decoding = 'async';
  });
})();
