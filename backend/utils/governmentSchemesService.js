import axios from "axios";

const OFFICIAL_SOURCE = {
  name: "myScheme",
  url: "https://www.myscheme.gov.in/",
  note: "National platform for discovering Government of India schemes.",
};

const fallbackSchemes = [
  {
    id: "pm-kisan",
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    category: "Income Support",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    regionType: "all-india",
    states: [],
    districts: [],
    summary: "Income support for eligible landholding farmer families through direct benefit transfer.",
    benefits: ["Periodic financial assistance", "Direct transfer to bank account"],
    eligibility: ["Landholding farmer family", "Valid Aadhaar and bank details"],
    applicationUrl: "https://pmkisan.gov.in/",
    sourceUrl: "https://www.myscheme.gov.in/schemes/pm-kisan",
    tags: ["farmer", "income", "dbt"],
  },
  {
    id: "kcc",
    title: "Kisan Credit Card (KCC)",
    category: "Credit",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    regionType: "all-india",
    states: [],
    districts: [],
    summary: "Provides farmers with flexible short-term credit for cultivation, allied activities, and working capital needs.",
    benefits: ["Crop loan access", "Working capital for allied activities", "Interest subvention in eligible cases"],
    eligibility: ["Farmers", "Tenant farmers or sharecroppers in participating institutions", "Basic KYC and land or cultivation proof"],
    applicationUrl: "https://www.myscheme.gov.in/schemes/kcc",
    sourceUrl: "https://www.myscheme.gov.in/schemes/kcc",
    tags: ["credit", "crop loan", "banking"],
  },
  {
    id: "pmfby",
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    category: "Insurance",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    regionType: "all-india",
    states: [],
    districts: [],
    summary: "Crop insurance support against yield losses due to natural calamities, pests, and diseases.",
    benefits: ["Crop insurance coverage", "Lower premium for farmers", "Post-harvest loss support in eligible cases"],
    eligibility: ["Farmers growing notified crops", "Enrollment through participating banks, CSCs, or portals"],
    applicationUrl: "https://pmfby.gov.in/",
    sourceUrl: "https://www.myscheme.gov.in/schemes/pmfby",
    tags: ["insurance", "crop", "risk"],
  },
  {
    id: "soil-health-card",
    title: "Soil Health Card Scheme",
    category: "Soil & Input Support",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    regionType: "all-india",
    states: [],
    districts: [],
    summary: "Provides soil testing insights and nutrient recommendations to improve farm productivity.",
    benefits: ["Soil nutrient analysis", "Fertilizer recommendations", "Better crop planning"],
    eligibility: ["Farmers seeking soil testing support"],
    applicationUrl: "https://www.myscheme.gov.in/schemes/shc",
    sourceUrl: "https://www.myscheme.gov.in/schemes/shc",
    tags: ["soil", "fertility", "input"],
  },
  {
    id: "e-nam",
    title: "e-NAM",
    category: "Market Access",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    regionType: "all-india",
    states: [],
    districts: [],
    summary: "Digital agriculture market platform helping farmers discover buyers and market prices.",
    benefits: ["Broader market discovery", "Transparent price information", "Online trading support in connected mandis"],
    eligibility: ["Farmers and traders in participating mandis"],
    applicationUrl: "https://www.enam.gov.in/",
    sourceUrl: "https://www.myscheme.gov.in/schemes/e-nam",
    tags: ["market", "pricing", "trading"],
  },
  {
    id: "maha-krishi-mechanization",
    title: "Maharashtra Agriculture Mechanization Support",
    category: "Equipment",
    ministry: "State Agriculture Department",
    regionType: "state",
    states: ["Maharashtra"],
    districts: [],
    summary: "State-level support for farm mechanization and equipment access for eligible farmers.",
    benefits: ["Subsidy on machinery", "Support for mechanization adoption"],
    eligibility: ["Eligible farmers in Maharashtra", "Scheme-specific landholding and category rules may apply"],
    applicationUrl: "https://www.myscheme.gov.in/",
    sourceUrl: "https://www.myscheme.gov.in/",
    tags: ["state", "equipment", "subsidy"],
  },
  {
    id: "karnataka-farmer-support",
    title: "Karnataka Farmer Welfare and Input Assistance",
    category: "State Support",
    ministry: "State Agriculture Department",
    regionType: "state",
    states: ["Karnataka"],
    districts: [],
    summary: "State-focused benefits and agricultural support discoverable for Karnataka farmers.",
    benefits: ["State-level agricultural support", "Input and welfare assistance"],
    eligibility: ["Eligible farmers in Karnataka"],
    applicationUrl: "https://www.myscheme.gov.in/",
    sourceUrl: "https://www.myscheme.gov.in/",
    tags: ["state", "input", "welfare"],
  },
];

const normalize = (value) => String(value || "").trim().toLowerCase();

const includesNormalized = (list = [], candidate = "") =>
  list.some((item) => normalize(item) === normalize(candidate));

const normalizeExternalScheme = (scheme, index) => ({
  id: scheme.id || scheme.schemeId || scheme.scheme_id || `external-scheme-${index + 1}`,
  title: scheme.title || scheme.scheme_name || scheme.name || "Government Scheme",
  category: scheme.category || scheme.schemeCategory || "General",
  ministry: scheme.ministry || scheme.department || scheme.organisation || "Government of India",
  regionType: scheme.regionType || (scheme.state || scheme.district ? "regional" : "all-india"),
  states: Array.isArray(scheme.states) ? scheme.states : scheme.state ? [scheme.state] : [],
  districts: Array.isArray(scheme.districts) ? scheme.districts : scheme.district ? [scheme.district] : [],
  summary: scheme.summary || scheme.description || scheme.brief || "Scheme details available at the source link.",
  benefits: Array.isArray(scheme.benefits) ? scheme.benefits : scheme.benefits ? [scheme.benefits] : [],
  eligibility: Array.isArray(scheme.eligibility) ? scheme.eligibility : scheme.eligibility ? [scheme.eligibility] : [],
  applicationUrl: scheme.applicationUrl || scheme.apply_url || scheme.url || scheme.link || OFFICIAL_SOURCE.url,
  sourceUrl: scheme.sourceUrl || scheme.url || scheme.link || OFFICIAL_SOURCE.url,
  tags: Array.isArray(scheme.tags) ? scheme.tags : [],
});

const filterSchemes = (schemes, { state, district, query, category }) => {
  const normalizedQuery = normalize(query);
  const normalizedCategory = normalize(category);

  return schemes.filter((scheme) => {
    const stateMatch =
      !state ||
      scheme.regionType === "all-india" ||
      includesNormalized(scheme.states, state);

    const districtMatch =
      !district ||
      scheme.regionType === "all-india" ||
      includesNormalized(scheme.districts, district) ||
      scheme.districts.length === 0;

    const categoryMatch =
      !normalizedCategory ||
      normalize(scheme.category).includes(normalizedCategory) ||
      scheme.tags.some((tag) => normalize(tag).includes(normalizedCategory));

    const queryMatch =
      !normalizedQuery ||
      [scheme.title, scheme.summary, scheme.category, scheme.ministry, ...(scheme.tags || [])]
        .some((field) => normalize(field).includes(normalizedQuery));

    return stateMatch && districtMatch && categoryMatch && queryMatch;
  });
};

const fetchExternalSchemes = async ({ state, district, query, category, limit }) => {
  const apiUrl = process.env.GOV_SCHEMES_API_URL;
  if (!apiUrl) return null;

  const apiKey = process.env.GOV_SCHEMES_API_KEY;
  const apiAuthHeader = process.env.GOV_SCHEMES_API_AUTH_HEADER || "x-api-key";
  const headers = {};

  if (apiKey) {
    headers[apiAuthHeader] = apiKey;
  }

  const response = await axios.get(apiUrl, {
    headers,
    params: { state, district, q: query, category, limit },
    timeout: 12000,
  });

  const rawSchemes =
    response.data?.schemes ||
    response.data?.results ||
    response.data?.data ||
    response.data?.records ||
    [];

  if (!Array.isArray(rawSchemes)) return [];

  return rawSchemes.map(normalizeExternalScheme);
};

export const getGovernmentSchemes = async ({
  state = "",
  district = "",
  query = "",
  category = "",
  limit = 12,
}) => {
  try {
    const externalSchemes = await fetchExternalSchemes({ state, district, query, category, limit });
    if (externalSchemes) {
      return {
        schemes: filterSchemes(externalSchemes, { state, district, query, category }).slice(0, limit),
        source: {
          type: "external-api",
          url: process.env.GOV_SCHEMES_API_URL,
          usedFallback: false,
        },
      };
    }
  } catch (error) {
    console.error("Government schemes external API failed, using fallback:", error.message);
  }

  return {
    schemes: filterSchemes(fallbackSchemes, { state, district, query, category }).slice(0, limit),
    source: {
      ...OFFICIAL_SOURCE,
      type: "fallback",
      usedFallback: true,
    },
  };
};
