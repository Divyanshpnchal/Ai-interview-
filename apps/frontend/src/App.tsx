
import "../styles/globals.css"
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";


export function App() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div>
        <Input></Input>
        <Input></Input>
        <Button>Start Interview</Button>
      </div>
    </div>
  );
}

export default App;
