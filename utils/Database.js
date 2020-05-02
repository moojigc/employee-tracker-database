const mysql = require('mysql2/promise');

class Sequel {
    constructor(config) {
        const { host, user, password, database } = config;
        this.host = host;
        this.user = user;
        this.password = password;
        this.database = database;
    }
    async startPool() {
        try {
            const conn = mysql.createPool({
                host: this.host,
                user: this.user,
                password: this.password,
                database: this.database
            });
            return conn;
        } catch (error) {
            console.log(error)
        }
    }
    // Creating function to connect to database, do stuff, then disconnect and return data or errors
    async closedQuery(sqlStatement, values) {
        const conn = await this.startPool();
        try {
            // the native .query method returns an array of rows then columns
            const [ rows ] = await conn.query(sqlStatement, values);
            return rows;
        } catch (error) {
            return console.trace(error);
        } finally {
            await conn.end();
        }
    };
    // For doing multiple queries before closing connection
    async openQuery(conn, sqlStatement, values) {
        try { 
            const [ rows ] = await conn.query(sqlStatement, values);
            return rows;
        } catch (error) {
            return console.trace(error);
        }
    }
}

module.exports = Sequel;