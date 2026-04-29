import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ImagePlus, Mic, Send, Store, Tractor, X } from 'lucide-react';
import { assistantAPI } from '../../utils/api';

const MAX_IMAGE_DIMENSION = 1280;
const MAX_IMAGE_FILE_SIZE = 4 * 1024 * 1024;

const AIAssistantWidget = ({ role = 'farmer' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimeoutRef = useRef(null);
  const transcriptRef = useRef('');

  const assistantName = useMemo(
    () => (role === 'merchant' ? 'VyaparMitra' : 'KrushiMitra'),
    [role]
  );
  const isMerchant = role === 'merchant';

  const welcomeText = useMemo(
    () =>
      isMerchant
        ? 'Namaste! I am VyaparMitra. Ask me about purchasing, pricing, order planning, or product evaluation.'
        : 'Namaste! I am KrushiMitra. Ask me about crops, disease prevention, irrigation, or selling strategy.',
    [isMerchant]
  );

  const visibleMessages =
    messages.length === 0
      ? [{ role: 'assistant', content: welcomeText }]
      : messages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, isListening, selectedImage]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const sendMessage = async (overrideText) => {
    const userText = typeof overrideText === 'string' ? overrideText.trim() : input.trim();
    if ((!userText && !selectedImage) || sending) return;
    const userMessage = {
      role: 'user',
      content: userText || 'Image uploaded for analysis.',
      imageUrl: selectedImage?.previewUrl || null,
      imageName: selectedImage?.name || null,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await assistantAPI.chat({
        message: userText,
        history: nextMessages.slice(-8),
        imageData: selectedImage?.data,
        imageMimeType: selectedImage?.mimeType,
      });

      const reply = response?.data?.reply || 'I could not generate a response right now.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setSelectedImage(null);
    } catch (error) {
      const providerDetail = error?.response?.data?.providerError;
      const errMessage =
        error?.response?.data?.message ||
        (providerDetail ? String(providerDetail) : '') ||
        'Assistant is temporarily unavailable. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMessage }]);
    } finally {
      setSending(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const onImagePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Please upload a valid image file.' },
      ]);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const image = new Image();
      image.onload = () => {
        const needsResize =
          file.size > MAX_IMAGE_FILE_SIZE ||
          image.width > MAX_IMAGE_DIMENSION ||
          image.height > MAX_IMAGE_DIMENSION;

        if (!needsResize) {
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          setSelectedImage({
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            data: base64,
            previewUrl: result,
          });
          return;
        }

        const scale = Math.min(
          1,
          MAX_IMAGE_DIMENSION / image.width,
          MAX_IMAGE_DIMENSION / image.height
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');

        if (!context) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Could not prepare this image. Please try another one.' },
          ]);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = optimizedDataUrl.split(',')[1] || '';

        setSelectedImage({
          name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
          mimeType: 'image/jpeg',
          data: base64,
          previewUrl: optimizedDataUrl,
        });
      };
      image.onerror = () => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'This image could not be read. Please try another file.' },
        ]);
      };
      image.src = result;
    };
    reader.onerror = () => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'The image could not be loaded from your device.' },
      ]);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const stopRecordedVoiceInput = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.stop();
    }
  };

  const transcribeRecordedAudio = async (audioBlob) => {
    try {
      const audioData = await blobToBase64(audioBlob);
      const response = await assistantAPI.transcribeAudio({
        audioData,
        audioMimeType: audioBlob.type || 'audio/webm',
      });
      const transcript = response?.data?.transcript?.trim();

      if (!transcript) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'No speech was detected. Try speaking a little closer to the microphone.' },
        ]);
        return;
      }

      setInput(transcript);
      setTimeout(() => {
        sendMessage(transcript);
      }, 100);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Voice input could not be transcribed. Please type your message and try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setIsListening(false);
    }
  };

  const startRecordedVoiceInput = async () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      stopRecordedVoiceInput();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Voice recording is not supported in this browser.' },
      ]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];

        if (audioBlob.size === 0) {
          setIsListening(false);
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'No audio was recorded. Please try again.' },
          ]);
          return;
        }

        transcribeRecordedAudio(audioBlob);
      };

      recorder.start();
      setIsListening(true);
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecordedVoiceInput();
      }, 12000);
    } catch (error) {
      setIsListening(false);
      const message =
        error?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow microphone access in the browser and try again.'
          : 'Could not access the microphone. Please check your browser permissions.';
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
    }
  };

  const startVoiceInput = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      stopRecordedVoiceInput();
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Voice input needs HTTPS or localhost to access the microphone.' },
      ]);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      startRecordedVoiceInput();
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    transcriptRef.current = '';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      if (mediaRecorderRef.current?.state === 'recording') {
        return;
      }
      setIsListening(false);
      const transcript = transcriptRef.current.trim();
      if (transcript) {
        setTimeout(() => {
          sendMessage(transcript);
        }, 150);
      }
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setIsListening(false);

      const errorMessages = {
        'audio-capture': 'No microphone was detected on this device.',
        'not-allowed': 'Microphone permission was denied. Allow microphone access in the browser and try again.',
        'service-not-allowed': 'This browser blocked speech recognition for this page.',
        'network': 'Browser speech recognition could not connect. Recording voice through the app instead...',
        'no-speech': 'No speech was detected. Try speaking a little closer to the microphone.',
        'aborted': 'Voice input was stopped.',
      };

      const message = errorMessages[event.error] || 'Voice input could not start. Please try again.';
      if (event.error === 'network') {
        setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
        startRecordedVoiceInput();
        return;
      }
      if (event.error !== 'aborted') {
        setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
      }
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();

      if (transcript) {
        transcriptRef.current = transcript;
        setInput(transcript);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2"
        aria-label={`Open ${assistantName}`}
        title={assistantName}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-xl transition-all duration-200 hover:shadow-2xl">
          {isOpen ? (
            <X size={22} />
          ) : isMerchant ? (
            <Store size={20} />
          ) : (
            <Tractor size={20} />
          )}
        </span>
        <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-800 shadow-sm">
          AI Assistance
        </span>
      </button>

      {isOpen && (
        <div className="fixed right-24 top-1/2 -translate-y-1/2 z-50 w-[420px] max-w-[calc(100vw-5rem)] h-[560px] bg-white border border-emerald-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-emerald-100 flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-100">
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Bot size={18} className="text-green-700" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{assistantName}</p>
              <p className="text-xs text-gray-600">{isMerchant ? 'Merchant AI Assistant' : 'Farmer AI Assistant'}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-green-50/30">
            {visibleMessages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[86%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-white border border-emerald-100 text-gray-900'
                  }`}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt={msg.imageName || 'Uploaded'}
                      className="mb-2 max-h-44 w-full rounded-lg object-cover"
                    />
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="text-xs text-gray-500 px-1">Thinking...</div>
            )}
            <div ref={endRef} />
          </div>

          {isListening && (
            <div className="px-4 pt-2 pb-1 border-t border-emerald-100 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-700 font-medium">Listening...</span>
                <div className="voice-wave">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="p-4 border-t border-emerald-100 flex gap-2 bg-white">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImagePick}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="h-11 w-11 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
              aria-label="Upload image"
              title="Upload image"
            >
              <ImagePlus size={16} />
            </button>
            <button
              type="button"
              onClick={startVoiceInput}
              className={`h-11 w-11 rounded-xl border flex items-center justify-center ${
                isListening
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Voice input"
              title="Voice input"
            >
              <Mic size={16} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${assistantName}...`}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || sending}
              className="h-11 w-11 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
          {selectedImage && (
            <div className="px-4 pb-3 bg-white">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                <img
                  src={selectedImage.previewUrl}
                  alt={selectedImage.name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-emerald-800">{selectedImage.name}</p>
                  <p className="text-xs text-emerald-700">Image ready to send</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        .voice-wave {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 14px;
        }
        .voice-wave span {
          width: 3px;
          border-radius: 3px;
          background: #059669;
          animation: voiceWave 1s ease-in-out infinite;
        }
        .voice-wave span:nth-child(1) { animation-delay: 0s; height: 6px; }
        .voice-wave span:nth-child(2) { animation-delay: 0.15s; height: 10px; }
        .voice-wave span:nth-child(3) { animation-delay: 0.3s; height: 14px; }
        .voice-wave span:nth-child(4) { animation-delay: 0.45s; height: 10px; }
        .voice-wave span:nth-child(5) { animation-delay: 0.6s; height: 6px; }
        @keyframes voiceWave {
          0%, 100% { transform: scaleY(0.55); opacity: 0.65; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AIAssistantWidget;
