import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Landing from "./Pages/Landing";
import Login from "./Pages/Login";
import Problems from "./Pages/problems";
import ProblemDetail from "./Pages/problemdetail";
import Profile from "./Pages/profile";
import Contests from "./Pages/contests";
import ContestDetail from "./Pages/contestdetail";
import Leaderboard from "./Pages/leaderboard";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:slug" element={<ProblemDetail />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/contests/:id" element={<ContestDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;