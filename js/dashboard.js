const SUPABASE_URL = "https://dsffclttfnbnxonyfmhw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZmZjbHR0Zm5ibnhvbnlmbWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyNzIsImV4cCI6MjA3MDA4MDI3Mn0.SNM7Rph0yb8BdTDy8D2urNiYP4Z5Zu9vjXszLXFznh8";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estudiantesData = []; // Aquí guardamos la lista cargada

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
    console.log("Cargando estudiantes...");
    const { data, error } = await client
        .from("estudiantes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        alert("Error al cargar estudiantes: " + error.message);
        return;
    }

    estudiantesData = data || [];
    console.log("Estudiantes cargados:", estudiantesData);

    const lista = document.getElementById("lista-estudiantes");
    lista.innerHTML = "";

    estudiantesData.forEach((est) => {
        console.log("Renderizando estudiante:", est.id, est.nombre);
        const item = document.createElement("li");
        item.innerHTML = `
            <span>${est.nombre} (${est.clase})</span>
            <div class="lista-botones">
                <button class="btn-editar" onclick="abrirModalEdicion(${est.id})">Editar</button>
                <button class="btn-eliminar" onclick="eliminarEstudiante(${est.id})">Eliminar</button>
            </div>
        `;
        lista.appendChild(item);
    });
}

// ----------------- MODAL DE EDICIÓN -----------------
function abrirModalEdicion(id) {
    if (!estudiantesData.length) {
        alert("La lista de estudiantes no está cargada todavía.");
        return;
    }

    const estudiante = estudiantesData.find(est => est.id == id);
    console.log("Buscando estudiante con ID:", id, "Resultado:", estudiante);

    if (!estudiante) {
        alert(`No se encontró el estudiante con id: ${id}`);
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
async function guardarEdicion(event) {
    event.preventDefault();

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

// Ejecutar carga inicial al abrir la página
document.addEventListener("DOMContentLoaded", cargarEstudiantes);
