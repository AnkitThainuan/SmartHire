import { useEffect, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const VoicePracticePanel = ({ question, answer, setAnswer, onVoiceUsed, disabled = false }) => {
  const recognitionRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognition()));

    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const appendTranscript = (text) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    setAnswer((current) => `${current ? `${current} ` : ""}${cleaned}`.trim());
  };

  const startListening = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setStatus("Voice input is not available in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Listening");
      setInterimTranscript("");
      onVoiceUsed?.();
    };

    recognition.onerror = (event) => {
      setStatus(event.error === "not-allowed" ? "Microphone permission was blocked." : "Voice input paused.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      setStatus((current) => (current === "Listening" ? "Voice input stopped" : current));
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }

      appendTranscript(finalText);
      setInterimTranscript(interimText.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setStatus("Voice input stopped");
  };

  const speakQuestion = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("Question playback is not available in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus("Reading question");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus("Question read aloud");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatus("Question playback stopped.");
    };
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setStatus("Question playback stopped");
    }
  };

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Voice practice</p>
          <p className="text-xs text-ink/60">{speechSupported ? status || "Ready" : "Speech input unavailable"}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={isSpeaking ? stopSpeaking : speakQuestion} className="btn-secondary" disabled={disabled}>
            {isSpeaking ? "Stop reading" : "Read question"}
          </button>
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={isListening ? "btn-primary" : "btn-signal"}
            disabled={disabled || !speechSupported}
          >
            {isListening ? "Stop voice" : "Start voice"}
          </button>
          <button
            type="button"
            onClick={() => setAnswer("")}
            className="btn-secondary"
            disabled={disabled || (!answer && !interimTranscript)}
          >
            Clear
          </button>
        </div>
      </div>

      {interimTranscript && (
        <p className="mt-4 rounded-md border border-signal/30 bg-signal/5 px-3 py-2 text-sm text-ink/70">
          {interimTranscript}
        </p>
      )}
    </section>
  );
};

export default VoicePracticePanel;
