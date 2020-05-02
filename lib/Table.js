const Sequel = require('../utils/Database');
const CONFIG = require('../utils/config.json');

const db = new Sequel(CONFIG);

class Table {
    constructor(id, table) {
        this.id = id;
        this.table = table;
    }
    capitalize(word) {
        let words = word.split(' ');
        const caps = words.map(w => w.slice()[0].toUpperCase() + w.substring(1));
        return caps.join(' ');
    }
    getProperties() {
        return this;
    } 
    async updateRow(newValues) {
        return await db.closedQuery(`UPDATE ${this.table} SET ? WHERE ?`, [
            newValues,
            {
                id: this.id
            }
        ]);
    }
    async deleteRow() {
        return await db.closedQuery(`DELETE FROM ${this.table} WHERE id = ?`, [this.id]);
    }

}

module.exports = Table;