const SUPABASE_URL = "https://dsffclttfnbnxonyfmhw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZmZjbHR0Zm5ibnhvbnlmbWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyNzIsImV4cCI6MjA3MDA4MDI3Mn0.SNM7Rph0yb8BdTDy8D2urNiYP4Z5Zu9vjXszLXFznh8";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estudiantesData = []; 

// ----------------- AGREGAR ESTUDIANTE -----------------
async function agregarEstudiante() {
    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const clase = document.getElementById("clase").value;

    const { data: { user }, error: userError } = await client.auth.getUser();

    if (userError || !user) {
        alert("No estás autenticado.");
        return;
    }

    const { error } = await client.from("estudiantes").insert({
        nombre,
        correo,
        clase,
        user_id: user.id,
    });

    if (error) {
        alert("Error al agregar: " + error.message);
    } else {
        alert("Estudiante agregado");
        document.getElementById("nombre").value = "";
        document.getElementById("correo").value = "";
        document.getElementById("clase").value = "";
        cargarEstudiantes();
    }
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

    estudiantesData = data;
    const lista = document.getElementById("lista-estudiantes");
    lista.innerHTML = "";
    
    data.forEach((est) => {
        const item = document.createElement("li");
        item.innerHTML = `
            <span>${est.nombre} (${est.clase})</span>
            <div class="lista-botones">
                <button class="btn-editar" onclick="abrirModalEdicion('${est.id}')">Editar</button>
                <button class="btn-eliminar" onclick="eliminarEstudiante('${est.id}')">Eliminar</button>
            </div>
        `;
        lista.appendChild(item);
    });
}
cargarEstudiantes();

// ----------------- MODAL DE EDICIÓN -----------------
function abrirModalEdicion(id) {
    const estudiante = estudiantesData.find(est => est.id === id);
    if (!estudiante) {
        alert("Estudiante no encontrado.");
        return;
    }
    
    document.getElementById("edit-id").value = estudiante.id;
    document.getElementById("edit-nombre").value = estudiante.nombre;
    document.getElementById("edit-correo").value = estudiante.correo;
    document.getElementById("edit-clase").value = estudiante.clase;
    document.getElementById("modal-editar").style.display = "block";
}

function cerrarModal() {
    document.getElementById("modal-editar").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("modal-editar");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// ----------------- GUARDAR EDICIÓN -----------------
async function guardarEdicion() {
    const id = document.getElementById("edit-id").value;
    const nuevoNombre = document.getElementById("edit-nombre").value;
    const nuevoCorreo = document.getElementById("edit-correo").value;
    const nuevaClase = document.getElementById("edit-clase").value;

    if (!nuevoNombre || !nuevoCorreo || !nuevaClase) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    const { error } = await client
        .from("estudiantes")
        .update({ nombre: nuevoNombre, correo: nuevoCorreo, clase: nuevaClase })
        .eq("id", id);

    if (error) {
        alert("Error al editar: " + error.message);
    } else {
        alert("Estudiante actualizado");
        cerrarModal();
        cargarEstudiantes();
    }
}

// ----------------- ELIMINAR ESTUDIANTE -----------------
async function eliminarEstudiante(id) {
    if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

    const { error } = await client
        .from("estudiantes")
        .delete()
        .eq("id", id);

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
        localStorage.clear();
        alert("Sesión cerrada.");
        window.location.href = "index.html";
    }
}