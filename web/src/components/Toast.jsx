import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X, Sparkles } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <Sparkles size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
};

const COLORS = {
  success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/40",
  error: "text-red-400 bg-red-500/10 border-red-500/40",
  info: "text-blue-400 bg-blue-500/10 border-blue-500/40",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/40",
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-sm ${
        COLORS[toast.type] || COLORS.info
      } ${exiting ? "toast-exit" : "toast-enter"}`}
    >
      <span className="mt-0.5 flex-shrink-0">
        {ICONS[toast.type] || ICONS.info}
      </span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
