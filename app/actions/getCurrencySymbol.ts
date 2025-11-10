import currencyMap from "../../currencyMap.json"; // Import the JSON map of currency codes and symbols

const getCurrencySymbol = (currencyCode) => {
  // Check if currencyCode exists in the currencyMap
  if (currencyMap[currencyCode]) {
    return currencyMap[currencyCode];
  }
  return "$";
};

export default getCurrencySymbol;
