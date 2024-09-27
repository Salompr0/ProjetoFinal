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

app.use(bodyParser.urlencoded({ extended: true }));

//Função para obter categorias
async function getCategorias(){
    let categoria = [];
    
    const result = await db.query("SELECT cat_nome FROM categoria");

    result.rows.forEach((cat) => {
        categoria.push(cat.cat_nome);
    });
    
    console.log(result.rows);

    return categoria;
}

//Função para obter artigos de uma categoria
/*async function getArtigos(){

    const result = await db.query("SELECT * FROM artigo");

    result.rows.forEach(async (artigo) => {

        const artigoID = artigo.art_id;
        const artNome = artigo.nome;
        const preco = artigo.preco;
        const quantidade = artigo.quantidade;
        const descricao = artigo.descricao;
        const autor = await db.query("SELECT nome FROM user JOIN artigo ON user_id =artigo.user_id");
        const categoria = artigo.cat_id;    
    });

    const result = await db.select({

    artigoID: artigo.art_id,
    artNome: artigo.nome,
    preco: artigo.preco,
    quantidade: artigo.quantidade,
    descricao: artigo.descricao,
    categoria: artigo.cat_id,
    }).from(artigo);

    const artigos = result[];
    
    return 
}*/

//Página principal
app.get("/", async (req, res) => {
    //Categorias em Destaque (Acrílico, Aguarelas)
    const categoriaDestaque = await getCategorias();


    res.render(home, { categoria: categoriaDestaque});
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
    
    res.render(categorias, { categoria: categoria, total: categoria.length});
    db.end();
});


//Página do carrinho de compras
app.get("/compra", (req, res) => {
    res.render(compra);
});


//Página de um artigo
app.post("/artigo/:id", (req, res) => {

    res.render(artigo);
});







app.listen(port, () => {
    console.log(`Successfully started server on port ${port}.`);
});
