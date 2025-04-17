"use client";

import { useState } from "react";
import { loginUser } from "@/lib/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "../app/store/userSlice";
import '@/styles/AuthForm.module.css'

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      const user = await loginUser(email, password);

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      };

      dispatch(setUser(userData));
    } catch (err) {
      setError("Неверный email или пароль.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-black">
        <h1 className="text-2xl font-bold mb-4 text-center">Вход</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Войти
        </button>
      </div>
    </div>
  );
}
