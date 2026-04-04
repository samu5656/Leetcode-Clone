import { useNavigate } from "react-router-dom";
import bgimage from "../assets/code-landing.jpg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0b1220] text-white ">

      <div className="relative h-screen w-full">

        <img
          src={bgimage}
          alt="bg"
          className="absolute w-full h-full object-cover opacity-8"
        />

        <div className="absolute inset-0 bg-black/40"></div>

          <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-4">
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Ready to evolve your stack?
          </h1>

          <p className="text-gray-300 mb-6 max-w-xl">
            Practice DSA, compete in contests, and become a better developer.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 px-6 py-3 rounded hover:bg-orange-600"
            >
              Start Coding Now
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}