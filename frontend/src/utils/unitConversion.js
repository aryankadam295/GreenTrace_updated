const WEIGHT_UNIT_TO_KG = {
  kg: 1,
  quintal: 100,
  ton: 1000
};

export const isWeightUnit = (unit) => Object.prototype.hasOwnProperty.call(WEIGHT_UNIT_TO_KG, unit);

export const getCompatibleUnits = (productUnit) => {
  if (isWeightUnit(productUnit)) {
    return ["kg", "quintal", "ton"];
  }
  return [productUnit];
};

export const convertQuantity = (quantity, fromUnit, toUnit) => {
  const numericQuantity = Number(quantity);

  if (!Number.isFinite(numericQuantity)) {
    return 0;
  }

  if (fromUnit === toUnit) {
    return numericQuantity;
  }

  if (isWeightUnit(fromUnit) && isWeightUnit(toUnit)) {
    const quantityInKg = numericQuantity * WEIGHT_UNIT_TO_KG[fromUnit];
    return quantityInKg / WEIGHT_UNIT_TO_KG[toUnit];
  }

  return numericQuantity;
};

export const getUnitStep = (unit) => {
  if (unit === "kg") return 1;
  if (unit === "quintal") return 0.01; // 1 kg
  if (unit === "ton") return 0.001; // 1 kg
  return 1;
};

export const getDefaultPurchaseUnit = (productUnit) => {
  if (isWeightUnit(productUnit)) {
    return "kg";
  }
  return productUnit;
};
