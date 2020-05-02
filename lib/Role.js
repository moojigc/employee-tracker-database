const Table = require('./Table');
const Sequel = require('../utils/Database');
const CONFIG = require('../utils/config.json');
const inq = require('inquirer');

class Role extends Table {
    constructor(params) {
        let defaults = {
            id: null,
            title: null,
            departmentID: null,
            salary: null
        }
        let { title, salary, departmentID } = params ? params : defaults;
        super(id, 'roles');
        this.title = title ? title : null;
        this.salary = salary ? salary : null;
        this.departmentID = departmentID ? departmentID : null;
    }
    async addRolePrompt() {
        const db = new Sequel(CONFIG);
        let conn = await db.startPool();
        // Check if departments have been defined
        let sql = "SELECT id, name FROM departments;";
        let results = await db.openQuery(conn, sql);
        if (results.length === 0) {
            conn.end();
            throw new Error("You must set up departments before adding roles!");
        } else {
            let allDepartments = results.map(r => r.name); // Take the value out of the name key from each department in the array
            let { title, salary, departmentName } = await inq.prompt([
                {
                    type: "list",
                    message: "Select role's department:",
                    name: "departmentName",
                    choices: allDepartments
                },
                {
                    message: "Enter new role's title:",
                    name: "title",
                    validate: (input) => {
                        if (input) return true;
                        else return false;
                    }
                },
                {
                    message: "Enter role's salary:",
                    name: "salary",
                    validate: (input) => {
                        if (input) return true;
                        else return false;
                    }
                },
            ]);
            let [ department ] = results.filter(r => r.name === departmentName);
            console.log(department.id);
            let [ checkIfExists ] = await db.openQuery(conn, "SELECT id, title FROM roles WHERE ?", { title: title });
            if (checkIfExists) {
                return console.log(`Role already exists. Title: ${checkIfExists.title}. ID: ${checkIfExists.id}.`)
            } else {
                let insert = await db.openQuery(conn, "INSERT INTO roles SET ?", {
                    title: title,
                    salary: salary,
                    department_id: department.id,
                });
                await conn.end();
                if (insert.affectedRows === 1) {
                    console.log(`Success! Inserted role ${title} with an ID of ${insert.insertId}.`)
                } else {
                    console.log(`Unable to insert role ${title}.`);
                }
                return insert;
            }
        }
    }
    async updateRole() {
        const db = new Sequel(CONFIG);
        
        let results = await db.closedQuery('UPDATE roles SET ? WHERE ?', [
            newValues,
            {
                id: this.id
            }
        ]);
        return results;
    }
}

module.exports = Role;