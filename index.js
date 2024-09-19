import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/login.ejs", (req,res) =>{
    res.render("login.ejs");
});

app.get("/registar", (req, res) => {
    res.render("registar.ejs");
});

app.get("/perfil.ejs", (req, res) => {
    res.render("perfil.ejs");
});

app.post("/artigo/:id", (req, res) => {
    res.render("artigo.ejs");
});

app.get("/compra.ejs", (req, res) => {
    res.render("compra.ejs");
})


app.listen(port, () => {
    console.log(`Successfully started server on port ${port}.`);
});
