
import "../styles/globals.css"
import { BrowserRouter, Routes, Route } from "react-router"
import { Toaster } from "sonner";

import { Interviewsetup } from "./pages/Interviewsetup";
import { Landing } from "./pages/Landing";
import { Interview } from "./pages/interview";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing></Landing>}/>
        <Route path="/interviewsetup" element={<Interviewsetup />} />
        <Route path="/interview/:id" element={<Interview></Interview>}/>
        
      </Routes>
      <Toaster richColors  />
    </BrowserRouter>
  );
}

export default App;
