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
            choices: ["Manage employees", "Manage roles", "Manage departments"],
        },
    ]);
    return action;
}

async function addEmployeesPrompt() {
    let conn = await db.startPool();
    // Check if roles and departments have been defined
    let sql =
        "SELECT roles.title, departments.name FROM roles INNER JOIN departments ON roles.department_id = departments.id;";
    let res = await db.openQuery(conn, sql);
    if (res.length === 0) {
        conn.end();
        throw new Error(
            "You must set up roles and departments before adding employees!"
        );
    }
    let { firstName, lastName, department, role, managerID } = await inq.prompt([
        {
            message: "Enter first name:",
            name: "firstName",
        },
        {
            message: "Enter last name:",
            name: "lastName",
        },
        {
            message: "Enter department:",
            name: "department",
        },
        {
            message: "Enter role:",
            name: "role",
        },
        {
            message: "Enter manager ID if employee has manager:",
            name: "managerID",
        },
    ]);
    let roleID = await db.openQuery(
        conn,
        "SELECT id FROM roles WHERE title = ?;",
        role
    );
    let departmentID = await db.openQuery(
        conn,
        "SELECT id FROM departments WHERE name = ?;",
        department
    );
    console.log(departmentID)
    // let insert = await db.openQuery("INSERT INTO employees SET ?", {
    //     first_name: firstName,
    //     last_name: lastName,
    //     department_id: departmentID,
    //     role_id: roleID,
    // });
    await conn.end();
    return insert;
}

async function addRolePrompt() {
    let conn = await db.startPool();
    // Check if departments have been defined
    let sql = "SELECT id FROM departments;";
    let res = await db.openQuery(conn, sql);
    if (res.length === 0) {
        conn.end();
        throw new Error("You must set up departments before adding roles!");
    }

    let { title, salary, department } = await inq.prompt([
        {
            message: "Enter new role's title:",
            name: "title",
        },
        {
            message: "Enter role's salary:",
            name: "salary",
        },
        {
            message: "Enter role's department:",
            name: "department",
        },
    ]);

    let departmentID = await db.openQuery(
        conn,
        "SELECT id FROM departments WHERE name = ?",
        department
    );
    let insert = await db.openQuery(conn, "INSERT INTO roles SET ?", {
        title: title,
        salary: salary,
        department_id: departmentID,
    });
    await conn.end();
    return insert;
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
    let { action } = inq.prompt([
        {
            type: "list",
            message: "Would you like to view, add, update, or delete an employee?",
            choices: [
                "Add",
                "View",
                "Delete"
            ]  
        }
    ])
    switch (action) {
        case 'Add':
            addEmployeesPrompt()
                .then((r) => console.log(r))
                .catch(console.error);
            break;
        case 'View':
            
            break;
        case 'Delete':
            
            break;
        default:
            break;
    }
}

async function main() {
    const action = await initialPrompt();
    switch (action) {
        case "Manage employees":
            
            break;
        case "Manage roles":
            addRolePrompt()
                .then((r) => console.log(r))
                .catch(console.error);
            break;
        case "Manage departments":
            addDepartmentPrompt()
                .then((r) => console.log(r))
                .catch(console.error);

            break;
        default:
            break;
    }
}

main();