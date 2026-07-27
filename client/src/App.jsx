import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout      from "./components/Layout";
import Dashboard   from "./pages/Dashboard";
import StockDetail from "./pages/StockDetail";
import Watchlist   from "./pages/Watchlist";
import Portfolio   from "./pages/Portfolio";
import Alerts      from "./pages/Alerts";
import Compare     from "./pages/Compare";
import Market      from "./pages/Market";
import StockQA     from "./pages/StockQA";
import Psychology  from "./pages/Psychology";
import Login       from "./pages/auth/Login";
import Register    from "./pages/auth/Register";
import { Flame } from "lucide-react";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--k-bg)" }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
        style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-s))", boxShadow:"0 0 30px var(--k-p40)" }}>
        <Flame size={22} style={{ color:"var(--k-tx)" }}/>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i=>(
          <div key={i} className="w-2 h-2 rounded-full animate-bounce"
            style={{ background:"var(--k-p)", animationDelay:`${i*0.15}s` }}/>
        ))}
      </div>
    </div>
  </div>
);

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  return user ? children : <Navigate to="/auth/login" replace/>;
};
const GuestOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  return !user ? children : <Navigate to="/" replace/>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth/login"    element={<GuestOnly><Login/></GuestOnly>}/>
    <Route path="/auth/register" element={<GuestOnly><Register/></GuestOnly>}/>
    <Route path="/" element={<Protected><Layout/></Protected>}>
      <Route index               element={<Dashboard/>}/>
      <Route path="stock/:symbol" element={<StockDetail/>}/>
      <Route path="watchlist"    element={<Watchlist/>}/>
      <Route path="portfolio"    element={<Portfolio/>}/>
      <Route path="alerts"       element={<Alerts/>}/>
      <Route path="compare"      element={<Compare/>}/>
      <Route path="market"       element={<Market/>}/>
      <Route path="ask"          element={<StockQA/>}/>
      <Route path="psychology"   element={<Psychology/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes/>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "var(--k-b97)",
                backdropFilter: "blur(24px)",
                color: "var(--k-tx)",
                border: "1px solid var(--k-p25)",
                borderRadius: 12,
                fontSize: 14,
              },
              success: { iconTheme:{ primary:"#4ade80", secondary:"var(--k-bg)" } },
              error:   { iconTheme:{ primary:"#f87171", secondary:"var(--k-bg)" } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
