import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Landing from "./Pages/Landing";
import Login from "./Pages/Login";
import Problems from "./Pages/problems";
import ProblemDetail from "./Pages/problemdetail";
import Profile from "./Pages/profile";
import Contests from "./Pages/contests";
import Leaderboard from "./Pages/leaderboard";
import Discuss from "./Pages/discuss";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/discuss" element={<Discuss />} />
      </Routes>
    </Layout>
  );
}

export default App;