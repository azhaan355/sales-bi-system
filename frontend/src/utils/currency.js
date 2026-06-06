/**
 * Formats a numeric value into Indian Rupee (₹) currency format.
 * Example: 17192 -> ₹17,192
 * 
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted INR currency string
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};
