"use client";

import { useSelector } from "react-redux";
import Auth from "@/components/AuthForm";
import Chat from "@/components/Chat";

export default function Home() {
  const user = useSelector((state) => state.user.data);
  return user ? <Chat /> : <Auth />;
}
