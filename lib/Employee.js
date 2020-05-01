const Sequel = require('../utils/Database');
const CONFIG = require('../utils/config.json');
const inq = require('inquirer');

class Employee {
    constructor(firstName, lastName) {
        this.id = 0;
        this.firstName = firstName ? firstName : "";
        this.lastName = lastName ? lastName : "";
        this.roleID = 0;
        this.isManager = false;
        this.departmentID = 0;
        this.managerID = 0;
    }
    getFullName() {
        // Returns the full name with proper capitalization (without modifying original values)
        let firstC = this.firstName.slice()[0].toUpperCase() + this.firstName.substring(1);
        let lastC = this.lastName.slice()[0].toUpperCase() + this.lastName.substring(1);
        return `${firstC} ${lastC}`
    }
    getEmployee() {
        return this;
    }
    async addEmployeesPrompt() {
        const db = new Sequel(CONFIG);
        let conn = await db.startPool(); // Start connection
        // Check if roles and departments have been defined
        let sql =
            "SELECT roles.id, roles.title, departments.id, departments.name FROM roles INNER JOIN departments ON roles.department_id = departments.id;";
        let results = await db.openQuery(conn, sql);
        if (results.length === 0) {
            conn.end();
            throw new Error(
                "You must set up roles and departments before adding employees!"
            );
        } else {    
            let allDepartments = await db.openQuery(conn, 'SELECT name FROM departments;');
            let allRoles = results.map(r => r.title);
            let allManagers = await db.openQuery(conn, 'SELECT first_name, last_name FROM employees WHERE is_manager = true');
            
            // I know this part looks weird but it makes it easier to handle the inquirer code later
            allManagers.push({
                first_name: "no",
                last_name: "manager"
            });
    
            let { firstName, lastName, departmentName, roleTitle, isManager, theirManager } = await inq.prompt([
                {
                    message: "Enter first name:",
                    name: "firstName",
                    validate: function(input) {
                        if (input === "") return false;
                        else return true;
                    }
                },
                {
                    message: "Enter last name:",
                    name: "lastName",
                    validate: function(input) {
                        if (input === "") return false;
                        else return true;
                    }
                },
                {
                    type: "list",
                    message: "Select department:",
                    name: "departmentName",
                    choices: allDepartments.map(d => d.name)
                },
                {
                    type: "list",
                    message: "Enter role:",
                    name: "roleTitle",
                    choices: allRoles
                },
                {
                    type: "confirm",
                    message: "Is this employee a manager?",
                    name: "isManager"
                },
                {
                    type: "list",
                    message: "Select manager:",
                    name: "theirManager",
                    choices: allManagers.map(r => `${r.first_name} ${r.last_name}`)
                }
            ]);
            // Pass values to the class Object, make sure all lowercase and no spaces
            this.firstName = firstName.toLowerCase().trim();
            this.lastName = lastName.toLowerCase().trim();
            this.isManager = isManager;
    
            // We expect an array of 1 Object from db.openQuery(), so we will just deal with that in one line using deconstruction
            let [ department ] = await db.openQuery(conn, "SELECT id FROM departments WHERE name = ?", [departmentName]);
            let [ role ] = await db.openQuery(conn, "SELECT id FROM roles WHERE title = ?", [roleTitle]);
            // Pass values to the class Object
            this.departmentID = department.id;
            this.roleID = role.id;
    
            console.log(department.id);
            // Defines theirManagerID based on whether employee has a manager or not
            let theirManagerID;
            switch (theirManager) {
                case 'no manager': 
                    theirManagerID = null;
                    break;
                default:
                    theirManagerID = await db.openQuery(
                        conn, 
                        "SELECT id FROM employees WHERE first_name = ? AND last_name = ?", 
                        [theirManager.split(' ')[0], theirManager.split(' ')[1]]
                    ).then(r => r.map(r => r.id)[0]);
            }
            console.log(theirManagerID);
            this.managerID = theirManagerID;
            let insert = await db.openQuery(conn, "INSERT INTO employees SET ?", {
                // make sure everything is lowercase
                first_name: this.firstName,
                last_name: this.lastName,
                department_id: this.departmentID,
                role_id: this.roleID,
                is_manager: this.isManager,
                manager_id: this.managerID
            });
            await conn.end();
            console.log(`Success! Added ${this.getFullName()}`)
            // Finally return the result from the database which contains metadata about what was inserted
            return insert;
        }
    }
    async deleteEmployeesPrompt() {
        const db = new Sequel(CONFIG);
        const conn = await db.startPool();

        // Here I do a little trickery to reduce the amount of code I need to display full, capitalized names for each employee
        let employeesRaw = await db.openQuery(conn, 'SELECT first_name, last_name FROM employees;');
        // map the MySQL data into array with new Employee objects (even though we're still inside the Employee object)
        let employeesObject = employeesRaw.map(e => new Employee(e.first_name, e.last_name));
        // Then get the full name and map it into a new array with capitalized names!
        let employeesFullNameArray = employeesObject.map(e => e.getFullName());

        let { fullName } = await inq.prompt([
            {
                type: "list",
                message: "Choose employee to remove:",
                name: "fullName",
                choices: employeesFullNameArray
            }
        ]);
        let firstName = fullName.split(' ')[0].toLowerCase();
        let lastName = fullName.split(' ')[1].toLowerCase();
        this.firstName = firstName;
        this.lastName = lastName;

        // Again, it always returns an array, so just take it out of the array
        let [employee] = await db.openQuery(
            conn, 
            'SELECT id FROM employees WHERE first_name = ? AND last_name = ?', 
            [this.firstName, this.lastName]
        );
    
        let deleted = await db.openQuery(conn, 'DELETE FROM employees WHERE id = ?', [employee.id]); 
        if (deleted.affectedRows === 1) console.log(`Success! Deleted employee ${this.getFullName()}.`)
        await conn.end();
        return deleted;
    }
    async updateEmployeesPrompt() {
        const db = new Sequel(CONFIG);
        const conn = await db.startPool();

        let employeesRaw = await db.openQuery(conn, 'SELECT first_name, last_name FROM employees;');
        let employeesObject = employeesRaw.map(e => new Employee(e.first_name, e.last_name));
        let employeesFullNameArray = employeesObject.map(e => e.getFullName());

        let { fullName } = await inq.prompt([
            {
                type: "list",
                message: "Choose an employee to update:",
                name: "fullName",
                choices: employeesFullNameArray
            }
        ]);
        this.firstName = fullName.split(' ')[0];
        this.lastName = fullName.split(' ')[1];

        let [ employee ] = await db.openQuery(conn, 'SELECT id FROM employees WHERE first_name =? AND last_name = ?;', [this.firstName, this.lastName]);
        await conn.end();

        this.id = employee.id;

        let { action } = await inq.prompt([
            {
                type: "list",
                message: `What would you like to update for ${this.getFullName()}?`,
                choices: [
                    "Change first name.",
                    "Change last name.",
                    "Change role.",
                    "Change department.",
                    "Change manager.",
                    "Change manager status."
                ],
                name: "action"
            }
        ]);

        switch (action) {
            case 'Change first name.': 
                let { newFirstName } = await inq.prompt([
                    {
                        message: "Enter new first name.",
                        name: "newFirstName"
                    }
                ])
                this.firstName = newFirstName;
                return this.updateEmployee({ first_name: this.firstName });
            
            case 'Change last name.': 
                let { newLastName } = await inq.prompt([
                    {
                        message: "Enter new last name.",
                        name: "newLastName"
                    }
                ])
                this.lastName = newLastName;
                return this.updateEmployee({ last_name: this.lastName });

            case 'Change role.': 
                let rolesQuery = await db.closedQuery('SELECT id, title FROM roles;');
                let allRoles = rolesQuery.map(r => r.title); 
                let { newRole } = await inq.prompt([
                    {
                        type: "list",
                        message: "Select new role.",
                        name: "newRole",
                        choices: allRoles
                    }
                ])
                this.roleID = rolesQuery.filter(r => r.title === newRole)[0].id;
                let update = await this.updateEmployee({ role_id: this.roleID });
                if (update.affectedRows === 1) console.log(`Success! Set ${this.getFullName()}'s role to ${newRole}.`);
        }
    }
    async updateEmployee(newValues) {
        const db = new Sequel(CONFIG);
        let update = await db.closedQuery('UPDATE employees SET ? WHERE ?', [
            newValues,
            {
                id: this.id
            }
        ]);
        return update;
    }

}

module.exports = Employee;