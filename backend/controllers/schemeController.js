import axios from "axios";

const normalize = (value = "") => value.toString().trim().toLowerCase();

const FALLBACK_SCHEMES = [
  {
    id: "pm-kisan",
    title: "PM-KISAN Samman Nidhi",
    description: "Income support of Rs. 6,000 per year for eligible farmer families in three installments.",
    benefits: "Direct cash support to reduce seasonal financial stress.",
    eligibility: "Small and marginal farmer families with cultivable land, subject to government rules.",
    applyLink: "https://pmkisan.gov.in/",
    states: ["all"],
  },
  {
    id: "pmfby",
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description: "Crop insurance support against natural calamities, pests, and diseases.",
    benefits: "Helps recover financial loss due to crop damage.",
    eligibility: "Farmers growing notified crops in notified areas.",
    applyLink: "https://pmfby.gov.in/",
    states: ["all"],
  },
  {
    id: "kcc",
    title: "Kisan Credit Card (KCC)",
    description: "Short-term credit support for crop cultivation and allied activities.",
    benefits: "Low-interest institutional credit and flexible repayment support.",
    eligibility: "Farmers, tenant farmers, and sharecroppers as per bank norms.",
    applyLink: "https://www.myscheme.gov.in/schemes/kcc",
    states: ["all"],
  },
  {
    id: "soil-health",
    title: "Soil Health Card Scheme",
    description: "Periodic soil testing and nutrient recommendations for better crop planning.",
    benefits: "Improves yield and reduces unnecessary fertilizer usage.",
    eligibility: "All farmers can avail soil testing support through local agriculture offices.",
    applyLink: "https://soilhealth.dac.gov.in/",
    states: ["all"],
  },
  {
    id: "kalia",
    title: "KALIA Scheme",
    description: "Livelihood and income support for farmers and landless agricultural households.",
    benefits: "Financial assistance for cultivation and allied activities.",
    eligibility: "Eligible farmer and landless households in Odisha.",
    applyLink: "https://kalia.odisha.gov.in/",
    states: ["odisha"],
  },
  {
    id: "rythu-bandhu",
    title: "Rythu Bandhu",
    description: "Investment support for farmers for each crop season.",
    benefits: "Direct per-acre assistance for input expenses.",
    eligibility: "Eligible land-owning farmers in Telangana.",
    applyLink: "https://rythubandhu.telangana.gov.in/",
    states: ["telangana"],
  },
  {
    id: "rythu-bharosa",
    title: "YSR Rythu Bharosa",
    description: "Annual financial support for farmers in Andhra Pradesh.",
    benefits: "Input-cost support to improve farm operations.",
    eligibility: "Eligible farmers in Andhra Pradesh.",
    applyLink: "https://ysrrythubharosa.ap.gov.in/",
    states: ["andhra pradesh"],
  },
  {
    id: "krishak-bandhu",
    title: "Krishak Bandhu",
    description: "Income assistance and social security support for farmers in West Bengal.",
    benefits: "Seasonal income support and death benefit assistance.",
    eligibility: "Eligible farmers in West Bengal.",
    applyLink: "https://krishakbandhu.net/",
    states: ["west bengal"],
  },
  {
    id: "mukhya-mantri-kisan-kalyan",
    title: "Mukhyamantri Kisan Kalyan Yojana",
    description: "Additional state-level financial support for farmers.",
    benefits: "Supplementary direct benefit along with central support.",
    eligibility: "Eligible farmers in Madhya Pradesh.",
    applyLink: "https://saara.mp.gov.in/",
    states: ["madhya pradesh"],
  },
];

const mapExternalScheme = (item, fallbackIdPrefix = "external") => {
  const name =
    item?.title ||
    item?.scheme_name ||
    item?.name ||
    item?.schemeTitle ||
    item?.SchemeName;

  if (!name) {
    return null;
  }

  return {
    id: item?.id || `${fallbackIdPrefix}-${normalize(name).replace(/\s+/g, "-")}`,
    title: name,
    description:
      item?.description ||
      item?.summary ||
      item?.details ||
      "No description available.",
    benefits: item?.benefits || item?.benefit || "Check official page for benefit details.",
    eligibility:
      item?.eligibility || item?.eligibilityCriteria || "Check official page for eligibility details.",
    applyLink:
      item?.apply_link ||
      item?.url ||
      item?.website ||
      item?.official_link ||
      "https://www.myscheme.gov.in/",
    states: Array.isArray(item?.states) && item.states.length > 0 ? item.states : ["all"],
  };
};

const filterByRegion = (schemes, state) => {
  const userState = normalize(state);
  return schemes.filter((scheme) => {
    const schemeStates = Array.isArray(scheme.states) ? scheme.states.map(normalize) : ["all"];
    return schemeStates.includes("all") || schemeStates.includes(userState);
  });
};

const fetchSchemesFromApi = async ({ state, district, village }) => {
  const apiUrl = process.env.GOV_SCHEMES_API_URL;
  if (!apiUrl) return [];

  const response = await axios.get(apiUrl, {
    params: {
      state,
      district,
      village,
      limit: 50,
      ...(process.env.GOV_SCHEMES_API_KEY ? { apiKey: process.env.GOV_SCHEMES_API_KEY } : {}),
    },
    timeout: 3500,
  });

  const rawList = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.schemes)
      ? response.data.schemes
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

  return rawList.map((item) => mapExternalScheme(item)).filter(Boolean);
};

export const getFarmerSchemes = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can access scheme suggestions." });
    }

    const state = req.user?.state || "";
    const district = req.user?.district || "";
    const village = req.user?.village || "";

    let source = "fallback";
    let schemes = [];

    try {
      const externalSchemes = await fetchSchemesFromApi({ state, district, village });
      if (externalSchemes.length > 0) {
        source = "api";
        schemes = filterByRegion(externalSchemes, state);
      }
    } catch (error) {
      console.warn("Government schemes API unavailable, using fallback dataset.");
    }

    if (schemes.length === 0) {
      schemes = filterByRegion(FALLBACK_SCHEMES, state);
      source = "fallback";
    }

    return res.status(200).json({
      source,
      region: { state, district, village },
      total: schemes.length,
      schemes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch government schemes at the moment.",
      error: error.message,
    });
  }
};
