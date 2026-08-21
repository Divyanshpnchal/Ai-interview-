import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export function Landing(){
    const navigate = useNavigate();

    function onhandle(){
        navigate('/interviewsetup');
    }

    return (
        <div className="h-screen w-screen flex justify-center items-center">
            <div className=" p-4">
                <h1 className='text-3xl font-extrabold text-balance md:text-4xl text-center p-2 '>AI INTERVIEWER</h1>
                <div className='text-lg font-semibold'>Practice interviews with an AI interviewer</div>
                <Button onClick={onhandle}  className=" w-full">Start Interview</Button>
            </div>
        </div>
    );
}