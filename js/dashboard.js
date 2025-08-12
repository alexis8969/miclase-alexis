const SUPABASE_URL = "https://dsffclttfnbnxonyfmhw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZmZjbHR0Zm5ibnhvbnlmbWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyNzIsImV4cCI6MjA3MDA4MDI3Mn0.SNM7Rph0yb8BdTDy8D2urNiYP4Z5Zu9vjXszLXFznh8";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estudiantesData = []; // Variable global para guardar la lista de estudiantes

// ----------------- AGREGAR ESTUDIANTE -----------------
async function agregarEstudiante() {
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const clase = document.getElementById("clase").value.trim();

    if (!nombre || !correo || !clase) {
        alert("Todos los campos son obligatorios.");
        return;
    }

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
        await cargarEstudiantes();
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

    estudiantesData = data || [];
    const lista = document.getElementById("lista-estudiantes");
    lista.innerHTML = "";

    const selectEstudiante = document.getElementById("estudiante");
    selectEstudiante.innerHTML = "";
    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Selecciona un estudiante";
    selectEstudiante.appendChild(opcionInicial);

    estudiantesData.forEach((est) => {
        const item = document.createElement("li");
        item.innerHTML = `
            <span>${est.nombre} (${est.clase})</span>
            <div class="lista-botones">
                <button class="btn-editar" onclick="abrirModalEdicion('${est.id}')">Editar</button>
                <button class="btn-eliminar" onclick="eliminarEstudiante('${est.id}')">Eliminar</button>
            </div>
        `;
        lista.appendChild(item);

        const opcion = document.createElement("option");
        opcion.value = est.id;
        opcion.textContent = est.nombre;
        selectEstudiante.appendChild(opcion);
    });
}

// ----------------- MODAL DE EDICIÓN -----------------
function abrirModalEdicion(id) {
    const estudiante = estudiantesData.find(est => String(est.id) === String(id));
    if (!estudiante) {
        alert(`Estudiante no encontrado. ID buscado: ${id}`);
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

window.onclick = function (event) {
    const modal = document.getElementById("modal-editar");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// ----------------- GUARDAR EDICIÓN -----------------
async function guardarEdicion(event) {
    event.preventDefault(); // Evita que la página se recargue

    const id = document.getElementById("edit-id").value;
    const nuevoNombre = document.getElementById("edit-nombre").value.trim();
    const nuevoCorreo = document.getElementById("edit-correo").value.trim();
    const nuevaClase = document.getElementById("edit-clase").value.trim();

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
        await cargarEstudiantes();
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
        await cargarEstudiantes();
        await listarArchivos(); // Recargar la lista de archivos por si hay cambios
    }
}

// ----------------- SUBIR ARCHIVO -----------------
async function subirArchivo() {
    const archivoInput = document.getElementById("archivo");
    const archivo = archivoInput.files[0];
    const idEstudiante = document.getElementById("estudiante").value;

    if (!archivo || !idEstudiante) {
        alert("Selecciona un estudiante y un archivo primero.");
        return;
    }

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
        alert("Sesión no válida.");
        return;
    }

    const nombreRuta = `${user.id}/${idEstudiante}/${archivo.name}`;
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
        await listarArchivos();
    }
}

// ----------------- LISTAR ARCHIVOS -----------------
async function listarArchivos() {
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
        alert("Sesión no válida.");
        return;
    }

    const lista = document.getElementById("lista-archivos");
    lista.innerHTML = "";

    const { data, error } = await client.storage
        .from("tareas")
        .list(`${user.id}`, { limit: 100 }); // Aumenta el límite si hay muchos archivos

    if (error) {
        lista.innerHTML = "<li>Error al listar archivos</li>";
        return;
    }

    for (const estudianteFolder of data) {
        if (estudianteFolder.id) {
            const { data: archivosEstudiante, error: archivosError } = await client.storage
                .from("tareas")
                .list(`${user.id}/${estudianteFolder.id}`, { limit: 100 });

            if (archivosError) continue;

            const nombreEstudiante = (estudiantesData.find(est => String(est.id) === String(estudianteFolder.id)) || {}).nombre || `Estudiante ${estudianteFolder.id}`;

            archivosEstudiante.forEach(async (archivo) => {
                const { data: signedUrlData } = await client.storage
                    .from("tareas")
                    .createSignedUrl(`${user.id}/${estudianteFolder.id}/${archivo.name}`, 60);

                const publicUrl = signedUrlData.signedUrl;
                const item = document.createElement("li");

                item.innerHTML = `
                    <span><strong>${nombreEstudiante}:</strong> ${archivo.name}</span>
                    <div class="lista-botones">
                        <a href="${publicUrl}" target="_blank" class="btn-ver">Ver</a>
                        <button class="btn-eliminar" onclick="eliminarArchivo('${user.id}/${estudianteFolder.id}/${archivo.name}')">Eliminar</button>
                    </div>
                `;
                lista.appendChild(item);
            });
        }
    }
}

// ----------------- ELIMINAR ARCHIVO -----------------
async function eliminarArchivo(nombreArchivo) {
    if (!confirm("¿Seguro que quieres eliminar este archivo?")) return;
    const { error } = await client.storage.from("tareas").remove([nombreArchivo]);
    if (error) {
        alert("Error al eliminar el archivo: " + error.message);
    } else {
        alert("Archivo eliminado.");
        await listarArchivos();
    }
}


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

// Cargar estudiantes y archivos al inicio
document.addEventListener("DOMContentLoaded", async () => {
    await cargarEstudiantes();
    await listarArchivos();
});