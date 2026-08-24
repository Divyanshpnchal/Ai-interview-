import express from "express";


const app = express();
app.use(express.json());
app.listen(3001);

app.post("/api/v1/pre-interview" , (req,res)=>{
    res.status(201);
    return res.json({
        Message : "working "
    })
})


