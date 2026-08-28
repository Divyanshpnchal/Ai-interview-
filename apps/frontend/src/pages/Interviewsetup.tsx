import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router";


const BACKEND_URL = process.env.BUN_PUBLIC_BACKEND_URL;
const navigate =  useNavigate();


export function Interviewsetup(){
    const [gitlink , setGitlink ] = useState("");
    

    async function handleclick(){
        if(!gitlink.trim()){
            toast.error("Please fill the fields")
            return ;
        }
        try{
            const response = await axios.post(`${BACKEND_URL}/api/v1/pre-interview`,{
                gitlink: gitlink
                }
            )
            toast.success("Interview Created ");
            const userid = response.data.id ;
            navigate(`/interview/${userid}`);

        }
        catch(error){
            console.log(error);
            toast.error("Something went wrong ..")
        }


        
    }
    
    return(
        
        <div className=" h-screen w-screen flex justify-center items-center">
            <div className="  ">
                <div><h2 className='text-3xl font-extrabold text-balance md:text-4xl text-center p-2 '>ENTER YOUR DETAILS</h2></div>
                <div><Input onChange={(e)=>setGitlink(e.target.value)} placeholder="Enter your Github profile link"></Input></div>
                <div><Button onClick={handleclick} className="w-full">CONTINUE</Button></div>    
            </div>
            
        </div>
    );
}