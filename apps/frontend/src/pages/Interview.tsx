import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router";





export function Interview() {
    
    const audioelement = useRef<null| HTMLAudioElement>(null);
    const peerconnection = useRef<null| RTCPeerConnection>(null);
    
    //getuserid 
    const{id} = useParams<{id : string}>()


    //step1 : get the token 
    async function fetchtoken(){
        try{
            const response = await axios.post(`/api/v1/session/${id}`);
            const data = response.data;
            return data.value ;

        }
        catch(error){
            console.error("error while getting the token" , error );
        }
    }

    //step 2 : 
    async function startconnection(){
        const ephemeralKey = await fetchtoken();
        const pc = new RTCPeerConnection();
        peerconnection.current = pc ;

        //receiving the audio track 
        pc.ontrack = async (event)=>{
            const mediastream = event.streams[0];
            if(mediastream && audioelement.current){
                audioelement.current.srcObject = mediastream ;
            }
        }

        // send audio
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        const track = stream.getTracks()[0];
        if(track){
            pc.addTrack(track ,stream);
        }
       
        //create a channel to send data like text json etc 
        const dc = pc.createDataChannel("oai-channel") //this parameter is just a name for the channel there can be multiple channel so to recognise 


        //send sdp 
        const offer = await pc.createOffer(); //generates an SDP
        await pc.setLocalDescription(offer);  //tells your browser: “Here’s what I want to send.”
        
        //send the actual sdp
        const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
        },
        });        
        

        const answer: RTCSessionDescriptionInit = {
        type: "answer", 
        sdp: await sdpResponse.text(),
        };

        await pc.setRemoteDescription(answer);


        //Step 7 (separate, comes after connection is live): sending/listening to events
        dc.addEventListener("message" , (e)=>{
            const data = JSON.parse(e.data);
            console.log(data);
        })


        
    }

    useEffect(()=>{
        startconnection();
    },[])

  return (
    <div>
      <h1>INTERVIEW IS STARTING</h1>
      <audio ref={audioelement}></audio>
    </div>
  );
}
