document.addEventListener('DOMContentLoaded', function() {
  AOS.init({ duration: 800, easing: "ease-in-out", once: true, disable: "phone" });

  const swiper = new Swiper(".swiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    loop: false,
    autoplay: { delay: 5000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    breakpoints: { 640: { slidesPerView: 2 }, 992: { slidesPerView: 3 } },
    a11y: {
      prevSlideMessage: "Producto anterior",
      nextSlideMessage: "Siguiente producto",
      paginationBulletMessage: "Ir al producto {{index}}"
    }
  });

  const menuBtn = document.getElementById("menuBtn");
  const mainNav = document.getElementById("mainNav");

  menuBtn.addEventListener("click", () => {
    const isExpanded = mainNav.classList.toggle("active");
    menuBtn.setAttribute("aria-expanded", isExpanded);
    menuBtn.innerHTML = isExpanded ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  document.querySelectorAll(".main-nav a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        mainNav.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  });

  window.addEventListener("load", () => {
    setTimeout(() => {
      document.querySelector(".loader").classList.add("fade-out");
      loadProductsFromFirebase();
    }, 1500);
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", () => {
    const header = document.querySelector(".main-header");
    header.style.boxShadow = window.scrollY > 100 ? "0 2px 15px rgba(0, 0, 0, 0.1)" : "none";
    document.querySelector(".back-to-top").classList.toggle("show", window.scrollY > 300);
  });

  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");
      document.querySelectorAll(".swiper-slide").forEach(slide => {
        slide.style.display = (filter === "all" || slide.dataset.category === filter) ? "block" : "none";
      });
      swiper.update();
    });
  });

  const cookieConsent = document.getElementById("cookieConsent");
  const acceptCookies = document.getElementById("acceptCookies");

  if (!localStorage.getItem("cookiesAccepted")) {
    setTimeout(() => cookieConsent.classList.add("show"), 2000);
  }

  acceptCookies.addEventListener("click", () => {
    localStorage.setItem("cookiesAccepted", "true");
    cookieConsent.classList.remove("show");
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();

  if ("loading" in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => img.src = img.dataset.src);
  }

  const cartModal = document.getElementById("cartModal");
  const cartItemsContainer = document.querySelector(".cart-items");
  const cartCount = document.querySelector(".cart-count");
  const totalPriceElement = document.querySelector(".total-price");
  const cartLink = document.querySelector(".cart-link");
  const closeCartBtn = document.querySelector(".close-cart");
  const checkoutBtn = document.querySelector(".checkout-btn");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cartLink.addEventListener("click", e => {
    e.preventDefault();
    cartModal.classList.add("active");
  });

  closeCartBtn.addEventListener("click", () => cartModal.classList.remove("active"));

  cartModal.addEventListener("click", e => {
    if (e.target === cartModal) cartModal.classList.remove("active");
  });

  async function syncCartWithFirebase() {
    if (auth.currentUser) {
      await db.collection("userCarts").doc(auth.currentUser.uid).set({
        items: cart,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    await syncCartWithFirebase();

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    cartItemsContainer.innerHTML = cart.length === 0 ? '<div class="empty-cart">Tu carrito está vacío</div>' : "";
    let totalPrice = 0;

    cart.forEach((item, index) => {
      totalPrice += item.price * item.quantity;
      cartItemsContainer.innerHTML += `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${item.img}" alt="${item.name}" loading="lazy">
          </div>
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-price">$${item.price.toLocaleString()} COP</div>
            <div class="cart-item-actions">
              <button class="quantity-btn minus" data-index="${index}">-</button>
              <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}">
              <button class="quantity-btn plus" data-index="${index}">+</button>
              <button class="remove-item" data-index="${index}">Eliminar</button>
            </div>
          </div>
        </div>`;
    });

    totalPriceElement.textContent = `$${totalPrice.toLocaleString()} COP`;

    document.querySelectorAll(".quantity-btn").forEach(btn => btn.addEventListener("click", handleQuantityChange));
    document.querySelectorAll(".quantity-input").forEach(input => input.addEventListener("change", handleQuantityInputChange));
    document.querySelectorAll(".remove-item").forEach(btn => btn.addEventListener("click", removeItem));
  }

  async function handleQuantityChange(e) {
    const index = e.target.dataset.index;
    cart[index].quantity += e.target.classList.contains("plus") ? 1 : -1;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    await updateCart();
  }

  async function handleQuantityInputChange(e) {
    const index = e.target.dataset.index;
    const quantity = parseInt(e.target.value);
    if (quantity > 0) {
      cart[index].quantity = quantity;
      await updateCart();
    }
  }

  async function removeItem(e) {
    cart.splice(e.target.dataset.index, 1);
    await updateCart();
  }

  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) return;
    let message = "¡Hola SER CROCHET! Quiero realizar el siguiente pedido:%0A%0A";
    cart.forEach(item => message += `- ${item.name} (${item.quantity} x $${item.price.toLocaleString()})%0A`);
    message += `%0ATotal: $${calculateTotal().toLocaleString()} COP%0A%0AMis datos:%0ANombre: `;
    window.open(`https://wa.me/573226102915?text=${message}`, "_blank");
  });

  function calculateTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  async function loadProductsFromFirebase() {
    try {
      const querySnapshot = await db.collection("products").get();
      const wrapper = document.querySelector('.swiper-wrapper');
      wrapper.innerHTML = '';

      querySnapshot.forEach(doc => {
        const p = doc.data();
        wrapper.innerHTML += `
          <div class="swiper-slide" data-category="${p.category}">
            <div class="product-card">
              <div class="product-img">
                <img src="${p.image}" alt="${p.name}" loading="lazy" width="400" height="300">
                <div class="product-badges">
                  ${p.nuevo ? '<span class="product-badge">Nuevo</span>' : ''}
                  ${p.masVendido ? '<span class="product-badge">Más vendido</span>' : ''}
                  ${p.oferta ? '<span class="product-badge">Oferta</span>' : ''}
                  ${p.featured ? '<span class="product-badge">Destacado</span>' : ''}
                </div>
              </div>
              <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3 class="product-title">${p.name}</h3>
                <p class="product-description">${p.description}</p>
                <div class="product-price">$${p.price.toLocaleString('es-CO')} COP</div>
                <div class="product-actions">
                  <button class="add-to-cart" data-id="${doc.id}" data-name="${p.name}" data-price="${p.price}" data-img="${p.image}">Agregar al carrito</button>
                  <a href="https://wa.me/573226102915?text=Me%20interesa%20${encodeURIComponent(p.name)}" class="product-cta">Consultar</a>
                </div>
              </div>
            </div>
          </div>`;
      });

      swiper.update();
      attachAddToCartEvents();
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  }

  function attachAddToCartEvents() {
    document.querySelectorAll(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", async function() {
        const id = this.dataset.id;
        const name = this.dataset.name;
        const price = parseInt(this.dataset.price);
        const img = this.dataset.img;

        const existingItem = cart.find(i => i.id === id);
        if (existingItem) existingItem.quantity += 1;
        else cart.push({ id, name, price, img, quantity: 1 });

        await updateCart();
        cartModal.classList.add("active");
        this.textContent = "¡Agregado!";
        setTimeout(() => this.textContent = "Agregar al carrito", 1000);
      });
    });
  }

  updateCart();
});
