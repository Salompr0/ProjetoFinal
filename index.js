import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

//The path names
const home = join(__dirname, "views/index.ejs");
const login = join(__dirname, "views/login.ejs");
const registo = join(__dirname, "views/registar.ejs");
const perfil = join(__dirname, "views/perfil.ejs");
const artistas = join(__dirname, "views/artistas.ejs");
const artigo = join(__dirname, "views/artigo.ejs");
const categorias = join(__dirname, "views/categorias.ejs");
const compra = join(__dirname, "views/compra.ejs");

const app = express();
const port = 3000;

//CSS Path
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render(home);
});

app.get("/login", (req,res) =>{
    res.render(login);
});

app.get("/registar", (req, res) => {
    res.render(registo);
});

app.get("/perfil", (req, res) => {
    res.render(perfil);
});


app.get("/categorias", (req, res) => {
    res.render(categorias);
})

app.get("/compra", (req, res) => {
    res.render(compra);
});




app.post("/artigo/:id", (req, res) => {

    res.render(artigo);
});







app.listen(port, () => {
    console.log(`Successfully started server on port ${port}.`);
});
