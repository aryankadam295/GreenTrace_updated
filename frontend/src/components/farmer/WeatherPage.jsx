import { useEffect, useMemo, useState } from "react";

const LOCATION_BASE_URL = "https://www.india-location-hub.in/api/locations";
const OPEN_WEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const FALLBACK_LOCATION_DATA = {
  states: [
    { id: "AN", name: "Andaman and Nicobar Islands" },
    { id: "AP", name: "Andhra Pradesh" },
    { id: "AR", name: "Arunachal Pradesh" },
    { id: "AS", name: "Assam" },
    { id: "BR", name: "Bihar" },
    { id: "CH", name: "Chandigarh" },
    { id: "CT", name: "Chhattisgarh" },
    { id: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
    { id: "DL", name: "Delhi" },
    { id: "GA", name: "Goa" },
    { id: "GJ", name: "Gujarat" },
    { id: "HR", name: "Haryana" },
    { id: "HP", name: "Himachal Pradesh" },
    { id: "JK", name: "Jammu and Kashmir" },
    { id: "JH", name: "Jharkhand" },
    { id: "KA", name: "Karnataka" },
    { id: "KL", name: "Kerala" },
    { id: "LA", name: "Ladakh" },
    { id: "LD", name: "Lakshadweep" },
    { id: "MP", name: "Madhya Pradesh" },
    { id: "MH", name: "Maharashtra" },
    { id: "MN", name: "Manipur" },
    { id: "ML", name: "Meghalaya" },
    { id: "MZ", name: "Mizoram" },
    { id: "NL", name: "Nagaland" },
    { id: "OR", name: "Odisha" },
    { id: "PY", name: "Puducherry" },
    { id: "PB", name: "Punjab" },
    { id: "RJ", name: "Rajasthan" },
    { id: "SK", name: "Sikkim" },
    { id: "TN", name: "Tamil Nadu" },
    { id: "TS", name: "Telangana" },
    { id: "TR", name: "Tripura" },
    { id: "UP", name: "Uttar Pradesh" },
    { id: "UT", name: "Uttarakhand" },
    { id: "WB", name: "West Bengal" },
  ],
  districtsByState: {
    MH: [
      { id: "MH-Pune", name: "Pune" },
      { id: "MH-Satara", name: "Satara" },
      { id: "MH-Kolhapur", name: "Kolhapur" },
      { id: "MH-Nashik", name: "Nashik" },
      { id: "MH-Ahilyanagar", name: "Ahilyanagar" },
    ],
    UP: [
      { id: "UP-Lucknow", name: "Lucknow" },
      { id: "UP-Kanpur", name: "Kanpur Nagar" },
      { id: "UP-Varanasi", name: "Varanasi" },
      { id: "UP-Prayagraj", name: "Prayagraj" },
    ],
    RJ: [
      { id: "RJ-Jaipur", name: "Jaipur" },
      { id: "RJ-Udaipur", name: "Udaipur" },
      { id: "RJ-Jodhpur", name: "Jodhpur" },
      { id: "RJ-Kota", name: "Kota" },
    ],
    MP: [
      { id: "MP-Bhopal", name: "Bhopal" },
      { id: "MP-Indore", name: "Indore" },
      { id: "MP-Jabalpur", name: "Jabalpur" },
      { id: "MP-Gwalior", name: "Gwalior" },
    ],
    KA: [
      { id: "KA-Bengaluru", name: "Bengaluru Urban" },
      { id: "KA-Belagavi", name: "Belagavi" },
      { id: "KA-Mysuru", name: "Mysuru" },
      { id: "KA-Kalaburagi", name: "Kalaburagi" },
    ],
    GJ: [
      { id: "GJ-Ahmedabad", name: "Ahmedabad" },
      { id: "GJ-Surat", name: "Surat" },
      { id: "GJ-Rajkot", name: "Rajkot" },
      { id: "GJ-Vadodara", name: "Vadodara" },
    ],
    TN: [
      { id: "TN-Chennai", name: "Chennai" },
      { id: "TN-Coimbatore", name: "Coimbatore" },
      { id: "TN-Madurai", name: "Madurai" },
      { id: "TN-Tiruchirappalli", name: "Tiruchirappalli" },
    ],
    AP: [
      { id: "AP-Visakhapatnam", name: "Visakhapatnam" },
      { id: "AP-Guntur", name: "Guntur" },
      { id: "AP-Vijayawada", name: "NTR" },
      { id: "AP-Tirupati", name: "Tirupati" },
    ],
    TS: [
      { id: "TS-Hyderabad", name: "Hyderabad" },
      { id: "TS-Rangareddy", name: "Rangareddy" },
      { id: "TS-Warangal", name: "Hanamkonda" },
      { id: "TS-Karimnagar", name: "Karimnagar" },
    ],
    PB: [
      { id: "PB-Ludhiana", name: "Ludhiana" },
      { id: "PB-Amritsar", name: "Amritsar" },
      { id: "PB-Patiala", name: "Patiala" },
      { id: "PB-Jalandhar", name: "Jalandhar" },
    ],
    HR: [
      { id: "HR-Gurugram", name: "Gurugram" },
      { id: "HR-Faridabad", name: "Faridabad" },
      { id: "HR-Hisar", name: "Hisar" },
      { id: "HR-Karnal", name: "Karnal" },
    ],
    JK: [
      { id: "JK-Jammu", name: "Jammu" },
      { id: "JK-Srinagar", name: "Srinagar" },
      { id: "JK-Anantnag", name: "Anantnag" },
      { id: "JK-Baramulla", name: "Baramulla" },
    ],
    BR: [
      { id: "BR-Patna", name: "Patna" },
      { id: "BR-Muzaffarpur", name: "Muzaffarpur" },
      { id: "BR-Gaya", name: "Gaya" },
      { id: "BR-Bhagalpur", name: "Bhagalpur" },
    ],
    WB: [
      { id: "WB-Kolkata", name: "Kolkata" },
      { id: "WB-Howrah", name: "Howrah" },
      { id: "WB-Hooghly", name: "Hooghly" },
      { id: "WB-Nadia", name: "Nadia" },
    ],
  },
  talukasByDistrict: {
    "MH-Satara": ["Satara", "Karad", "Wai", "Phaltan", "Koregaon"],
    "MH-Pune": ["Haveli", "Baramati", "Shirur", "Maval", "Junnar"],
    "MH-Kolhapur": ["Karvir", "Kagal", "Hatkanangale", "Radhanagari"],
    "MH-Nashik": ["Nashik", "Sinnar", "Igatpuri", "Niphad"],
    "MH-Ahilyanagar": ["Nagar", "Rahata", "Shrirampur", "Sangamner"],
    "UP-Lucknow": ["Lucknow", "Malihabad", "Mohanlalganj"],
    "UP-Kanpur": ["Kanpur", "Bilhaur", "Ghatampur"],
    "UP-Varanasi": ["Varanasi", "Pindra", "Rohaniya"],
    "UP-Prayagraj": ["Soraon", "Phulpur", "Karchhana"],
    "RJ-Jaipur": ["Jaipur", "Sanganer", "Amer"],
    "RJ-Udaipur": ["Girwa", "Mavli", "Salumber"],
    "RJ-Jodhpur": ["Jodhpur", "Bhopalgarh", "Phalodi"],
    "RJ-Kota": ["Kota", "Ladpura", "Sangod"],
    "MP-Bhopal": ["Huzur", "Berasia"],
    "MP-Indore": ["Indore", "Sanwer", "Depalpur"],
    "MP-Jabalpur": ["Jabalpur", "Sihora", "Patan"],
    "MP-Gwalior": ["Gwalior", "Bhitarwar", "Dabra"],
    "KA-Bengaluru": ["Bengaluru North", "Bengaluru South", "Anekal"],
    "KA-Belagavi": ["Belagavi", "Chikkodi", "Athani"],
    "KA-Mysuru": ["Mysuru", "Nanjangud", "Hunsur"],
    "KA-Kalaburagi": ["Kalaburagi", "Sedam", "Chitapur"],
    "GJ-Ahmedabad": ["Ahmedabad City", "Dholka", "Sanand"],
    "GJ-Surat": ["Surat City", "Olpad", "Bardoli"],
    "GJ-Rajkot": ["Rajkot", "Gondal", "Jasdan"],
    "GJ-Vadodara": ["Vadodara", "Padra", "Savli"],
    "TN-Chennai": ["Mylapore", "Ambattur", "Guindy"],
    "TN-Coimbatore": ["Coimbatore North", "Coimbatore South", "Pollachi"],
    "TN-Madurai": ["Madurai North", "Madurai South", "Usilampatti"],
    "TN-Tiruchirappalli": ["Trichy West", "Srirangam", "Lalgudi"],
    "AP-Visakhapatnam": ["Bheemunipatnam", "Anandapuram", "Pendurthi"],
    "AP-Guntur": ["Guntur", "Tenali", "Mangalagiri"],
    "AP-Vijayawada": ["Vijayawada", "Ibrahimpatnam", "Kankipadu"],
    "AP-Tirupati": ["Tirupati", "Srikalahasti", "Renigunta"],
    "TS-Hyderabad": ["Amberpet", "Secunderabad", "Charminar"],
    "TS-Rangareddy": ["Chevella", "Shadnagar", "Ibrahimpatnam"],
    "TS-Warangal": ["Warangal", "Hasanparthy", "Hanamkonda"],
    "TS-Karimnagar": ["Karimnagar", "Huzurabad", "Jammikunta"],
    "PB-Ludhiana": ["Ludhiana East", "Ludhiana West", "Jagraon"],
    "PB-Amritsar": ["Amritsar I", "Ajnala", "Baba Bakala"],
    "PB-Patiala": ["Patiala", "Nabha", "Rajpura"],
    "PB-Jalandhar": ["Jalandhar I", "Phillaur", "Nakodar"],
    "HR-Gurugram": ["Gurugram", "Sohna", "Pataudi"],
    "HR-Faridabad": ["Faridabad", "Ballabgarh", "Badkhal"],
    "HR-Hisar": ["Hisar", "Hansi", "Narnaund"],
    "HR-Karnal": ["Karnal", "Assandh", "Indri"],
    "JK-Jammu": ["Jammu", "Akhnoor", "Bishnah", "RS Pura"],
    "JK-Srinagar": ["Srinagar North", "Srinagar South", "Khonmoh"],
    "JK-Anantnag": ["Anantnag", "Bijbehara", "Dooru"],
    "JK-Baramulla": ["Baramulla", "Sopore", "Pattan"],
    "BR-Patna": ["Patna Sadar", "Paliganj", "Danapur"],
    "BR-Muzaffarpur": ["Muzaffarpur", "Sakra", "Bochaha"],
    "BR-Gaya": ["Gaya Town", "Sherghati", "Tekari"],
    "BR-Bhagalpur": ["Bhagalpur", "Kahalgaon", "Nathnagar"],
    "WB-Kolkata": ["Alipore", "Sealdah", "Kashipur"],
    "WB-Howrah": ["Howrah", "Uluberia", "Domjur"],
    "WB-Hooghly": ["Chinsurah", "Serampore", "Arambagh"],
    "WB-Nadia": ["Krishnanagar", "Ranaghat", "Kalyani"],
  },
  villagesByTaluka: {
    "MH-Satara|Satara": ["Khed", "Kas", "Parali", "Shendre"],
    "MH-Satara|Karad": ["Malkapur", "Umbraj", "Kole"],
    "MH-Pune|Haveli": ["Wagholi", "Manjari", "Uruli Kanchan"],
    "MH-Pune|Baramati": ["Kurkumbh", "Morgaon", "Nira"],
  },
};

const formatSunTime = (unixSeconds) =>
  new Date(unixSeconds * 1000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const dayLabel = (dateText) =>
  new Date(dateText).toLocaleDateString("en-IN", { weekday: "short" });

const itemId = (item) =>
  item?.id ?? item?.state_id ?? item?.district_id ?? item?.taluka_id ?? item?.village_id ?? "";

const itemName = (item) =>
  item?.name ?? item?.state ?? item?.district ?? item?.taluka ?? item?.village ?? "";

const MOCK_DATA = {
  city: "Mumbai",
  country: "IN",
  temp: 31,
  feels_like: 35,
  condition: "Clear",
  description: "Clear sky",
  humidity: 72,
  wind: 14,
  pressure: 1008,
  visibility: 10,
  sunrise: "06:23",
  sunset: "18:47",
  forecast: [
    { day: "Mon", high: 32, low: 26, condition: "Clear" },
    { day: "Tue", high: 30, low: 25, condition: "Clouds" },
    { day: "Wed", high: 28, low: 24, condition: "Rain" },
    { day: "Thu", high: 27, low: 23, condition: "Rain" },
    { day: "Fri", high: 29, low: 24, condition: "Clouds" },
    { day: "Sat", high: 31, low: 25, condition: "Clear" },
    { day: "Sun", high: 33, low: 27, condition: "Clear" },
  ],
};

// SVG Weather Icons
const WeatherSVG = ({ condition, size = 64 }) => {
  const s = size;
  const icons = {
    Clear: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="14" fill="#FBBF24" />
        <g stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
          <line x1="32" y1="6" x2="32" y2="12" />
          <line x1="32" y1="52" x2="32" y2="58" />
          <line x1="6" y1="32" x2="12" y2="32" />
          <line x1="52" y1="32" x2="58" y2="32" />
          <line x1="13" y1="13" x2="17" y2="17" />
          <line x1="47" y1="47" x2="51" y2="51" />
          <line x1="51" y1="13" x2="47" y2="17" />
          <line x1="17" y1="47" x2="13" y2="51" />
        </g>
      </svg>
    ),
    Clouds: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="24" cy="30" r="10" fill="#94A3B8" />
        <circle cx="36" cy="26" r="13" fill="#CBD5E1" />
        <circle cx="46" cy="32" r="9" fill="#94A3B8" />
        <rect x="14" y="32" width="40" height="14" rx="7" fill="#CBD5E1" />
      </svg>
    ),
    Rain: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="24" cy="22" r="10" fill="#64748B" />
        <circle cx="36" cy="18" r="12" fill="#94A3B8" />
        <circle cx="46" cy="24" r="8" fill="#64748B" />
        <rect x="14" y="24" width="40" height="12" rx="6" fill="#94A3B8" />
        <g stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
          <line x1="22" y1="42" x2="20" y2="50" />
          <line x1="32" y1="42" x2="30" y2="52" />
          <line x1="42" y1="42" x2="40" y2="50" />
          <line x1="27" y1="46" x2="25" y2="54" />
          <line x1="37" y1="44" x2="35" y2="54" />
        </g>
      </svg>
    ),
    Drizzle: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="26" cy="24" r="10" fill="#94A3B8" />
        <circle cx="38" cy="20" r="12" fill="#CBD5E1" />
        <rect x="16" y="26" width="36" height="10" rx="5" fill="#CBD5E1" />
        <g stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round">
          <line x1="24" y1="42" x2="23" y2="47" />
          <line x1="32" y1="43" x2="31" y2="49" />
          <line x1="40" y1="41" x2="39" y2="47" />
          <line x1="28" y1="47" x2="27" y2="53" />
          <line x1="36" y1="46" x2="35" y2="52" />
        </g>
      </svg>
    ),
    Thunderstorm: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="22" cy="22" r="10" fill="#374151" />
        <circle cx="36" cy="18" r="13" fill="#4B5563" />
        <circle cx="46" cy="24" r="9" fill="#374151" />
        <rect x="12" y="24" width="42" height="12" rx="6" fill="#4B5563" />
        <polyline points="36,36 28,48 34,48 26,60" stroke="#FCD34D" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      </svg>
    ),
    Snow: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="24" cy="22" r="10" fill="#CBD5E1" />
        <circle cx="36" cy="18" r="12" fill="#E2E8F0" />
        <rect x="14" y="24" width="38" height="11" rx="5.5" fill="#E2E8F0" />
        <g stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round">
          <line x1="24" y1="40" x2="24" y2="54" /><line x1="18" y1="43" x2="30" y2="51" /><line x1="30" y1="43" x2="18" y2="51" />
          <line x1="40" y1="40" x2="40" y2="54" /><line x1="34" y1="43" x2="46" y2="51" /><line x1="46" y1="43" x2="34" y2="51" />
        </g>
      </svg>
    ),
    Mist: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
          <line x1="12" y1="24" x2="52" y2="24" />
          <line x1="16" y1="32" x2="48" y2="32" />
          <line x1="10" y1="40" x2="54" y2="40" />
          <line x1="18" y1="48" x2="46" y2="48" />
        </g>
      </svg>
    ),
    Fog: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <g stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round">
          <line x1="10" y1="22" x2="54" y2="22" />
          <line x1="14" y1="30" x2="50" y2="30" />
          <line x1="10" y1="38" x2="54" y2="38" />
          <line x1="16" y1="46" x2="48" y2="46" />
        </g>
      </svg>
    ),
    Haze: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="28" r="11" fill="#FDE68A" opacity="0.7" />
        <g stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity="0.6">
          <line x1="32" y1="8" x2="32" y2="13" />
          <line x1="32" y1="45" x2="32" y2="50" />
          <line x1="10" y1="28" x2="15" y2="28" />
          <line x1="49" y1="28" x2="54" y2="28" />
        </g>
        <g stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="42" x2="52" y2="42" />
          <line x1="16" y1="50" x2="48" y2="50" />
        </g>
      </svg>
    ),
  };
  return icons[condition] || icons["Clear"];
};

// Animated Scene based on weather
const WeatherScene = ({ condition }) => {
  const scenes = {
    Clear: {
      bg: "linear-gradient(180deg, #0ea5e9 0%, #38bdf8 40%, #7dd3fc 70%, #fde68a 100%)",
      elements: (
        <>
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", animation: "pulse 3s infinite" }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="22" fill="#FCD34D" />
              <g stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" opacity="0.6">
                {[0,45,90,135,180,225,270,315].map((deg,i) => (
                  <line key={i}
                    x1={45 + 28*Math.cos(deg*Math.PI/180)}
                    y1={45 + 28*Math.sin(deg*Math.PI/180)}
                    x2={45 + 38*Math.cos(deg*Math.PI/180)}
                    y2={45 + 38*Math.sin(deg*Math.PI/180)}
                  />
                ))}
              </g>
            </svg>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48 }}>
            <svg viewBox="0 0 400 48" preserveAspectRatio="none" width="100%" height="48">
              <path d="M0,32 Q30,10 60,28 Q90,46 120,20 Q150,2 180,24 Q210,44 240,18 Q270,0 300,22 Q330,42 360,16 Q385,4 400,24 L400,48 L0,48Z" fill="#4ade80" opacity="0.8"/>
              <path d="M0,40 Q40,22 80,36 Q120,48 160,30 Q200,14 240,34 Q280,48 320,28 Q360,14 400,32 L400,48 L0,48Z" fill="#16a34a" opacity="0.9"/>
            </svg>
          </div>
          <div style={{ position: "absolute", top: 50, left: "15%", animation: "float 6s ease-in-out infinite" }}>
            <svg width="50" height="22" viewBox="0 0 50 22"><ellipse cx="25" cy="14" rx="22" ry="8" fill="white" opacity="0.6"/><ellipse cx="18" cy="16" rx="14" ry="7" fill="white" opacity="0.5"/></svg>
          </div>
          <div style={{ position: "absolute", top: 36, right: "18%", animation: "float 8s ease-in-out infinite 1s" }}>
            <svg width="44" height="20" viewBox="0 0 44 20"><ellipse cx="22" cy="13" rx="19" ry="7" fill="white" opacity="0.5"/><ellipse cx="15" cy="15" rx="12" ry="6" fill="white" opacity="0.4"/></svg>
          </div>
        </>
      ),
    },
    Rain: {
      bg: "linear-gradient(180deg, #334155 0%, #475569 40%, #64748b 100%)",
      elements: (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 70 }}>
            <svg viewBox="0 0 400 70" preserveAspectRatio="none" width="100%" height="70">
              <ellipse cx="80" cy="40" rx="75" ry="35" fill="#475569"/>
              <ellipse cx="200" cy="30" rx="110" ry="40" fill="#334155"/>
              <ellipse cx="330" cy="44" rx="80" ry="32" fill="#475569"/>
            </svg>
          </div>
          {[10,22,35,48,60,72,85,97].map((x,i) => (
            <div key={i} style={{ position: "absolute", top: `${50 + (i%3)*12}px`, left: `${x}%`, animation: `rain ${0.6 + i*0.07}s linear infinite ${i*0.13}s` }}>
              <svg width="3" height="18"><line x1="1.5" y1="0" x2="1.5" y2="18" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <svg viewBox="0 0 400 36" preserveAspectRatio="none" width="100%" height="36">
              <path d="M0,20 Q50,5 100,18 Q150,30 200,12 Q250,0 300,16 Q350,28 400,10 L400,36 L0,36Z" fill="#166534" opacity="0.9"/>
            </svg>
          </div>
        </>
      ),
    },
    Clouds: {
      bg: "linear-gradient(180deg, #94a3b8 0%, #cbd5e1 50%, #e2e8f0 100%)",
      elements: (
        <>
          {[{x:10,y:12,w:120,op:0.8},{x:35,y:5,w:150,op:0.9},{x:65,y:16,w:110,op:0.7}].map((c,i) => (
            <div key={i} style={{ position: "absolute", top: c.y, left: `${c.x}%`, animation: `drift ${10+i*3}s ease-in-out infinite ${i*2}s`, opacity: c.op }}>
              <svg width={c.w} height="55" viewBox="0 0 120 55">
                <ellipse cx="45" cy="35" rx="40" ry="20" fill="#e2e8f0"/>
                <ellipse cx="70" cy="28" rx="50" ry="25" fill="white"/>
                <ellipse cx="95" cy="38" rx="30" ry="17" fill="#f1f5f9"/>
              </svg>
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <svg viewBox="0 0 400 32" preserveAspectRatio="none" width="100%" height="32">
              <path d="M0,16 Q100,0 200,14 Q300,26 400,8 L400,32 L0,32Z" fill="#4ade80" opacity="0.7"/>
            </svg>
          </div>
        </>
      ),
    },
    Thunderstorm: {
      bg: "linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #3730a3 100%)",
      elements: (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80 }}>
            <svg viewBox="0 0 400 80" preserveAspectRatio="none" width="100%" height="80">
              <ellipse cx="100" cy="50" rx="90" ry="42" fill="#1e1b4b"/>
              <ellipse cx="240" cy="36" rx="130" ry="50" fill="#312e81"/>
              <ellipse cx="360" cy="54" rx="70" ry="36" fill="#1e1b4b"/>
            </svg>
          </div>
          <div style={{ position: "absolute", top: 60, left: "42%", animation: "lightning 3s ease-in-out infinite 0.5s" }}>
            <svg width="20" height="55" viewBox="0 0 20 55">
              <polyline points="14,0 6,26 12,26 4,55" stroke="#FCD34D" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <svg viewBox="0 0 400 30" preserveAspectRatio="none" width="100%" height="30">
              <path d="M0,14 Q80,0 160,12 Q240,22 320,6 Q370,0 400,10 L400,30 L0,30Z" fill="#14532d"/>
            </svg>
          </div>
        </>
      ),
    },
  };
  const scene = scenes[condition] || scenes["Clear"];
  return (
    <div style={{ background: scene.bg, borderRadius: "16px 16px 0 0", height: 150, position: "relative", overflow: "hidden" }}>
      {scene.elements}
    </div>
  );
};

const advisoryIcons = {
  Irrigation: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4 C14 4 6 13 6 18 A8 8 0 0 0 22 18 C22 13 14 4 14 4Z" fill="#3B82F6" opacity="0.8"/>
      <path d="M14 10 C14 10 9 16 9 19 A5 5 0 0 0 19 19 C19 16 14 10 14 10Z" fill="#BAE6FD"/>
    </svg>
  ),
  Spraying: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="14" width="10" height="7" rx="2" fill="#6B7280"/>
      <rect x="14" y="16" width="9" height="3" rx="1.5" fill="#9CA3AF"/>
      <path d="M10 14 L10 10 Q10 7 13 7 L16 7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="16" cy="7" r="1.5" fill="#6B7280"/>
      <g stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
        <line x1="20" y1="12" x2="22" y2="10"/><line x1="22" y1="16" x2="25" y2="16"/><line x1="20" y1="20" x2="22" y2="22"/>
      </g>
    </svg>
  ),
  "Disease Risk": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <ellipse cx="10" cy="16" rx="7" ry="5" fill="#86EFAC" transform="rotate(-20 10 16)"/>
      <ellipse cx="18" cy="15" rx="7" ry="4.5" fill="#4ADE80" transform="rotate(15 18 15)"/>
      <line x1="14" y1="22" x2="14" y2="26" stroke="#166534" strokeWidth="1.5"/>
      <circle cx="21" cy="9" r="4" fill="#FCA5A5" opacity="0.9"/>
      <line x1="19" y1="9" x2="23" y2="9" stroke="#EF4444" strokeWidth="1.5"/>
      <line x1="21" y1="7" x2="21" y2="11" stroke="#EF4444" strokeWidth="1.5"/>
    </svg>
  ),
  "Field Work": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="8" r="4" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2"/>
      <line x1="14" y1="12" x2="14" y2="20" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="14" y1="16" x2="10" y2="20" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="16" x2="18" y2="20" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="20" x2="11" y2="26" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="20" x2="17" y2="26" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 22 Q14 18 22 22" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
};

const levelConfig = {
  Good:    { bg: "#F0FDF4", border: "#86EFAC", badge: "#DCFCE7", badgeText: "#166534", dot: "#22C55E" },
  Caution: { bg: "#FFFBEB", border: "#FCD34D", badge: "#FEF3C7", badgeText: "#92400E", dot: "#F59E0B" },
  Risk:    { bg: "#FFF1F2", border: "#FCA5A5", badge: "#FEE2E2", badgeText: "#991B1B", dot: "#EF4444" },
};

const forecastConditionIcon = (condition) => {
  const map = { Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️", Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️", Haze: "🌤️" };
  return map[condition] || "🌤️";
};

const metricIcons = {
  Humidity:    <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 2 C10 2 4 9 4 13 A6 6 0 0 0 16 13 C16 9 10 2 10 2Z" fill="#60A5FA" opacity="0.9"/></svg>,
  "Wind Speed":<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 8 Q8 5 12 8 Q16 11 18 8" stroke="#94A3B8" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M2 12 Q7 9 11 12 Q14 14 14 12 A2 2 0 0 0 10 12" stroke="#64748B" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>,
  Pressure:    <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" stroke="#A78BFA" strokeWidth="1.5" fill="none"/><line x1="10" y1="10" x2="14" y2="7" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="1.5" fill="#7C3AED"/></svg>,
  Visibility:  <svg width="20" height="20" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="8" ry="5" stroke="#34D399" strokeWidth="1.5" fill="none"/><circle cx="10" cy="10" r="2.5" fill="#10B981"/></svg>,
  Sunrise:     <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 12 A5 5 0 0 1 10 2" stroke="#F59E0B" strokeWidth="1.5" fill="none"/><line x1="10" y1="13" x2="10" y2="16" stroke="#D97706" strokeWidth="1.5"/><line x1="3" y1="13" x2="17" y2="13" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="10" x2="3" y2="10" stroke="#FCD34D" strokeWidth="1.5"/><line x1="17" y1="10" x2="19" y2="10" stroke="#FCD34D" strokeWidth="1.5"/><line x1="3" y1="5" x2="4.5" y2="6.5" stroke="#FCD34D" strokeWidth="1.2"/><line x1="15.5" y1="6.5" x2="17" y2="5" stroke="#FCD34D" strokeWidth="1.2"/></svg>,
  Sunset:      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 2 A5 5 0 0 1 10 12" stroke="#F97316" strokeWidth="1.5" fill="none"/><line x1="10" y1="13" x2="10" y2="16" stroke="#EA580C" strokeWidth="1.5"/><line x1="3" y1="13" x2="17" y2="13" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="10" x2="3" y2="10" stroke="#FED7AA" strokeWidth="1.5"/><line x1="17" y1="10" x2="19" y2="10" stroke="#FED7AA" strokeWidth="1.5"/></svg>,
};

export default function WeatherPage() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("C");
  const [time, setTime] = useState(new Date());

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedTalukaName, setSelectedTalukaName] = useState("");
  const [selectedVillageName, setSelectedVillageName] = useState("");
  const [useFallbackLocations, setUseFallbackLocations] = useState(false);

  const extractArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  // Keep displayed time fixed (no 1s interval) so the UI doesn't appear to be continuously updating.

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch(`${LOCATION_BASE_URL}/states`);
        if (!response.ok) throw new Error(`State API failed (${response.status})`);
        const data = await response.json();
        const parsed = extractArray(data);
        if (!parsed.length) throw new Error("State API returned empty data");
        setStates(parsed);
        setUseFallbackLocations(false);
      } catch (err) {
        setStates(FALLBACK_LOCATION_DATA.states);
        setUseFallbackLocations(true);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedStateId) {
        setDistricts([]); setTalukas([]); setVillages([]);
        setSelectedDistrictId(""); setSelectedTalukaName(""); setSelectedVillageName("");
        return;
      }
      try {
        if (useFallbackLocations) { setDistricts(FALLBACK_LOCATION_DATA.districtsByState[selectedStateId] || []); return; }
        const response = await fetch(`${LOCATION_BASE_URL}/districts?state_id=${encodeURIComponent(selectedStateId)}`);
        if (!response.ok) throw new Error(`District API failed`);
        setDistricts(extractArray(await response.json()));
      } catch {
        setDistricts(FALLBACK_LOCATION_DATA.districtsByState[selectedStateId] || []);
        setUseFallbackLocations(true);
      }
    };
    fetchDistricts();
  }, [selectedStateId, useFallbackLocations]);

  useEffect(() => {
    const fetchTalukas = async () => {
      if (!selectedDistrictId) {
        setTalukas([]); setVillages([]); setSelectedTalukaName(""); setSelectedVillageName("");
        return;
      }
      try {
        if (useFallbackLocations) {
          const fb = FALLBACK_LOCATION_DATA.talukasByDistrict[selectedDistrictId] || [];
          setTalukas(fb.map((n) => ({ name: n }))); return;
        }
        const response = await fetch(`${LOCATION_BASE_URL}/talukas?district_id=${encodeURIComponent(selectedDistrictId)}`);
        if (!response.ok) throw new Error("Taluka API failed");
        setTalukas(extractArray(await response.json()));
      } catch {
        const fb = FALLBACK_LOCATION_DATA.talukasByDistrict[selectedDistrictId] || [];
        setTalukas(fb.map((n) => ({ name: n })));
        setUseFallbackLocations(true);
      }
    };
    fetchTalukas();
  }, [selectedDistrictId, useFallbackLocations]);

  const selectedState = useMemo(() => states.find((s) => String(itemId(s)) === String(selectedStateId)), [states, selectedStateId]);
  const selectedDistrict = useMemo(() => districts.find((d) => String(itemId(d)) === String(selectedDistrictId)), [districts, selectedDistrictId]);

  useEffect(() => {
    const fetchVillages = async () => {
      if (!selectedState || !selectedDistrict || !selectedTalukaName) { setVillages([]); setSelectedVillageName(""); return; }
      try {
        if (useFallbackLocations) {
          const key = `${selectedDistrictId}|${selectedTalukaName}`;
          setVillages((FALLBACK_LOCATION_DATA.villagesByTaluka[key] || []).map((n) => ({ name: n }))); return;
        }
        const params = new URLSearchParams({ state: itemName(selectedState) || "", district: itemName(selectedDistrict) || "", taluka: selectedTalukaName });
        const response = await fetch(`${LOCATION_BASE_URL}/villages?${params.toString()}`);
        if (!response.ok) throw new Error("Village API failed");
        setVillages(extractArray(await response.json()));
      } catch {
        const key = `${selectedDistrictId}|${selectedTalukaName}`;
        setVillages((FALLBACK_LOCATION_DATA.villagesByTaluka[key] || []).map((n) => ({ name: n })));
        setUseFallbackLocations(true);
      }
    };
    fetchVillages();
  }, [selectedState, selectedDistrict, selectedTalukaName, selectedDistrictId, useFallbackLocations]);

  const displayTemp = (celsius) => (unit === "C" ? celsius : Math.round((celsius * 9) / 5 + 32));

  const locationQuery =
    selectedVillageName || selectedTalukaName ||
    itemName(selectedDistrict) || itemName(selectedState) || query.trim();

  const buildFallback = (name) => ({ ...MOCK_DATA, city: name || MOCK_DATA.city, temp: Math.round(18 + Math.random() * 20), humidity: Math.round(50 + Math.random() * 40), wind: Math.round(5 + Math.random() * 25) });

  const fetchWeather = async () => {
    if (!locationQuery) return;
    setLoading(true);
    try {
      if (!OPEN_WEATHER_KEY) { setWeather(buildFallback(locationQuery)); return; }
      const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(`${locationQuery},IN`)}&appid=${OPEN_WEATHER_KEY}&units=metric`);
      if (!currentRes.ok) throw new Error("Location not found");
      const current = await currentRes.json();
      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(`${locationQuery},IN`)}&appid=${OPEN_WEATHER_KEY}&units=metric`);
      const forecastJson = forecastRes.ok ? await forecastRes.json() : { list: [] };
      const daily = [];
      for (let i = 0; i < (forecastJson.list || []).length; i += 8) {
        const item = forecastJson.list[i];
        if (!item) continue;
        daily.push({ day: dayLabel(item.dt_txt), high: Math.round(item.main.temp_max), low: Math.round(item.main.temp_min), condition: item.weather?.[0]?.main || "Clear" });
      }
      setWeather({ city: current.name, country: current.sys?.country || "IN", temp: Math.round(current.main?.temp || 0), feels_like: Math.round(current.main?.feels_like || 0), condition: current.weather?.[0]?.main || "Clear", description: current.weather?.[0]?.description || "Clear sky", humidity: current.main?.humidity || 0, wind: Math.round((current.wind?.speed || 0) * 3.6), pressure: current.main?.pressure || 0, visibility: Math.round((current.visibility || 0) / 1000), sunrise: current.sys?.sunrise ? formatSunTime(current.sys.sunrise) : "--:--", sunset: current.sys?.sunset ? formatSunTime(current.sys.sunset) : "--:--", forecast: daily.length ? daily : MOCK_DATA.forecast });
    } catch { setWeather(buildFallback(locationQuery)); }
    finally { setLoading(false); }
  };

  const formatTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const advisories = useMemo(() => {
    const rainSoon = weather.forecast.slice(0, 3).some((d) => ["Rain", "Drizzle", "Thunderstorm"].includes(d.condition));
    const wetConditions = ["Rain", "Drizzle", "Thunderstorm", "Mist", "Fog", "Clouds"].includes(weather.condition);
    let irrigation = { title: "Irrigation", level: "Good", message: "Normal watering is enough today." };
    if (rainSoon) irrigation = { title: "Irrigation", level: "Caution", message: "Rain likely soon. Avoid heavy irrigation today." };
    else if (weather.temp >= 34 || weather.humidity <= 45) irrigation = { title: "Irrigation", level: "Good", message: "Hot and dry weather. Give light water in morning or evening." };
    let spraying = { title: "Spraying", level: "Good", message: "Good spray window. Spray in calm hours." };
    if (weather.wind > 20 || rainSoon) spraying = { title: "Spraying", level: "Risk", message: "Avoid spraying now due to wind/rain chance." };
    else if (weather.humidity > 85) spraying = { title: "Spraying", level: "Caution", message: "Humidity is high. Prefer short, targeted spraying." };
    let diseaseRisk = { title: "Disease Risk", level: "Good", message: "Low fungal risk right now. Continue regular checks." };
    if (weather.humidity >= 80 && wetConditions) diseaseRisk = { title: "Disease Risk", level: "Risk", message: "High fungal risk. Check leaves and apply preventive measures." };
    else if (weather.humidity >= 70) diseaseRisk = { title: "Disease Risk", level: "Caution", message: "Moderate risk. Monitor crop and drainage closely." };
    let fieldWork = { title: "Field Work", level: "Good", message: "Good conditions for routine farm work." };
    if (weather.temp >= 38 || weather.wind > 28 || weather.visibility <= 2) fieldWork = { title: "Field Work", level: "Risk", message: "Harsh conditions. Avoid long outdoor work in peak hours." };
    else if (weather.temp >= 34 || rainSoon) fieldWork = { title: "Field Work", level: "Caution", message: "Work in short shifts and avoid midday heat." };
    return [irrigation, spraying, diseaseRisk, fieldWork];
  }, [weather]);

  const selectStyle = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #D1FAE5",
    borderRadius: 10, background: "#F0FDF4", color: "#1A3A2A",
    fontSize: 14, fontFamily: "'Lato', sans-serif", outline: "none",
    cursor: "pointer", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%2316A34A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Lato', sans-serif" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@400;700&display=swap');
        @keyframes pulse { 0%,100%{transform:scale(1) translateX(-50%)} 50%{transform:scale(1.06) translateX(-50%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes rain { 0%{transform:translateY(-20px) scaleY(0.5);opacity:0} 20%{opacity:1} 100%{transform:translateY(120px);opacity:0} }
        @keyframes lightning { 0%,100%,45%,55%{opacity:0} 50%{opacity:1} 52%{opacity:0.3} 53%{opacity:1} }
        @keyframes drift { 0%,100%{transform:translateX(0)} 50%{transform:translateX(10px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select:focus { border-color:#16A34A !important; box-shadow:0 0 0 3px rgba(22,163,74,0.15); }
        input:focus { border-color:#16A34A !important; box-shadow:0 0 0 3px rgba(22,163,74,0.15); outline:none; }
        .metric-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.08); }
        .forecast-row:hover { background:#F0FDF4; }
        .advisory-card:hover { transform:translateY(-2px); }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #F0FDF4 0%, #ECFDF5 40%, #F0F9FF 100%)", fontFamily: "'Lato', sans-serif", padding: "32px 16px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ background: "linear-gradient(135deg, #16A34A, #059669)", borderRadius: 16, padding: 12, flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 6 C16 6 8 14 8 19 A8 8 0 0 0 24 19 C24 14 16 6 16 6Z" fill="white" opacity="0.9"/>
                <line x1="6" y1="26" x2="26" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="10" y1="22" x2="10" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="21" x2="16" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="22" y1="22" x2="22" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, color: "#14532D", margin: 0, lineHeight: 1.1 }}>Weather Forecast</h1>
              <p style={{ color: "#4B7A5E", margin: "4px 0 0", fontSize: 14 }}>Check live weather by selecting state, district, taluka and village.</p>
            </div>
          </div>

          {/* Main Card */}
          <div style={{ background: "white", borderRadius: 20, boxShadow: "0 4px 32px rgba(0,0,0,0.07)", overflow: "hidden" }}>

            {/* Animated Scene */}
            <WeatherScene condition={weather.condition} />

            {/* Weather Hero Strip */}
            <div style={{ background: "linear-gradient(135deg, #14532D 0%, #166534 50%, #15803D 100%)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>
                  <WeatherSVG condition={weather.condition} size={72} />
                </div>
                <div>
                  <div style={{ color: "#A7F3D0", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    📍 {weather.city}, {weather.country}
                  </div>
                  <div style={{ color: "white", fontSize: 52, fontWeight: 900, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
                    {displayTemp(weather.temp)}°<span style={{ fontSize: 28, opacity: 0.8 }}>{unit}</span>
                  </div>
                  <div style={{ color: "#86EFAC", fontSize: 14, textTransform: "capitalize", marginTop: 2 }}>{weather.description}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#A7F3D0", fontSize: 12 }}>{formatDate(time)}</div>
                <div style={{ color: "white", fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, letterSpacing: "0.04em" }}>{formatTime(time)}</div>
                <div style={{ color: "#86EFAC", fontSize: 13, marginTop: 4 }}>
                  Feels like <span style={{ color: "white", fontWeight: 700 }}>{displayTemp(weather.feels_like)}°{unit}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: "28px 28px 32px" }}>

              {/* Location Selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
                {[
                  { label: "State", value: selectedStateId, onChange: (e) => setSelectedStateId(e.target.value), options: states, disabled: false, placeholder: "Select state" },
                  { label: "District", value: selectedDistrictId, onChange: (e) => setSelectedDistrictId(e.target.value), options: districts, disabled: !selectedStateId, placeholder: "Select district" },
                  { label: "Taluka", value: selectedTalukaName, onChange: (e) => setSelectedTalukaName(e.target.value), options: talukas, disabled: !selectedDistrictId, placeholder: "Select taluka", isNameBased: true },
                  { label: "Village", value: selectedVillageName, onChange: (e) => setSelectedVillageName(e.target.value), options: villages, disabled: !selectedTalukaName, placeholder: "Select village (optional)", isNameBased: true },
                ].map((sel) => (
                  <div key={sel.label}>
                    <label style={labelStyle}>{sel.label}</label>
                    <select value={sel.value} onChange={sel.onChange} disabled={sel.disabled}
                      style={{ ...selectStyle, opacity: sel.disabled ? 0.5 : 1, cursor: sel.disabled ? "not-allowed" : "pointer" }}>
                      <option value="">{sel.placeholder}</option>
                      {sel.options.map((opt, idx) => {
                        if (sel.isNameBased) {
                          const n = opt.name || opt.taluka || opt.village || String(opt);
                          return <option key={`${n}-${idx}`} value={n}>{n}</option>;
                        }
                        return <option key={String(itemId(opt))} value={String(itemId(opt))}>{itemName(opt)}</option>;
                      })}
                    </select>
                  </div>
                ))}
              </div>

              {/* Search + Unit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, marginBottom: 24, alignItems: "flex-end" }}>
                <div>
                  <label style={labelStyle}>Manual Location Search</label>
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchWeather()} placeholder="e.g., Pune"
                    style={{ ...selectStyle, backgroundImage: "none", padding: "10px 14px" }} />
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...selectStyle, width: 110 }}>
                    <option value="C">Celsius (°C)</option>
                    <option value="F">Fahrenheit (°F)</option>
                  </select>
                </div>
                <button onClick={fetchWeather} disabled={loading}
                  style={{ padding: "10px 24px", background: loading ? "#86EFAC" : "linear-gradient(135deg, #16A34A, #059669)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Lato', sans-serif", display: "flex", alignItems: "center", gap: 8, transition: "opacity 0.2s", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}>
                  {loading ? (
                    <><svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" fill="none" strokeDasharray="24" strokeDashoffset="8"/></svg> Fetching...</>
                  ) : "🌾 Get Weather"}
                </button>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1.5px solid #D1FAE5", margin: "0 0 24px" }} />

              {/* Farmer Advisory */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#14532D", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 2 L12 8 L18 8 L13.5 12 L15.5 18 L10 14.5 L4.5 18 L6.5 12 L2 8 L8 8Z" fill="#F59E0B"/></svg>
                  Farmer Advisory
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  {advisories.map((item) => {
                    const cfg = levelConfig[item.level];
                    return (
                      <div key={item.title} className="advisory-card"
                        style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 14, padding: "14px 16px", transition: "transform 0.2s", cursor: "default" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {advisoryIcons[item.title]}
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#1A3A2A" }}>{item.title}</span>
                          </div>
                          <span style={{ background: cfg.badge, color: cfg.badgeText, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                            {item.level}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{item.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#14532D", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke="#4B7A5E" strokeWidth="1.5" fill="none"/><line x1="9" y1="5" x2="9" y2="9" stroke="#4B7A5E" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="9" x2="12" y2="11" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Current Conditions
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Humidity", value: `${weather.humidity}%` },
                    { label: "Wind Speed", value: `${weather.wind} km/h` },
                    { label: "Pressure", value: `${weather.pressure} hPa` },
                    { label: "Visibility", value: `${weather.visibility} km` },
                    { label: "Sunrise", value: weather.sunrise },
                    { label: "Sunset", value: weather.sunset },
                  ].map(({ label, value }) => (
                    <div key={label} className="metric-card"
                      style={{ background: "#F8FFFE", border: "1.5px solid #D1FAE5", borderRadius: 12, padding: "12px 14px", transition: "transform 0.2s, box-shadow 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        {metricIcons[label]}
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4B7A5E", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#14532D", fontFamily: "'Playfair Display', serif" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Forecast */}
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#14532D", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="4" width="14" height="12" rx="2" stroke="#4B7A5E" strokeWidth="1.5" fill="none"/><line x1="6" y1="2" x2="6" y2="6" stroke="#4B7A5E" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="2" x2="12" y2="6" stroke="#4B7A5E" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="8" x2="16" y2="8" stroke="#4B7A5E" strokeWidth="1" /></svg>
                  7-Day Forecast
                </h2>
                <div style={{ border: "1.5px solid #D1FAE5", borderRadius: 14, overflow: "hidden" }}>
                  {weather.forecast.map((d, i) => (
                    <div key={`${d.day}-${i}`} className="forecast-row"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: i !== weather.forecast.length - 1 ? "1px solid #D1FAE5" : "none", transition: "background 0.15s", gap: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#14532D", minWidth: 36 }}>{d.day}</span>
                      <span style={{ fontSize: 22 }}>{forecastConditionIcon(d.condition)}</span>
                      <span style={{ fontSize: 13, color: "#4B7A5E", flex: 1, textAlign: "center", textTransform: "capitalize" }}>{d.condition}</span>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <span style={{ fontWeight: 900, fontSize: 15, color: "#14532D", fontFamily: "'Playfair Display', serif" }}>{displayTemp(d.high)}°</span>
                        <span style={{ fontSize: 14, color: "#94A3B8" }}>{displayTemp(d.low)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <p style={{ textAlign: "center", color: "#A7C5B0", fontSize: 12, marginTop: 20 }}>🌾 Powered by OpenWeatherMap · Built for Indian Farmers</p>
        </div>
      </div>
    </>
  );
}