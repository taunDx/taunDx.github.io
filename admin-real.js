import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
  import {
    getFirestore, doc, setDoc, getDoc, onSnapshot, collection, deleteDoc, addDoc, query
  } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
  import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
  import {
    getStorage, ref as storageRef, deleteObject
  } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

  // Configuración de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCmfnmwARjEAwIO0AL1ARHW8JVelcR8ZWc",
    authDomain: "rifa-pro-fondos.firebaseapp.com",
    projectId: "rifa-pro-fondos",
    storageBucket: "rifa-pro-fondos.firebasestorage.app",
    messagingSenderId: "902059536686",
    appId: "1:902059536686:web:be80e12bcb5aa8f4158abf"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth();

  // 🔐 Autenticación anónima
  signInAnonymously(auth).catch((error) => {
    console.error("Error de autenticación anónima:", error);
  });

  // VARIABLES
  const totalNumeros = 100;
  const valorBoleta = 20000;
  const grid = document.getElementById("grid");
  const availableNumbersText = document.getElementById("availableNumbers");
  const listaParticipantes = document.getElementById("listaParticipantes");
  const filtroEstado = document.getElementById("filtroEstado");
  const resumenEstadisticas = document.getElementById("resumenEstadisticas");
  const barraVendidos = document.getElementById("barraVendidos");
  const barraPendientes = document.getElementById("barraPendientes");
  const barraVendidosMeta = document.getElementById("barraVendidosMeta");
  const barraPendientesMeta = document.getElementById("barraPendientesMeta");
  const textoMeta = document.getElementById("textoMeta");
  const textoTotal = document.getElementById("textoTotal");
  const modal = document.getElementById("modal");
  const numeroModal = document.getElementById("numeroModal");
  const nombreInput = document.getElementById("nombreInput");
  const apellidoInput = document.getElementById("apellidoInput");
  const estadoInput = document.getElementById("estadoInput");
  const noticiasAdmin = document.getElementById("noticiasAdmin");
  const listaComprobantes = document.getElementById("listaComprobantes");
  const selectorGanador = document.getElementById("selectorGanador");
  const nombreGanadorAdmin = document.getElementById("nombreGanadorAdmin");
  const guardarGanadorBtn = document.getElementById("guardarGanadorBtn");
  const mensajeGanadorAdmin = document.getElementById("mensajeGanadorAdmin");

  let numeroSeleccionado = null;

  function actualizarMensaje() {
    const disponibles = [];
    document.querySelectorAll(".cell").forEach(cell => {
      if (!cell.classList.contains("green") && !cell.classList.contains("yellow")) {
        disponibles.push(cell.dataset.numero);
      }
    });
    availableNumbersText.textContent = disponibles.join(", ");
  }

  async function actualizarLista() {
    const registros = [];
    let vendidos = 0;
    let pendientes = 0;
    let disponibles = 0;
    const estadoFiltro = filtroEstado.value;
    const promises = [];

    for (let i = 0; i < totalNumeros; i++) {
      const numRef = doc(db, "numeros", i.toString());
      promises.push(getDoc(numRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.estado === "vendido") vendidos++;
          else if (data.estado === "pendiente") pendientes++;
          else disponibles++;

          if (data.estado !== "disponible" && (estadoFiltro === "todos" || data.estado === estadoFiltro)) {
            registros.push(`#${i}: ${data.nombre || ""} ${data.apellido || ""} (${data.estado})`);
          }
        } else {
          disponibles++;
        }
      }));
    }

    await Promise.all(promises);

    listaParticipantes.innerHTML = registros.sort((a, b) => a.localeCompare(b)).join("<br>");
    const totalRecaudado = (vendidos + pendientes) * valorBoleta;
    resumenEstadisticas.innerHTML = `
      <strong>Resumen:</strong><br>
      Vendidos: ${vendidos} (COP $${vendidos * valorBoleta})<br>
      Pendientes: ${pendientes} (COP $${pendientes * valorBoleta})<br>
      Disponibles: ${disponibles}<br>
      <strong>Total recaudado: COP $${totalRecaudado}</strong>
    `;

    // --- BARRA META 600K ---
    const vendidosEnDinero = vendidos * valorBoleta;
    const meta = 600000;
    const porcentajeVendidosMeta = Math.min((vendidosEnDinero / meta) * 100, 100);
    const porcentajePendientesMeta = Math.max(100 - porcentajeVendidosMeta, 0);

    barraVendidosMeta.style.width = `${porcentajeVendidosMeta}%`;
    barraPendientesMeta.style.width = `${porcentajePendientesMeta}%`;
    textoMeta.textContent = `Meta 600k: ${Math.round(porcentajeVendidosMeta)}%`;

    // --- BARRA TOTAL (queda igual) ---
    const porcentajeVendidos = (vendidos / totalNumeros) * 100;
    const porcentajePendientes = (pendientes / totalNumeros) * 100;
    barraVendidos.style.width = `${porcentajeVendidos}%`;
    barraPendientes.style.width = `${porcentajePendientes}%`;
    textoTotal.textContent = `Total: ${Math.round(porcentajeVendidos + porcentajePendientes)}%`;
  }

  for (let i = 0; i < totalNumeros; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.textContent = i;
    cell.dataset.numero = i;
    grid.appendChild(cell);

    const numRef = doc(db, "numeros", i.toString());

    onSnapshot(numRef, (docSnap) => {
      const data = docSnap.data();
      cell.classList.remove("green", "yellow", "blue");
      if (!data || data.estado === "disponible") {
        cell.title = "Disponible";
      } else {
        if (data.estado === "vendido") cell.classList.add("green");
        else if (data.estado === "pendiente") cell.classList.add("yellow");
        else if (data.estado === "solicitado") cell.classList.add("blue");
        cell.title = `${data.nombre || ""} ${data.apellido || ""}`.trim();
      }
      actualizarMensaje();
    });

    cell.addEventListener("click", async () => {
      numeroSeleccionado = i;
      const snap = await getDoc(numRef);
      const data = snap.data() || { estado: "disponible" };
      numeroModal.textContent = i;
      nombreInput.value = data.nombre || "";
      apellidoInput.value = data.apellido || "";
      estadoInput.value = data.estado || "disponible";
      modal.style.display = "flex";
    });
  }

  window.guardarCambios = async () => {
    const numRef = doc(db, "numeros", numeroSeleccionado.toString());
    await setDoc(numRef, {
      estado: estadoInput.value,
      nombre: nombreInput.value,
      apellido: apellidoInput.value
    });
    cerrarModal();
    actualizarLista();
  };

  window.cerrarModal = () => {
    modal.style.display = "none";
  };

  filtroEstado.addEventListener("change", actualizarLista);
  actualizarLista();

  document.getElementById("copyBtn").addEventListener("click", () => {
    const texto = "Los números disponibles son: " + availableNumbersText.textContent;
    navigator.clipboard.writeText(texto).then(() => {
      copyBtn.textContent = "¡Copiado!";
      setTimeout(() => { copyBtn.textContent = "Copiar mensaje"; }, 2000);
    });
  });

  const toggleBtn = document.getElementById("toggleInscritos");
  let visible = true;
  toggleBtn.addEventListener("click", () => {
    visible = !visible;
    listaParticipantes.style.display = visible ? "block" : "none";
    toggleBtn.textContent = visible ? "Ocultar lista de inscritos" : "Mostrar lista de inscritos";
  });

  // 🔄 Solicitudes
  const solicitudesRef = collection(db, "solicitudes");
  onSnapshot(query(solicitudesRef), (snapshot) => {
    noticiasAdmin.innerHTML = "";
    if (snapshot.empty) {
      noticiasAdmin.innerHTML = "<p>No hay solicitudes en este momento.</p>";
      return;
    }
    snapshot.forEach(docSnap => {
      const s = docSnap.data();
      const id = docSnap.id;
      const div = document.createElement("div");
      div.classList.add("solicitud");
      div.innerHTML = `
        <strong>#${s.numero}</strong><br>
        Nombre: ${s.nombre} ${s.apellido}<br>
        Método: ${s.metodo}<br>
        <button class="aprobar" onclick="aprobarSolicitud('${id}', ${s.numero}, '${s.nombre}', '${s.apellido}')">Aprobar</button>
        <button class="cancelar" onclick="rechazarSolicitud('${id}')">Cancelar</button>
      `;
      noticiasAdmin.appendChild(div);
    });
  });

  window.aprobarSolicitud = async (id, numero, nombre, apellido) => {
    const refNum = doc(db, "numeros", numero.toString());
    await setDoc(refNum, { nombre, apellido, estado: "vendido" });
    await deleteDoc(doc(db, "solicitudes", id));
  };

  window.rechazarSolicitud = async (id) => {
    const solicitudSnap = await getDoc(doc(db, "solicitudes", id));
    if (solicitudSnap.exists()) {
      const data = solicitudSnap.data();
      const numero = data.numero.toString();
      await setDoc(doc(db, "numeros", numero), {
        estado: "disponible",
        nombre: "",
        apellido: ""
      });
    }
    await deleteDoc(doc(db, "solicitudes", id));
  };

  // 📷 Comprobantes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      onSnapshot(collection(db, "comprobantes"), (snapshot) => {
        listaComprobantes.innerHTML = "";
        if (snapshot.empty) {
          listaComprobantes.textContent = "No hay comprobantes subidos aún.";
          return;
        }

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const card = document.createElement("div");
          card.classList.add("comprobante-card");

          const fecha = new Date(data.fecha).toLocaleString("es-CO");

          card.innerHTML = `
            <strong>Números:</strong> ${data.numeros}<br>
            <strong>Subido:</strong> ${fecha}<br>
            <img src="${data.url}" alt="Comprobante" /><br>
            <button data-id="${docSnap.id}" data-path="${data.path}">Eliminar</button>
          `;

          card.querySelector("button").addEventListener("click", async (e) => {
  const id = e.target.getAttribute("data-id");
  const path = e.target.getAttribute("data-path");

  console.log("🧪 ID del documento:", id);
  console.log("🧪 PATH del archivo:", path);

  if (!confirm("¿Seguro que deseas eliminar este comprobante?")) return;

  if (!path || typeof path !== "string") {
    alert("❌ Path inválido o no definido: " + path);
    return;
  }

  try {
    console.log("🚀 Eliminando archivo en Storage:", path);
    await deleteObject(storageRef(storage, path));
    await deleteDoc(doc(db, "comprobantes", id));
    alert("✅ Comprobante eliminado correctamente.");
  } catch (err) {
    console.error("❌ Error al eliminar archivo:", err);
    alert("❌ Error al eliminar el comprobante. Revisa la consola.");
  }
});


          listaComprobantes.appendChild(card);
        });
      });
    } else {
      alert("No autenticado. Recarga la página.");
    }
  });

  // --- Selección de ganador desde admin ---
  // Llenar el selector con los números vendidos
  async function llenarSelectorGanador() {
    if (!selectorGanador) return;
    selectorGanador.innerHTML = '<option value="">-- Selecciona un número --</option>';
    for (let i = 0; i < totalNumeros; i++) {
      const numRef = doc(db, "numeros", i.toString());
      const docSnap = await getDoc(numRef);
      if (docSnap.exists()) {
        const estado = docSnap.data().estado;
        if (estado === "vendido" || estado === "pendiente") {
          const option = document.createElement("option");
          option.value = i;
          option.textContent = `#${i} (${estado})`;
          selectorGanador.appendChild(option);
        }
      }
    }
  }
  llenarSelectorGanador();

  if (selectorGanador) {
    selectorGanador.addEventListener("change", async function() {
      const numero = selectorGanador.value;
      if (!numero) {
        nombreGanadorAdmin.textContent = "";
        return;
      }
      const numRef = doc(db, "numeros", numero);
      const docSnap = await getDoc(numRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const nombre = (data.nombre || "") + " " + (data.apellido || "");
        nombreGanadorAdmin.textContent = `${nombre.trim()}`;
      } else {
        nombreGanadorAdmin.textContent = "No encontrado";
      }
    });

    guardarGanadorBtn.addEventListener("click", async function() {
      const numero = selectorGanador.value;
      if (!numero) {
        mensajeGanadorAdmin.style.color = "red";
        mensajeGanadorAdmin.textContent = "Selecciona un número válido.";
        return;
      }
      // Guarda el número ganador en un documento especial
      await setDoc(doc(db, "config", "ganador"), { numero: numero });
      mensajeGanadorAdmin.style.color = "green";
      mensajeGanadorAdmin.textContent = "¡Ganador guardado correctamente!";
    });
  }
