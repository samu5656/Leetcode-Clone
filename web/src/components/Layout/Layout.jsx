import Navbar from "./Navbar.jsx";

export default function Layout({ children }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="pt-16 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
        {children}
      </main>
    </>
  );
}