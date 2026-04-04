import problems from "../components/mock/problems.js";
import { useNavigate } from "react-router-dom";
export default function Problems() {

    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 transition-colors duration-300">

            <h1 className="text-3xl font-bold mb-6">
                Problems
            </h1>

            <div className="overflow-x-auto">
                <table className="w-full border border-[var(--border-line)] rounded-lg overflow-hidden shadow-lg">

                    <thead className="bg-[var(--bg-header-start)] text-[var(--text-sub)] text-left border-b border-[var(--border-line)]">
                        <tr>
                            <th className="p-4 border-r border-[var(--border-line)]">#</th>
                            <th className="p-4 border-r border-[var(--border-line)]">Title</th>
                            <th className="p-4">Difficulty</th>
                        </tr>
                    </thead>

                    <tbody>
                        {problems.map((problem, index) => (
                            <tr
                                key={problem.id}
                                onClick={() => navigate(`/problems/${problem.id}`)}
                                className="border-b border-[var(--border-line)] hover:bg-[var(--bg-alt)] cursor-pointer transition-colors duration-300"
                            >
                                <td className="p-4 font-semibold text-[var(--text-sub)] border-r border-[var(--border-line)]">{index + 1}</td>

                                <td className="p-4 font-medium border-r border-[var(--border-line)]" style={{ color: 'var(--text-main)' }}>{problem.title}</td>

                                <td
                                    className={`p-4 font-semibold ${problem.difficulty === "Easy"
                                            ? "text-green-400"
                                            : problem.difficulty === "Medium"
                                                ? "text-yellow-400"
                                                : "text-red-400"
                                        }`}
                                >
                                    {problem.difficulty}
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

        </div>
    );
}