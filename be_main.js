const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const url = require('url');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();
const sqlite3 = require('sqlite3').verbose();

logject = {};
//not dbfunctions.js file
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



const dbfunc = require('./dbfunctions.js')


//To parse html requests when posting them
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));

app.set("view engine", "ejs")

app.use(express.static('public'));


dbfunc.craftDB();
const email = process.env.BOTMAIL;
const password = process.env.BOTWD;

console.log("Email---------------------:", email);
console.log("Password:-----------------------", password ? "Loaded" : "Not Loaded");

//Create session for user
app.use(session(
    {
        secret: '$#FD)$G_@)FMVS#)@',
        cookie: {maxAge: 1800000, secure: false},
        resave: false,
        saveUninitialized: true 
    }

 
));

app.use((req, res, next) => 
    {
        if(req.session.user) //if the user is present
        {
            //set session data
            res.locals.user = 
            {
                ID: req.session.user.ID,
                semail: req.session.user.email,
                spassword: req.session.user.password
            }
            console.log("USER ID: " + req.session.user.ID);
            console.log("email: " + req.session.user.email);
            console.log("password: " + req.session.user.password);

        }
        next() //if the user isn't logged in then this can just be called
    })
 



app.get("/", async(req, res,) =>
    {
    res.render('student_login', { message : ''});
    console.log("__________________________________________________________________________________");
    dbfunc.runStudentQuery();
    console.log("__________________________________________________________________________________");console.log("__________________________________________________________________________________");
    dbfunc.runDetailsQuery();
    console.log("__________________________________________________________________________________");
    console.log("__________________________________________________________________________________");
    dbfunc.runInterviewsQuery();
    console.log("__________________________________________________________________________________");

    })

app.post("/", async(req, res,) =>
    {


        sqlu = "SELECT * FROM students WHERE email = ?"
        db.get(sqlu, [req.body.email],(err, user)=>
        {
            if(err)
            {
                return console.error(err.message)
            } 

            if(!user) //email is not found in database
            {
                return res.render('student_login', { message: 'The email is incorrect or does not exist'})
            }

            bcrypt.compare(req.body.password, user.password, (err, isMatch) => 
            {

                if(!isMatch)
                {
                    return res.render('student_login', { message: 'The password is incorrect or does not exist'})
                }
                else
                {
                    req.session.user = user;
                    res.redirect('/' + req.session.user.ID + '/student_menu');

                }
            })
        }) 



    })
    
//end user session when logging out
app.get('/logout', async (req, res) => {
    req.session.user = undefined;
    res.redirect('/');
})

app.get("/student_signup", async(req, res,) =>
    {
        res.render('student_signup', { message : ''});
    })
    
app.post("/student_signup", async(req, res,) =>

    {
    
    //Check to see whether or not email already exists
    copymail = "SELECT email FROM students WHERE email = ?"
    db.get(copymail, [req.body.email], (err, email2) => {
        if (err) 
        {
          console.error(err.message);
          return res.render('student_signup', { message: 'Well, this was not supposed to happen' });
        }

        if(req.body.email === email2) // throw an error. cannot read property username of undefined
        {
           return res.render('student_signup', {message: 'The specified account already exists'})
        } 
    
    })


    //
    const pass1 = req.body.password.trim();
    const pass2 = req.body.repassword.trim();
    if(pass1 != pass2)
    {
        return res.render('student_signup', {message: "Passwords don't match. Try again."});
    }

  

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(pass1, salt);
    console.log("salt: " + salt);
    console.log("hash: " + hash);
    
        
    
    logject.sID = req.body.ID;
    logject.email = req.body.email;
    logject.password = hash;

    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
    dbfunc.runStudentQuery();
    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");


        res.redirect('/student_details');
    })
    
app.get("/student_details", async(req, res,) =>
    {
        res.render("student_details");
        console.log("I don't wanna be touched HEEEEY " + req.body.pstatus)
        console.log(logject.ID)
        console.log(logject.email)
        console.log(logject.password)
    })
    
app.post("/student_details", async(req, res,) =>
    {
        

        sql = 'INSERT INTO students(email, password, role) VALUES (?, ?, ?)';
        db.run(sql, [logject.email, logject.password, "student"], (err)=>
        { 
            if (err) return console.error(err.message);
            return res.render('student_signup', { message: 'An error occurred while creating the account.' });
        })
       
        sql = 'INSERT INTO details(first_name, last_name, college, pstatus, gradyear, GPA, DSAscore, Languages, intexp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.run(sql,[req.body.fname, req.body.lname, req.body.college, req.body.pstatus, req.body.gradyear, req.body.GPA, req.body.DSAscore, req.body.language, req.body.iexp],(err)=>
        { 
            if (err)
            {
                return res.render('student_details', { message: 'An error occurred while creating the account.' });
            } 
        })
        dbfunc.runDetailsQuery();

        res.redirect('/');
    })

app.get("/:sid/student_menu", async(req, res,) =>
    {
        console.log("I don't want to be abused" + req.session.user.ID);


        res.render('student_menu', {id: req.session.user.ID});
    })
    

const heading = (title) => {
    const html = `
        <!doctype html>
            <html>
                <head>
                    <title>${title}</title>
                    
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

                </head>
                <body>
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
                    
    `; 
    return html;
}

app.get("/:sid/apply_for_jobs", async (req, res) => {
    let html = heading('Manage Jobs');
        html += `<a class="btn" href="/${req.session.user.ID}/student_menu" role="button" style="width:15px; height:20px; font-color: black;">Menu</a>`;
    
        
    
            // Add style to the page
            html += `
                <style>
                    .container {
                        padding-top: 30px;
                    }
                    .col-sm-4 {
                        margin-top: 5px;
                        margin-bottom: 5px;
                    }
                    p {
                        font-color: red;
                    }
                    html {
                        height: 100%;
                        margin: 0;
                    }
                    body {
                        background-repeat: no-repeat;
                        background-color: rgb(78, 255, 246);
                        background-image: cover;
                    }
                </style>
            `;
    

            const sql = "SELECT * FROM jobs";
            const jobProm = await new Promise((resolve, reject) => {
                db.all(sql, [], (err, rows) => {
                    if (err) {
                        console.error('Error fetching admin data for job', job, err);
                        return reject(err); // Reject if error
                    }
                    resolve(rows); // Resolve with admin data
                    console.log("ROWS INNIE " + rows)
                });
            });
            
            //and jobProm[i].title === sid.languages
            const sqlu = "SELECT * FROM jobs"; // Query to get all jobs

            const nArr = [];
            
            const newql = "SELECT languages from details where dID = ?"
            const sidlanguage = await new Promise((resolve, reject) => {
                db.all(newql, [req.params.sid], (err, rows) => {
                    if (err) {
                        console.error('Error fetching admin data for job', rows, err);
                        return reject(err); // Reject if error
                    }
                    resolve(rows); // Resolve with admin data
                });
            });
            
            let newstr = JSON.stringify(sidlanguage[0].Languages);
            let parstr = JSON.parse(newstr);
            let newerstr = parstr.split(' ');
            for(let i = 0; i < newerstr.length; i++)
            {
                newerstr[i] = newerstr[i].replace(',', '');
            }

            //The entries for loop
            for(let i = 0; i < jobProm.length; i++)
            {
                //The languages for loop
                for(let j = 0; j < newerstr.length; j++)
                {
                    console.log("jobProm[i].s" + jobProm[i].skills)
                    console.log("NEWSTR" + newerstr)
                    if (jobProm[i].skills.toLowerCase().includes(newerstr[j].toLowerCase())) {
                    {
                        html += `
                        <div class="container">
                            <div class="row">
                                <div class="col-sm">
                                    <div class="card" style="background-color: rgb(238, 224, 171)">
                                        <form action="/${req.params.sid}/apply_for_jobs" method="POST">
                                            <ul class="list-group list-group-flush">
                                                <div class="card-body">
                                                    <h2 class="card-title">${jobProm[i].title}</h2>
                                                    <h4 class="card-subtitle mb-2 text-muted">${jobProm[i].company}</h4>
                                                    <b>Skills: </b>
                                                    <p>${jobProm[i].skills}</p>
                                                    <b>Description: </b>
                                                    <p>${jobProm[i].description}</p>
                                                    <input type="hidden" name="Title" value="${jobProm[i].title}" />
                                                    <input type="hidden" name="skills" value="${jobProm[i].skills}" />
                                                    <input type="hidden" name="description" value="${jobProm[i].description}" />
                                                    <input type="hidden" name="company" value="${jobProm[i].company}" />
                                                    <button type="submit" value="Apply">Apply</button>
                                                </div>
                                            </ul>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    }
                    break; //If one of the student's skills applies with at least one of the skills required for the job, it counts.
                }
            }
                
        }
    
            html += "</body>";
            res.send(html); 
});


const cors = require('cors');
const nodemailer = require('nodemailer');
const corsOptions = {
    origin: '*',  // Allows requests from all domains. Specify actual domain in production for security.
    optionsSuccessStatus: 200 // Ensure compatibility by setting OPTIONS success status to 200 OK.
};
app.use(cors(corsOptions));



app.post("/:sid/apply_for_jobs", async (req, res) => {
    res.locals.sID = req.session.user.ID;
    getPlacementStatus = await new Promise((resolve, reject) => 
    {
        const sql0 = "SELECT pstatus FROM details WHERE dID = ?"
        db.get(sql0, [req.params.sid], (err, entry) => 
        {
            if (err) {
                console.error('Error getting data from admin');
                return reject(err);
            } else {
                resolve(entry);
            }
        })
    })

    res.locals.title = req.body.Title;
    res.locals.skills = req.body.skills;
    res.locals.description = req.body.description;
    res.locals.company = req.body.company;

    console.log("I want this to be over: " + res.locals.sID);
    console.log("I want this to be over: " + res.locals.title);
    console.log("I want this to be over: " + res.locals.company);
    console.log("I want this to be over: " + getPlacementStatus.pstatus);

    console.log("RUN ADMIN QUERY");
    dbfunc.runAdminQuery();
    console.log("RUN JOB QUERY");
    dbfunc.runJobsQuery();

    // Insert into results database
    const sql = "INSERT INTO results (sID, jobtitle, company, status) values (?, ?, ?, ?)";
    db.run(sql, [res.locals.sID, res.locals.title, res.locals.company, getPlacementStatus.pstatus]);

    const onlyWayToGetAdminDetails = await new Promise((resolve, reject) => {
        const sql1 = "SELECT * FROM admin WHERE ID = ?";
        db.all(sql1, [req.session.user.ID], (err, entries) => {
            if (err) {
                console.error('Error getting data from admin');
                return reject(err);
            } else {
                resolve(entries);
            }
        });
    });

    
    let testAcc = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use false for STARTTLS; true for SSL on port 465
        auth: { //account used to send emails
            user: process.env.BOTMAIL,
            pass: process.env.BOTWD,
        }, 

    });

    transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      });

    /*
    try {
        let name = onlyWayToGetAdminDetails[0].first_name + " " + onlyWayToGetAdminDetails[0].last_name;
        let email = onlyWayToGetAdminDetails[0]?.email;
        let subject = "New Application: A student has applied to one of your positions";
        let message = `${name} has applied to your position ${res.locals.title}. Check out their profile to see if they're a good fit!`;

        // Validate required fields.
        if (!name || !subject || !email || !message) {
            return res.status(400).json({ status: 'error', message: 'Missing required fields' });
        }


        
        db.all(sql1, [req.session.user.ID], (err, entries) => {

    
            const onlyWayToGetEmail = await new Promise((resolve, reject) => {
                const sql2 = "SELECT email FROM students WHERE ID = ?";
                db.get(sql2, [req.params.sid], (err, entry) => {
                    if (err) {
                        console.error('Error getting data from admin');
                        return reject(err);
                    } else {
                        resolve(entry);
                    }
                })
            });


            console.log("Email---------------------:", process.env.BOTMAIL);
            console.log("Password:-----------------------", process.env.BOTWD ? "Loaded" : "Not Loaded");

                let mailOptions = {
                    from: 'emailbot557@gmail.com', // Sender address from environment variables.
                    to: `${name} <${email}>`, // Recipient's name and email address.
                    replyTo: onlyWayToGetEmail.email, // Sets the email address for recipient responses.
                    subject: subject, // Subject line.
                    text: message // Plaintext body.
                }; 
        
        
        // Send email
        //this is the part that's throwing the error
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        
        // Send the redirect response after email is successfully sent
    } catch (err) {
        // Handle errors and log them.
        console.error('Error sending email:', err);
        return res.status(500).json({ status: 'error', message: 'Error sending email, please try again.' });
    }*/ 
    res.redirect('/' + req.session.user.ID + '/job_placement');
    
});


    app.get("/:sid/student_profile", async(req, res) =>
    {

        

        const id = req.session.user.ID;
        console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEE" + id);

        // get student details and place them in variables
        

        console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD: " + JSON.stringify(req.session.user))
        sqld = "SELECT * FROM details JOIN students ON details.dID = students.ID WHERE ID = ?"
        db.all(sqld, [id], (err, entries)=>
        {
            res.locals.firstname = entries[0].first_name;
            res.locals.lastname = entries[0].last_name;
            res.locals.college = entries[0].college;
            res.locals.pstatus = entries[0].pstatus;
            res.locals.gradyear = entries[0].gradyear;
            res.locals.GPA = entries[0].GPA;
            res.locals.email = entries[0].email;
            res.locals.dsascore = entries[0].DSAscore;
            res.locals.iexp = entries[0].intexp; 
            res.locals.languages = entries[0].Languages;
            res.render("student_profile", {ustatus: req.session.user.role, id: req.session.user.ID, eaddress: res.locals.email, fname: res.locals.firstname, lname: res.locals.lastname, col: res.locals.college, status: res.locals.pstatus, batch: res.locals.gradyear, gpa: res.locals.GPA, score: res.locals.dsascore, intexp: res.locals.iexp, languages: res.locals.languages});
    
            
        })
        
    }); 

    const path = require('path');

    app.get("/:aid/admin_menu/admin_profile/a_edit_profile",  async(req, res) =>
        {
            newsql = "SELECT * FROM admin WHERE ID = ?"


            badhtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <!--<link rel="stylesheet" href="stylesheets/clogin.css" >-->
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
                <style id="custom-cursor" type="text/css"></style>
                <title>Document</title>
                <style>
                .container-lg
                {
                    margin-top: 5px;
                    margin-bottom: 20px;
                }
                .input-group
                {
                    padding-top: 20px;
                    padding-bottom: 20px;
                }
                html 
                {
                    height: 100%;
                    margin: 0;
                }
                body
                {
                    background-image: linear-gradient(rgb(78, 255, 246), rgb(238, 194, 73));
                    background-repeat: no-repeat;
                    background-image: cover;
                }
                </style>
            </head>
            <body>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    
                <div class="container-lg" style="margin-top: 40px;">
                <div class="row justify-content-center">
                <div class="col-lg-8">
                <div class="card card-custom">
                    <div class="card-header" style="background-color: rgb(246, 201, 78);">
                    <h1>Enter details</h1>
                    </div> 
                    <div class="card-body" style="background-color: rgb(191, 157, 63);">
                    <form action="/${req.session.user.ID}/admin_menu/admin_profile/a_edit_profile" method="POST" autocomplete="on">
                        <div class="form-group" id="dgroup">
                            <label for="fname">First name:</label><br>
                            <div class="input-group">
                            <input type="text" id="fname" name="fname" class="form-control" list="flist" required><br>
                            </div>
                            <datalist id="flist">
                                <option value=${res.locals.fname}>
                            </datalist>
                            <label for="lname">Last name:</label><br>
                            <div class="input-group">
                            <input type="text" id="lname" name="lname" class="form-control" list="llist" required><br>
                            </div>
                            <datalist id="llist">
                                <option value=${res.locals.fname}>
                            </datalist>
                            <button type="submit" value="Continue">Continue</button>
                        </form>
                        </div>
                    </div>
                </div>
                </div>
                </div>
                </div>
                <br></br>
                
            </body>
            </html>
            `
            res.send(badhtml);
        })

    
        app.post("/:aid/admin_menu/admin_profile/a_edit_profile",  async(req, res) =>
        {
            sql = "UPDATE admin SET first_name = ?, last_name = ? WHERE ID = ?"; 
            db.run(sql, [req.body.fname, req.body.lname, req.params.aid])
            res.redirect('/' + req.session.user.ID + '/admin_menu' + '/admin_profile');
        })


    app.get("/:aid/admin_menu/admin_profile", async(req, res) =>
        {

            console.log("REQ SESSION ADMIN GGGGHHHHHHHHHHHHHHHHHHHHHHH: " + JSON.stringify(req.session.user));
            
            sqld = "SELECT * FROM admin WHERE ID = ?"
            db.all(sqld, [req.params.aid], (err, entries)=>
            {
                res.locals.firstname = entries[0].first_name;
                res.locals.lastname = entries[0].last_name;
                res.locals.email = entries[0].email;
                res.locals.number = entries[0].number;
                res.locals.Company = entries[0].Company;
                res.render("admin_profile", {id: req.session.user.ID, fname: res.locals.firstname, lname: res.locals.lastname, email: res.locals.email, number: res.locals.number, company: res.locals.Company, role: res.locals.role});
    
            });
            
        }); 

    app.get("/:aid/admin_menu/manage_students/:sid/student_profile", async(req, res) =>
        {
    
            sqld = "SELECT * FROM details JOIN students ON details.dID = students.ID WHERE ID = ?"
            db.all(sqld, [req.params.sid], (err, entries)=>
            {
                res.locals.firstname = entries[0].first_name;
                res.locals.lastname = entries[0].last_name;
                res.locals.college = entries[0].college;
                res.locals.pstatus = entries[0].pstatus;
                res.locals.gradyear = entries[0].gradyear;
                res.locals.GPA = entries[0].GPA;
                res.locals.email = entries[0].email;
                res.locals.dsascore = entries[0].DSAscore;
                res.locals.iexp = entries[0].intexp; 
                res.locals.languages = entries[0].Languages;
                res.render("student_profile", {ustatus: req.session.user.role, id: req.session.user.ID, sid: req.params.sid, eaddress: res.locals.email, fname: res.locals.firstname, lname: res.locals.lastname, col: res.locals.college, status: res.locals.pstatus, batch: res.locals.gradyear, gpa: res.locals.GPA, score: res.locals.dsascore, intexp: res.locals.iexp, languages: res.locals.languages});
    
                
            })

            
            
        }); 


        app.get("/:aid/admin_menu/manage_students/:sid/student_profile/create_interview", async(req, res) =>
            {
                console.log("REQ SESSION USER GGGGHHHHHHHHHHHHHHHHHHHHHHH: " + JSON.stringify(req.session.user));
        
                console.log("REQ SESSION EMAIL: " + req.session.user.email)
                console.log("REQ SESSION company: " + req.session.user.Company)

                res.render("create_interview", {id: req.params.aid, sid: req.params.sid});
                
            }); 
        

        app.post("/:aid/admin_menu/manage_students/:sid/student_profile/create_interview", async(req, res) =>
            {
                //try to find different way
                sql1 = "SELECT first_name, last_name FROM details WHERE dID = ?"
                const sName = await new Promise((resolve, reject) => {
                    db.all(sql1, [req.params.sid], (err, rows) => {
                        if (err) {
                            console.error('Error fetching admin data for row', rows, err);
                            return reject(err); // Reject if error
                        }
                        resolve(rows); // Resolve with admin data
                    });
                });
                

                let newname = sName[0].first_name + ' ' + sName[0].last_name;
                console.log("First name: " + sName[0].first_name)
                console.log("Last name: " + sName[0].last_name)
                console.log("NEWNAME: " + newname);
                sqld = "INSERT INTO interviews (sID, sName, aID, aName, aEmail, aCompany, iTime, iDate, iStatus) values (?, ?, ?, ?, ?, ?, ?, ?, ?)"
                db.run(sqld, [req.params.sid, newname, req.params.aid, req.session.user.first_name, req.session.user.email, req.session.user.Company, req.body.time, req.body.date, "undecided"]); 
                res.redirect("/" + req.params.aid + "/admin_menu/list_interviews");
                
            }); 

        app.get("/:aid/admin_menu/manage_students/:sid/student_profile", async(req, res) =>
            {
        
                
        
                const id = req.params.sid;
                console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEE" + id);

                
        
                sqld = "SELECT * FROM details JOIN students ON details.dID = students.ID WHERE ID = ?"
                db.all(sqld, [id], (err, entries)=>
                {
                    res.locals.firstname = entries[0].first_name;
                    res.locals.lastname = entries[0].last_name;
                    res.locals.college = entries[0].college;
                    res.locals.pstatus = entries[0].pstatus;
                    res.locals.gradyear = entries[0].gradyear;
                    res.locals.GPA = entries[0].GPA;
                    res.locals.email = entries[0].email;
                    res.locals.dsascore = entries[0].DSAscore;
                    res.locals.iexp = entries[0].intexp; 
                    res.locals.languages = entries[0].Languages;
                    res.render("student_profile", {id: req.session.user.ID, eaddress: res.locals.email, fname: res.locals.firstname, lname: res.locals.lastname, col: res.locals.college, status: res.locals.pstatus, batch: res.locals.gradyear, gpa: res.locals.GPA, score: res.locals.dsascore, intexp: res.locals.iexp, languages: res.locals.languages});
            
                    
                    
                })
    
                
                
            }); 
    app.get('/:sid/job_placement', async(req, res)=>
    {
        let subtml = "";
        let subtml2 = "";


        sql2 = "SELECT * FROM interviews where sID = ?"
                    const interviews = await new Promise((resolve, reject) => {
                        db.all(sql2, [req.params.sid], (err, rows) => {
                            if (err) {
                                console.error('Error fetching admin data for row', rows, err);
                                return reject(err); // Reject if error
                            }
                            resolve(rows); // Resolve with admin data
                            console.log("ROWS INNIE " + rows)
                        });
                    });

        const { ID } = req.session.user;
        console.log(`Fetching job placements for user with ID: ${ID}`);

                
        for(let i = 0; i < interviews.length; i++)
            {

                subtml2 += `
                <tr>
                <th>${interviews[i].sName}</th>
                <th>${interviews[i].aName}</th>
                <th>${interviews[i].aEmail}</th>
                <th>${interviews[i].aCompany}</th>
                <th>${interviews[i].iDate}</th>
                <th>${interviews[i].iTime}</th>
                <th>${interviews[i].iStatus}</th>
                </tr>`
            } 
       
            html =  `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            </head>
            <body>
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    
                <style>
                    html 
                    {
                        height: 100%;
                        margin: 0;
                    }
                    body
                    {
                        background-image: cover;
                        background-color: rgb(78, 255, 246)
                    }
                    th
                    {
                        font-size: 20px;
                        padding: 30px;
                    }
                </style> <!--//chatgpt used to help with table-->
    
    
    
                <div class="container-lg" style="margin-top: 40px;">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <div class="container-lg" style="margin-top: 40px;">
                                <div class="row justify-content-center">
                                    <div class="col-lg-8">
                                        <table class = "table">
                                        <h2>Interviews Table</h2>
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Employer</th>
                                                    <th>Email</th>
                                                    <th>Company</th>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${subtml2}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>                
                        </div>
                    </div>
                </div>
    
            </body>
            </html>`
    res.send(html);

        
        

   
    })


    app.get('/:aid/admin_menu/list_interviews', async(req, res)=>
    {
        let html = heading('See interviews');
        let subtml2 = '';

        console.log("ID: " + req.params.aid);
        sql2 = "SELECT * FROM interviews where aID = ?"
        const interviews = await new Promise((resolve, reject) => {
            db.all(sql2, [req.params.aid], (err, rows) => {
                if (err) {
                    console.error('Error fetching admin data for row', rows, err);
                    return reject(err); // Reject if error
                }
                resolve(rows); // Resolve with admin data
                console.log("ROWS INNIE " + rows)
            });
        });

        const { ID } = req.session.user;
        console.log(`Fetching job placements for user with ID: ${ID}`);

        for(let i = 0; i < interviews.length; i++)
        {

            subtml2 += `
            <tr>
            <th>${interviews[i].sName}</th>
            <th>${interviews[i].aName}</th>
            <th>${interviews[i].aEmail}</th>
            <th>${interviews[i].aCompany}</th>
            <th>${interviews[i].iDate}</th>
            <th>${interviews[i].iTime}</th>
            <td><select name="status" id="status">
                    <option value = "undecided">undecided</option>
                    <option value = "accepted">accepted</option>
                    <option value = "rejected">rejected</option>
                </select></td>
            </tr>`
        } 

        html += `<a class="btn" href="/${req.session.user.ID}/admin_menu" role="button" style="width:15px; height:20px; font-color: black;">Menu</a>;
        <div class="container-lg" style="margin-top: 40px;">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="container-lg" style="margin-top: 40px;">
                        <div class="row justify-content-center">
                            <div class="col-lg-8">
                                <table class = "table">
                                <h2>Interviews Table</h2>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Employer</th>
                                            <th>Email</th>
                                            <th>Company</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${subtml2}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>                
                </div>
            </div>
        </div>
    </body>
    </html>`

    html += `<script> 
    
    
        function getEmail(event)
        {
            const iidd = event.target.closest('tr').childNodes
            console.log(iidd[5].innerText)
            return iidd[5].innerText;
        }

        const changeStatuses = document.querySelectorAll('select[id="status"]')
        changeStatuses.forEach(status => 
        {
            status.addEventListener('change', function(event)
                {
                    const email = getEmail(event)
                     fetch(\`/${req.params.aid}/admin_menu/list_interviews\`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json' // Add this header to tell the server we're sending JSON
                            },
                        body: JSON.stringify({email: email, istatus: event.target.value})
                    })

                }); // Listen for 'change' events
 
        })
    </script>`
    res.send(html); //This sends the html as a response so you don't have to put anything on the manage_students page

    });

    app.post('/:aid/admin_menu/list_interviews', async(req, res)=>
        {
            const email = req.body.email;
            const istatus = req.body.istatus;
            console.log('Received email:', email);
            console.log("REQ BODY ISTATUS: ", req.body.istatus);
            //res.json({ message: 'Successfully received newlem', newlemReceived: newlem });

            SQL = "UPDATE interviews SET iStatus = ? WHERE aEmail = ?"
            db.run(SQL, [req.body.istatus, req.body.email])

            //Delete all accepted and rejected entries after 24 hours to avoid clutter
            setTimeout(() => 
            {
                delql = "DELETE FROM admin WHERE iStatus = ? OR iStatus = ?";
                db.run(delql, ["accepted", "rejected"])
            }, 1000 * 60 * 60 * 24)

        });

    app.get('/:aid/admin_menu/manage_students/:sid/job_placement', async(req, res)=>
        {
        let subtml2 = "";


        sql2 = "SELECT * FROM interviews where sID = ?"
                    const interviews = await new Promise((resolve, reject) => {
                        db.all(sql2, [req.params.sid], (err, rows) => {
                            if (err) {
                                console.error('Error fetching admin data for row', rows, err);
                                return reject(err); // Reject if error
                            }
                            resolve(rows); // Resolve with admin data
                            console.log("ROWS INNIE " + rows)
                        });
                    });

        const { ID } = req.session.user;
        console.log(`Fetching job placements for user with ID: ${ID}`);

        for(let i = 0; i < interviews.length; i++)
            {

                subtml2 += `
                <tr>
                <th>${interviews[i].sName}</th>
                <th>${interviews[i].aName}</th>
                <th>${interviews[i].aEmail}</th>
                <th>${interviews[i].aCompany}</th>
                <th>${interviews[i].iDate}</th>
                <th>${interviews[i].iTime}</th>
                <th>${interviews[i].iStatus}</th>
                </tr>`
            } 
       

                html =  `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        </head>
        <body>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

            <style>
                html 
                {
                    height: 100%;
                    margin: 0;
                }
                body
                {
                    background-image: cover;
                    background-color: rgb(78, 255, 246)
                }
                th
                {
                    font-size: 20px;
                    padding: 30px;
                }
            </style> <!--//chatgpt used to help with table-->



            <div class="container-lg" style="margin-top: 40px;">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="container-lg" style="margin-top: 40px;">
                            <div class="row justify-content-center">
                                <div class="col-lg-8">
                                    <table class = "table">
                                    <h2>Interviews Table</h2>
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Employer</th>
                                                <th>Email</th>
                                                <th>Company</th>
                                                <th>Date</th>
                                                <th>Time</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${subtml2}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>                
                    </div>
                </div>
            </div>

        </body>
        </html>`

        
        res.send(html);

        
            
                
    
       
        })

    app.get("/:sid/edit_profile",  async(req, res) =>
    {
        /*res.render('student_details', {id: req.params.ID})*/
        newsql = "SELECT * FROM details WHERE ID = ?"
        /*db.all(newsql, [], (entries)=>
            {
                console.log(entries[0].email);
                console.log(entries[0].Company);
                console.log(entries[0].cID);
                console.log(entries[0].jID);
    
                res.locals.user = 
                {
                    ID: req.session.user.ID,
                    semail: req.session.user.email,
                    spassword: req.session.user.password
                }

                res.locals.title = entries.title;
                
    
            })*/

        db.get(newsql, [req.session.user.ID], (entries)=>
        {
            console.log("Hi" + req.session.user.ID);
            console.log("I don't know" + entries.first_name);
            res.locals.fname = entries.first_name;
        })
        console.log("YAAAAAAAAY TKTKTKTKTKTKTK" + res.locals.fname);


        badhtml = `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!--<link rel="stylesheet" href="stylesheets/clogin.css" >-->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style id="custom-cursor" type="text/css"></style>
    <title>Document</title>
    <style>
      body
      {
        background-color: rgb(61, 61, 61);
      }
      .container-lg
      {
        margin-top: 5px;
        margin-bottom: 20px;
      }
      .input-group
      {
        padding-top: 20px;
        padding-bottom: 20px;
      }
    </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

    <div class="container-lg" style="margin-top: 40px;">
      <div class="row justify-content-center">
      <div class="col-lg-8">
      <div class="card card-custom">
        <div class="card-header" style="background-color: rgb(191, 189, 189);">
          <h1>Edit profile</h1>
        </div>
        <div class="card-body" style="background-color: rgb(128, 128, 128);">
          <form action="/student_details" method="POST" autocomplete="on">
              <div class="form-group" id="dgroup">
                <label for="fname">First name:</label><br>
                <div class="input-group">
                  <input type="text" id="fname" name="fname" class="form-control" required><br>
                </div>
                <label for="lname">Last name:</label><br>
                <div class="input-group">
                <input type="text" id="lname" name="lname" class="form-control" required><br>
                </div>
                <label for="college">College:</label><br>
                <div class="input-group">
                <input type="text" id="college" name="college" class="form-control" required><br>
                </div>
                <label for="pstatus">Placement Status:</label><br>
                <div class="input-group">
                <input type="text" id="pstatus" name="pstatus" value="Not Placed" readonly class="form-control" required><br>
                </div>
                <div class="row">
                  <div class="col-4">
                  <label for="gradyear">Batch:</label><br>
                    <div class="input-group">
                    <input type="number" id="gradyear" name="gradyear" class="form-control" required><br>
                    </div>
                  </div>
                  <div class="col-4">
                    <label for="GPA">GPA:</label><br>
                    <div class="input-group">
                    <input type="number" id="GPA" name="GPA" class="form-control" step="0.01" required><br>
                    </div>
                  </div>
                  <div class="col-4">
                    <label for="DSAscore">DSA score:</label><br>
                    <div class="input-group">
                    <input type="number" id="DSAscore" name="DSAscore" class="form-control" required><br>
                    </div>
                  </div>
                </div> <!--row-->
                <label for="language">Languages: </label><br>
                <div class="input-group">
                  <input type="text" id="language" name="language" required multiple> 
                </div>              
                </div>
                <label for="iexp">internship experience(optional):</label><br> 
                <div class="input-group">
                  <input type="text" id="iexp" name="iexp" multiple> 
                </div>
                <label for="resume">Resume: </label>
                <input type="file" id="resume" name="resume" value="resume">
                <button type="submit" value="Continue">Continue</button>
                
              </form>
            </div>
          </div>
      </div>
    </div>
    </div>
    </div>
    <br></br>
    
</body>
</html>
        `
        res.send(badhtml);
    })

    app.post("/:sid/edit_profile",  async(req, res) =>
    {
        
        sql = "UPDATE details SET first_name = ?, last_name = ?, college = ?, pstatus = ?, gradyear = ?, GPA = ?, DSAScore = ? WHERE dID = ?;" 
        db.run(sql, [req.body.fname, req.body.lname, req.body.college, req.body.pstatus, req.body.gradyear, req.body.GPA, req.body.DSAscore, req.session.user.ID])
        res.redirect('/' + req.session.user.ID + '/student_profile');
    })

    app.get("/admin_login", async(req, res,) =>
        {
            res.render('admin_login', { message : ''});
            dbfunc.runAdminQuery();
    
        })
    
    
            
    app.post("/admin_login", async(req, res,) =>
        {
            sqlu = "SELECT * FROM admin WHERE email = ?"
            db.get(sqlu, [req.body.email],(err, admin)=>
            {
                if(err)
                {
                    return console.error(err.message)
                }
    
                if(!admin) //email is not found in database
                {
                    res.render('admin_login', { message: 'The email is incorrect or does not exist'})
                }
    
                bcrypt.compare(req.body.password, admin.password, (err, isMatch) => 
                {
                    console.log(req.body.password)
                    console.log(admin.password)
                    console.log(isMatch)
                    if(!isMatch)
                    {
                        return res.render('admin_login', { message: 'The password is incorrect or does not exist'})
                    }
                    else
                    {
                        req.session.user = admin;
                        res.redirect('/' + req.session.user.ID + '/admin_menu');
                    }
                })
            }) 
        })
    
    app.get("/admin_signup", async(req, res,) =>
        {
            res.render('admin_signup', { message : ''});
        })
    
    
    app.post("/admin_signup", async(req, res,) =>
        {
        
        //Check to see whether or not email already exists
        copymail = "SELECT email FROM admin WHERE email = ?"
        db.get(copymail, [req.body.email], (err, email2) => {
            if (err) {
              console.error(err.message);
              return res.render('admin_signup', { message: 'An error occurred. Please try again later.' });
            }
    
            if(req.body.email === email2) // throw an error. cannot read property username of undefined
            {
               return res.render('admin_signup', {message: 'The specified account already exists'})
            } 
        
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        dbfunc.runAdminQuery();
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
    
        })
    
    
        //
        const pass1 = req.body.password.trim();
        console.log("P1: " + pass1);
        const pass2 = req.body.repassword.trim();
        console.log("P2: " + pass2);
        if(pass1 != pass2)
        {
            return res.render('admin_signup', {message: "Passwords don't match. Try again."});
        }
    
      
    
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(pass1, salt);
        console.log("salt: " + salt);
        console.log("hash: " + hash);
    
     
        sql = 'INSERT INTO admin(first_name, last_name, email, password, number, Company, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.run(sql,[req.body.fname, req.body.lname, req.body.email, hash, req.body.number, req.body.company, "admin"],(err)=>{ 
            if (err) return console.error(err.message);
            return res.render('admin_signup', { message: 'An error occurred while creating the account.' });
        })
            
    
            res.redirect('/admin_login');
        })
        
    app.get("/:aid/admin_menu", async(req, res,) =>
        {
            res.render('admin_menu', {id: req.session.user.ID});
        })
        
    
    
    //
    //        
    app.get("/:aid/admin_menu/manage_students", async(req, res) =>
    {
        let html = heading('Manage Students');
        let subhtml = ``;
        
        html += '<table class="table table-bordered" style="margin-bottom: 60px" border="1"><tr><th>ID</th><th>first</th><th>last</th><th>college</th><th>status</th><th>batch</th><th>GPA</th><th>DSA</th><th>email</th>';
        sqlu = "SELECT * FROM students JOIN details on students.ID = details.dID"


        db.all(sqlu, [], (err, entries)=>
        {
            if (err) {
                console.error('Error fetching data from the database', err);
                return res.status(500).send('Server error'); //edit this lateer
              }

            for(let i = 0; i < entries.length; i++)
            {
                subhtml += `<tr>
                <td id = "IIDD">${entries[i].ID}</td>
                <td>${entries[i].first_name}</td>
                <td>${entries[i].last_name}</td>
                <td>${entries[i].college}</td>
                <td><select name="status" id="status">
                    <option value = "not placed">not placed</option>
                    <option value = "placed">placed</option>
                </select></td>
                <td>${entries[i].pstatus}</td>
                <td>${entries[i].gradyear}</td>
                <td>${entries[i].GPA}</td>
                <td>${entries[i].DSAscore}</td>
                <td>${entries[i].email}</td>
                <td><a class="btn btn-danger" href="/${req.session.user.ID}/admin_menu/manage_students/${entries[i].ID}/student_profile" role="button">See profile</a></td>
                </tr>`
            }
            html += `<form action="/${req.params.aid}/admin_menu/manage_students" method="POST" autocomplete="on">
                ${subhtml}
            </form>`
            

            html += `<script>
            
               

                function changeRes(event)
                {
                    const iidd = event.target.closest('tr').childNodes
                    return iidd[1].innerText;
                }


         
                document.addEventListener('DOMContentLoaded', function() {
                    console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr")
                    const statusElements = document.querySelectorAll('select[name="status"]'); // Select all status dropdowns
                    statusElements.forEach(status => {
                        status.addEventListener('change', function(event)
                        {
                            const newlem = changeRes(event);
                            const status = document.getElementById("status");
                            console.log("A---------------------" + status)
                            fetch(\`/${req.params.aid}/admin_menu/manage_students\`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json' // Add this header to tell the server we're sending JSON
                                    },
                                    body: JSON.stringify({newlem: newlem, pstatus: event.target.value})
                                }
                            )
                            
                        }); // Listen for 'change' events
                        
                    });
                });
            </script>`;


        

            html += '</table>';


            res.send(html); //This sends the html as a response so you don't have to put anything on the manage_students page
        })


    });

    app.post("/:aid/admin_menu/manage_students", async(req, res) =>
        {
            const newlem = req.body.newlem;
            const pstatus = req.body.pstatus;
            console.log('Received newlem:', newlem);
            console.log("REQ BODY NEWSTATUS: ", req.body.pstatus);
            res.json({ message: 'Successfully received newlem', newlemReceived: newlem });
            sql = "UPDATE details SET pstatus = ? WHERE dID = ?";
            db.run(sql, [req.body.pstatus, req.body.newlem]) 
            /*setTimeout(() => 
            {
                delql = "DELETE FROM admin WHERE status = ? OR status = ?";
            }, 1000 * 60 * 60 * 24) */
        });
    

    app.get("/admin_menu/manage_students/delete_student/:id", async(req, res) =>
    {
        res.render("delete_student", {id: req.params.id})
    })

    app.post("/admin_menu/manage_students/delete_student/:id", async(req, res) =>
    {
        res.redirect('/admin_menu/manage_students');
    })


    //Manage jobs

    app.get("/:aid/admin_menu/manage_jobs", async (req, res) => {
        // Start building the HTML string
        let html = heading('Manage Jobs');
        html += `<a class="btn" href="/${req.session.user.ID}/admin_menu" role="button" style="width:15px; height:20px; font-color: black;">Menu</a>`;
    
        const sqlu = "SELECT * FROM jobs"; // Query to get all jobs
    
            // Add style to the page
            html += `
                <style>
                    .container {
                        padding-top: 30px;
                    }
                    .col-sm-4 {
                        margin-top: 5px;
                        margin-bottom: 5px;
                    }
                    p {
                        font-color: red;
                    }
                    html {
                        height: 100%;
                        margin: 0;
                    }
                    body {
                        background-repeat: no-repeat;
                        background-color: rgb(78, 255, 246);
                        background-image: cover;
                    }
                </style>
            `;
    
            // Add "Add Job" button
            html += `
                <div class="container">
                    <div class="d-flex justify-content-end">
                        <a class="btn btn-primary" href="/${req.params.aid}/admin_menu/add_job" role="button" style="position: static; font-size: 15px; padding: 15px 35px; width: 15px; height: 30px;">+ Add job</a>
                    </div>
                </div>
            `;

            const sql = "SELECT * FROM jobs WHERE cID = ?";
            const jobProm = await new Promise((resolve, reject) => {
                db.all(sql, [req.params.aid], (err, rows) => {
                    if (err) {
                        console.error('Error fetching admin data for rows', rows, err);
                        return reject(err); // Reject if error
                    }
                    resolve(rows); // Resolve with admin data
                    console.log("ROWS INNIE " + rows)
                });
            });
    
            
            for(let i = 0; i < jobProm.length; i++)
            {
                html += `
                <div class="container">
                    <div class="row">
                        <div class="col-sm">
                            <div class="card" style="background-color: rgb(238, 224, 171)">
                                <form action="/" method="POST">
                                    <ul class="list-group list-group-flush">
                                        <div class="card-body">
                                            <h2 class="card-title">${jobProm[i].title}</h2>
                                            <h4 class="card-subtitle mb-2 text-muted">${jobProm[i].company}</h4>
                                            <b>Skills: </b>
                                            <p>${jobProm[i].skills}</p>
                                            <b>Description: </b>
                                            <p>${jobProm[i].description}</p>
                                        </div>
                                    </ul>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }
    
            html += "</body>";
            res.send(html); 
    });

    app.get("/:aid/admin_menu/add_job", async(req, res) =>
    {
        res.render('add_job', {id: req.session.user.ID});
    })

    app.post("/:aid/admin_menu/add_job", async(req, res) =>
    {
        //Get the Company_Name here

        getCompany = "SELECT Company FROM admin WHERE ID = ?";
        const testEntry = await new Promise((resolve, reject)=>
        {
            db.all(getCompany, [req.params.aid], (err, results)=>
            {
                if (err) {
                    console.error('Error fetching jobs data from the database', err);
                    return reject(err); // Reject if error
                }
                resolve(results); // Resolve with job entries   
            });
        })
        

        console.log("ADD THE JOB" + testEntry)
        console.log(testEntry.length)
        console.log("ADD THE JOB" + testEntry[0])
        console.log("ADD THE JOB" + testEntry[0].Company)
        insertInfo = "INSERT INTO jobs (cID, title, company, skills, description) VALUES (?, ?, ?, ?, ?)"
        db.run(insertInfo, [req.params.aid, req.body.Title, testEntry[0].Company, req.body.skills, req.body.description])
        res.redirect('/' + req.session.user.ID + '/admin_menu/manage_jobs');
    })

app.listen(8080);
