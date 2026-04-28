import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { marketPriceAPI } from "../utils/api";

const formatPrice = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `₹${Number(value).toLocaleString("en-IN")}`;
};

const formatDateTime = (isoText) => {
  if (!isoText) return "-";
  const dt = new Date(isoText);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh",
];

/* ── Reusable dropdown field ── */
const SelectField = ({ label, icon, value, onChange, disabled, placeholder, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
      <span>{icon}</span> {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: `1.5px solid ${disabled ? "#e5e7eb" : value ? "#16a34a" : "#d1d5db"}`,
        fontSize: 15,
        color: value ? "#111827" : "#9ca3af",
        background: disabled ? "#f9fafb" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        transition: "border-color 0.15s",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: 36,
      }}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  </div>
);

/* ── Price summary cards ── */
const PriceSummaryCard = ({ commodity, minPrice, modalPrice, maxPrice, market, district, arrivalDate }) => (
  <div
    style={{
      background: "#fff",
      border: "1.5px solid #e5e7eb",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "border-color 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#86efac")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{commodity}</p>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{market} · {district}</p>
      </div>
      <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{arrivalDate}</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
      {[
        { label: "Min", value: formatPrice(minPrice), color: "#dc2626", bg: "#fef2f2" },
        { label: "Modal", value: formatPrice(modalPrice), color: "#15803d", bg: "#f0fdf4" },
        { label: "Max", value: formatPrice(maxPrice), color: "#1d4ed8", bg: "#eff6ff" },
      ].map(({ label, value, color, bg }) => (
        <div key={label} style={{ background: bg, borderRadius: 8, padding: "8px 0", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 2px", fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 14, fontWeight: 700, color, margin: 0 }}>{value}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════ */
const MarketPrices = () => {
  const { user } = useAuth();

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [commodity, setCommodity] = useState("");

  const [districtOptions, setDistrictOptions] = useState([]);
  const [marketOptions, setMarketOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);

  const [prices, setPrices] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [error, setError] = useState("");

  /* Pre-fill from user profile */
  const defaultState = useMemo(() => {
    if (!user) return "";
    return user.role === "farmer" ? user.state || "" : user.merchantState || "";
  }, [user]);

  const defaultDistrict = useMemo(() => {
    if (!user) return "";
    return user.role === "farmer" ? user.district || "" : user.city || "";
  }, [user]);

  useEffect(() => {
    setSelectedState(defaultState);
    setSelectedDistrict(defaultDistrict);
  }, [defaultState, defaultDistrict]);

  /* ── API: fetch districts on state change ── */
  useEffect(() => {
    if (!selectedState) { setDistrictOptions([]); setSelectedDistrict(""); return; }
    setLoadingDistricts(true);
    setDistrictOptions([]);
    setSelectedDistrict("");
    setMarketOptions([]);
    setSelectedMarket("");
    marketPriceAPI
      .getOptions({ level: "districts", state: selectedState, limit: 350 })
      .then((r) => setDistrictOptions(r.data.options || []))
      .catch(() => setDistrictOptions([]))
      .finally(() => setLoadingDistricts(false));
  }, [selectedState]); // eslint-disable-line

  /* ── API: fetch markets on district change ── */
  useEffect(() => {
    if (!selectedState || !selectedDistrict) { setMarketOptions([]); setSelectedMarket(""); return; }
    setLoadingMarkets(true);
    setMarketOptions([]);
    setSelectedMarket("");
    marketPriceAPI
      .getOptions({ level: "markets", state: selectedState, district: selectedDistrict, limit: 350 })
      .then((r) => setMarketOptions(r.data.options || []))
      .catch(() => setMarketOptions([]))
      .finally(() => setLoadingMarkets(false));
  }, [selectedDistrict]); // eslint-disable-line

  /* ── API: fetch commodities ── */
  useEffect(() => {
    if (!selectedState) { setCommodityOptions([]); return; }
    marketPriceAPI
      .getCommodities({ state: selectedState, district: selectedDistrict || undefined, limit: 200 })
      .then((r) => setCommodityOptions(r.data.options || []))
      .catch(() => setCommodityOptions([]));
  }, [selectedState, selectedDistrict]); // eslint-disable-line

  /* ── API: fetch prices ── */
  const fetchPrices = async ({ silent = false } = {}) => {
    if (!selectedState) return;
    try {
      silent ? setRefreshing(true) : setLoading(true);
      setError("");
      const response = await marketPriceAPI.getLive({
        state: selectedState || undefined,
        district: selectedDistrict || undefined,
        market: selectedMarket || undefined,
        commodity: commodity || undefined,
        limit: 60,
      });
      setPrices(response.data.records || []);
      setLastUpdatedAt(response.data.sourceUpdatedAt || new Date().toISOString());
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to fetch prices.");
      setPrices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchPrices(), 500);
    return () => clearTimeout(t);
  }, [selectedState, selectedDistrict, selectedMarket, commodity]); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => fetchPrices({ silent: true }), 300000);
    return () => clearInterval(id);
  }, [selectedState, selectedDistrict, selectedMarket, commodity]); // eslint-disable-line

  const hasSelection = !!selectedState;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, padding: "4px 0" }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: 0 }}>Market Prices</h1>
        <p style={{ color: "#6b7280", marginTop: 4, fontSize: 14, margin: "4px 0 0" }}>
          Live mandi prices — select your location to see today's rates.
        </p>
      </div>

      {/* ── Location selector card ── */}
      <div
        style={{
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            📍
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Select Your Location</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Choose state, then district to see prices</p>
          </div>
        </div>

        {/* Dropdowns — responsive grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {/* State */}
          <SelectField
            label="State"
            icon="🗺️"
            value={selectedState}
            onChange={(v) => setSelectedState(v)}
            placeholder="Select state…"
          >
            {INDIA_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>

          {/* District */}
          <SelectField
            label="District"
            icon="🏘️"
            value={selectedDistrict}
            onChange={(v) => setSelectedDistrict(v)}
            disabled={!selectedState || loadingDistricts}
            placeholder={
              !selectedState ? "Select state first" :
              loadingDistricts ? "Loading…" :
              districtOptions.length === 0 ? "No districts found" :
              "Select district…"
            }
          >
            {districtOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </SelectField>

          {/* Market — optional */}
          <SelectField
            label="Market (optional)"
            icon="🏪"
            value={selectedMarket}
            onChange={(v) => setSelectedMarket(v)}
            disabled={!selectedDistrict || loadingMarkets}
            placeholder={
              !selectedDistrict ? "Select district first" :
              loadingMarkets ? "Loading…" :
              marketOptions.length === 0 ? "No markets found" :
              "All markets"
            }
          >
            {marketOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </SelectField>

          {/* Crop — optional */}
          <SelectField
            label="Crop (optional)"
            icon="🌾"
            value={commodity}
            onChange={(v) => setCommodity(v)}
            disabled={!selectedState}
            placeholder={!selectedState ? "Select state first" : "All crops"}
          >
            {commodityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectField>
        </div>

        {/* Active filters summary + refresh */}
        {hasSelection && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              paddingTop: 12,
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Showing:</span>
              {[selectedState, selectedDistrict, selectedMarket, commodity].filter(Boolean).map((v, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                    borderRadius: 20,
                    padding: "2px 10px",
                    fontWeight: 600,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {lastUpdatedAt && (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  Updated: <strong style={{ color: "#6b7280" }}>{formatDateTime(lastUpdatedAt)}</strong>
                </span>
              )}
              <button
                onClick={() => fetchPrices()}
                disabled={refreshing}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "#15803d",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  border: "none",
                  cursor: refreshing ? "not-allowed" : "pointer",
                  opacity: refreshing ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {refreshing ? "↻ Refreshing…" : "↻ Refresh"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Empty state — no state selected ── */}
      {!hasSelection && (
        <div
          style={{
            textAlign: "center",
            padding: "56px 24px",
            background: "#fafafa",
            border: "1.5px dashed #d1d5db",
            borderRadius: 16,
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 12 }}>🌾</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#374151", margin: "0 0 6px" }}>
            Select your state to get started
          </p>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
            Choose a state above to see live mandi prices near you.
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {hasSelection && loading && (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div
            style={{
              width: 38,
              height: 38,
              border: "3px solid #e5e7eb",
              borderTopColor: "#15803d",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Fetching latest prices…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#b91c1c",
            fontSize: 14,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── Price results ── */}
      {!loading && !error && hasSelection && (
        <>
          {/* Result count header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
              Price Results
              {prices.length > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                    borderRadius: 20,
                    padding: "2px 10px",
                    fontWeight: 600,
                  }}
                >
                  {prices.length} records
                </span>
              )}
            </p>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>₹ per quintal</span>
          </div>

          {prices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 24px",
                background: "#fafafa",
                border: "1.5px dashed #d1d5db",
                borderRadius: 16,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>No prices found</p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Try selecting a different district or removing the crop filter.
              </p>
            </div>
          ) : (
            /* Card grid */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {prices.map((row, idx) => (
                <PriceSummaryCard
                  key={`${row.commodity}-${row.market}-${row.arrivalDate}-${idx}`}
                  commodity={row.commodity || "-"}
                  minPrice={row.minPrice}
                  modalPrice={row.modalPrice}
                  maxPrice={row.maxPrice}
                  market={row.market || "-"}
                  district={row.district || "-"}
                  arrivalDate={row.arrivalDate || "-"}
                />
              ))}
            </div>
          )}

          {/* Full table — collapsed below cards for detail view */}
          {prices.length > 0 && (
            <details style={{ marginTop: 4 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#6b7280",
                  padding: "10px 0",
                  userSelect: "none",
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>▸</span> View full table with all columns
              </summary>
              <div
                style={{
                  marginTop: 12,
                  background: "#fff",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {["Date", "Crop", "Variety", "Market", "District", "Min", "Modal", "Max"].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 14px",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#6b7280",
                              textAlign: i >= 5 ? "right" : "left",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((row, idx) => (
                        <tr
                          key={`${row.commodity}-${row.market}-${row.arrivalDate}-${idx}`}
                          style={{ borderTop: idx === 0 ? "none" : "1px solid #f3f4f6" }}
                        >
                          <td style={{ padding: "9px 14px", fontSize: 13, color: "#6b7280" }}>{row.arrivalDate || "-"}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{row.commodity || "-"}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13, color: "#6b7280" }}>{row.variety || "-"}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13, color: "#374151" }}>{row.market || "-"}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13, color: "#374151" }}>{row.district || "-"}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13, color: "#dc2626", textAlign: "right" }}>{formatPrice(row.minPrice)}</td>
                          <td style={{ padding: "9px 14px", fontSize: 14, fontWeight: 700, color: "#15803d", textAlign: "right" }}>{formatPrice(row.modalPrice)}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13, color: "#1d4ed8", textAlign: "right" }}>{formatPrice(row.maxPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
};

export default MarketPrices;