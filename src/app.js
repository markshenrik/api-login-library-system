const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const connection = require("../database/database");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const tokenSecret = process.env.TOKEN_SECRET;

const User = require("../models/User");
const Book = require("../models/Book");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
return res.json("Hello, world!");
})

app.post("/sign", async (req, res) => {
  const { login, password } = req.body;

  try {
    const user = await User.findOne({ where: { login: login } });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado. Login ou senha incorretos." });

    const passwordMatched = bcrypt.compareSync(password, user.password);

    if (passwordMatched) {
      const token = jwt.sign(
        { id: user._id, login: user.login, name: user.name },
        tokenSecret,
        {
          expiresIn: "100h",
        }
      );

      res.status(200).json({ user, token });
    } else {
      res.status(404).json({ error: "Usuário não encontrado. Login ou senha incorretos." })
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Ocorreu um erro ao processar a requisição" });
  }
});

app.post("/register", (req, res) => {
  const { name, login, password, confirmPassword } = req.body;

  User.findOne({ where: { login: login, name: name } }).then((user) => {
  if (user) {
    res.status(409).json({ msg: "Este usuário já existe!" });
  } else {
    if (password !== confirmPassword) {
      return res.status(422).json({ msg: "As senhas são diferentes!" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    User.create({
      name: name,
      login: login,
      password: hash,
    })
      .then((createdUser) => {
        const token = jwt.sign(
          { id: createdUser._id, login: createdUser.login, name: createdUser.name },
          tokenSecret,
          {
            expiresIn: "100h",
          }
        );

        res.status(200).json({ msg: "Usuário cadastrado",  createdUser, token });
      })
      .catch((error) => {
        res.status(500).json({ msg: "Erro no servidor imprevisto!" });
      });
  }
});

});

app.post("/addBookcase", (req, res) => {
  const { bookId, bookTitle, bookCover, storageLogin } = req.body;

  Book.findOne({ where: { apiID: bookId, login: storageLogin } })
    .then((book) => {
      if (!book) {
        Book.create({
          apiID: bookId,
          title: bookTitle,
          cover: bookCover,
          login: storageLogin
        })
          .then(() => {
            res
              .status(200)
              .json({ msg: "Livro adicionado à estante." });
          })
          .catch((error) => {
            res.status(500).json({ msg: "Falha ao registrar livro!" });
          });
      } else {
        res.status(200).json({ msg: "Livro já está na lista de favoritos." });
      }
    })
    .catch((error) => {
      res
        .status(500)
        .json({ msg: "Falha ao registrar livro!", error: error.message });
    });
});

app.delete("/removeBookcase", (req, res) => {
  const { bookId, storageLogin } = req.body;


  Book.findOne({ where: { apiID: bookId, login: storageLogin } })
    .then((book) => {
      if (book) {
        Book.destroy({
          where: {
            apiID: bookId,
            login: storageLogin
          }
        })
          .then(() => {
            res
              .status(200)
              .json({ msg: "Livro removido da estante." });
          })
          .catch((error) => {
            console.log(error)
            res.status(500).json({ msg: "Falha ao remover livro!" });
          });
      } else {
        console.log(error)
        res.status(400).json({ msg: "Livro não está na estante." });
      }
    })
    .catch((error) => {
      res
        .status(500)
        .json({ msg: "Falha ao remover livro!", error: error.message });
    });
});

app.get('/books', (req, res) => {
  const { LoginUser } = req.query;

  try {
    Book.findAll({ where: { login: LoginUser } })
      .then(books => {
        res.send(books);
      })
      .catch(error => {
        res.status(500).send(error);
      });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put('/favoriteBooks', (req, res) => {
  try {
    const {title, storageLogin, bookId} = req.body.book;

    Book.update({favorite: true}, { where: { title: title, login: storageLogin, apiID: bookId } });

    res.status(200).send({msg: 'Livro adicionado aos Favoritos!'})
  } catch (error) {
    res.status(500).send({ msg: "Erro ao atualizar o livro." });
  }
})

app.put("/removeFavorite", (req, res) => {


  try {
    const {title, storageLogin, bookId} = req.body.book;

    Book.update({ favorite: false }, { where: { title: title, login: storageLogin, apiID: bookId } });

    const updatedBookCount = Book.count({ where: { title: title, favorite: false, login: storageLogin } });
    
    if (updatedBookCount === 0) {
      return res.status(404).send({ msg: "Livro não encontrado na lista de favoritos." });
    }

    res.status(200).send({ msg: "Livro removido da lista de favoritos!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Erro ao atualizar o livro." });
  }
});

app.put('/readBooks', async (req, res) => {
  try {
    const {title, storageLogin, bookId} = req.body.book;

    await Book.update({ read: true, toRead: false }, { where: { title: title, login: storageLogin, apiID: bookId } });

    const updatedBookCount = await Book.count({ where: { title: title, read: true, login: storageLogin } });
    
    if (updatedBookCount === 0) {
      return res.status(404).send({ msg: "Livro não encontrado na lista de leitura." });
    }

    res.status(200).send({ msg: "Livro adicionado à lista de livros lidos!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Erro ao atualizar o livro." });
  }
});

app.put('/toReadBooks', async (req, res) => {
  try {
    const { bookItem } = req.body;
console.log(bookItem)
console.log(bookItem.title)
    if (!bookItem || !bookItem.title) {
      return res.status(400).send({ msg: "O livro não foi fornecido corretamente." });
    }

    await Book.update({ toRead: true, read: false }, { where: { title: bookItem.title } });

    const updatedBookCount = await Book.count({ where: { title: bookItem.title, toRead: true } });
    if (updatedBookCount === 0) {
      return res.status(404).send({ msg: "Livro não encontrado na lista de leitura." });
    }

    res.status(200).send({ msg: "Livro adicionado à lista de livros Não Lidos!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Erro ao atualizar o livro." });
  }
});

app.get("/user/:login", auth, (req, res) => {
  res.status(200).json({ user: req.user, token: req.token });
});

function auth(req, res, next) {
  const authToken = req.headers["authorization"];
  const bearer = authToken.split(" ");
  const token = bearer[1];

if (!token) return res.status(401).json({ error: "Acesso negado!" });

  try {
    const verifiedUser = jwt.verify(token, tokenSecret);

    if (verifiedUser.login !== req.params.login) {
      return res.status(401).json({ error: "Acesso negado!" });
    }

    req.token = token;
    req.user = verifiedUser;
    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error.message);
    res.status(401).json({ error: "Acesso negado!" });
  }
}

//DATABASE
const PORT = process.env.PORT || 5000

connection
  .sync()
  .then(() => {
    console.log("Tabelas sincronizadas com o banco de dados.");
    app.listen(PORT, () => {
      console.log("Servidor rodando.");
    });
  })
  .catch((error) => {
    console.error("Falha ao sincronizar tabelas com o banco de dados:", error);
  });

