import { useState } from "react";
import { GamePage } from "./pages/GamePage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return <GamePage onLogout={() => setIsLoggedIn(false)} />;
}
