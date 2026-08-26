import express from "express";
import cors from "cors";
import schemadesign from "./type";
import {gitdetails} from "./scrapper/github"

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
        res.status(201).json({message : "got the request " , userdetails});
    }
    catch(error){
        res.status(401).json({message : "Something went wrong "  });
        return ;
    }
    

    

});




app.listen(3001, () => console.log("Backend running on port 3001"));