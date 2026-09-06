import express from "express";
import cors from "cors";
import schemadesign from "./type";
import {gitdetails} from "./scrapper/github"
import prisma from "./db";
import axios from "axios";
const apiKey = process.env.CHATGPT_API;


const app = express();
app.use(express.json());

const sessionConfig = JSON.stringify({
    Session : {
        type : "realtime" ,
        model : "gpt-realtime-2.1",
        audio:{
            output:{
                voice : "marin",
            },
        },
    },
});



app.use(cors());
app.post("/api/v1/pre-interview", async (req, res) => {
    const { data, success, error } = schemadesign.safeParse(req.body);
    if (!success) {
        console.log(error.issues); 
        res.status(401).json({ message: "invalid link" });
        return;
    }

    const gitlink =  new URL(data.gitlink) ;
    const username: string = gitlink.pathname.split("/").filter(Boolean)[0] ?? "";

    try{
        const userdetails = await gitdetails(username);
        const newinterview = await prisma.interview.create({
            data:{
                githubData : userdetails
            }
        })
        
        res.status(201).json({message : "got the request " , id : newinterview.id});
        

    }
    catch(error){
        res.status(401).json({message : "Something went wrong "  });
        return ;
    }
    

    

});


app.post("/token" , async(req,res)=>{
    try{
        const response = await axios.post("https://api.openai.com/v1/realtime/client_secrets" , sessionConfig , {
            headers : {
                Authorization : `Bearer ${apiKey}`, 
                "Content-Type": "application/json",
                "OpenAI-Safety-Identifier": "hashed-user-id"
            },
        })
        
        const data = response.data;
        res.json(data);
    }
    catch(error){
        console.error("Token generation error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});




app.listen(3001, () => console.log("Backend running on port 3001"));