(() => {
  const init = () => {
    const beanGrid = document.querySelector('.bean-grid');
    if (!beanGrid) return;

    const coffees = {
      "El Paraiso 92": {
        storeUrl:"https://roomscoffee.online/products/el-paraiso-92",
        country:"Colombia", weight:"250g", price:32, region:"EL PARAISO", altitude:"2100 masl",
        variety:"Catuai", process:"Washed With Thermal Shock", harvest:"Spring 2025",
        notes:"Lychee, layered berries, honeyed sweetness, wine-like finish.",
        poetic:"Lychee drifts like perfume in cool air, a sweetness clear as first light. Berries ripple beneath an ice-wine hush, honeyed and luminous.",
        story:"El Paraíso 92 is a highly innovative coffee farm in Cauca, Colombia, led by producer Diego Bermúdez. The farm is known for controlled fermentations, temperature regulation, and experimental processing.",
        images:[
          ["https://roomscoffee.online/cdn/shop/files/05.jpg?v=1783519613&width=1600","El Paraiso 92 coffee bag"],
          ["https://roomscoffee.online/cdn/shop/files/paraiso_F.png?v=1777671244&width=1400","El Paraiso farm"],
          ["https://roomscoffee.online/cdn/shop/files/pasted-image-8.png?v=1771776501&width=1800","Coffee processing and drying"]
        ]
      },
      "Halo Beriti": {
        storeUrl:"https://roomscoffee.online/products/halo-beriti",
        country:"Ethiopia", weight:"250g", price:28, region:"Halo Beriti", altitude:"1900–2000 masl",
        variety:"Heirloom", process:"Washed", harvest:"Spring 2025",
        notes:"Osmanthus, white peach, citrus tea, clean finish.",
        poetic:"Washed in a pale morning light, osmanthus breathes its quiet perfume. White peach unfolds, soft and luminous — lemon tea gliding through with a gentle spark.",
        story:"Halo Beriti is a celebrated coffee-producing community in Gedeb, Yirgacheffe, known for vibrant florals, layered fruit and clarity.",
        images:[
          ["https://roomscoffee.online/cdn/shop/files/01.jpg?v=1783520094&width=1600","Halo Beriti coffee bag"],
          ["https://roomscoffee.online/cdn/shop/t/15/assets/rooms-region-default.png?v=28646555499115422441771018398","Halo Beriti growing region"],
          ["https://roomscoffee.online/cdn/shop/files/pasted-image-8.png?v=1771776501&width=1800","Coffee processing and drying"]
        ]
      },
      "Eduar Gaviria": {
        storeUrl:"https://roomscoffee.online/products/eduar-gaviria",
        country:"Colombia", weight:"250g", price:32, region:"LA VILLA – EDUAR GAVIRIA", altitude:"1670 masl",
        variety:"Papayo", process:"Anaerobic Natural", harvest:"Fall 2025",
        notes:"Tea-like florals, blueberry depth, red wine finish.",
        poetic:"Floral and tea-like at its core, blueberry deepens into red wine, leaving a vivid sweetness that lingers softly on the palate.",
        story:"At La Villa Farm in Acevedo, Huila, Eduar Gaviria focuses on careful selection and precise processing. This Papayo lot undergoes 48 hours of anaerobic fermentation before controlled drying.",
        images:[
          ["https://roomscoffee.online/cdn/shop/files/02.jpg?v=1783519614&width=1600","Eduar Gaviria coffee bag"],
          ["https://roomscoffee.online/cdn/shop/files/La_Villa_-_Eduar_Gaviria.png?v=1777672497&width=1400","La Villa – Eduar Gaviria"],
          ["https://roomscoffee.online/cdn/shop/files/pasted-image-8.png?v=1771776501&width=1800","Papayo processing and drying"]
        ]
      },
      "Minas Gerais": {
        storeUrl:"https://roomscoffee.online/products/minas-gerais",
        country:"Brazil", weight:"250g", price:26, region:"MINAS GERAIS", altitude:"1200 masl",
        variety:"Red Catuaí", process:"Natural", harvest:"Summer 2025",
        notes:"Toffee, cocoa, roasted nuts, gentle sweetness.",
        poetic:"Golden toffee melts into soft chocolate depth — caramelized sugar, cocoa, roasted nuts, and a gentle sweetness that lingers.",
        story:"Minas Gerais is Brazil's largest and most influential coffee-producing region, with varied elevations and farm-level experimentation shaping a wide range of coffees.",
        images:[
          ["https://roomscoffee.online/cdn/shop/files/03.jpg?v=1783519613&width=1600","Minas Gerais coffee bag"],
          ["https://roomscoffee.online/cdn/shop/files/Brazil_front.png?v=1777670377&width=1400","Minas Gerais coffee region"],
          ["https://roomscoffee.online/cdn/shop/files/pasted-image-8.png?v=1771776501&width=1800","Coffee processing and drying"]
        ]
      },
      "Finca La Playita": {
        storeUrl:"https://roomscoffee.online/products/finca-la-playita",
        country:"Colombia", weight:"250g", price:32, region:"Finca La Playita", altitude:"1580 masl",
        variety:"Wush Wush", process:"Anaerobic Natural", harvest:"Fall 2025",
        notes:"Cherry, mango, prickly pear, melon, round sweetness.",
        poetic:"Ripe mango softens into sweetness, while prickly pear and melon carry a bright, juicy lift. Round sweetness lingers gently.",
        story:"Finca La Playita is a five-generation family farm. Its current story follows Victor and his family's careful stewardship of the land, with modern processing used to bring out the intensity and sweetness of Wush Wush.",
        images:[
          ["https://roomscoffee.online/cdn/shop/files/04.jpg?v=1783519613&width=1600","Finca La Playita coffee bag"],
          ["https://roomscoffee.online/cdn/shop/files/FINCA_LA_PLAYITA.png?v=1777671753&width=1400","Finca La Playita"],
          ["https://roomscoffee.online/cdn/shop/files/pasted-image-8.png?v=1771776501&width=1800","Wush Wush processing and drying"]
        ]
      }
    };

    const cards = [...beanGrid.querySelectorAll('.bean-card')];
    const getName = card => (card.querySelector('h3')?.textContent || '').trim();

    cards.forEach(card => {
      const name = getName(card);
      const data = coffees[name];
      if (!data) return;
      card.dataset.coffee = name;
      card.dataset.origin = data.country;
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`Explore ${name} coffee details`);
      if (!card.querySelector('.coffee-explore')) {
        const info = card.querySelector('.info');
        if (info) {
          const explore = document.createElement('span');
          explore.className = 'coffee-explore mono';
          explore.textContent = 'Explore coffee →';
          info.appendChild(explore);
        }
      }
    });

    // Origin filters
    const controls = document.createElement('div');
    controls.className = 'coffee-filter';
    controls.innerHTML = `
      <div class="coffee-intro">
        <span class="tag mono">Single Origin</span>
        <p>Open any coffee for its full profile, farm story, gallery and official Rooms product page.</p>
      </div>
      <div class="coffee-filter-buttons" role="group" aria-label="Filter coffees by origin">
        <button class="coffee-filter-btn active" data-origin="all" type="button">All</button>
        <button class="coffee-filter-btn" data-origin="Colombia" type="button">Colombia</button>
        <button class="coffee-filter-btn" data-origin="Ethiopia" type="button">Ethiopia</button>
        <button class="coffee-filter-btn" data-origin="Brazil" type="button">Brazil</button>
      </div>`;
    beanGrid.parentNode.insertBefore(controls, beanGrid);

    controls.addEventListener('click', e => {
      const btn = e.target.closest('.coffee-filter-btn');
      if (!btn) return;
      controls.querySelectorAll('.coffee-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.origin;
      cards.forEach(card => {
        card.hidden = filter !== 'all' && card.dataset.origin !== filter;
      });
    });

    const overlay = document.createElement('div');
    overlay.className = 'coffee-modal';
    overlay.innerHTML = `
      <div class="coffee-modal-backdrop" data-close></div>
      <article class="coffee-modal-panel" role="dialog" aria-modal="true" aria-labelledby="coffeeModalTitle">
        <button class="coffee-modal-close" type="button" aria-label="Close coffee details">&times;</button>
        <div class="coffee-modal-gallery">
          <div class="coffee-modal-main"><img id="coffeeModalImage" alt=""></div>
          <div class="coffee-modal-thumbs" id="coffeeModalThumbs"></div>
          <button class="coffee-gallery-prev" type="button" aria-label="Previous image">‹</button>
          <button class="coffee-gallery-next" type="button" aria-label="Next image">›</button>
        </div>
        <div class="coffee-modal-copy">
          <div class="mono coffee-modal-kicker" id="coffeeModalOrigin"></div>
          <h3 class="display" id="coffeeModalTitle"></h3>
          <p class="coffee-modal-notes" id="coffeeModalNotes"></p>
          <div class="coffee-profile-grid" id="coffeeProfile"></div>
          <div class="coffee-modal-story">
            <span class="tag mono">The Coffee</span>
            <p id="coffeeModalPoetic"></p>
            <span class="tag mono">The Story</span>
            <p id="coffeeModalStory"></p>
          </div>
          <div class="coffee-modal-actions">
            <button class="coffee-add-cart" type="button" id="coffeeAddCart">Add to Cart</button>
            <a class="coffee-buy-room" id="coffeeBuyRoom" href="#" target="_blank" rel="noopener">Buy on Rooms ↗</a>
            <span class="mono coffee-modal-price" id="coffeeModalPrice"></span>
          </div>
          <div class="coffee-related">
            <div class="tag mono">You May Also Like</div>
            <div class="coffee-related-grid" id="coffeeRelated"></div>
          </div>
        </div>
      </article>`;
    document.body.appendChild(overlay);

    const $ = sel => overlay.querySelector(sel);
    const img = $('#coffeeModalImage'), thumbs = $('#coffeeModalThumbs');
    const title = $('#coffeeModalTitle'), origin = $('#coffeeModalOrigin'), notes = $('#coffeeModalNotes');
    const profile = $('#coffeeProfile'), poetic = $('#coffeeModalPoetic'), story = $('#coffeeModalStory');
    const price = $('#coffeeModalPrice'), related = $('#coffeeRelated'), addBtn = $('#coffeeAddCart'), buyRoom = $('#coffeeBuyRoom');
    let current = null, currentName = '', currentIndex = 0;

    const setGallery = index => {
      if (!current) return;
      currentIndex = (index + current.images.length) % current.images.length;
      img.src = current.images[currentIndex][0];
      img.alt = current.images[currentIndex][1];
      thumbs.querySelectorAll('button').forEach((b,i) => b.classList.toggle('active', i === currentIndex));
    };

    const openCoffee = name => {
      const data = coffees[name];
      if (!data) return;
      current = data;
      currentName = name;
      title.textContent = name;
      origin.textContent = `${data.country} · ${data.weight}`;
      notes.textContent = data.notes;
      price.textContent = `$${data.price}`;
      poetic.textContent = data.poetic;
      story.textContent = data.story;
      profile.innerHTML = [
        ['Region',data.region],['Altitude',data.altitude],['Variety',data.variety],
        ['Process',data.process],['Harvest',data.harvest]
      ].map(([k,v]) => `<div><span class="mono">${k}</span><strong>${v}</strong></div>`).join('');
      thumbs.innerHTML = data.images.map((item,i) => `
        <button type="button" class="${i===0?'active':''}" data-index="${i}" aria-label="Show image ${i+1}">
          <img src="${item[0]}" alt="">
        </button>`).join('');
      related.innerHTML = Object.keys(coffees).filter(n => n !== name).slice(0,3).map(n => {
        const d = coffees[n];
        return `<button class="coffee-related-card" type="button" data-related="${n}">
          <img src="${d.images[0][0]}" alt="${n}">
          <span><strong>${n}</strong><small>${d.country} · $${d.price}</small></span>
        </button>`;
      }).join('');
      overlay.classList.add('open');
      document.body.classList.add('coffee-modal-open');
      setGallery(0);
      addBtn.textContent = `Add ${name} — $${data.price}`;
      buyRoom.href = data.storeUrl;
    };

    const closeCoffee = () => {
      overlay.classList.remove('open');
      document.body.classList.remove('coffee-modal-open');
    };

    // Event delegation makes every coffee card work, including future cards.
    beanGrid.addEventListener('click', e => {
      const card = e.target.closest('.bean-card');
      if (!card || card.hidden) return;
      openCoffee(card.dataset.coffee);
    });
    beanGrid.addEventListener('keydown', e => {
      const card = e.target.closest('.bean-card');
      if (!card || card.hidden) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCoffee(card.dataset.coffee);
      }
    });

    thumbs.addEventListener('click', e => {
      const b = e.target.closest('[data-index]');
      if (b) setGallery(Number(b.dataset.index));
    });
    related.addEventListener('click', e => {
      const b = e.target.closest('[data-related]');
      if (b) openCoffee(b.dataset.related);
    });
    $('.coffee-modal-close').addEventListener('click', closeCoffee);
    $('[data-close]').addEventListener('click', closeCoffee);
    $('.coffee-gallery-prev').addEventListener('click', () => setGallery(currentIndex - 1));
    $('.coffee-gallery-next').addEventListener('click', () => setGallery(currentIndex + 1));
    addBtn.addEventListener('click', () => {
      if (current && typeof window.addToCart === 'function') window.addToCart(currentName, current.price);
    });
    document.addEventListener('keydown', e => {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') closeCoffee();
      if (e.key === 'ArrowLeft') setGallery(currentIndex - 1);
      if (e.key === 'ArrowRight') setGallery(currentIndex + 1);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();