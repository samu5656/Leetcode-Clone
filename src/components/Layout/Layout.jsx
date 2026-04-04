import Navbar from "./Navbar.jsx";

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-[#0b1220]">
        {children}
      </div>
    </>
  );
}