class Employee {
    constructor(firstName, lastName, roleID, departmentID, managerID) {
        this.id = 0;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roleID = roleID;
        this.departmentID = departmentID;
        this.managerID = managerID;
    }
    getFullName() {
        return `${this.firstName} ${this.lastName};`
    }
    getEmployee() {
        return this;
    }
}

module.exports = Employee;