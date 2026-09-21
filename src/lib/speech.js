// Envoltorio delgado sobre la Web Speech API (dictado por voz).
// Soportado en Chrome/Edge de escritorio; en navegadores sin soporte,
// isSupported() devuelve false y la UI oculta el botón de micrófono.

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSupported() {
  return Boolean(SpeechRecognitionImpl);
}

export function createDictation({ onResult, onEnd, onError }) {
  if (!SpeechRecognitionImpl) return null;

  const recognition = new SpeechRecognitionImpl();
  recognition.lang = "es-EC";
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = "";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript + " ";
      } else {
        interim += transcript;
      }
    }
    onResult(finalText, interim);
  };

  recognition.onerror = (event) => onError?.(event.error);
  recognition.onend = () => onEnd?.(finalText);

  return {
    start: () => {
      finalText = "";
      recognition.start();
    },
    stop: () => recognition.stop(),
  };
}
