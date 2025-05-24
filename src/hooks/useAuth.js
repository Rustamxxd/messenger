import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { auth, loginUser, registerUser, logoutUser } from "../lib/firebase";
import { setUser, logout as logoutAction } from "@/app/store/userSlice";

export function useAuthState() {
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setLocalUser(firebaseUser);
        dispatch(setUser(userData));
      } else {
        setLocalUser(null);
        dispatch(logoutAction());
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  return { user, loading };
}

export function useAuth() {
  const { user, loading } = useAuthState();
  const dispatch = useDispatch();

  const login = async (email, password) => {
    try {
      await loginUser(email, password);
      const currentUser = auth.currentUser;
      if (currentUser) {
        dispatch(setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        }));
      }
    } catch (error) {
      console.error("Ошибка при входе:", error);
    }
  };

  const register = async (email, password) => {
    try {
      await registerUser(email, password);
      const currentUser = auth.currentUser;
      if (currentUser) {
        dispatch(setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        }));
      }
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      dispatch(logoutAction());
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  return { user, loading, login, register, logout };
}