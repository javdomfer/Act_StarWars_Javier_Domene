// npm init -y
// npm install express method-override ejs

const express = require("express");
const app = express();
const port = 5322;
const path = require("path");
const datos = require("./starwars.json");
const methodOverride = require("method-override"); // Cambiar método de formulario

app.set("view engine", "ejs"); // Modelo para las vistas
app.set("views", path.join(__dirname, "/views")); // Carpeta para las vistas

app.use(express.static(path.join(__dirname, "public"))); // Carpeta pública
app.use(express.urlencoded({ extended: true })); // Para poder leer datos (request body) en métodos POST
app.use(express.json()); // Leer datos json
app.use(methodOverride("_method")); // ?_method=PATCH | ?_method=DELETE

let personajes = []; // Array para almacenar los personajes

// Ruta raíz

app.get("/", (req, res) => {
  res.redirect("search.html");
});

// Rutas fijas

app.get("/starwars", (req, res) => { // Read
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.render("index.ejs", { personajes });
    }

    const personaje = personajes.find((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (personaje) {
      res.redirect(`/starwars/${personaje.name.split(" ")[0]}`);
    } else {
      res.render("error.ejs", { msg: `No se ha encontrado ningún personaje con "${q}"` });
    }
  } catch (error) {
    res.render("error.ejs", { msg: "Error buscando personaje" });
  }
});

app.get("/starwars/new", (req, res) => { // Insert
  try {
    res.render("new.ejs");
  } catch (error) {
    res.render("error.ejs", { msg: "Error de formulario de creación" });
  }
});

app.post("/starwars", (req, res) => { // Create
  try {
    const { nombre, altura, peso, foto } = req.body;
    const nombreCorto = nombre.trim().split(" ")[0];

    const comprobacion = personajes.some((p) => p.name.split(" ")[0] === nombreCorto);
    if (comprobacion) {
      return res.render("error.ejs", { msg: "Ya existe un personaje con ese nombre" });
    }

    const personajeNew = {
      name: nombre.trim(),
      height: altura,
      mass: peso,
      photo: foto,
    };
    personajes.push(personajeNew);

    res.redirect(`/starwars/${nombreCorto}`);
  } catch (error) {
    res.render("error.ejs", { msg: "Error durante la creación del personaje" });
  }
});

// Rutas variables

app.get("/starwars/:nombre", async (req, res) => { // Read
  try {
    const { nombre } = req.params;
    const personaje = personajes.find((p) => p.name.split(" ")[0] === nombre);
    if (!personaje) {
      return res.render("error.ejs", { msg: "Personaje no encontrado" });
    }

    let planeta = null;
    try {
      const respuesta = await fetch(personaje.homeworld);
      if (respuesta.ok) {
        planeta = await respuesta.json();
      }
    } catch (error) {
      console.log("No hay planeta");
    }

    res.render("show.ejs", { personaje, planeta });
  } catch (error) {
    res.render("error.ejs", { msg: "Error mostrando personaje" });
  }
});

app.get("/starwars/:nombre/edit", (req, res) => { // Update 
  try {
    const { nombre } = req.params;
    const personaje = personajes.find((p) => p.name.split(" ")[0] === nombre);
    if (personaje) {
      res.render("edit.ejs", { personaje });
    } else {
      res.render("error.ejs", { msg: "Personaje no encontrado" });
    }
  } catch (error) {
    res.render("error.ejs", { msg: "Error de formulario de edición" });
  }
});

app.patch("/starwars/:nombre", (req, res) => { // Update
  try {
    const { nombre } = req.params;
    const personajeOld = personajes.find((p) => p.name.split(" ")[0] === nombre);
    if (!personajeOld) {
      return res.render("error.ejs", { msg: "Personaje no encontrado" });
    }

    const { height, mass } = req.body;
    if (!height) {
      return res.render("error.ejs", { msg: "Altura inválida" });
    } else if (!mass) {
      return res.render("error.ejs", { msg: "Peso inválido" });
    } else {
      personajeOld.height = height;
      personajeOld.mass = mass;
    }

    res.redirect(`/starwars/${nombre}`);
  } catch (error) {
    res.render("error.ejs", { msg: "Error editando personaje" });
  }
});

app.delete("/starwars/:nombre", (req, res) => { // Delete
  try {
    const { nombre } = req.params;
    const comprobacion = personajes.some((p) => p.name.split(" ")[0] === nombre);
    if (comprobacion) {
      personajes = personajes.filter((p) => p.name.split(" ")[0] !== nombre);
    } else {
      return res.render("error.ejs", { msg: "El personaje no existe" });
    }

    res.redirect("/starwars");
  } catch (error) {
    res.render("error.ejs", { msg: "Error borrando personaje" });
  }
});

// Página de error general

app.use((req, res) => {
  res.send("<h1>Error página no encontrada</h1>");
});

// Funciones

function anyadirFoto() {
  return datos.map((p) => ({
    ...p,
    photo: `../images/${p.name.split(" ")[0]}.jpg`,
  }));
}

// Levantar servidor

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
  personajes = anyadirFoto();
});
