import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import { log } from "console";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { dirname, join } from "path";
import pg from "pg";
import { fileURLToPath } from "url";
import multer from "multer";

const app = express();
const port = 3000;

//Hashing 10 vezes
const salt = 10;

//Conexão ao dotenv
dotenv.config();

//Conexão à session
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure=true apenas em produção com HTTPS
        maxAge: 1000 * 60 * 60 * 24 // Duração do cookie: 1 dia
    }
    })
  );

app.use(passport.session());
app.use(passport.initialize());

//CSS Path
app.use(express.static("public"));

//app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


const __dirname = dirname(fileURLToPath(import.meta.url));
//The path names
const home = join(__dirname, "views/index.ejs");
const login = join(__dirname, "views/login.ejs");
const registo = join(__dirname, "views/registar.ejs");
const artigoescolhido = join(__dirname, "views/artigo.ejs");
const categorias = join(__dirname, "views/categorias.ejs");
const compra = join(__dirname, "views/compra.ejs");
const registoArt = join(__dirname, "views/registarArtigo.ejs");
const perfilView = join(__dirname, "views/perfil.ejs");
const editarArtigo = join(__dirname, "views/editarArtigo.ejs");
const checkout = join(__dirname, "views/checkout.ejs");
const artista  = join(__dirname, "views/artistas.ejs");

//Connexão à base de dados
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db.connect();
//console.log(process.env);

//Incializar o multer para guardar uma imagem
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const imgSufix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + imgSufix);
    }
});

const upload = multer({ storage: storage});

app.use('/uploads', express.static(`${__dirname}/uploads`));

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

async function getUsers(){

    let users = [];

    const result = await db.query("SELECT * FROM users ORDER BY user_id ASC");

    users = result.rows;

    //console.log(users);
    
    return users;
}

//Página principal
app.get("/", async (req, res) => {
    //Categorias em Destaque (Acrílico, Aguarelas)

        //console.log(req.user);
        
        const categoriaDestaque = await getCategorias();

        const artigos = await getArtigos();

        let idArtigo = [];

        let newRow = [];

        const loggedin = req.isAuthenticated();
        

        res.render(home, { categoria: categoriaDestaque, artigo: artigos, totalArtigo: artigos.length, idArtigo: idArtigo, newRow: newRow, loggedin: loggedin });

});

app.get("/registar", (req, res) => {
    res.render(registo);
});

//Página de Registo
app.post("/registar", async (req, res) => {

    const nome = req.body["nome"];
    const email = req.body["email"];
    const telemovel = req.body["telemovel"];
    const nif = req.body["nif"];
    const morada = req.body["morada"];
    const qualificacao = req.body["qualificacao"];
    const vendedor = req.body["vendedor"];
    const img = req.body["img"];
    const password = req.body["password"];
    
    try{
        const checkResult = await db.query("SELECT FROM users WHERE email = $1", [email]);

        if (checkResult.rows.length > 0){
            res.send("Esse email já existe. Tente fazer login.");
        } else {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err){
                    console.log("Error hashing password: ", err);
                } else {
                    const result = await db.query("INSERT INTO users (user_nome, email, telemovel, nif, morada, qualificacao, vendedor, img_user, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [nome, email, telemovel, nif, morada, qualificacao, vendedor, img, hash]);

                    console.log(result);
                    res.render(home);
                }
            });    
        }
    } catch (err){
        console.log(err);
    }
});

passport.use(
    new Strategy(async function verify(username, password, cb) {
        try {
            const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);

            if(result.rows.length > 0){
                const user = result.rows[0];
                const pass = user.password;

                bcrypt.compare(password, pass, (err, valid) => {
                    if(err) {
                        console.error("Erro ao comparar as passwords: ", err);
                        return cb(err);
                    } else {
                        if(valid) {
                            return cb(null, user);
                        } else {
                            return cb(null, false); 
                        }
                    }    
                });
            } else {
                return cb(" Utilizador não encontrado");
            }
        } catch (err){
            console.log(err); 
        }
    })
);
    
passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

app.get("/login", (req, res) => {
    res.render(login);
});

//Página de Perfil do Utilizador
app.get("/perfil", async (req, res) => {

    //console.log("Authenticated:", req.isAuthenticated());
    //console.log("User:", req.user);

    const loggedin = req.isAuthenticated();
    const logoutSuccess = req.query.logoutSuccess === 'true';
        
    const userID = req.user.user_id;
        
        const result = await db.query("SELECT * FROM users WHERE user_id = $1", [userID]);
        
        const perfil = result.rows[0];

        //console.log("ID:", userID);
        //console.log("PERFIL:", perfil);

        const artigos = await getArtigos();
    
        res.render(perfilView, { perfil: perfil, loggedin: loggedin, artigos: artigos, totalArtigo: artigos.length, logoutSuccess: logoutSuccess});
     
});

//Página com todas as categorias
app.get("/categorias", async (req, res) => {

    const loggedin = req.isAuthenticated();

    const categoria = await getCategorias();
    const artigo = await getArtigos();
    
    res.render(categorias, { categoria: categoria, total: categoria.length, artigos: artigo, loggedin: loggedin });

});

//Registo de artigo
app.get("/registoArtigo", async (req, res) => {

    const loggedin = req.isAuthenticated();
    const categorias = await getCategorias();

    res.render(registoArt, {categoria: categorias, total: categorias.length, loggedin:loggedin});
});

//Atualizar artigo
app.get("/editarArtigo/:id", async (req, res) => {

    const loggedin = req.isAuthenticated();
    const artID = parseInt(req.params.id);

    const categorias = await getCategorias();
    const users = await getUsers();

    const result = await db.query('SELECT * FROM artigo WHERE art_id = $1', [artID]);
    const artigo = result.rows[0];

    //console.log(artigo);

    res.render(editarArtigo, { categoria: categorias, total: categorias.length, artigos: artigo, loggedin: loggedin, users: users, totalUsers: users.length });
});



//Página de um artigo
app.get("/arte/:id", async (req, res) => {

    const loggedin = req.isAuthenticated();

    let userID = 0;

    if(req.isAuthenticated() === true){
        
        userID = req.user.user_id;
    } else {
        userID = 0;
    }

    //console.log("USER ID: ", userID);

    const artID = parseInt(req.params.id);
    const users = await getUsers();

    const result = await db.query('SELECT * FROM artigo WHERE art_id = $1', [artID]);
    const artigo = result.rows[0];

    //console.log(artigo);

    res.render(artigoescolhido, { artigos: artigo, loggedin: loggedin, users: users, totalUsers: users.length, artista: userID });
});

//Página do carrinho de compras
app.get("/carrinho", (req, res) => {

    const loggedin = req.isAuthenticated();

    const carrinho = req.session.carrinho;


    res.render(compra, { pedidos: carrinho, loggedin: loggedin});
});

app.get("/checkout", (req, res) => {

    const loggedin = req.isAuthenticated();
    
    if (!loggedin){        
        return res.redirect("/login");
    }
    const carrinho = req.session.carrinho || [];

    res.render(checkout, { loggedin: loggedin, carrinho: carrinho});
});

app.get("/artistas", (req, res) => {
    const loggedin = req.isAuthenticated();

    res.render(artista, { loggedin: loggedin });
});

app.post('/upload', upload.single('imgFile'), (req, res) => {
    console.log("FICHEIRO:", req.file);
    registo.send("Imagem carregada com sucesso!");
});

app.post("/checkout", async (req, res) => {

    const userID= req.user.user_id;

    const carrinho = req.session.carrinho;

    const comprador = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        morada: req.body.morada,
        pais: req.body.pais,
        cidade: req.body.cidade,
        codigoPostal: req.body.codigo, 
        pagamento: req.body.paymentMethod       
    }

    if(!carrinho || carrinho.length === 0){
        res.redirect("/");
    }

    const date = new Date();
    const atualDate = date.toISOString().split('T')[0];

    console.log("DATA ATUAL", atualDate);

    try {
        for(const item of carrinho){//item & carrinho from session
            await db.query("INSERT INTO pedido (pedido_data, quantidade, email, morada, codigoPostal, metodoPagamento, preco, user_id, art_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
                atualDate,
                item.quantidade,
                email,
                morada,
                codigoPostal,
                metodoPagamento,
                item.preco * item.quantidade,
                userID,
                item.art_id                
            ]);
        }
        req.session.carrinho = [];
        
        res.redirect("/?checkoutSuccess=true");

    } catch (err) {
        console.log(err);
        res.redirect("/?checkoutError=true");
    }

});

app.post("/editarArtigo/:id", upload.single('imgFile'), async (req, res) => {

    const loggedin = req.isAuthenticated();
    const artID = parseInt(req.params.id);
    //console.log(artID);

    const result = await db.query('SELECT * FROM artigo WHERE art_id = $1', [artID]);
    const artigo = result.rows[0];
    
    //console.log("ARTIGO ATUAL:", artigo);
    
    if(req.body.nome_art) artigo.nome = req.body.nome_art;
    if(req.body.preco) artigo.preco = parseFloat(req.body.preco);
    if(req.body.quantidade) artigo.quantidade = parseInt(req.body.quantidade);
    if(req.body.descricao) artigo.descricao = req.body.descricao;
    if(req.body.cat_id) artigo.cat_id = req.body.cat_id;

    if(req.file){
        artigo.img = req.file.filename;
    }

    if(artigo.preco < 0 || artigo.quantidade < 0){
        return res.status(400).send("Preço e quantidade não podem ser negativos.");
    } else {

        try{

            await db.query(`UPDATE artigo SET nome= $1, img = $2, preco = $3, quantidade = $4, descricao = $5, cat_id = $6 WHERE art_id = $7`, [
                artigo.nome,
                artigo.img,
                artigo.preco,
                artigo.quantidade,
                artigo.descricao,
                artigo.cat_id,
                artID
            ]);

            res.render(editarArtigo, { artigos: artigo, loggedin: loggedin, totalUsers: users.length });

        } catch(err) {
            console.log(err);
        }
    }
});

//Iniciar sessão do carrinho e Adicionar artigo ao carrinho
app.post("/adicionarCarrinho/:id", async (req, res) => {

    const artID = parseInt(req.params.id);

    const result = await db.query("SELECT * FROM artigo WHERE art_id = $1", [artID]);

    const artigo = result.rows[0];

    //console.log("ARTIGO ESCOLHIDO:", artigo);

    if(!req.session.carrinho){

        req.session.carrinho = [];
    }

    const artigoAdicionado = req.session.carrinho.find(item => item.art_id === artID);
    
    if(artigoAdicionado){

        artigoAdicionado.quantidade ++;

    } else {

        req.session.carrinho.push({
            art_id: artigo.art_id,
            nome: artigo.nome,
            img: artigo.img,
            preco: artigo.preco,
            quantidade: 1,
            quantidadeTotal: artigo.quantidade
        });
    }

    res.redirect("/");
});

//Atualizar artigo no carrinho
app.post("/atualizarCarrinho/:id", async (req, res) => {

    const artID = parseInt(req.params.id);

    const novaQuantidade = parseInt(req.body.quantidade);

    const artigoExistente = req.session.carrinho.find(artigo => artigo.art_id === artID);

    if(artigoExistente){
        if (novaQuantidade <= 0){
            req.session.carrinho = req.session.carrinho.filter(artigo => artigo.art_id !== artID);

        } else if (novaQuantidade > artigoExistente.quantidade) {
            novaQuantidade = artigoExistente.quantidade;
            console.log("QUANTIDADE INSUFICIENTE.");
            //mandar mensagem de erro pela quantidade não ser suficiente
        } else {
            artigoExistente.quantidade = novaQuantidade;
        }
    }
    res.redirect("/carrinho");
});

//Remover do Carrinho
app.post("/removerCarrinho/:id", (req, res) => {

    const artID = parseInt(req.params.id);

    req.session.carrinho = req.session.carrinho.filter(artigo => artigo.art_id !== artID);

    //console.log("Carrinho após remoção:", req.session.carrinho);

    res.redirect("/carrinho");
});

//Logout
app.get("/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

//Página para editar utilizador
app.post("/perfil", upload.single('imgFile'), async (req, res) => {
    //console.log("Authenticated:", req.isAuthenticated());
    //console.log("User:", req.user);

    const loggedin = req.isAuthenticated();
        
    const userID = req.user.user_id;
    //console.log("ID:", userID);

    const result = await db.query("SELECT * FROM users WHERE user_id = $1", [userID]);
    const perfilAtual = result.rows[0];

    //console.log("PERFIL ATUAL:", perfil);
    
    
    if(req.body.nome) perfilAtual.user_nome = req.body.nome;
    if(req.body.email) perfilAtual.email = req.body.email;
    if(req.body.telemovel) perfilAtual.telemovel = req.body.telemovel;
    if(req.body.nif) perfilAtual.nif = req.body.nif;
    if(req.body.morada) perfilAtual.morada = req.body.morada;
    if(req.body.qualificacao) perfilAtual.qualificacao = req.body.qualificacao;

    if(req.file){
        perfilAtual.img_user = req.file.filename;
    }

    if(req.body.senha) {

        const hashedPass = await bcrypt.hash(req.body.senha, salt);
        perfilAtual.password = hashedPass;
    }
    
    try{
        await db.query(`UPDATE users SET user_nome = $1, email = $2, telemovel= $3, nif = $4, morada = $5, qualificacao = $6, img_user = $7, password = $8 WHERE user_id = $9`, [
            perfilAtual.user_nome,
            perfilAtual.email,
            perfilAtual.telemovel,
            perfilAtual.nif,
            perfilAtual.morada,
            perfilAtual.qualificacao,
            perfilAtual.img_user,
            perfilAtual.password,
            userID
        ]);

        const artigos = await getArtigos();
    
        res.render(perfilView, { perfil: perfilAtual, loggedin: loggedin, artigos: artigos, totalArtigo: artigos.length});
    } catch(err) {
        console.log(err);
    }

});

//Página para registar artigo
app.post("/registoArtigo", upload.single('imgFile'),  async (req, res) => {
    
    //console.log("Authenticated:", req.isAuthenticated());
    //console.log("User:", req.user);

    const userID = req.user.user_id;
    
    const loggedin = req.isAuthenticated();

    const categorias = await getCategorias();
    //console.log(categorias);

    const nome = req.body["nome_art"];
    const preco = parseFloat(req.body["preco"]);
    const quantidade = parseInt(req.body["quantidade"]);
    const descricao = req.body["descricao"];
    const categoria = req.body["cat_id"];

    const imgFile = req.file;

    if(preco < 0 || quantidade < 0){
        return res.status(400).send("Preço e quantidade não podem ser negativos.");
    }

    //console.log("NOVO NOME:", nome);

    try{
        const checkResult = await db.query("SELECT * FROM artigo WHERE nome = $1", [nome]);

        if (checkResult.rows.length > 0){
            res.redirect("/perfil");

        } else {
            const img = imgFile ? imgFile.filename : null;
            const result = await db.query("INSERT INTO artigo (nome, img, preco, quantidade, descricao, user_id, cat_id) VALUES ($1, $2, $3, $4, $5, $6, $7)", [nome, img, preco, quantidade, descricao, userID, categoria]);    

            console.log(result.rows[0]);

            res.redirect("/perfil");
        }
    } catch(err) {
        console.log("ERRO:", err);
    }
});

//Página de Registo
app.post("/registar", upload.single('imgFile'), async (req, res) => {

    const nome = req.body["nome"];
    const email = req.body["email"];
    const telemovel = req.body["telemovel"];
    const nif = req.body["nif"];
    const morada = req.body["morada"];
    const qualificacao = req.body["qualificacao"];
    const vendedor = req.body["vendedor"];
    const password = req.body["password"];
    
    const imgFile = req.file;
    try{
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (checkResult.rows.length > 0){
            res.redirect("/login");

        } else {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err){
                    console.log("Erro hashing password: ", err);
                } else {
                    const img = imgFile ? imgFile.filename : null;
                    const result = await db.query("INSERT INTO users (user_nome, email, telemovel, nif, morada, qualificacao, vendedor, img_user, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *", [nome, email, telemovel, nif, morada, qualificacao, vendedor, img, hash]);

                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log(err);
                        res.redirect("/");
                    });
                }
            });    
        }
    } catch (err){
        console.log(err);
    }
});

passport.use(new LocalStrategy(async (username, password, cb) => {
        try {
            const result = await db.query("SELECT * FROM users WHERE user_nome = $1", [username]);

            //console.log(result);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const hashedPass = user.password;
                
                //console.log(user);

                const valid = await bcrypt.compare(password, hashedPass);
                    if(valid) {

                        return cb(null, user);
                    } else {

                        return cb(null, false, {message: 'Senha incorreta'}); 
                    }
                } else {
                return cb(null, false, {message: 'Utilizador não encontrado'});
            }
        } catch (err){
            console.log(err);
            return cb(err); 
        }
    })
);

//Página de login
app.post('/login',(req, res, next) => {

    const carrinho = req.session.carrinho;

    passport.authenticate('local', (err, user, info) => {
        if(err) {
            return next(err);
        }

        if(!user) {
            return res.redirect("/login");
        }

        req.logIn(user, (err) => {
            if(err) {
                return next(err);
            }

            req.session.carrinho = carrinho || [];

            return res.redirect("/");
        });

    })(req, res, next);
});
passport.serializeUser((user, cb) => {
    return cb(null, user.user_id);
});

passport.deserializeUser(async (id, cb) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE user_id = $1", [id]);
        cb(null, result.rows[0]); // Attach user data to the session
    } catch (err) {
        cb(err);
    }
});
 
  

app.listen(port, () => {
    console.log(`Successfully started server on port ${port}.`);
});
