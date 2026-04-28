import axios from "axios";

const DEFAULT_BASE_URL =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const DEFAULT_SAMPLE_API_KEY = "579b464db66ec23bdd00000168976bd46d2743d65185a3ae3accf6e4";
const LIVE_CACHE_TTL_MS = Number(process.env.MARKET_PRICE_CACHE_TTL_MS || 2 * 60 * 1000);
const COMMODITY_CACHE_TTL_MS = Number(
  process.env.MARKET_PRICE_COMMODITY_CACHE_TTL_MS || 10 * 60 * 1000
);
const OPTIONS_MAX_RECORDS = Number(process.env.MARKET_PRICE_OPTIONS_MAX_RECORDS || 5000);
const OPTIONS_PAGE_SIZE = Math.min(Math.max(Number(process.env.MARKET_PRICE_OPTIONS_PAGE_SIZE || 500), 100), 1000);
const marketCache = new Map();
const GEOCODE_CACHE_TTL_MS = Number(process.env.MARKET_PRICE_GEOCODE_CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const geocodeCache = new Map();

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalize = (value = "") => value.toString().trim();

const buildQuery = ({ state, district, market, commodity, limit = 50, offset = 0 }) => {
  const params = {
    format: "json",
    offset,
    limit,
    "filters[state]": normalize(state),
    "filters[district]": normalize(district),
    "filters[market]": normalize(market),
    "filters[commodity]": normalize(commodity),
    fields:
      "arrival_date,state,district,market,commodity,variety,min_price,max_price,modal_price",
  };

  // Clean empty params so upstream API receives only active filters
  Object.keys(params).forEach((key) => {
    if (params[key] === "") delete params[key];
  });

  return params;
};

const transformRecord = (item) => ({
  arrivalDate: item.arrival_date || item.arrivalDate || item.date || "",
  state: item.state || item.stateName || "",
  district: item.district || item.districtName || item.city || "",
  market: item.market || item.marketName || item.mandi || "",
  commodity: item.commodity || item.commodityName || item.crop || "",
  variety: item.variety || item.varietyName || "Other",
  minPrice: toNumber(item.min_price ?? item.minPrice),
  maxPrice: toNumber(item.max_price ?? item.maxPrice),
  modalPrice: toNumber(item.modal_price ?? item.modalPrice ?? item.price),
});

const buildCacheKey = (scope, filters) =>
  `${scope}:${JSON.stringify({
    state: filters.state || "",
    district: filters.district || "",
    market: filters.market || "",
    commodity: filters.commodity || "",
    limit: filters.limit || 0,
    offset: filters.offset || 0,
  })}`;

const getCached = (key, ttlMs) => {
  const hit = marketCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > ttlMs) return null;
  return hit.value;
};

const setCached = (key, value) => {
  marketCache.set(key, { value, timestamp: Date.now() });
};

const getGeocodeCache = (key) => {
  const hit = geocodeCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > GEOCODE_CACHE_TTL_MS) return null;
  return hit.value;
};

const setGeocodeCache = (key, value) => {
  geocodeCache.set(key, { value, timestamp: Date.now() });
};

const resolveStateDistrictFilters = ({ queryState, queryDistrict, defaultState, defaultDistrict }) => {
  const stateProvided = typeof queryState === "string" && queryState.trim() !== "";
  const districtProvided = typeof queryDistrict === "string" && queryDistrict.trim() !== "";
  const state = stateProvided ? queryState : defaultState || "";

  // If user explicitly changes state but does not choose district yet,
  // do not force profile district from another state.
  let district = "";
  if (districtProvided) district = queryDistrict;
  else if (!stateProvided) district = defaultDistrict || "";

  return { state, district };
};

const fetchMarketData = async (filters) => {
  // Single key strategy for both /live and /commodities.
  const baseURL = process.env.AGMARKRATE_API_BASE_URL || DEFAULT_BASE_URL;
  const timeoutMs = Number(process.env.AGMARKRATE_API_TIMEOUT_MS || 7000);
  const allowSampleInDev =
    process.env.NODE_ENV !== "production" && process.env.AGMARKRATE_ALLOW_SAMPLE_KEY !== "false";
  const apiKey = process.env.AGMARKRATE_API_KEY || (allowSampleInDev ? DEFAULT_SAMPLE_API_KEY : "");

  if (!apiKey) {
    const e = new Error("Missing AGMARKRATE_API_KEY in backend environment.");
    e.status = 500;
    throw e;
  }

  if (!process.env.AGMARKRATE_API_KEY && allowSampleInDev) {
    console.warn("Using sample AGMARK API key in development. Add AGMARKRATE_API_KEY for full data access.");
  }

  const query = buildQuery(filters);
  const headers = {};
  if (apiKey && process.env.AGMARKRATE_API_KEY_HEADER) {
    headers[process.env.AGMARKRATE_API_KEY_HEADER] = apiKey;
  }
  if (apiKey && process.env.AGMARKRATE_BEARER_AUTH === "true") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  // Keep default `api-key` query support unless explicitly disabled.
  if (process.env.AGMARKRATE_DISABLE_QUERY_API_KEY !== "true" && apiKey) {
    query["api-key"] = apiKey;
  }

  const response = await axios.get(baseURL, {
    params: query,
    headers,
    timeout: timeoutMs,
  });

  // Support multiple payload shapes commonly used by market APIs.
  const records = Array.isArray(response.data?.records)
    ? response.data.records
    : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.result)
        ? response.data.result
        : Array.isArray(response.data)
          ? response.data
          : [];

  return {
    source: process.env.AGMARKRATE_API_BASE_URL ? "agmarkrate" : "agmarknet",
    count: Number(response.data?.count || records.length || 0),
    total: Number(
      response.data?.total ||
        response.data?.totalRecords ||
        response.data?.total_count ||
        records.length ||
        0
    ),
    records: records.map(transformRecord),
    sourceUpdatedAt: new Date().toISOString(),
  };
};

const fetchMarketDataPaginated = async (baseFilters) => {
  const pageLimit = Math.min(OPTIONS_PAGE_SIZE, OPTIONS_MAX_RECORDS);
  let offset = 0;
  let collected = [];
  let declaredTotal = null;

  while (collected.length < OPTIONS_MAX_RECORDS) {
    const page = await fetchMarketData({
      ...baseFilters,
      limit: Math.min(pageLimit, OPTIONS_MAX_RECORDS - collected.length),
      offset,
    });

    const pageRows = Array.isArray(page.records) ? page.records : [];
    if (!pageRows.length) break;

    collected = collected.concat(pageRows);

    if (Number.isFinite(Number(page.total))) {
      declaredTotal = Number(page.total);
    }

    offset += pageRows.length;

    if (pageRows.length < pageLimit) break;
    if (declaredTotal !== null && offset >= declaredTotal) break;
  }

  return {
    records: collected,
    total: declaredTotal ?? collected.length,
  };
};

export const getLiveMarketPrices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!["farmer", "merchant"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only farmer and merchant accounts can access live market prices." });
    }

    const defaultState = req.user.role === "farmer" ? req.user.state : req.user.merchantState;
    const defaultDistrict = req.user.role === "farmer" ? req.user.district : req.user.city;

    const region = resolveStateDistrictFilters({
      queryState: req.query.state,
      queryDistrict: req.query.district,
      defaultState,
      defaultDistrict,
    });
    const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 100);
    const filters = {
      state: region.state,
      district: region.district,
      market: req.query.market || "",
      commodity: req.query.commodity || "",
      limit,
      offset: Number(req.query.offset || 0),
    };

    const cacheKey = buildCacheKey("live", filters);
    const cached = getCached(cacheKey, LIVE_CACHE_TTL_MS);
    if (cached) {
      return res.status(200).json({
        ...cached,
        cache: { hit: true, ttlMs: LIVE_CACHE_TTL_MS },
      });
    }

    const data = await fetchMarketData(filters);
    const payload = {
      message: "Live market prices fetched successfully",
      region: {
        state: filters.state,
        district: filters.district,
      },
      filters: {
        commodity: filters.commodity || null,
        market: filters.market || null,
      },
      ...data,
    };
    setCached(cacheKey, payload);
    return res.status(200).json({ ...payload, cache: { hit: false, ttlMs: LIVE_CACHE_TTL_MS } });
  } catch (error) {
    const upstreamStatus = error.response?.status || 500;
    const upstreamError =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.statusText ||
      error.message;

    if (upstreamStatus === 429) {
      const region = resolveStateDistrictFilters({
        queryState: req.query.state,
        queryDistrict: req.query.district,
        defaultState: req.user?.role === "farmer" ? req.user?.state : req.user?.merchantState,
        defaultDistrict: req.user?.role === "farmer" ? req.user?.district : req.user?.city,
      });
      const filters = {
        state: region.state,
        district: region.district,
        market: req.query.market || "",
        commodity: req.query.commodity || "",
        limit: Math.min(Math.max(Number(req.query.limit || 30), 1), 100),
        offset: Number(req.query.offset || 0),
      };
      const cacheKey = buildCacheKey("live", filters);
      const staleCache = marketCache.get(cacheKey)?.value;
      if (staleCache) {
        return res.status(200).json({
          ...staleCache,
          cache: { hit: true, stale: true, reason: "rate_limited" },
          warning: "Upstream rate-limited. Showing recently cached prices.",
        });
      }
    }

    return res.status(upstreamStatus >= 400 ? upstreamStatus : 500).json({
      message: "Unable to fetch live market prices right now.",
      error: upstreamError,
    });
  }
};

export const getCommodityOptions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!["farmer", "merchant"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only farmer and merchant accounts can access live market prices." });
    }

    const defaultState = req.user.role === "farmer" ? req.user.state : req.user.merchantState;
    const defaultDistrict = req.user.role === "farmer" ? req.user.district : req.user.city;

    const region = resolveStateDistrictFilters({
      queryState: req.query.state,
      queryDistrict: req.query.district,
      defaultState,
      defaultDistrict,
    });
    const filters = {
      state: region.state,
      district: region.district,
      limit: Math.min(Math.max(Number(req.query.limit || 100), 10), 300),
      offset: 0,
      market: "",
      commodity: "",
    };

    const cacheKey = buildCacheKey("commodities", filters);
    const cached = getCached(cacheKey, COMMODITY_CACHE_TTL_MS);
    if (cached) {
      return res.status(200).json({
        ...cached,
        cache: { hit: true, ttlMs: COMMODITY_CACHE_TTL_MS },
      });
    }

    const data = await fetchMarketDataPaginated(filters);
    const options = [...new Set(data.records.map((r) => r.commodity).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );

    const payload = {
      message: "Commodity options fetched successfully",
      region: { state: filters.state, district: filters.district },
      options,
      total: options.length,
    };
    setCached(cacheKey, payload);
    return res.status(200).json({
      ...payload,
      cache: { hit: false, ttlMs: COMMODITY_CACHE_TTL_MS },
    });
  } catch (error) {
    const upstreamStatus = error.response?.status || 500;
    const upstreamError =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.statusText ||
      error.message;

    if (upstreamStatus === 429) {
      const region = resolveStateDistrictFilters({
        queryState: req.query.state,
        queryDistrict: req.query.district,
        defaultState: req.user?.role === "farmer" ? req.user?.state : req.user?.merchantState,
        defaultDistrict: req.user?.role === "farmer" ? req.user?.district : req.user?.city,
      });
      const filters = {
        state: region.state,
        district: region.district,
        limit: Math.min(Math.max(Number(req.query.limit || 100), 10), 300),
        offset: 0,
        market: "",
        commodity: "",
      };
      const cacheKey = buildCacheKey("commodities", filters);
      const staleCache = marketCache.get(cacheKey)?.value;
      if (staleCache) {
        return res.status(200).json({
          ...staleCache,
          cache: { hit: true, stale: true, reason: "rate_limited" },
          warning: "Upstream rate-limited. Showing recently cached commodities.",
        });
      }
    }

    return res.status(upstreamStatus >= 400 ? upstreamStatus : 500).json({
      message: "Unable to fetch commodities right now.",
      error: upstreamError,
    });
  }
};

export const getRegionOptions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!["farmer", "merchant"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only farmer and merchant accounts can access region options." });
    }

    const level = req.query.level || "districts";
    const defaultState = req.user.role === "farmer" ? req.user.state : req.user.merchantState;
    const defaultDistrict = req.user.role === "farmer" ? req.user.district : req.user.city;

    const region = resolveStateDistrictFilters({
      queryState: req.query.state,
      queryDistrict: req.query.district,
      defaultState,
      defaultDistrict,
    });
    const filters = {
      state: region.state,
      district: region.district,
      market: "",
      commodity: "",
      limit: Math.min(Math.max(Number(req.query.limit || 300), 50), 500),
      offset: Number(req.query.offset || 0),
    };

    const cacheKey = buildCacheKey(`options-${level}`, filters);
    const cached = getCached(cacheKey, COMMODITY_CACHE_TTL_MS);
    if (cached) {
      return res.status(200).json({ ...cached, cache: { hit: true, ttlMs: COMMODITY_CACHE_TTL_MS } });
    }

    const data = await fetchMarketDataPaginated(filters);
    let options = [];
    if (level === "districts") {
      options = [...new Set(data.records.map((row) => row.district).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      );
    } else if (level === "markets") {
      options = [...new Set(data.records.map((row) => row.market).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      );
    } else {
      return res.status(400).json({ message: "Invalid level. Use 'districts' or 'markets'." });
    }

    const payload = {
      message: `${level} options fetched successfully`,
      level,
      region: { state: filters.state, district: filters.district },
      options,
      total: options.length,
    };
    setCached(cacheKey, payload);
    return res.status(200).json({ ...payload, cache: { hit: false, ttlMs: COMMODITY_CACHE_TTL_MS } });
  } catch (error) {
    const upstreamStatus = error.response?.status || 500;
    const upstreamError =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.statusText ||
      error.message;

    return res.status(upstreamStatus >= 400 ? upstreamStatus : 500).json({
      message: "Unable to fetch region options right now.",
      error: upstreamError,
    });
  }
};

export const geocodeRegionPoint = async (req, res) => {
  try {
    const state = normalize(req.query.state);
    const district = normalize(req.query.district);
    const market = normalize(req.query.market);

    if (!state && !district && !market) {
      return res.status(400).json({ message: "Provide at least one of state, district, or market." });
    }

    const searchText = [market, district, state, "India"].filter(Boolean).join(", ");
    const cacheKey = searchText.toLowerCase();
    const cached = getGeocodeCache(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cache: { hit: true, ttlMs: GEOCODE_CACHE_TTL_MS } });
    }

    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: searchText,
        format: "jsonv2",
        limit: 1,
      },
      headers: {
        "User-Agent": "GreenTrace/1.0 (market-map-support)",
      },
      timeout: 6000,
    });

    const item = Array.isArray(response.data) ? response.data[0] : null;
    if (!item) {
      return res.status(404).json({ message: "Coordinates not found for this location." });
    }

    const payload = {
      query: searchText,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      displayName: item.display_name || "",
    };
    setGeocodeCache(cacheKey, payload);
    return res.status(200).json({ ...payload, cache: { hit: false, ttlMs: GEOCODE_CACHE_TTL_MS } });
  } catch (error) {
    const upstreamStatus = error.response?.status || 500;
    const upstreamError =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.statusText ||
      error.message;

    return res.status(upstreamStatus >= 400 ? upstreamStatus : 500).json({
      message: "Unable to geocode location right now.",
      error: upstreamError,
    });
  }
};
