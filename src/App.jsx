import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Landing from "./Pages/Landing";
import Login from "./Pages/Login";
import Problems from "./Pages/problems";
import ProblemDetail from "./Pages/problemdetail";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;