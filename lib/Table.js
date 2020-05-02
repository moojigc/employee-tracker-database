const Sequel = require('../utils/Database');
const CONFIG = require('../utils/config.json');

const db = new Sequel(CONFIG);

class Table {
    constructor(id, table) {
        this.id = id;
        this.table = table;
    }
    capitalize(input) {
        let words = input.split(' ');
        const caps = words.map(w => {
            let englishKeywords = {
                keywords: ['of', 'a', 'the', 'an', 'to'],
                match: function() {
                    if (this.keywords.filter(keyword => keyword === w).length > 0) return true;
                    else return false;
                }
            };
            
            if (englishKeywords.match() === false) return w.slice()[0].toUpperCase() + w.substring(1).toLowerCase();
            else return w.toLowerCase();
        });
        return caps.join(' ');
    }
    getProperties() {
        return this;
    } 
    async updateRow(newValues) {
        return await db.closedQuery('UPDATE ?? SET ? WHERE ?', [
            this.table,
            newValues,
            {
                id: this.id
            }
        ]);
    }
    async deleteRow() {
        return await db.closedQuery('DELETE FROM ?? WHERE id = ?', [
            this.table,
            this.id
        ]);
    }
    async insertRow(newValues) {
        return await db.closedQuery('INSERT INTO ?? SET ?', [
            this.table,
            newValues
        ])
    }
}

module.exports = Table;