const Sequelize = require('sequelize');

const connection = new Sequelize('library-data', 'f3i48s8surzcwns0sbj2', 'pscale_pw_GvYCMNaJh3th79wzlhQ8gSGjNWLnPoDLpSzrzZuWlMI', {
    host: 'aws.connect.psdb.cloud',
    dialect: 'mysql',
    define: {
        timestamps: false
    }
});

module.exports = connection;