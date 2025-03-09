
const express = require('express');

const sqlite3 = require('sqlite3').verbose();
let sql;


//connect to db
const db = new sqlite3.Database('./db/celldb.db', sqlite3.OPEN_READWRITE, (err)=>{
    if (err)
    {
        return console.error('Error opening SQLite database:', err);
    } 
    else
    {
        console.log('SQLite database connected');
    }
})


function craftDB()
{

   
    /*db.run("DROP TABLE IF EXISTS students");
    db.run("DROP TABLE IF EXISTS admin");*/
    /*db.run("DROP TABLE IF EXISTS details")*/ 
    /*db.run("DROP TABLE IF EXISTS interviews")*/

    const createStudentsTable = `
    CREATE TABLE IF NOT EXISTS students (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    `;

    db.run(createStudentsTable, (err) => {
    if (err) {
        console.error('Error creating students table:', err.message);
    } else {
        console.log('Students table initialized');
    }
    });

    const createDetailsTable = `
    CREATE TABLE IF NOT EXISTS details (
        dID INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        college TEXT NOT NULL,
        pstatus TEXT NOT NULL,
        gradyear INTEGER NOT NULL,
        GPA DECIMAL NOT NULL,
        DSAscore INTEGER NOT NULL,
        Languages TEXT NOT NULL,
        intexp TEXT
    )`;
//but you have to find a way to join them somehow right? Shouldn't we have to insert something into it. 
    db.run(createDetailsTable, (err) => {
    if (err) {
        console.error('Error creating details table:', err.message);
    } else {
        console.log('Details table initialized');
    }
    });

    const createAdminTable = `
    CREATE TABLE IF NOT EXISTS admin (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        number TEXT NOT NULL,
        Company TEXT NOT NULL,
        role TEXT NOT NULL
    )`;

    db.run(createAdminTable, (err) => {
    if (err) {
        console.error('Error creating admin table:', err.message);
    } else {
        console.log('Admin table initialized');
    }
    });

    const createResultsTable = `
    CREATE TABLE IF NOT EXISTS results (
        rID INTEGER PRIMARY KEY AUTOINCREMENT,
        sID INTEGER,
        jobtitle TEXT NOT NULL,
        company TEXT NOT NULL,
        status TEXT NOT NULL
    )`;

    db.run(createResultsTable, (err) => {
        if (err) 
        {
            console.error('Error creating results table:', err.message);
        } 
        else
        {
            console.log('Results table initialized');
        }
        });

        
    const createJobsTable = `
    CREATE TABLE IF NOT EXISTS jobs (
        jID INTEGER PRIMARY KEY AUTOINCREMENT,
        cID INTEGER NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        skills TEXT NOT NULL,
        description TEXT NOT NULL
    )`;

    db.run(createJobsTable, (err) => {
        if (err) 
        {
            console.error('Error creating jobs table:', err.message);
        } 
        else
        {
            console.log('Jobs table initialized');
        }
        });

    
    const createInterviewsTable = `
    CREATE TABLE IF NOT EXISTS interviews (
        jID INTEGER PRIMARY KEY AUTOINCREMENT,
        sID INTEGER,
        sName TEXT NOT NULL,
        aID INTEGER,
        aName TEXT NOT NULL,
        aEmail TEXT NOT NULL,
        aCompany TEXT NOT NULL,
        iTime TEXT NOT NULL,
        iDate TEXT NOT NULL,
        iStatus TEXT NOT NULL
    )`;

    db.run(createInterviewsTable, (err) => {
        if (err) 
        {
            console.error('Error creating jobs table:', err.message);
        } 
        else
        {
            console.log('Jobs table initialized');
        }
        });
}



function runStudentQuery() {
    const selectQuery = "SELECT * FROM students";
    runQuery(selectQuery)
}

function runDetailsQuery() {
    const selectQuery = "SELECT * FROM details";
    runQuery(selectQuery)
}

function runJobsQuery() {
    const selectQuery = "SELECT * FROM jobs";
    runQuery(selectQuery)
}

//Change this and all the others
function runAdminQuery() {
    const selectQuery = "SELECT * FROM admin";
    runQuery(selectQuery)
}


function runResultsQuery() {
    const selectQuery = "SELECT * FROM results";
    runQuery(selectQuery)
}

function runInterviewsQuery() {
    const selectQuery = "SELECT * FROM interviews";
    runQuery(selectQuery)
}

function runQuery(selectQuery)
{

    db.all(selectQuery, [], (err, rows) => {
        if (err) 
        {
            console.error("Error querying table: ", err.message);
        } 
        else 
        {
            rows.forEach((row) => {
                console.log(row);
            });
        }
    });
}
//dbfunctions.js file
module.exports = {runStudentQuery, runDetailsQuery, runAdminQuery, runJobsQuery, runResultsQuery, runInterviewsQuery,runQuery, craftDB};