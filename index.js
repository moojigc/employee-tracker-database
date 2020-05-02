const inq = require("inquirer");
const cTable = require("console.table");

const Employee = require("./lib/Employee");
const Role = require("./lib/Role");
const Department = require("./lib/Department");

async function manageEmployees() {
    const employee = new Employee();
    let { action } = await inq.prompt([
        {
            type: "list",
            message: "Would you like to view, add, update, or delete an employee?",
            choices: ["View", "Add", "Update", "Delete", "Return to main menu"],
            name: "action",
        },
    ]);

    if (action !== "Return to main menu") {
        try {
            switch (action) {
                case "Add":
                    await employee.addEmployeesPrompt();

                    break;
                case "Update":
                    await employee.updateEmployeesPrompt();

                    break;
                case "View":
                    const allEmployees = await employee.getAllEmployees("closed");
                    const formatted = allEmployees.map((e) => {
                        const manager = function() {
                            // Find their manager and return full name or N/A if no one
                            let [ manager ] = allEmployees.filter(m => m.id === e.managerID);
                            if (!!manager) return manager.getFullName();
                            else return "N/A";
                        }
                        return {
                            'ID': e.id,
                            'Name': e.getFullName(),
                            'Role': e.capitalize(e.roleTitle),
                            'Department': e.capitalize(e.departmentName),
                            'Salary': `$${e.salary}`,
                            'Direct Manager': manager()
                        };
                    });
                    console.table(formatted);

                    break;
                case "Delete":
                    await employee.deleteEmployeesPrompt();

                    break;
            }
        } catch (error) {
            console.log(error);
        } finally {
            await manageEmployees();
        }
    } else {
        await main();
    }
}

async function manageRoles() {
    const role = new Role();
    let { action } = await inq.prompt([
        {
            type: "list",
            message: "Would you like to view, add, update, or delete a role?",
            choices: ["View", "Add", "Update", "Delete", "Return to main menu"],
            name: "action",
        },
    ]);

    if (action !== "Return to main menu") {
        try {
            switch (action) {
                case "Add":
                    await role.addRolePrompt();

                    break;
                case "Update":
                    await role.updateRole();

                    break;
                case "View":
                    let allRoles = await role.getAllRoles();
                    let formatted = allRoles.map(r => {
                        return {
                            'ID': r.id,
                            'Title': role.capitalize(r.title),
                            'Salary': '$' + r.salary,
                            'Department': role.capitalize(r.departmentName),
                        }
                    });
                    console.table(formatted);

                    break;
                case "Delete":
                    await role.deleteRole();

                    break;
            }
        } catch (error) {
            console.log(error);
        } finally {
            await manageRoles();
        }
    } else {
        await main();
    }
}

async function manageDepartments() {
    const department = new Department();
    let { action } = await inq.prompt([
        {
            type: "list",
            message: "Would you like to view, add, update, or delete a department?",
            choices: ["View", "Add", "Update", "Delete", "Return to main menu"],
            name: "action",
        },
    ]);

    if (action !== "Return to main menu") {
        try {
            switch (action) {
                case "Add":
                    await department.addDepartmentPrompt();
                    break;
                case "Update":
                    await department.updateDepartmentsPrompt();

                    break;
                case "View":
                    let results = await department.getAllDepartments();
                    let formatted = results.map(d => {
                        return {
                            'ID': d.id,
                            'Name': d.capitalize(d.name)
                        }
                    })
                    console.table(formatted);
                    
                    break;
                case "Delete":
                    await department.deleteDepartmentPrompt();

                    break;
            }
        } catch (error) {
            console.log(error);
        } finally {
            await manageDepartments();
        }
    } else {
        await main();
    }
}

// Runs the program
async function main() {
    // Ask the user what they would like to do
    const { action } = await inq.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "action",
            choices: [
                "Manage employees",
                "Manage roles",
                "Manage departments",
                "Exit",
            ],
        },
    ]);

    if (action !== "Exit") {
        try {
            switch (action) {
                case "Manage employees":
                    await manageEmployees();

                    break;
                case "Manage roles":
                    await manageRoles();

                    break;
                case "Manage departments":
                    await manageDepartments();

                    break;
            }
        } catch (error) {
            console.trace(error);
        } finally {
            // some recursive fun
            await main();
        }
    } else {
        return;
    }
}

// Run the program
main();
