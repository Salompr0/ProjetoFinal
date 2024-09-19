import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    /*function myFunction() {
        document.getElementById("myDropdown").classList.toggle("show");
      }
      
      // Close the dropdown menu if the user clicks outside of it
      window.onclick = function(event) {
        if (!event.target.matches('.dropbtn')) {
          var dropdowns = document.getElementsByClassName("dropdown-content");
          var i;
          for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
              openDropdown.classList.remove('show');
            }
          }
        }
      }*/ 
    res.render("index.ejs");
});

app.get("/login.ejs", (req,res) =>{
    res.render("login.ejs");
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
