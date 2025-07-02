import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot, setDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmfnmwARjEAwIO0AL1ARHW8JVelcR8ZWc",
  authDomain: "rifa-pro-fondos.firebaseapp.com",
  projectId: "rifa-pro-fondos",
  storageBucket: "rifa-pro-fondos.firebasestorage.app", // ✅ Bucket correcto
  messagingSenderId: "902059536686",
  appId: "1:902059536686:web:be80e12bcb5aa8f4158abf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // ✅ Usa el bucket por defecto


const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const numSeleccionadoSpan = document.getElementById("numSeleccionado");
const nombre = document.getElementById("nombre");
const apellido = document.getElementById("apellido");
const metodo = document.getElementById("metodo");
const qrContainer = document.getElementById("qrContainer");
const infoNequi = document.getElementById("info-nequi");
const infoBancolombia = document.getElementById("info-bancolombia");

metodo.addEventListener("change", () => {
  if (metodo.value === "nequi") {
    infoNequi.style.display = "block";
    infoBancolombia.style.display = "none";
  } else if (metodo.value === "bancolombia") {
    infoNequi.style.display = "none";
    infoBancolombia.style.display = "block";
  } else {
    infoNequi.style.display = "none";
    infoBancolombia.style.display = "none";
  }
});

let numeroSeleccionado = null;
const totalNumeros = 100;

for (let i = 0; i < totalNumeros; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.textContent = i;
  grid.appendChild(cell);

  const docRef = doc(db, "numeros", i.toString());
  onSnapshot(docRef, (snap) => {
    cell.className = "cell";
    if (!snap.exists() || snap.data().estado === "disponible") {
      cell.onclick = () => abrirModal(i);
    } else if (snap.data().estado === "vendido") {
      cell.classList.add("vendido");
    } else if (snap.data().estado === "pendiente") {
      cell.classList.add("pendiente");
    } else if (snap.data().estado === "solicitado") {
      cell.classList.add("solicitado");
    }
  });
}

function abrirModal(numero) {
  numeroSeleccionado = numero;
  numSeleccionadoSpan.textContent = numero;
  modal.style.display = "flex";
}

window.enviarSolicitud = async function () {
  if (!nombre.value.trim() || !apellido.value.trim() || !metodo.value) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  await setDoc(doc(db, "numeros", numeroSeleccionado.toString()), {
    estado: "solicitado",
    nombre: nombre.value,
    apellido: apellido.value
  });

  await addDoc(collection(db, "solicitudes"), {
    numero: numeroSeleccionado,
    nombre: nombre.value,
    apellido: apellido.value,
    metodo: metodo.value,
    fecha: new Date().toISOString()
  });

  alert("Solicitud enviada. No olvides subir el comprobante más abajo.");
  modal.style.display = "none";
  nombre.value = "";
  apellido.value = "";
  metodo.value = "";
};

window.onclick = function (e) {
  if (e.target == modal) {
    modal.style.display = "none";
  }
};

// 📤 Subida de comprobantes
const formComprobante = document.getElementById("formComprobante");
const numerosInput = document.getElementById("numerosComprobante");
const imagenInput = document.getElementById("imagenComprobante");
const estadoSubida = document.getElementById("estadoSubida");

formComprobante.addEventListener("submit", async (e) => {
  e.preventDefault();

  const numeros = numerosInput.value.trim();
  const archivo = imagenInput.files[0];

  if (!numeros || !archivo) {
    estadoSubida.style.color = "red";
    estadoSubida.textContent = "Por favor completa todos los campos.";
    return;
  }

  const timestamp = Date.now();
  const nombreLimpio = numeros.replace(/\s+/g, '-').replace(/,/g, '-');
  const nombreArchivo = `comprobantes/${nombreLimpio}_${timestamp}_${archivo.name}`;
  const archivoRef = ref(storage, nombreArchivo);

  try {
    // Subir imagen a Firebase Storage
    await uploadBytes(archivoRef, archivo);

    // Obtener URL pública
    const downloadURL = await getDownloadURL(archivoRef);

    // Guardar info en Firestore
    await addDoc(collection(db, "comprobantes"), {
      numeros,
      url: downloadURL,
      path: archivoRef.fullPath, // ✅ Path correcto
      fecha: new Date().toISOString()
    });

    estadoSubida.style.color = "green";
    estadoSubida.textContent = "¡Comprobante subido exitosamente!";
    formComprobante.reset();
    console.log(downloadURL);
  } catch (err) {
    console.error(err);
    estadoSubida.style.color = "red";
    estadoSubida.textContent = "Error al subir el comprobante.";
  }
});