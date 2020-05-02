const Table = require('./Table');
const Sequel = require('../utils/Database');
const CONFIG = require('../utils/config.json');
const inq = require('inquirer');

const db = new Sequel(CONFIG);

class Department extends Table {
    constructor(params) {
        let defaults = {
            id: null,
            name: null
        };
        let { id, name } = params ? params : defaults;
        super(id, 'departments');
        this.name = name ? name : null;
    }
    async addDepartmentPrompt() {
        let { name } = await inq.prompt([
            {
                message: "Enter new department's name:",
                name: "name",
            },
        ]);
    
        this.name = name.toLowerCase().trim();
        let response = await db.closedQuery("INSERT INTO departments SET ?", {
            name: this.name,
        });
        if (response.affectedRows === 1) console.log(`Successfully added ${this.capitalize(this.name)} Department.`);
        return this
    }
    async deleteDepartmentPrompt() {
        let dbResults = await db.closedQuery('SELECT id, name FROM departments');
        let allDepartments = dbResults.map(r => new Department({
            id: parseInt(r.id),
            name: r.name
        }));

        let { department } = await inq.prompt([
            {
                type: "list",
                message: "Choose department to delete:",
                name: "department",
                choices: allDepartments.map(d => `${d.id} ${this.capitalize(d.name)}`)
            }
        ]) 
        this.name = department.split(' ').slice(1).join(' ');
        this.id = department.split(' ')[0];
        let response = await this.deleteRow();
        if (response.affectedRows === 1) console.log(`Successfully deleted ${this.capitalize(this.name)}`);
    }
}

module.exports = Department;