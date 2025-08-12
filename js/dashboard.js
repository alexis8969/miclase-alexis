const SUPABASE_URL = "https://dsffclttfnbnxonyfmhw.supabase.co";
const SUPABASE_KEY = "TU_KEY_AQUI";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let editando = false; // Saber si estamos editando

// ----------------- AGREGAR O ACTUALIZAR -----------------
async function agregarOActualizar() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();
  const editId = document.getElementById("edit-id").value;

  if (!nombre || !correo || !clase) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  let error;
  if (editando) {
    ({ error } = await client
      .from("estudiantes")
      .update({ nombre, correo, clase })
      .eq("id", editId));
  } else {
    ({ error } = await client
      .from("estudiantes")
      .insert({ nombre, correo, clase, user_id: user.id }));
  }

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  alert(editando ? "Estudiante actualizado" : "Estudiante agregado");
  cancelarEdicion();
  cargarEstudiantes();
}

// ----------------- CARGAR ESTUDIANTES -----------------
async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";
  
  data.forEach((est) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${est.nombre} (${est.clase})</span>
      <button class="btn-editar" onclick="cargarEnFormulario('${est.id}', '${est.nombre}', '${est.correo}', '${est.clase}')">Editar</button>
      <button class="btn-eliminar" onclick="eliminarEstudiante('${est.id}')">Eliminar</button>
    `;
    lista.appendChild(item);
  });
}

cargarEstudiantes();

// ----------------- CARGAR EN FORMULARIO PARA EDITAR -----------------
function cargarEnFormulario(id, nombre, correo, clase) {
  document.getElementById("edit-id").value = id;
  document.getElementById("nombre").value = nombre;
  document.getElementById("correo").value = correo;
  document.getElementById("clase").value = clase;
  
  document.getElementById("form-title").innerText = "Editar estudiante";
  document.getElementById("btn-guardar").innerText = "Actualizar";
  document.getElementById("btn-cancelar").style.display = "inline-block";

  editando = true;
}

// ----------------- CANCELAR EDICIÓN -----------------
function cancelarEdicion() {
  document.getElementById("edit-id").value = "";
  document.getElementById("nombre").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("clase").value = "";

  document.getElementById("form-title").innerText = "Registrar estudiante";
  document.getElementById("btn-guardar").innerText = "Agregar";
  document.getElementById("btn-cancelar").style.display = "none";

  editando = false;
}

// ----------------- ELIMINAR ESTUDIANTE -----------------
async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);
  if (error) {
    alert("Error al eliminar: " + error.message);
  } else {
    alert("Estudiante eliminado");
    cargarEstudiantes();
  }
}

// ----------------- SUBIR ARCHIVO -----------------
async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`; 
  const { error } = await client.storage
    .from("tareas")
    .upload(nombreRuta, archivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    alert("Error al subir: " + error.message);
  } else {
    alert("Archivo subido correctamente.");
    listarArchivos(); 
  }
}

// ----------------- LISTAR ARCHIVOS -----------------
async function listarArchivos() {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const { data, error } = await client.storage
    .from("tareas")
    .list(`${user.id}`, { limit: 20 });

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (error) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  data.forEach(async (archivo) => {
    const { data: signedUrlData } = await client.storage
      .from("tareas")
      .createSignedUrl(`${user.id}/${archivo.name}`, 60); 

    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");

    const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const esPDF = archivo.name.match(/\.pdf$/i);

    if (esImagen) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>
      `;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>
      `;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
    }

    lista.appendChild(item);
  });
}
listarArchivos();

// ----------------- CERRAR SESIÓN -----------------
async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    localStorage.removeItem("token");
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}
