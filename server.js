const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
const authMiddleware = require('./authMiddleware');
const cookieparser = require('cookie-parser');
const app = express();
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieparser());
const db = mysql.createConnection({
    host:"localhost",
    user:'root',
    password:"yourpassword",
    database:"project1"

})

db.connect(err=>{
    if(err){
        console.log("Database Connection Error");

    }
    else{
        console.log("DataBase Connected");
    }
})
app.get("/",(req,res)=>{
    res.send("This is Home page")
})

app.post("/signup",async (req,res)=>{
    const {username,email,password} = req.body;
    if(!username || !email || !password){
        return res.status(400).json({success:false,message:"All fields are Required"});
    }

    const hashedpassword = await bcrypt.hash(password,10);
    const query = "INSERT INTO users (username,email,password) VALUES (?,?,?)";
    db.query(query,[username,email,hashedpassword],(err,result)=>{
        if(err){
           console.log("error: ",err);
           return res.send("Signup Failed");
        }
        return res.send("Signup Succesfull");
        
    })
    console.log("signup recieved : ");
    console.log(username,email,password);
})

app.post('/login',async (req,res)=>{
    const {email,password} = req.body;
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query,[email],async (err,result)=>{
        if(err){
            return res.json({success:false,message:"login failed"});

        }
        if(result.length === 0 ){
           return res.json({message:"USer Not Found"});
        }
        const user = result[0];
        const ismatch = await bcrypt.compare(password,user.password);
        if(ismatch){
            res.cookie("session-user", user.username, {
                httpOnly: false,
                secure: false,
                maxAge: 1000 * 60 * 60
            });

            return res.json({
                success:true,
                username:user.username,
                message:"Login Succesfull"
            });
        }
         return res.json({
            success: false,
            message: "Wrong username or password"
        });
    
    });
});
app.get("/dashboard",authMiddleware,(req,res)=>{
   res.json({
     success: true,
    username: req.username
   })
});
app.post("/logout",(req,res)=>{
    res.clearCookie("session-user");
    return res.json({success:true,message:"logged Out"});
})
app.get("/notes",authMiddleware,(req,res)=>{
    const username = req.username; 
    const query = "SELECT * FROM notes WHERE username = ?";
    db.query(query,[username],(err,result)=>{
        if(err){
            return res.json({success:false,message:"Database error"});
        }
        return res.json({
            success:true,
            username:username,
            notes:result
        })
    })
})


app.post("/notes",authMiddleware,(req,res)=>{
    console.log("POST /notes request received:", req.body);

    const username = req.username;
    const {title,content} = req.body;
     if (!title || !content) {
        return res.json({ success: false, message: "All fields required" });
    }
     const query = "INSERT INTO notes (username, title, content) VALUES (?, ?, ?)";
    db.query(query,[username,title,content],(err,result)=>{
        if(err){
            return res.json({
                success:false,
                message:"Database Error"
            })
        
        }
        return res.json({ success: true, message: "Note added successfully!" });
    })

})
app.delete("/notes/:id", authMiddleware, (req, res) => {
    const noteId = req.params.id;
    const username = req.username;

    const query = "DELETE FROM notes WHERE id = ? AND username = ?";
    db.query(query, [noteId, username], (err, result) => {
        if (err) {
            console.log("Delete Error:", err);
            return res.json({ success: false, message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.json({ success: false, message: "Unauthorized or not found" });
        }

        return res.json({ success: true, message: "Note deleted successfully" });
    });
});
app.put("/notes/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const username = req.username;

    if (!title || !content) {
        return res.json({ success: false, message: "All fields required" });
    }

    const query = "UPDATE notes SET title = ?, content = ? WHERE id = ? AND username = ?";
    db.query(query, [title, content, id, username], (err, result) => {
        if (err) return res.json({ success: false, message: "DB error" });
        res.json({ success: true, message: "Note Updated Successfully!" });
    });
});


app.listen(3000,()=>{
    console.log(`Server Running at port http://localhost:${3000}`);
});
