const Table = require('./Table');
const Sequel = require('../utils/Database');
const Department = require('./Department');
const Role = require('./Role');
const CONFIG = require('../utils/config.json');
const inq = require('inquirer');

const db = new Sequel(CONFIG);

class Employee extends Table {
    // You can either pass in config values as an object or let them be the default ones
    constructor(params) {
        let defaults = {
            id: null,
            firstName: "",
            lastName: "",
            roleID: null,
            roleTitle: "",
            department_id: null,
            departmentName: "",
            isManager: false,
            managerID: null,
            salary: null,
        };
        let { firstName, lastName, roleTitle, departmentName, id, roleID, isManager, departmentID, managerID, salary } = params ? params : defaults;
        super(id, 'employees');
        this.firstName = firstName
        this.lastName = lastName;
        this.roleID = roleID;
        this.roleTitle = roleTitle; 
        this.isManager = isManager;
        this.departmentID = departmentID; 
        this.departmentName = departmentName; 
        this.managerID = managerID;
        this.salary = salary;
    }
    getFullName() {
        // Returns the full name with proper capitalization (without modifying original values)
        let firstC = this.firstName.slice()[0].toUpperCase() + this.firstName.substring(1);
        let lastC = this.lastName.slice()[0].toUpperCase() + this.lastName.substring(1);
        return `${firstC} ${lastC}`
    }
    async addEmployeesPrompt() {
        let allDepartments = await new Department().getAllDepartments();
        let allRoles = await new Role().getAllRoles();
        if (allDepartments.length === 0 || allRoles.length === 0) {
            throw new Error(
                "You must set up roles and departments before adding employees!"
            );
        } else {    
            let allManagers = await this.getAllManagers();
            
            // I know this part looks weird but it makes it easier to handle the inquirer code later
            allManagers.push(new Employee({
                id: null,
                firstName: "no",
                lastName: "manager"
            }));
    
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
                    choices: allDepartments.map(d => this.capitalize(d.name))
                },
                {
                    type: "list",
                    message: "Enter role:",
                    name: "roleTitle",
                    choices: allRoles.map(r => this.capitalize(r.title))
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
                    choices: allManagers.map(e => `${e.id} ${e.getFullName()}`)
                }
            ]);
            // Pass values to the class Object, make sure all lowercase and no spaces
            this.firstName = firstName.toLowerCase().trim();
            this.lastName = lastName.toLowerCase().trim();
            this.isManager = isManager;
    
            // We expect an array of 1 Object from db.openQuery(), so we will just deal with that in one line using deconstruction
            let [ department ] = await db.closedQuery("SELECT id FROM departments WHERE name = ?", [departmentName]);
            let [ role ] = await db.closedQuery("SELECT id FROM roles WHERE title = ?", [roleTitle]);
            // Pass values to the class Object
            this.departmentID = department.id;
            this.roleID = role.id;
    
            // Defines theirManagerID based on whether employee has a manager or not
            switch (theirManager) {
                case '0 No Manager': 
                    this.managerID = null;
                    break;
                default:
                    this.managerID = allManagers.filter(m => m.id === parseInt(theirManager.split(' ')[0]))[0].id;
            }
            let insert = await this.insertRow({
                // make sure everything is lowercase and correct object type
                first_name: this.firstName.toLowerCase().trim(),
                last_name: this.lastName.toLowerCase().trim(),
                department_id: parseInt(this.departmentID),
                role_id: parseInt(this.roleID),
                is_manager: this.isManager,
                manager_id: parseInt(this.managerID)
            });
            if (insert.affectedRows === 1) console.log(`Success! Added ${this.getFullName()}, employee ID #${insert.insertId}`)
            // Finally return the result from the database which contains metadata about what was inserted
            return this;
        }
    }
    async deleteEmployeesPrompt() {
        
        const conn = await db.startPool();

        // Here I do a little trickery to reduce the amount of code I need to display full, capitalized names for each employee
        let employeesRaw = await db.openQuery(conn, 'SELECT first_name, last_name FROM employees;');
        // map the MySQL data into array with new Employee objects (even though we're still inside the Employee object)
        let employeesObject = employeesRaw.map(e => new Employee({
            firstName: e.first_name, 
            lastName: e.last_name
        }));
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
        // First find an employee to update...
        let allEmployees = await this.getAllEmployees();
        let employeesFullNameArray = allEmployees.map(e => `${e.id} ${e.getFullName()}`);
        let { fullName } = await inq.prompt([
            {
                type: "list",
                message: "Choose an employee to update:",
                name: "fullName",
                choices: employeesFullNameArray
            }
        ]);

        this.id = parseInt(fullName.split(' ')[0]);
        this.firstName = fullName.split(' ')[1];
        this.lastName = fullName.split(' ')[2];
        // Now that employee is selected, choose what to update
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
                    "Change manager status.",
                    "Go back"
                ],
                name: "action"
            }
        ]);
        // Now that the update action is decided, actually execute the update by calling this.updateRow();
        let update;
        switch (action) {
            case 'Change first name.': 
                let { newFirstName } = await inq.prompt([
                    {
                        message: "Enter new first name.",
                        name: "newFirstName"
                    }
                ]);
                this.firstName = newFirstName;
                update = await this.updateRow({ first_name: this.firstName });
                // the method returns the # of affected rows in database
                if (update.affectedRows === 1) console.log(`Success! Changed employee #${this.id}'s name to ${this.getFullName()}.`);

                break;
            case 'Change last name.': 
                let { newLastName } = await inq.prompt([
                    {
                        message: "Enter new last name.",
                        name: "newLastName"
                    }
                ])
                this.lastName = newLastName;

                update = await this.updateRow({ last_name: this.lastName });
                if (update.affectedRows === 1) console.log(`Success! Changed employee #${this.id}'s name to ${this.getFullName()}.`);

                break;
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
                update = await this.updateRow({ role_id: this.roleID });
                if (update.affectedRows === 1) console.log(`Success! Set ${this.getFullName()}'s role to ${newRole}.`);

                break;
            case 'Change manager.':
                let managers = await this.getAllManagers();
                let { newManagerStr } = await inq.prompt([
                    {
                        type: "list",
                        message: "Who is their new manager?",
                        name: "newManagerStr",
                        choices: managers.map(m => `${m.id} ${m.getFullName()}`)
                    }
                ]);
                this.managerID = parseInt(newManagerStr.split(' ')[0]);
                const [ newManager ] = managers.filter(m => m.id === this.managerID);
    
                update = await this.updateRow({ manager_id: this.managerID });
                if (update.affectedRows === 1) console.log(`Successfully changed ${this.getFullName()}'s manager to ${newManager.getFullName()}.`);
                
                break;
            case 'Change manager status.': 
                let { isManager } = await inq.prompt([
                    {
                        type: "confirm",
                        message: "Is this employee a manager/supervisor?",
                        name: "isManager"
                    }
                ]);

                update = await this.updateRow({ is_manager: isManager });
            
                if (update.affectedRows === 1) {
                    if (!isManager) console.log(`Successfully changed ${this.getFullName()} to a non-manager employee.`);
                    else console.log(`Successfully changed ${this.getFullName()} to a manager.`)
                } 

                break;
            case 'Change department.': 
                let results = await db.closedQuery('SELECT id, name FROM departments;');
                let departments = results.map(r => new Department({
                    id: r.id,
                    name: r.name
                }))
                let { newDepartmentName } = await inq.prompt([
                    {
                        type: "list",
                        message: "Choose their new department.",
                        name: "newDepartmentName",
                        choices: departments.map(d => `${d.id} ${this.capitalize(d.name)}`)
                    }
                ]);
                let [ newDepartment ] = departments.filter(d => d.id === parseInt(newDepartmentName.split(' ')[0]));

                this.departmentID = newDepartment.id;
                this.departmentName = newDepartment.name;
                const response = await this.updateRow({ department_id: this.departmentID });
                if (response.affectedRows === 1) console.log(`Successfully moved ${this.getFullName()} to ${this.capitalize(this.departmentName)}.`)
            case 'Go back':
            default:
                break;
        }
        return this;
    }
    
    // Can either use an existing DB connection or a new one. If existing, must pass in the connection object
    async getAllEmployees(openOrClosed, conn) {
        
        let sql = `SELECT employees.id, employees.first_name, employees.last_name, 
        employees.department_id, employees.role_id, employees.is_manager,
        employees.manager_id, roles.title, roles.salary,
        departments.name 
        FROM employees
        INNER JOIN roles
        ON employees.role_id = roles.id 
        INNER JOIN departments
        ON employees.department_id = departments.id;`;

        let employeesRaw;
        switch (openOrClosed) {
            case 'open': 
                employeesRaw = await db.openQuery(conn, sql);
                break;
            case 'closed': 
            default:
                employeesRaw = await db.closedQuery(sql);
                break;
        }
        let employeesMap = employeesRaw.map(e => new Employee({
            id: e.id,
            firstName: e.first_name,
            lastName: e.last_name,
            roleID: e.role_id,
            roleTitle: e.title,
            departmentID: e.department_id,
            departmentName: e.name,
            isManager: e.is_manager,
            managerID: e.manager_id,
            salary: e.salary
        })); 
        return employeesMap;
    }
    async getAllManagers(openOrClosed, conn) {
        let employees = await this.getAllEmployees(openOrClosed, conn);
        let managers = employees.filter(e => e.isManager);
        return managers;
    }
}

module.exports = Employee;