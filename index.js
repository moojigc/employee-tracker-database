const inq = require("inquirer");
const cTable = require("console.table");

const Sequel = require("./utils/Database");
const Employee = require("./lib/Employee");
const Role = require("./lib/Role");
const Department = require("./lib/Department");

// contains user, pass, host, db name
const CONFIG = require("./utils/config.json");
const db = new Sequel(CONFIG);

// Ask the user what they would like to do
async function initialPrompt() {
    const { action } = await inq.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "action",
            choices: ["Manage employees", "Manage roles", "Manage departments", "Exit"],
        },
    ]);
    return action;
}


async function addRolePrompt() {
    let conn = await db.startPool();
    // Check if departments have been defined
    let sql = "SELECT id, name FROM departments;";
    let results = await db.openQuery(conn, sql);
    if (results.length === 0) {
        conn.end();
        throw new Error("You must set up departments before adding roles!");
    } else {
        let allDepartments = results.map(r => r.name); // Take the value out of the name key from each department in the array
        console.log(`All departments: ${allDepartments}`);
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
            },
            {
                message: "Enter role's salary:",
                name: "salary",
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

async function addDepartmentPrompt() {
    let { name } = await inq.prompt([
        {
            message: "Enter new department's name:",
            name: "name",
        },
    ]);

    return await db.closedQuery("INSERT INTO departments SET ?", {
        name: name,
    });
}

async function manageEmployees() {
    let { action } = await inq.prompt([
        {
            type: "list",
            message: "Would you like to view, add, update, or delete an employee?",
            choices: [
                "Add",
                "Update",
                "View",
                "Delete"
            ],
            name: "action"  
        }
    ])
    let employee = new Employee();
    switch (action) {
        case 'Add':
            try {
                await employee.addEmployeesPrompt();
            } catch (error) {
                console.log(error);
            } finally {
                main();
            }
            break;
        case 'Update':
            try {
                await employee.updateEmployeesPrompt();
            } catch (error) {
                console.log(error);
            } finally {
                main();
            }
        case 'View':
            
            break;
        case 'Delete':
            try {
                await employee.deleteEmployeesPrompt();
            } catch (error) {
                console.log(error);
            } finally {
                main();
            }
            break;
        default:
            break;
    }
}

async function main() {
    const action = await initialPrompt();
    switch (action) {
        case "Manage employees":
            await manageEmployees();
            break;
        case "Manage roles":
            try {
                await addRolePrompt()
            } catch (error) {
                console.log(error)
            } finally {
                // Recursive function time!
                main();
            }
            break;
        case "Manage departments":
            try {
                await addDepartmentPrompt();
                
            } catch (error) {
                console.log(error)
            } finally {
                main();
            }
            break;
        case 'Exit':
        default:
            return;
    }
}

main();