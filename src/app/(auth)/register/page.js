"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, registerUser } from "@/lib/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "@/app/store/userSlice";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import styles from "@/styles/LoginPage.module.css";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    if (!displayName) {
      setLoading(false);
      setError("Имя пользователя обязательно");
      return;
    }
  
    try {
      const user = await registerUser(email, password, displayName);
  
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || "",
      };
  
      dispatch(setUser(userData));
      router.push("/chat");
    } catch (err) {
      console.error("Ошибка при регистрации:", err);
      if (err.code === "auth/invalid-email") {
        setError("Неверный формат email.");
      } else if (err.code === "auth/weak-password") {
        setError("Пароль слишком слабый.");
      } else {
        setError("Ошибка при регистрации. Попробуйте снова.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Пользователь авторизован через Google:", user);

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      dispatch(setUser(userData));
      router.push("/chat");
    } catch (error) {
      console.error("Ошибка при регистрации через Google:", error);
      setError("Ошибка при регистрации через Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Регистрация</h1>
        {error && <p className={styles.errorMessage}>{error}</p>}

        <form onSubmit={handleRegister} className={styles.form}>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`${styles.button} ${loading ? styles.loading : ""}`}
          >
            {loading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
        </form>

        <div className={styles.switchToRegister}>
          <a href="/login" className={styles.registerLink}>
            Уже есть аккаунт? Войдите
          </a>
        </div>

        <button
          onClick={handleGoogleLogin}
          className={`${styles.button} ${styles.googleButton}`}
          disabled={googleLoading}
        >
          {googleLoading ? "Загрузка..." : (
            <>
              <img
                src="https://auth.openai.com/assets/google-logo-NePEveMl.svg"
                alt="Google"
                className={styles.googleIcon}
              />
              Продолжить с Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}