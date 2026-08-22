import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";


   const BACKEND_URL = import.meta.env.BUN_PUBLIC_BACKEND_URL;

export function Interviewsetup(){
    const [gitlink , setGitlink ] = useState("");
    const [Linkedin , setLinkedin ] = useState("");

    async function handleclick(){
        if(!gitlink  || !Linkedin ){
            toast.error("Please fill the fields")
            return ;
        }
        
        try{
            const responce = await axios.post(`${BACKEND_URL}/api/v1/pre-interview`)
            
        }   
        catch{
            
        }

        
    }
    
    return(
        
        <div className=" h-screen w-screen flex justify-center items-center">
            <div className="  ">
                <div><h2 className='text-3xl font-extrabold text-balance md:text-4xl text-center p-2 '>ENTER YOUR DETAILS</h2></div>
                <div><Input onChange={(e)=>setGitlink(e.target.value)} placeholder="Enter your Github profile link"></Input></div>
                <div><Input onChange={(e)=>setLinkedin(e.target.value)} placeholder="Enter you Linkedin profile link"></Input></div>
                <div><Button onClick={handleclick} className="w-full">CONTINUE</Button></div>    
            </div>
            
        </div>
    );
}