const Sequelize = require("sequelize");
const connection = require("../database/database");
const User = require("./User");

const Book = connection.define("books", {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  apiID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  cover: {
    type: Sequelize.STRING,
    allowNull: false
  },
  login: { 
    type: Sequelize.STRING,
    allowNull: false,
    references: {
      model: 'users', 
      key: 'login'
    },
  },
  favorite: { type: Sequelize.BOOLEAN },
  toRead: { type: Sequelize.BOOLEAN },
  read: { type: Sequelize.BOOLEAN },
});

User.hasMany(Book);
Book.belongsTo(User);

// Book.sync({ force: false });

module.exports = Book;
