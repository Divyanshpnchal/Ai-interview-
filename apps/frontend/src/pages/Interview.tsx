import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Orb } from "@/components/ui/orb";

const BACKEND_URL = process.env.BUN_PUBLIC_BACKEND_URL;

function useVolumeLevel(stream: MediaStream | null) {
    const volumeRef = useRef(0);

    useEffect(() => {
        if (!stream) return;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function update() {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const boosted = Math.min(1, (avg / 255) * 3);  // multiply by 3, clamp to 1
            volumeRef.current = boosted;
            requestAnimationFrame(update);
        }
        update();

        return () => { audioContext.close() };
    }, [stream]);

    return volumeRef;
}

export function Interview() {
    const navigate = useNavigate();
    const audioelement = useRef<null | HTMLAudioElement>(null);
    const peerconnection = useRef<null | RTCPeerConnection>(null);
    const deepgramsocket = useRef<null | WebSocket>(null);
    const hasStarted = useRef(false); // guards against StrictMode double-run / duplicate messages

    const [userStream, setUserStream] = useState<MediaStream | null>(null);
    const [aiStream, setAiStream] = useState<MediaStream | null>(null);
    const inputVolumeRef = useVolumeLevel(userStream);
    const outputVolumeRef = useVolumeLevel(aiStream);

    const { id } = useParams<{ id: string }>();

    async function fetchtoken() {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/session/${id}`);
            const data = response.data;
            return data.value;
        } catch (error) {
            console.error("error while getting the token", error);
        }
    }

    async function startconnection() {
        const ephemeralKey = await fetchtoken();
        const pc = new RTCPeerConnection();
        peerconnection.current = pc;

        pc.ontrack = async (event) => {
            console.log("TRACK RECEIVED", event);
            const mediastream = event.streams[0];
            if (mediastream) {
                setAiStream(mediastream);
                if (audioelement.current) {
                    audioelement.current.srcObject = mediastream;
                }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setUserStream(stream);
        const track = stream.getTracks()[0];
        if (track) {
            pc.addTrack(track, stream);
        }

        startTranscription(stream);

        const dc = pc.createDataChannel("oai-channel");

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

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

        dc.addEventListener("message", (e) => {
            const data = JSON.parse(e.data);

            if (data.type === "response.output_audio_transcript.done") {
                axios.post(`${BACKEND_URL}/api/v1/message/${id}`, {
                    type: "Assistant",
                    content: data.transcript,
                });
            }
        });
    }

    async function startTranscription(stream: MediaStream) {
        const token = await axios.post(`${BACKEND_URL}/api/v1/deepgram-token`);
        const dgkey = token.data.access_token;

        const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?punctuate=true`, ["bearer", dgkey]);
        deepgramsocket.current = socket;

        socket.onopen = () => {
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    socket.send(event.data);
                }
            };
            recorder.start(250);
        };

        socket.onerror = (err) => {
            console.log("DEEPGRAM SOCKET ERROR", err);
        };

        socket.onclose = (e) => {
            console.log("DEEPGRAM SOCKET CLOSED", e.code, e.reason);
        };

        socket.onmessage = (message) => {
            const received = JSON.parse(message.data.toString());
            const transcript = received.channel?.alternatives?.[0]?.transcript;

            if (transcript && received.is_final) {
                axios.post(`${BACKEND_URL}/api/v1/message/${id}`, {
                    type: "User",
                    content: transcript,
                });
            }
        };
    }

    async function endInterview() {
        peerconnection.current?.close();
        deepgramsocket.current?.close();

        await axios.patch(`${BACKEND_URL}/api/v1/interview/${id}/end`);

        
        navigate(`/result/${id}`);
    }

    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        startconnection();
    }, []);

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col">
            <div className="flex flex-1">
                {/* Left half - User */}
                <div className="flex-1 flex flex-col items-center justify-center border-r border-zinc-800">
                    <div className="w-64 h-64">
                        <Orb
                            volumeMode="manual"
                            getInputVolume={() => inputVolumeRef.current}
                            getOutputVolume={() => inputVolumeRef.current}
                            colors={["#4ADE80", "#22C55E"]}
                        />
                    </div>
                    <p className="mt-4 text-zinc-400 text-sm tracking-wide">YOU</p>
                </div>

                {/* Right half - AI */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-64 h-64">
                        <Orb
                            volumeMode="manual"
                            getInputVolume={() => outputVolumeRef.current}
                            getOutputVolume={() => outputVolumeRef.current}
                            colors={["#60A5FA", "#3B82F6"]}
                        />
                    </div>
                    <p className="mt-4 text-zinc-400 text-sm tracking-wide">AI INTERVIEWER</p>
                </div>
            </div>

            {/* Bottom - End button */}
            <div className="flex justify-center pb-10">
                <button
                    onClick={endInterview}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full font-medium transition-colors"
                >
                    End Interview
                </button>
            </div>

            <audio ref={audioelement} autoPlay></audio>
        </div>
    );
}
