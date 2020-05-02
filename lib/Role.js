const Table = require('./Table');
const Sequel = require('../utils/Database');
const Department = require('./Department');
const CONFIG = require('../utils/config.json');
const inq = require('inquirer');

const db = new Sequel(CONFIG);

class Role extends Table {
    constructor(params) {
        let defaults = {
            id: null,
            title: null,
            departmentID: null,
            departmentName: null,
            salary: null
        }
        let { title, salary, departmentID, departmentName, id } = params ? params : defaults;
        super(id, 'roles');
        this.title = title;
        this.salary = salary;
        this.departmentID = departmentID;
        this.departmentName = departmentName;
    }
    async addRolePrompt() {
        // Check if departments have been defined, and also get them into an array
        let allDepartments = await new Department().getAllDepartments();
        if (allDepartments.length === 0) {
            throw new Error("You must set up departments before adding roles!");
        } else {
            let { title, salary, department } = await inq.prompt([
                {
                    type: "list",
                    message: "Select role's department:",
                    name: "department",
                    choices: allDepartments.map(d => `${d.id} ${this.capitalize(d.name)}`)
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
            this.departmentID = parseInt(department.split(' ')[0]);
            let [ departmentChosen ] = allDepartments.filter(d => d.id === this.departmentID);
            this.departmentName = departmentChosen.name;

            let insert = await this.insertRow({
                title: title.toLowerCase().trim(),
                salary: parseInt(salary),
                department_id: this.departmentID,
            })

            if (insert.affectedRows === 1) {
                console.log(`Success! Inserted role ${title} of ${this.capitalize(this.departmentName)} Department with an ID of ${insert.insertId}.`)
                this.id = parseInt(insert.insertId);
            } else {
                console.log(`Unable to insert role ${title}.`);
            }
            return insert;
        }
    }
    async updateRole() {
        let allRoles = await this.getAllRoles();
        let { role } = await inq.prompt([
            {
                type: "list",
                message: "Choose a role to update:",
                name: "role",
                choices: allRoles.map(r => `${r.id} ${this.capitalize(r.title)} of ${this.capitalize(r.departmentName)} Department`)
            }
        ])

        this.id = parseInt(role.split(' ')[0]);
        this.title = allRoles.filter(r => r.id === this.id)[0].title;

        let { property } = await inq.prompt([
            {
                type: "list",
                message: "Choose property to update.",
                name: "property",
                choices: [
                    "Title",
                    "Salary",
                    "Department",
                ]
            }
        ]);
        
        async function inquirerEntry(property) {
            let { entry } = await inq.prompt([
                {
                    message: `Enter new ${property}:`,
                    name: "entry",
                    validate: (input) => {
                        if (input) return true;
                        else return false;
                    }
                }
            ]);
            return entry;
        }
        let response;
        switch (property) {
            case 'Title': 
                let title = await inquirerEntry('title');

                this.title = title.toLowerCase().trim();
                response = await this.updateRow({ title: this.title });
                if (response.affectedRows === 1) console.log(`Successfully updated title to ${this.capitalize(this.title)}.`);
                break;
            case 'Salary': 
                let salary = await inquirerEntry('salary');

                this.salary = parseInt(salary);

                response = await this.updateRow({ salary: this.salary });
                if (response.affectedRows === 1) console.log(`Successfully updated salary to ${this.salary}.`);
                
                break
            case 'Department':
                let allDepartments = await new Department().getAllDepartments();
                let { department } = await inq.prompt([
                    {
                        type: "list",
                        message: "Choose new department:",
                        name: "department",
                        choices: allDepartments.map(d => `${d.id} ${this.capitalize(d.name)}`)
                    }
                ])
                this.departmentID = parseInt(department.split(' ')[0]);
                this.departmentName = department.split(' ').slice(1).join(' ');

                response = await this.updateRow({ department_id: this.departmentID });
                if (response.affectedRows === 1) console.log(`Successfully moved ${this.capitalize(this.title)} to ${this.capitalize(this.departmentName)} Department.`);
                break;
        }

        return this;
    }
    async deleteRole() {
        let allRoles = await this.getAllRoles();

        let { choice } = await inq.prompt([
            {
                type: "list",
                message: "Which role would you like to delete?",
                name: "choice",
                choices: allRoles.map(r => `${r.id} ${r.title}`)
            }
        ]);
        this.id = parseInt(choice.split(' ')[0]);
        this.name = choice.split(' ').slice(1).join(' ');
        let response = await this.deleteRow();
        if (response.affectedRows === 1) console.log(`Successfully deleted role ${this.capitalize(this.name)}`);
    }
    async getAllRoles() {
        let results = await db.closedQuery(
            `SELECT roles.id, roles.title, roles.salary, roles.department_id,
            departments.name
            FROM roles
            INNER JOIN departments
            ON departments.id = roles.department_id`
        );
        return results.map(r => new Role({
            departmentName: r.name,
            departmentID: r.department_id,
            id: r.id,
            title: r.title,
            salary: r.salary,
        }));
    }
}

module.exports = Role;