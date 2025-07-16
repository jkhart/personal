// Unit abbreviations and display settings
const units = {
    gram: {
        abbr: 'g',
        displayAfter: true  // true = '100g', false = 'g100'
    },
    piece: {
        abbr: 'pc',
        displayAfter: true
    },
    scoop: {
        abbr: 'sc',
        displayAfter: true
    }
};

// Function to format amount with unit
function formatUnit(amount, unit) {
    const unitConfig = units[unit];
    if (!unitConfig) {
        console.warn(`No unit configuration found for: ${unit}`);
        return `${amount} ${unit}`;
    }

    return unitConfig.displayAfter 
        ? `${amount}${unitConfig.abbr}`
        : `${unitConfig.abbr}${amount}`;
}

export { units, formatUnit };
