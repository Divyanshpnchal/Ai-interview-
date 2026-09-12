import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const BACKEND_URL = process.env.BUN_PUBLIC_BACKEND_URL;

type MessageType = {
    id: number;
    interviewID: number;
    type: string;
    content: string;
    createdAt: string;
};

export function Results() {
    const { id } = useParams<{ id: string }>();
    const [message, setMessage] = useState<MessageType[] | null>(null);
    const [score , setScore] = useState<number | null>(null);
    const [feedback , setFeedback] = useState<string | null>(null);

    async function fetchinterviewmessages() {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/v1/result/${id}`);
            const messages = response.data.messages;
            setMessage(messages);
            setScore(response.data.score);
            setFeedback(response.data.feedback);
        } catch (error) {
            console.error("something got wrong while fetching the messages", error);
        }
    }

    useEffect(() => {
        fetchinterviewmessages();
    }, []);

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col items-center overflow-hidden">
            <div className="w-full max-w-3xl flex flex-col flex-1 py-8 px-6 min-h-0">

                {/* Score + Feedback card */}
                <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                    {score === null && feedback === null ? (
                        <p className="text-zinc-500 text-sm">Scoring in progress...</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-semibold text-white">
                                    {score}
                                    <span className="text-base font-normal text-zinc-500">/10</span>
                                </span>
                                <span className="text-xs uppercase tracking-wide text-zinc-500">
                                    Interview Score
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-zinc-300">
                                {feedback}
                            </p>
                        </div>
                    )}
                </div>

                <h1 className="text-sm font-medium mb-6 text-zinc-500 uppercase tracking-wide">
                    Conversation
                </h1>

                <div className="custom-scrollbar flex-1 overflow-y-auto flex flex-col gap-6 pr-3 min-h-0">
                    {message === null && (
                        <p className="text-zinc-500 text-sm">Loading transcript...</p>
                    )}
                    {message?.map((m) => (
                        <Message key={m.id} content={m.content} type={m.type} />
                    ))}
                </div>
            </div>

            {/* Custom scrollbar styling - scoped to this page */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar {
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* old Edge/IE */
                }
            `}</style>
        </div>
    );
}

function Message(props: { content: string; type: string }) {
    const isUser = props.type === "User";

    const avatar = (
        <div
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? "bg-emerald-500" : "bg-indigo-600"
            }`}
        >
            {isUser ? (
                // simple user icon
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z" />
                </svg>
            ) : (
                // simple bot icon
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M12 2a2 2 0 0 1 2 2v1h2a3 3 0 0 1 3 3v2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v2a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-2H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a3 3 0 0 1 3-3h2V4a2 2 0 0 1 2-2ZM9 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                </svg>
            )}
        </div>
    );

    return (
        <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            {avatar}
            <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    isUser
                        ? "bg-zinc-100 text-black rounded-tr-sm"
                        : "bg-zinc-900 text-zinc-100 rounded-tl-sm"
                }`}
            >
                <p className="text-sm leading-relaxed">{props.content}</p>
            </div>
        </div>
    );
}
