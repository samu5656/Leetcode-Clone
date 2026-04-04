import { useParams } from "react-router-dom";
import problems from "../components/mock/problems.js";

export default function ProblemDetail() {
  const { id } = useParams();

  const problem = problems.find(p => p.id === Number(id));

  if (!problem) {
    return <div className="text-white p-10">Problem not found</div>;
  }

  return (
    <div className="h-screen flex bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">

      {/* LEFT SIDE - DESCRIPTION */}
      <div className="w-1/2 p-6 border-r border-[var(--border-line)] overflow-y-auto">
        
        <h1 className="text-2xl font-bold mb-4">
          {problem.title}
        </h1>

        <p className="mb-4" style={{ color: 'var(--text-sub)' }}>
          This is a sample problem description. Later you will fetch real data from backend.
        </p>

        <p className="font-semibold">
          Difficulty: {problem.difficulty}
        </p>

      </div>

      {/* RIGHT SIDE - CODE EDITOR */}
      <div className="w-1/2 p-6 flex flex-col">

        <textarea
          className="flex-1 bg-[var(--bg-header-start)] border border-[var(--border-line)] p-4 rounded font-mono text-sm outline-none transition-colors duration-300"
          style={{ color: 'var(--text-main)' }}
          placeholder="// Write your code here..."
        />

        <button className="mt-4 bg-green-500 py-2 rounded hover:bg-green-600">
          Run Code
        </button>

      </div>

    </div>
  );
}