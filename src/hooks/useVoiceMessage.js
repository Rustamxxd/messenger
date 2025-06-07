import { useState, useRef } from "react";

export const useVoiceMessage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const onStopCallbackRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        if (onStopCallbackRef.current) onStopCallbackRef.current(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Ошибка записи:", err);
    }
  };

  const stopRecording = (onStop) => {
    if (mediaRecorderRef.current?.state === "recording") {
      onStopCallbackRef.current = onStop;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setIsRecording(false);
    onStopCallbackRef.current = null;
  };

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    reset,
  };
};