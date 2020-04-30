class Role {
    constructor(title, salary, departmentID) {
        this.id = 0;
        this.title = title;
        this.salary = salary;
        this.departmentID = departmentID;
    }
    getRole() {
        return this;
    }
}

module.exports = Role;