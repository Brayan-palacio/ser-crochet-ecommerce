 // Configuración de Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyBxf1CcF0Esl0BsDtpsDiodTX3XTMZZFlg",
      authDomain: "ser-crochet.firebaseapp.com",
      projectId: "ser-crochet",
      storageBucket: "ser-crochet.appspot.com",
      messagingSenderId: "527639236941",
      appId: "1:527639236941:web:d27ad0ef334d570e93a704"
    };
    
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    
    // Elementos del DOM
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const buttonText = document.getElementById("buttonText");
    const errorAlert = document.getElementById("errorAlert");
    const errorMessage = document.getElementById("errorMessage");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    
    // Validación de formulario
    function validateForm() {
      let isValid = true;
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      
      // Validar email
      if (!email) {
        emailError.textContent = "Por favor ingresa tu correo electrónico";
        emailError.style.display = "block";
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = "Por favor ingresa un correo electrónico válido";
        emailError.style.display = "block";
        isValid = false;
      } else {
        emailError.style.display = "none";
      }
      
      // Validar contraseña
      if (!password) {
        passwordError.textContent = "Por favor ingresa tu contraseña";
        passwordError.style.display = "block";
        isValid = false;
      } else if (password.length < 6) {
        passwordError.textContent = "La contraseña debe tener al menos 6 caracteres";
        passwordError.style.display = "block";
        isValid = false;
      } else {
        passwordError.style.display = "none";
      }
      
      return isValid;
    }
    
    // Mostrar error
    function showError(message) {
      errorMessage.textContent = message;
      errorAlert.style.display = "block";
    }
    
    // Ocultar error
    function hideError() {
      errorAlert.style.display = "none";
    }
    
    // Iniciar sesión
    function login() {
      hideError();
      
      if (!validateForm()) return;
      
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      
      // Mostrar estado de carga
      loginBtn.classList.add("loading");
      buttonText.textContent = "Iniciando sesión...";
      loginBtn.disabled = true;
      
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          // Redireccionar al panel de administración
          window.location.href = "admin.html";
        })
        .catch(error => {
          // Manejar errores
          let errorMsg = "Ocurrió un error al iniciar sesión";
          
          switch (error.code) {
            case "auth/user-not-found":
              errorMsg = "No existe una cuenta con este correo electrónico";
              break;
            case "auth/wrong-password":
              errorMsg = "Contraseña incorrecta";
              break;
            case "auth/too-many-requests":
              errorMsg = "Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña";
              break;
            case "auth/user-disabled":
              errorMsg = "Esta cuenta ha sido deshabilitada";
              break;
          }
          
          showError(errorMsg);
        })
        .finally(() => {
          // Restaurar estado normal del botón
          loginBtn.classList.remove("loading");
          buttonText.textContent = "Iniciar Sesión";
          loginBtn.disabled = false;
        });
    }
    
    // Recuperar contraseña
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      
      if (!email) {
        showError("Por favor ingresa tu correo electrónico para restablecer la contraseña");
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Por favor ingresa un correo electrónico válido");
        return;
      }
      
      auth.sendPasswordResetEmail(email)
        .then(() => {
          showError(`Se ha enviado un correo a ${email} para restablecer tu contraseña`);
        })
        .catch(error => {
          showError("Error al enviar el correo de recuperación: " + error.message);
        });
    });
    
    // Permitir enviar el formulario con Enter
    document.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        login();
      }
    });