import toast from "react-hot-toast";

export function textToAudio(text: string) {
  if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = 'pt-BR'; // Defina o idioma
      utterance.pitch = 1; // Tom
      utterance.rate = 1.6; // Velocidade
      utterance.volume = 1; // Volume

      synth.speak(utterance);
  } else {
      toast.error('Este navegador não suporta síntese de fala.');
  }
}
