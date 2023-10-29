const Sequelize = require('sequelize');

const connection = new Sequelize('users-library', 'root', 'henrik22', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = connection;