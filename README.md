
## Employee Tracker
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](https://www.contributor-covenant.org/version/2/0/code_of_conduct/) 

Developed by Moojig Battsogt. 

<img src='https://avatars1.githubusercontent.com/u/57543294?v=4' style='width: 50px'>

Contact at moojig@nyu.edu.

## Description 

Manage your employee database using NodeJS Inquirer. Allows for all CRUD operations (Create, Read, Update, Delete).

[See in action here.](https://youtu.be/5WCKEf5zA2g)

## Installation

Git clone this repo and add a config file in the /utils folder to add your database connection details. Use either the config_template.json file (and rename it) or copy the snippet below.
```json
{
    "user": "root",
    "password": "",
    "host": "localhost",
    "database": "staff"
}
```

## Usage 
Run `npm install` to grab mysql2 and inquirer.

Run `node index.js`.

## License

ISC License

        Copyright (c) 2020, Moojig Battsogt
        
        Permission to use, copy, modify, and/or distribute this software for any
        purpose with or without fee is hereby granted, provided that the above
        copyright notice and this permission notice appear in all copies.
        
        THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
        WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
        MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
        ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
        WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
        ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
        OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
