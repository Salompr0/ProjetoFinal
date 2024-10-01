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
const artigoescolhido = join(__dirname, "views/artigo.ejs");
const categorias = join(__dirname, "views/categorias.ejs");
const compra = join(__dirname, "views/compra.ejs");

const app = express();
const port = 3000;

//Connexão à base de dados
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "LogArte",
    password: "Prog.sal23",
    port: 5432,
  });
  
  db.connect();

//CSS Path
app.use(express.static("public"));

app.set('render engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//Função para obter categorias
async function getCategorias(){
    let categoria = [];
    
    const result = await db.query("SELECT * FROM categoria");

    categoria = result.rows;
    
    //console.log(categoria);

    return categoria;
}

//Função para obter artigos de uma categoria
async function getArtigos(){

    let artigos = [];

    const result = await db.query("SELECT * FROM artigo ORDER BY art_id ASC");

    artigos = result.rows;

    //console.log(artigos);
    
    return artigos;
}

//Página principal
app.get("/", async (req, res) => {
    //Categorias em Destaque (Acrílico, Aguarelas)
    const categoriaDestaque = await getCategorias();

    const artigos = await getArtigos();

    res.render(home, { categoria: categoriaDestaque, artigo: artigos, totalArtigo: artigos.length});
});

//Página de login
app.get("/login", (req,res) =>{
    res.render(login);
});


//Página de Registo
app.get("/registar", (req, res) => {
    res.render(registo);
});


//Página de Perfil do Utilizador
app.get("/perfil", (req, res) => {
    res.render(perfil);
});


//Página com todas as categorias
app.get("/categorias", async (req, res) => {

    const categoria = await getCategorias();
    const artigo = await getArtigos();
    
    res.render(categorias, { categoria: categoria, total: categoria.length, artigo: artigo, totalArtigo: artigo.length});

});

//Página do carrinho de compras
app.get("/compra", (req, res) => {
    res.render(compra);
});

//Página de um artigo
app.get("/arte/:id", async (req, res) => {
    try {
        const artID = parseInt(req.params.id, 10);

        // Verifique se o artID é um número válido
        if (isNaN(artID)) {
            return res.status(400).send("ID inválido. O ID deve ser um número.");
        }

        const result = await db.query('SELECT * FROM artigo WHERE art_id = $1', [artID]);
        const artigo = result.rows;

        // Verifique se o artigo foi encontrado
        if (artigo.length === 0) {
            return res.status(404).send("Artigo não encontrado.");
        }
        //console.log(artID);
        console.log(artigo);

        res.render(artigoescolhido, { artigo: artigo });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro no servidor.");
    }
});







app.listen(port, () => {
    console.log(`Successfully started server on port ${port}.`);
});
