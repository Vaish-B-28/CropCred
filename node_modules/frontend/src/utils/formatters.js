/**
 * formatters.js
 * Utility functions to format dates, numbers, and strings
 */

// Format date (YYYY-MM-DD -> 10 March 2025)
export const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Format numbers with commas (e.g. 10000 -> 10,000)
export const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

// Format to currency (₹ Indian Rupees or $ etc.)
export const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
};

// Shorten text (crop description previews)
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
