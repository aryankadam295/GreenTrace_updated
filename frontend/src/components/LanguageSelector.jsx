import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "gu", label: "Gujarati" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "pa", label: "Punjabi" },
  { code: "ur", label: "Urdu" },
  { code: "or", label: "Odia" },
  { code: "as", label: "Assamese" },
  { code: "ne", label: "Nepali" },
  { code: "sa", label: "Sanskrit" },
  { code: "sd", label: "Sindhi" },
];

const TRANSLATE_COOKIE = "googtrans";

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
};

const setTranslateCookie = (languageCode) => {
  const value = `/en/${languageCode}`;
  document.cookie = `${TRANSLATE_COOKIE}=${value};path=/`;
  document.cookie = `${TRANSLATE_COOKIE}=${value};domain=${window.location.hostname};path=/`;
};

const clearTranslateCookie = () => {
  document.cookie = `${TRANSLATE_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  document.cookie = `${TRANSLATE_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=${window.location.hostname};path=/`;
};

const getCurrentLanguage = () => {
  const cookieValue = getCookie(TRANSLATE_COOKIE);
  const languageCode = cookieValue.split("/").filter(Boolean).pop();
  return languageCode || "en";
};

const dispatchGoogleTranslateChange = (languageCode) => {
  const combo = document.querySelector(".goog-te-combo");
  if (!combo) return false;

  combo.value = languageCode;
  combo.dispatchEvent(new Event("change"));
  return true;
};

const LanguageSelector = ({ compact = false }) => {
  const location = useLocation();
  const [language, setLanguage] = useState("en");

  const includedLanguages = useMemo(
    () => LANGUAGES.filter((item) => item.code !== "en").map((item) => item.code).join(","),
    []
  );

  useEffect(() => {
    setLanguage(getCurrentLanguage());

    if (!document.getElementById("google_translate_element")) {
      const translateRoot = document.createElement("div");
      translateRoot.id = "google_translate_element";
      translateRoot.className = "google-translate-widget";
      document.body.appendChild(translateRoot);
    }

    if (window.google?.translate?.TranslateElement) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const existingScript = document.querySelector(
      'script[src*="translate.google.com/translate_a/element.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [includedLanguages]);

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);

    if (nextLanguage === "en") {
      clearTranslateCookie();
      window.location.reload();
      return;
    }

    setTranslateCookie(nextLanguage);

    if (!dispatchGoogleTranslateChange(nextLanguage)) {
      window.location.reload();
    }
  };

  useEffect(() => {
    const currentLanguage = getCurrentLanguage();
    if (currentLanguage === "en") return;

    const timers = [300, 1000].map((delay) =>
      window.setTimeout(() => {
        dispatchGoogleTranslateChange(currentLanguage);
      }, delay)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [location.pathname, location.search]);

  return (
    <div className={`notranslate flex items-center gap-2 ${compact ? "w-full" : ""}`}>
      <label htmlFor={compact ? "mobile-language" : "language"} className="sr-only">
        Change language
      </label>
      <select
        id={compact ? "mobile-language" : "language"}
        value={language}
        onChange={handleLanguageChange}
        className={`rounded-md border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-900 shadow-sm outline-none transition hover:border-green-500 focus:border-green-600 focus:ring-2 focus:ring-green-100 ${
          compact ? "w-full" : "max-w-36"
        }`}
        title="Change language"
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
