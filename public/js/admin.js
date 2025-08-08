// Verificar autenticación
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = "login.html";
      } else {
        loadProducts();
      }
    });

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
      auth.signOut().then(() => {
        window.location.href = "login.html";
      });
    });

    // Elementos del DOM
    const productsTable = document.getElementById("productsTable");
    const productFormContainer = document.getElementById("productFormContainer");
    const productForm = document.getElementById("productForm");
    const formTitle = document.getElementById("formTitle");
    const addProductBtn = document.getElementById("addProductBtn");
    const cancelFormBtn = document.getElementById("cancelFormBtn");
    const saveProductBtn = document.getElementById("saveProductBtn");
    const saveButtonText = document.getElementById("saveButtonText");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const imagePreview = document.getElementById("imagePreview");
    const productImageUrl = document.getElementById("productImageUrl");
    const previewImageBtn = document.getElementById("previewImageBtn");

    // Vista previa de imagen al hacer clic en el botón
    previewImageBtn.addEventListener('click', () => {
      const url = productImageUrl.value.trim();
      if (url) {
        imagePreview.src = url;
        imagePreview.style.display = 'block';
        
        // Verificar si la imagen carga correctamente
        imagePreview.onload = () => {
          // La imagen se cargó correctamente
        };
        
        imagePreview.onerror = () => {
          alert("No se pudo cargar la imagen. Verifica que la URL sea correcta.");
          imagePreview.style.display = 'none';
        };
      } else {
        alert("Por favor ingresa una URL de imagen válida");
      }
    });

    // Vista previa automática al pegar la URL
    productImageUrl.addEventListener('paste', (e) => {
      setTimeout(() => {
        const url = productImageUrl.value.trim();
        if (url) {
          imagePreview.src = url;
          imagePreview.style.display = 'block';
          
          imagePreview.onload = () => {
            // La imagen se cargó correctamente
          };
          
          imagePreview.onerror = () => {
            imagePreview.style.display = 'none';
          };
        }
      }, 100);
    });

    // Cargar productos
    function loadProducts() {
      db.collection("products").orderBy("name").get().then(querySnapshot => {
        productsTable.innerHTML = '';
        
        if (querySnapshot.empty) {
          productsTable.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 30px;">
                <i class="fas fa-box-open" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                <p>No hay productos registrados</p>
              </td>
            </tr>
          `;
          return;
        }
        
        querySnapshot.forEach(doc => {
          const product = doc.data();
          
          // Generar badges para las etiquetas
          const badges = [];
          if (product.featured) badges.push('<span class="status-badge featured-badge"><i class="fas fa-star"></i> Destacado</span>');
          if (product.masVendido) badges.push('<span class="status-badge bestseller-badge"><i class="fas fa-fire"></i> Más Vendido</span>');
          if (product.nuevo) badges.push('<span class="status-badge new-badge"><i class="fas fa-certificate"></i> Nuevo</span>');
          if (product.oferta) badges.push('<span class="status-badge offer-badge"><i class="fas fa-tag"></i> Oferta</span>');
          
          const badgesHtml = badges.length > 0 ? badges.join(' ') : '<span class="text-muted">Sin etiquetas</span>';
          
          productsTable.innerHTML += `
            <tr>
              <td>
                <img src="${product.image || 'https://via.placeholder.com/70?text=Sin+imagen'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/70?text=Error+imagen'">
              </td>
              <td style="font-weight: 500;">${product.name}</td>
              <td><span class="category-badge category-${product.category}">${getCategoryName(product.category)}</span></td>
              <td class="product-price">$${product.price.toLocaleString('es-CO')} COP</td>
              <td>${badgesHtml}</td>
              <td>
                <button class="btn btn-edit" onclick="editProduct('${doc.id}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger" onclick="deleteProduct('${doc.id}', '${product.name}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
              </td>
            </tr>
          `;
        });
      }).catch(error => {
        console.error("Error cargando productos:", error);
        productsTable.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: var(--danger-color);">
              <i class="fas fa-exclamation-triangle"></i> Error al cargar los productos
            </td>
          </tr>
        `;
      });
    }

    // Obtener nombre de categoría
    function getCategoryName(category) {
      const categories = {
        bolsos: "Bolsos",
        accesorios: "Accesorios",
        decoracion: "Decoración"
      };
      return categories[category] || category;
    }

    // Mostrar formulario para nuevo producto
    addProductBtn.addEventListener("click", () => {
      productForm.reset();
      document.getElementById("productId").value = '';
      imagePreview.style.display = 'none';
      formTitle.textContent = "Agregar";
      productFormContainer.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Cancelar formulario
    cancelFormBtn.addEventListener("click", () => {
      productFormContainer.style.display = "none";
    });

    // Guardar producto
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const productId = document.getElementById("productId").value;
      const imageUrl = productImageUrl.value.trim();
      
      saveButtonText.style.display = 'inline-block';
      loadingSpinner.style.display = 'inline-block';
      saveProductBtn.disabled = true;
      
      try {
        const productData = {
          name: document.getElementById("productName").value,
          category: document.getElementById("productCategory").value,
          price: parseInt(document.getElementById("productPrice").value),
          description: document.getElementById("productDescription").value,
          image: imageUrl || 'https://via.placeholder.com/400?text=Sin+imagen',
          featured: document.getElementById("productFeatured").checked,
          masVendido: document.getElementById("productBestseller").checked,
          nuevo: document.getElementById("productNew").checked,
          oferta: document.getElementById("productOffer").checked,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (productId) {
          // Actualizar producto existente
          await db.collection("products").doc(productId).update(productData);
          showAlert("Producto actualizado correctamente", "success");
        } else {
          // Crear nuevo producto
          productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection("products").add(productData);
          showAlert("Producto creado correctamente", "success");
        }
        
        productFormContainer.style.display = "none";
        loadProducts();
      } catch (error) {
        console.error("Error guardando producto:", error);
        showAlert("Error al guardar el producto: " + error.message, "error");
      } finally {
        saveButtonText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
        saveProductBtn.disabled = false;
      }
    });

    // Mostrar mensaje de alerta
    function showAlert(message, type) {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type}`;
      alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
      `;
      
      const header = document.querySelector('.admin-header');
      header.insertAdjacentElement('afterend', alert);
      
      setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
      }, 3000);
    }

    // Editar producto
    window.editProduct = function(id) {
      db.collection("products").doc(id).get().then(doc => {
        if (doc.exists) {
          const product = doc.data();
          
          document.getElementById("productId").value = id;
          document.getElementById("productName").value = product.name;
          document.getElementById("productCategory").value = product.category;
          document.getElementById("productPrice").value = product.price;
          document.getElementById("productDescription").value = product.description;
          document.getElementById("productFeatured").checked = product.featured || false;
          document.getElementById("productBestseller").checked = product.masVendido || false;
          document.getElementById("productNew").checked = product.nuevo || false;
          document.getElementById("productOffer").checked = product.oferta || false;
          document.getElementById("productImageUrl").value = product.image || '';
          
          // Mostrar imagen actual
          if (product.image) {
            imagePreview.src = product.image;
            imagePreview.style.display = 'block';
          } else {
            imagePreview.style.display = 'none';
          }
          
          formTitle.textContent = "Editar";
          productFormContainer.style.display = "block";
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }).catch(error => {
        console.error("Error cargando producto:", error);
        showAlert("Error al cargar el producto para editar", "error");
      });
    };

    // Eliminar producto
    window.deleteProduct = function(id, name) {
      if (confirm(`¿Estás segura de que quieres eliminar el producto "${name}"?`)) {
        db.collection("products").doc(id).delete()
          .then(() => {
            showAlert("Producto eliminado correctamente", "success");
            loadProducts();
          })
          .catch(error => {
            console.error("Error eliminando producto:", error);
            showAlert("Error al eliminar el producto", "error");
          });
      }
    };