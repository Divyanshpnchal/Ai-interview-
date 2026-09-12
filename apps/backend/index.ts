import express from "express";
import cors from "cors";
import schemadesign from "./type";
import {gitdetails} from "./scrapper/github"
import prisma from "./db";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import * as z from "zod";

const apiKey = process.env.CHATGPT_API;
const geminikey = process.env.GEMINI_API_KEY;

const app = express();
app.use(express.json());
const ai = new GoogleGenAI({});




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
                instructions: `You are conducting a live, spoken mock technical interview with a candidate. This is a voice conversation, not a text chat — keep your responses natural, conversational, and reasonably short, the way a real interviewer would speak out loud.

                CANDIDATE'S GITHUB PROJECTS:
                ${JSON.stringify(interview.githubData, null, 2)}

                YOUR ROLE:
                - Greet the candidate briefly and let them introduce themselves if they choose to.
                - Ask questions based on their real GitHub projects listed above — reference specific project names, technologies, or descriptions when relevant.
                - Ask one question at a time. Wait for their answer before moving to the next question.
                - Ask natural follow-up questions based on what they say, the way a real interviewer probes deeper into an interesting answer.
                - Mix in both technical depth questions (how something works, why they made a design choice, how they'd handle an edge case) and communication-style questions (explain a project simply, walk through your thought process).
                - Keep the tone friendly, encouraging, and professional — this should feel like a supportive practice interview, not an interrogation.
                - Do not ask the candidate to write or dictate actual code out loud — this is a spoken conversation, not a coding exercise. Focus on verbal explanation and reasoning instead.
                - If the candidate seems stuck, offer a small hint or rephrase the question rather than moving on abruptly.
                - Keep the interview to a reasonable length — aim for roughly 5-8 exchanged questions total before wrapping up naturally.
                - When wrapping up, thank them for their time and let them know the interview is complete.`
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


// when you whant to update a specific field then you use patch 
app.patch("/api/v1/interview/:id/end" ,async (req , res)=>{

    const scoreschema = {
        type: "object" as const,
        properties: {
            score: { type: "integer" as const },
            feedback: { type: "string" as const }
        },
        required: ["score", "feedback"] as string[]
    };

    try{
        const id = Number(req.params.id);


        const interaction = await prisma.interview.findUnique({
            where : {
                id : id 
            },
            include : {
                messages : {
                    orderBy : { createdAt: "asc" },
                }
            }


        })

        if(!interaction){
            res.status(404).json({ message: "Interview not found" });
            return ;
        }        
        

        const transcript = interaction?.messages
            .map((m) => `${m.type}: ${m.content}`)
            .join("\n");           
        
        
        const scoringSchema = z.fromJSONSchema(scoreschema);    

        const score = await ai.interactions.create({
            model : "gemini-3.8-flash",
            input : `You are evaluating a mock technical interview transcript. Score the candidate from 1-10 based on:- Technical depth and understanding shown in their answers - Clarity of communication - Whether they directly answered the questions asked - Use of specific, concrete examples from their real experience Give a single integer score (1-10) and 3-4 sentences of constructive feedback. this is the conversation ${transcript}`,
            response_format: {
                type: "text",
                mime_type: "application/json",
                schema: scoreschema
            },        
                    
        })
        if (!score.output_text) {
        throw new Error("No output_text returned from model");
        }        
        const result = scoringSchema.parse(JSON.parse(score.output_text)) as { score: number; feedback: string };
        console.log(result);
        const interview = await prisma.interview.update({
            where : {id : id},
            data : {status:"Done" , score : result.score , feedback : result.feedback}
        })

        res.json({
            message : "ended",
            interview ,
            result : result 
        })        


    }
    catch (error: any) {
        console.error("problem with ending the interview", error);
        if (error.status === 429) {
            res.status(429).json({ message: "Scoring is temporarily rate-limited. Please try again in a moment." });
            return;
        }
        res.status(500).json({ message: "Could not end interview" });
    }


})



// fetch the messages for the results 
app.get("/api/v1/result/:id" , async(req ,res)=>{
    try{
        const id = Number(req.params.id)
        const interview = await prisma.interview.findUnique({
            where: { id },
            select : {
                score : true,
                feedback : true ,
                messages : {
                    orderBy: { createdAt: "asc" },

                }
            }
        });
        if(!interview){
            res.status(404).json({ message: "Interview not found" });
            return ;
        }

        res.status(200).json(interview);


    }
    catch(error){
        console.error("something went wrong while fetching the interview messages " , error);
        res.status(500).json({
            message : "something went wrong while fetching the interview messages "
        })
    }

})



app.listen(3001, () => console.log("Backend running on port 3001"));