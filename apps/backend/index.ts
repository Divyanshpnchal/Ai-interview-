import express from "express";
import cors from "cors";
import schemadesign from "./type";
import {gitdetails} from "./scrapper/github"
import prisma from "./db";
import axios from "axios";
const apiKey = process.env.CHATGPT_API;


const app = express();
app.use(express.json());





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


app.post("/api/v1/session/:interviewId" , async(req,res)=>{
    
    try{
        const interviewId = Number(req.params.interviewId);
        const interview = await prisma.interview.findUnique({
            where : {id : interviewId},
        })
        if(!interview){
            res.status(401).json({
                message:"interview not found"
            })
            return ;    
        }

        const sessionConfig = JSON.stringify({
            session : {
                type : "realtime" ,
                model : "gpt-realtime-2.1",
                audio:{
                    output:{
                        voice : "marin",
                    },
                }, 
                instructions: `You are an interview assistant. 
                Use the following GitHub profile data to ask technical questions:
                ${JSON.stringify(interview, null, 2)}`
            },
        });        

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





app.post("/api/v1/message/:interviewId" ,async (req,res)=>{

    try{
        const interviewId = Number(req.params.interviewId);
        const {type , content} = req.body;

        const message = await prisma.message.create({
            data: {
                interviewID: interviewId,
                type: type,
                content: content,
            },
        });

        res.status(201).json({
            message: "saved", data: message
        })

    }
    catch(error){
        res.status(401).json({
            message : "something went wrong"
        })
    }


})


app.post("/api/v1/deepgram-token" , async (req,res)=>{
    try{
        const response = await axios.post(
            "https://api.deepgram.com/v1/auth/grant",
            {},
            {headers:{Authorization:`Token ${process.env.DEEPGRAM_API_KEY}`}}

        )

        res.json(response.data);
    }
    catch(error:any){
        console.error("DEEPGRAM ERROR DETAILS:", error.response?.data, error.response?.status);
        res.status(500).json({ message : "problem with deepgram" });
        }



})

app.patch("/api/v1/interview/:id/end" , (req , res)=>{

    try{
        const id = Number(req.params.id);
        const interview = prisma.interview.update({
            where : {id : id},
            data : {status:"Done"}
        })

        res.json({
            message : "ended",
            interview
        })

    }
    catch(error){
        console.error("problem with ending the interview" , error);
        res.status(500).json("Could not end interview")
    }


})

app.listen(3001, () => console.log("Backend running on port 3001"));