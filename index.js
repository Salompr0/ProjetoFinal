import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import env from "dotenv";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { dirname, join } from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

//var LocalStrategy = require('passport-local').Strategy;

//Hashing 10 vezes
const salt = 10;

//Conexão ao dotenv
env.config();

//Conexão à session
app.use(
    session({
      secret: "",
      resave: false,
      saveUninitialized: true,
    })
  );

//CSS Path
app.use(express.static("public"));

//app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

const __dirname = dirname(fileURLToPath(import.meta.url));
//The path names
const home = join(__dirname, "views/index.ejs");
const login = join(__dirname, "views/login.ejs");
const registo = join(__dirname, "views/registar.ejs");
const artigoescolhido = join(__dirname, "views/artigo.ejs");
const categorias = join(__dirname, "views/categorias.ejs");
const compra = join(__dirname, "views/compra.ejs");
const registoArt = join(__dirname, "views/registarArtigo.ejs");

//Connexão à base de dados
const db = new pg.Client({
    user: "",
    host: "",
    database: "",
    password: "",
    port: ,
  });
  db.connect();
  //console.log(process.env);

//console.log( process.env.PG_PASSWORD);

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

        console.log(req.user);

        const categoriaDestaque = await getCategorias();

        const artigos = await getArtigos();

        let idArtigo = [];

        let newRow = [];

        const loggedin = req.isAuthenticated();
        const logoutSuccess = req.query.logoutSuccess === 'true';

        res.render(home, { categoria: categoriaDestaque, artigo: artigos, totalArtigo: artigos.length, idArtigo: idArtigo, newRow: newRow, loggedin: loggedin, logoutSuccess: logoutSuccess});

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
app.get("/perfil/:id", async (req, res) => {
    const userID = parseInt(req.params.id);

    const result = await db.query('SELECT * FROM user WHERE user_id = $1', [userID]);
    const perfil = result.rows;

    //console.log(userID);
    console.log(perfil);

    res.render(perfil, { perfil: perfil});
});

//Página com todas as categorias
app.get("/categorias", async (req, res) => {

    const categoria = await getCategorias();
    const artigo = await getArtigos();
    
    res.render(categorias, { categoria: categoria, total: categoria.length, artigo: artigo, totalArtigo: artigo.length});

});

//Registo de artigo
app.get("/registoArtigo", (req, res) => {
    res.render(registoArt);
});

//Página de um artigo
app.get("/arte/:id", async (req, res) => {

    const artID = parseInt(req.params.id);

    const result = await db.query('SELECT * FROM artigo WHERE art_id = $1', [artID]);
    const artigo = result.rows[0];

    //console.log(artigo);

    res.render(artigoescolhido, { artigos: artigo});
});

//Página do carrinho de compras
app.get("/compra", (req, res) => {

    const pedidos = 0;//change

    res.render(compra, { pedidos: pedidos});
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
app.patch("edit/user/:id", (req, res) => {

    
    res.render(registo);
});

//Página para registar artigo
app.post("/registoArtigo", async (req, res) => {

    const nome = req.body["nome_art"];
    const img = req.body["img"];
    const preco = req.body["preco"];
    const quantidade = req.body["quantidade"];
    const descricao = req.body["descricao"];
    const categoria = req.body["cat_id"];

    const categorias = await getCategorias();
    console.log(categorias);

    const result = await db.query("INSERT INTO artigo (nome_art, img, preco, quantidade, descricao, cat_id) VALUES ($1, $2, $3, $4, $5, $6)", [nome, img, preco, quantidade, descricao, categoria]);    

    console.log(result);

    res.render(registoArt, {categoria: categorias, total: categorias.length});
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
        const checkResult = await db.query("SELECT * FROM users WHERE user_nome = $1", [nome]);

        if (checkResult.rows.length > 0){
            res.redirect("/login");

        } else {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err){
                    console.log("Erro hashing password: ", err);
                } else {
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
    //console.log("Ajuda");
        try {
            const result = await db.query("SELECT * FROM users WHERE user_nome = $1", [username]);

            console.log(result);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const hashedPass = user.password;
                
                console.log(user);

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
app.post('/login', 
    passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
    (req, res) => {
      res.redirect('/');
    });
    

passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });
  

app.listen(port, () => {
    console.log(`Successfully started server on port ${port}.`);
});
