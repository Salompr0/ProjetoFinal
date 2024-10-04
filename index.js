import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import path from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

//The path names
const home = join(__dirname, "views/index.ejs");
const login = join(__dirname, "views/login.ejs");
const registo = join(__dirname, "views/registar.ejs");
const perfil = join(__dirname, "views/perfil.ejs");
const artigoescolhido = join(__dirname, "views/artigo.ejs");
const categorias = join(__dirname, "views/categorias.ejs");
const compra = join(__dirname, "views/compra.ejs");
const artistas = join(__dirname, "views/artistas.ejs");


const app = express();
const port = 3000;

//Connexão à base de dados
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "LogArte",
    password: "Felpes27",
    port: 5432,
  });
  
  db.connect();

//CSS Path
app.use(express.static("public"));

app.set('render engine', 'ejs');
// Configurando o EJS como mecanismo de view
app.set('view engine', 'ejs');

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
app.get("/perfil", async(req, res) => {

    const result = await db.query('SELECT * FROM users WHERE user_id = $1', [1]);
    const user = result.rows;

    res.render (perfil, {user: user});
});


//Página com todas as categorias
app.get("/categorias", async (req, res) => {

    const categoria = await getCategorias();
    const artigo = await getArtigos();
    
    res.render(categorias, { categoria: categoria, total: categoria.length, artigo: artigo, totalArtigo: artigo.length});

});

//Página do carrinho de compras
app.get("/compra", (req, res) => {

    const pedidos = 0;//change

    res.render(compra, { pedidos: pedidos });
});

//Página de um artigo
app.get("/arte/:id", async (req, res) => {

        const artID = parseInt(req.params.id);

        const result = await db.query('SELECT * FROM artigo WHERE art_id = $1', [artID]);
        const artigo = result.rows;

        //console.log(artID);
        console.log(artigo);

        res.render(artigoescolhido, { artigoEscolhido: artigo });
});

app.patch("edit/user/:id", (req, res) => {

    res.render("registo");
})


//Página de artistas
app.get("/artistas", async (req,res) => {

    const result = await db.query('SELECT * FROM users WHERE vendedor = true');
    const artista = result.rows;

    res.render(artistas, { artistas: artista });
});



app.listen(port, () => {
    console.log(`Successfully started server on port ${port}.`);
});


// Middleware para página 404
app.use((req, res, next) => {
    res.status(404).render("404");
});

// Registro de artigos
app.get("/registar_artigo", async (req, res) => {
    try {
      // Busca todas as categorias para o dropdown do formulário
      const result = await db.query("SELECT cat_id, cat_nome FROM categoria");
      res.render("registar_artigo", { categorias: result.rows });
    } catch (error) {
      console.error("Erro ao carregar categorias: ", error);
      res.status(500).send("Erro ao carregar a página de registro de artigos.");
    }
  });
  
  // Rota para processar o formulário de registro de artigos
  app.post("/registar_artigo", async (req, res) => {
    try {
      const { nome_art, preco, quantidade, descricao, cat_id } = req.body;
      const img = req.file ? req.file.filename : null; // Assumindo que o upload da imagem seja tratado com multer
  
      // Inserção do artigo no banco de dados
      const query = `
        INSERT INTO artigo (nome_art, img, preco, quantidade, descricao, user_id, cat_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      const values = [nome_art, img, preco, quantidade, descricao, req.session.user_id, cat_id]; // Usando o user_id da sessão
  
      await db.query(query, values);
  
      res.redirect("/artigos"); // Redireciona após o sucesso
    } catch (error) {
      console.error("Erro ao registrar artigo: ", error);
      res.status(500).send("Erro ao registrar o artigo.");
    }
  });

  


// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Pasta onde as imagens serão salvas
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único baseado no timestamp
  }
});

const upload = multer({ storage: storage });

// Modifique a rota POST para aceitar upload de imagens
app.post("/registar_artigo", upload.single('img'), async (req, res) => {
  try {
    const { nome_art, preco, quantidade, descricao, cat_id } = req.body;
    const img = req.file ? req.file.filename : null;

    const query = `
      INSERT INTO artigo (nome_art, img, preco, quantidade, descricao, user_id, cat_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [nome_art, img, preco, quantidade, descricao, req.session.user_id, cat_id];

    await db.query(query, values);

    res.redirect("/artigos");
  } catch (error) {
    console.error("Erro ao registrar artigo: ", error);
    res.status(500).send("Erro ao registrar o artigo.");
  }
});
