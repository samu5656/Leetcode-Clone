import problems from "../components/mock/problems.js";
import { useNavigate } from "react-router-dom";
export default function Problems() {

    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#0b1220] text-white px-6 py-10">

            <h1 className="text-3xl font-bold mb-6">
                Problems
            </h1>

            <div className="overflow-x-auto">
                <table className="w-full border border-gray-700 rounded-lg overflow-hidden">

                    <thead className="bg-[#1f2937] text-left">
                        <tr>
                            <th className="p-4">#</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Difficulty</th>
                        </tr>
                    </thead>

                    <tbody>
                        {problems.map((problem, index) => (
                            <tr
                                key={problem.id}
                                onClick={() => navigate(`/problems/${problem.id}`)}
                                className="border-t border-gray-700 hover:bg-[#1f2937] cursor-pointer"
                            >
                                <td className="p-4">{index + 1}</td>

                                <td className="p-4">{problem.title}</td>

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