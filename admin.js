const CONTRASEÑA_CORRECTA = "rifamonteria"; // 

  function verificarPassword() {
    const input = document.getElementById("passwordInput").value;
    const error = document.getElementById("errorMsg");

    if (input === CONTRASEÑA_CORRECTA) {
      // Redirigir a la vista real de administración
      window.location.href = "admin-real.html";
    } else {
      error.textContent = "Contraseña incorrecta. Intenta de nuevo.";
    }
  }