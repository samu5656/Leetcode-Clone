import { useState } from "react";
import { Plus, ChevronUp } from "lucide-react";
import ContestForm from "./components/ContestForm";

export default function ContestsTab({ problems }) {
  const [showContestForm, setShowContestForm] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setShowContestForm(!showContestForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          {showContestForm ? <ChevronUp size={16} /> : <Plus size={16} />}
          {showContestForm ? "Cancel" : "Create Contest"}
        </button>
      </div>

      {showContestForm && (
        <ContestForm
          problems={problems}
          onCancel={() => setShowContestForm(false)}
          onSuccess={() => setShowContestForm(false)}
        />
      )}

      {!showContestForm && (
        <div className="border border-(--border-line) rounded-lg p-6 max-w-xl">
          <h3 className="font-medium mb-2 text-[var(--text-main)]">
            About Contests
          </h3>
          <p className="text-sm text-[var(--text-sub)] leading-relaxed">
            Create contests by selecting a start time, end time, and problems.
            Each problem can have a custom point value. Contests automatically
            become active when the start time is reached.
          </p>
        </div>
      )}
    </div>
  );
}
