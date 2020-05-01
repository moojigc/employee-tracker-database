CREATE DATABASE staff;

USE staff;

CREATE TABLE employees(
	id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    department_id INT NOT NULL,
    role_id INT NOT NULL,
    is_manager boolean,
    manager_id INT,
    PRIMARY KEY (id)
);

CREATE TABLE roles(
	id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL NOT NULL,
    department_id INT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE departments(
	id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE employees
ADD FOREIGN KEY (role_id) REFERENCES roles(id),
ADD FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE role
ADD FOREIGN KEY (department_id) REFERENCES departments(id);

select * from employees;
delete from employees where first_name = "umiko";

SELECT id FROM employees WHERE first_name = "shizuku" AND last_name = "hazuki";