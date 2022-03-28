const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config()
const port = process.env.PORT || 5000;

const cors = require('cors');
// middleware setup 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// MY DATABASE
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.17kyq.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// mongodb client configuration
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
// //   client.close("Database Connected");
// });

async function run() {
    try {
        await client.connect();
        const studentCollection = client.db(process.env.DB_NAME).collection('students');
        const teacherCollection = client.db(process.env.DB_NAME).collection('teachers');
        const adminCollection = client.db(process.env.DB_NAME).collection('admins');
        const courseCollection = client.db(process.env.DB_NAME).collection('courses');
        const enrollCollection = client.db(process.env.DB_NAME).collection('enrolledCourse');
        const resultCollection = client.db(process.env.DB_NAME).collection('resultInfo');
        // create a document to insert
        console.log("................ANIK...............Database Connected to the server");

        /* ---admin api portion start from here ---*/

        // get all student 
        app.get('/admin/students', async (req, res) => {
            const cursor = studentCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        })

        // get all teacher
        app.get('/admin/teachers', async (req, res) => {
            const query = teacherCollection.find({});
            const showTeacher = await query.toArray();
            res.send(showTeacher);
        })

        // get all courses
        app.get('/admin/Courses', async (req, res) => {
            const cursor = courseCollection.find({});
            const allCourse = await cursor.toArray();
            res.send(allCourse);
        })

        // create course post api 
        app.post('/admin/createCourse', async (req, res) => {
            const course = req.body;
            const result = await courseCollection.insertOne(course);
            res.json(result);
        })

        // admin signup post method
        app.post('/admin/register', async (req, res) => {
            const admin = req.body;
            const result = await adminCollection.insertOne(admin);
            res.json(result);
        })


        // admin login post method
        app.post('/admin/signin', async (req, res) => {
            const { username, password } = req.body;
            // const user = adminCollection.find({ username, password });
            const query = adminCollection.find({ username, password });
            const cursor = await query.toArray();
            console.log(req.body);
            console.log(cursor);
            res.json(cursor);
        });

        // delete course (only for admin)
        app.delete('/admin/deleteCourse/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const deleteCourse = await courseCollection.deleteOne(query);
            res.json(deleteCourse);
        })

        // delete teacher (only for admin)
        app.delete('/admin/deleteTeacher/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const deleteTeacher = await teacherCollection.deleteOne(query);
            res.json(deleteTeacher);
        })

        // delete student (only for admin)
        app.delete('/admin/deleteStudent/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const deleteStudent = await studentCollection.deleteOne(query);
            res.json(deleteStudent);
        })

        /* --- admin api portion end here --- */



        /* --- student api portion start from here --- */

        // student signup post method
        app.post('/student/signup', async (req, res) => {
            const student = req.body;
            const query = { username: student.username };
            const findStudent = await studentCollection.findOne(query);
            if (findStudent === null) {
                const result = await studentCollection.insertOne(student);
                res.json(result);
            } else {
                const err = { msg: "Teacher already exists in database." }
                res.json(err);
            }
        })

        // student login post method
        app.post('/student/signin', async (req, res) => {
            const { username, password } = req.body;
            const query = studentCollection.find({ username: username, password: password });
            const searchStudentResult = await query.toArray();
            res.json(searchStudentResult);
        })

        // student course enroll
        app.post('/student/enrollCourse', async (req, res) => {
            const courses = req.body
            const query = await enrollCollection.findOne({ username: courses.username })
            const courseEnroll = await enrollCollection.insertOne(courses);
            console.log(courseEnroll);
            res.json(courseEnroll);
        })

        // student api
        app.get('/student/enroll', async (req, res) => {
            const user = req.query.username;
            const courseName = req.query.subject;
            const query = { username: user };
            let userInfo = await enrollCollection.findOne(query);

            if (!userInfo) {
                const query = { username: user };
                let result = await enrollCollection.findOne(query);
                console.log("user", user);
                res.send({ firstAdd: true, result });
            }
            else if (courseName && user) {
                const query = { username: user };
                let result = await enrollCollection.findOne(query);
                // console.log("user", user);
                console.log("Document", result.subject);
                console.log("Course Name", courseName);
                res.send(result.subject)
            }
            else if (user) {
                let result = await enrollCollection.findOne({ username: user });
                res.send(result);
                console.log(result);
            }
            console.log(userInfo);
        });

        // Student course update
        app.put('/student/enroll', async (req, res) => {

        })
        // Delete selected and confirm course
        app.delete('/student/enroll/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
        })

        // student result fetch using username
        app.get('/student/results', (req, res) => {
            const username = req.query.username
            resultCollection.find({ username: username })
                .toArray((err, document) => {
                    if (!err && document.length > 0) {
                        res.json({
                            data: document,
                            success: true
                        })
                    } else {
                        res.json({
                            data: 'nothing found',
                            success: false
                        })
                    }
                })
        })

        /* --- student api portion end here --- */



        /* --- teacher api portion start here --- */

        // teacher signup post method
        app.post('/teacher/signup', async (req, res) => {
            const teacher = req.body;
            const query = { username: teacher.username };
            const findTeacher = await teacherCollection.findOne(query);
            if (findTeacher === null) {
                const result = await teacherCollection.insertOne(teacher);
                res.json(result);
            } else {
                const err = { msg: "Teacher already exists in database." }
                res.json(err);
            }

        })

        // teacher login post method
        app.post('/teacher/signin', async (req, res) => {
            const { username, password } = req.body;
            const query = teacherCollection.find({ username: username, password: password })
            const result = await query.toArray();
            res.json(result);
        })

        // teacher assigned course 
        app.get('/teacher/course', (req, res) => {
            const assignedTeacher = req.query.name
            courseCollection.find({ assignedTeacher })
                .toArray((err, course) => {
                    if (!err) {
                        res.json({
                            data: course,
                            success: true
                        })
                    } else {
                        res.json({
                            data: err,
                            success: false
                        })
                    }
                })
        })

        // submit student mark 
        app.post('/teacher/grading', (req, res) => {
            const mark = req.body
            resultCollection.insertOne(mark)
                .then(result => {
                    if (result.insertedCount > 0) {
                        res.json({
                            data: mark,
                            success: true
                        })
                    } else {
                        res.json({
                            success: false
                        })
                    }
                })
        })

        // get all enrolled student for marking 
        app.get('/teacher/grading', (req, res) => {
            enrollCollection.find({})
                .toArray((err, document) => {
                    if (!err) {
                        res.json({
                            data: document,
                            success: true
                        })
                    } else {
                        res.json({
                            data: err,
                            success: false
                        })
                    }
                })
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

// root directory
app.get('/', (req, res) => {
    res.send("Online course selection server is running.......!");
});

app.listen(port, () => {
    console.log("Server listening at port: ", port);
});