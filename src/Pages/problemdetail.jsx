import { useParams } from "react-router-dom";
import problems from "../components/mock/problems.js";

export default function ProblemDetail() {
  const { id } = useParams();

  const problem = problems.find(p => p.id === Number(id));

  if (!problem) {
    return <div className="text-white p-10">Problem not found</div>;
  }

  return (
    <div className="h-screen flex bg-[#0b1220] text-white">

      {/* LEFT SIDE - DESCRIPTION */}
      <div className="w-1/2 p-6 border-r border-gray-700 overflow-y-auto">
        
        <h1 className="text-2xl font-bold mb-4">
          {problem.title}
        </h1>

        <p className="text-gray-300 mb-4">
          This is a sample problem description. Later you will fetch real data from backend.
        </p>

        <p className="font-semibold">
          Difficulty: {problem.difficulty}
        </p>

      </div>

      {/* RIGHT SIDE - CODE EDITOR */}
      <div className="w-1/2 p-6 flex flex-col">

        <textarea
          className="flex-1 bg-black text-green-400 p-4 rounded font-mono text-sm outline-none"
          placeholder="// Write your code here..."
        />

        <button className="mt-4 bg-green-500 py-2 rounded hover:bg-green-600">
          Run Code
        </button>

      </div>

    </div>
  );
}