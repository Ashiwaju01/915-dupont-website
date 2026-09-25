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
    document.getElementById('formFields').style.display = 'none';
    document.getElementById('confirmBox').classList.add('show');
    const cp = document.getElementById('confirmPreorder');
    if(preorderItems.length){
      let html = '<div class="mono" style="font-size:11px; opacity:.6; margin-bottom:8px;">Pre-order</div>';
      preorderItems.forEach(i => { html += `<div class="cp-row"><span>${i.name}</span><span>$${i.price}</span></div>`; });
      cp.innerHTML = html;
    }
  });

  /* ---------- Cart ---------- */
  let cart = [];
  const cartCountEl = document.getElementById('cartCount');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');

  function renderCart(){
    cartCountEl.textContent = cart.length;
    if(!cart.length){
      cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    } else {
      cartItemsEl.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
          <span>${item.name}</span>
          <span style="display:flex; align-items:center; gap:10px;">
            <span class="mono">$${item.price}</span>
            <button class="ci-remove" data-idx="${idx}">&times;</button>
          </span>
        </div>`).join('');
    }
    const total = cart.reduce((s,i) => s + i.price, 0);
    cartTotalEl.textContent = `$${total}`;
    cartItemsEl.querySelectorAll('.ci-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        cart.splice(parseInt(btn.dataset.idx), 1);
        renderCart();
      });
    });
  }

  function openCart(){ cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); }
  function closeCart(){ cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); }
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.push({ name: btn.dataset.name, price: parseFloat(btn.dataset.price) });
      renderCart();
      btn.textContent = 'Added ✓';
      btn.classList.add('added');
      showToast(`${btn.dataset.name} added to cart`);
      setTimeout(() => { btn.textContent = 'Add to Cart'; btn.classList.remove('added'); }, 1200);
      openCart();
    });
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if(!cart.length){ showToast('Your cart is empty'); return; }
    showToast('Order placed — this is a demo checkout');
    cart = [];
    renderCart();
    closeCart();
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg){
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ---------- Login modal ---------- */
  const loginOverlay = document.getElementById('loginOverlay');
  const loginBtn = document.getElementById('loginBtn');
  const loginClose = document.getElementById('loginClose');
  const loginTitle = document.getElementById('loginTitle');
  const loginSub = document.getElementById('loginSub');
  const nameFieldWrap = document.getElementById('nameFieldWrap');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const switchToSignup = document.getElementById('switchToSignup');
  let isSignup = false;

  function openLogin(){ loginOverlay.classList.add('open'); }
  function closeLogin(){ loginOverlay.classList.remove('open'); }
  loginBtn.addEventListener('click', openLogin);
  loginClose.addEventListener('click', closeLogin);
  loginOverlay.addEventListener('click', (e) => { if(e.target === loginOverlay) closeLogin(); });

  switchToSignup.addEventListener('click', () => {
    isSignup = !isSignup;
    if(isSignup){
      loginTitle.textContent = 'Create Account';
      loginSub.textContent = 'Join 915 Dupont for faster reservations.';
      nameFieldWrap.style.display = 'block';
      loginSubmitBtn.textContent = 'Create Account';
      switchToSignup.parentElement.innerHTML = 'Already have an account? <a id="switchToSignup2">Log in</a>';
      document.getElementById('switchToSignup2').addEventListener('click', () => location.reload());
    }
  });

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    loginBtn.textContent = isSignup ? 'Account Created ✓' : 'Logged In ✓';
    closeLogin();
    showToast(isSignup ? 'Account created — welcome to 915 Dupont' : 'Welcome back');
  });
  /* ---------- PWA: register the service worker ---------- */
  // "if the browser supports service workers" — older browsers don't, so we check first
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service worker registered — offline support active'))
        .catch((err) => console.log('Service worker registration failed:', err));
    });
  }
