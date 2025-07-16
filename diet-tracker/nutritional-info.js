import config from './config.js';

// Nutritional information per serving
const nutritionalInfo = {
    // Breakfast items
    powderedGreens: {
        servingSize: 1,
        servingUnit: 'scoop',
        protein: 2,
        carbs: 6,
        fat: 0,
        fiber: 2,
        calories: 32
    },
    sourdough: {
        servingSize: 35,
        servingUnit: 'gram',
        protein: 3,
        carbs: 19,
        fat: 0,
        fiber: 0,
        calories: 88
    },
    peanutButter: {
        servingSize: 32,
        servingUnit: 'gram',
        protein: 7,
        carbs: 6,
        fat: 16,
        fiber: 0,
        calories: 196
    },
    wheyIsolate: {
        servingSize: 32.5,
        servingUnit: 'gram',
        protein: 25,
        carbs: 3,
        fat: 1,
        fiber: 0,
        calories: 121
    },
    vitaminGummy: {
        servingSize: 2,
        servingUnit: 'piece',
        protein: 4,
        carbs: 0,
        fat: 0,
        fiber: 0,
        calories: 16
    },
    // Handle all milk entries
    breakfastMilk: {
        servingSize: 240,
        servingUnit: 'gram',
        protein: 8,
        carbs: 12,
        fat: 9,
        fiber: 0,
        calories: 161
    },
    lunchMilk: {
        servingSize: 240,
        servingUnit: 'gram',
        protein: 8,
        carbs: 12,
        fat: 9,
        fiber: 0,
        calories: 161
    },
    dinnerMilk: {
        servingSize: 240,
        servingUnit: 'gram',
        protein: 8,
        carbs: 12,
        fat: 9,
        fiber: 0,
        calories: 161
    },
    dessertMilk: {
        servingSize: 240,
        servingUnit: 'gram',
        protein: 8,
        carbs: 12,
        fat: 9,
        fiber: 0,
        calories: 161
    },
    // Handle all banana entries
    breakfastBanana: {
        servingSize: 118,
        servingUnit: 'gram',
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        fiber: 0,
        calories: 116.8
    },
    dessertBanana: {
        servingSize: 118,
        servingUnit: 'gram',
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        fiber: 0,
        calories: 116.8
    },
    // Lunch items
    sweetPotato: {
        servingSize: 133,
        servingUnit: 'gram',
        protein: 2,
        carbs: 27,
        fat: 0,
        fiber: 0,
        calories: 116
    },
    chickenThighs: {
        servingSize: 112,
        servingUnit: 'gram',
        protein: 21,
        carbs: 0,
        fat: 6,
        fiber: 0,
        calories: 138
    },
    butter: {
        servingSize: 14,
        servingUnit: 'gram',
        protein: 0,
        carbs: 0,
        fat: 11,
        fiber: 0,
        calories: 99
    },
    broccoli: {
        servingSize: 90,
        servingUnit: 'gram',
        protein: 2,
        carbs: 6,
        fat: 0,
        fiber: 2,
        calories: 32
    },
    // Dinner items
    whiteRice: {
        servingSize: 45,
        servingUnit: 'gram',
        protein: 3,
        carbs: 37,
        fat: 0,
        fiber: 0,
        calories: 160
    },
    spinach: {
        servingSize: 100,
        servingUnit: 'gram',
        protein: 2.9,
        carbs: 3.6,
        fat: 0.4,
        fiber: 0,
        calories: 29.6
    },
    sirloin: {
        servingSize: 84,
        servingUnit: 'gram',
        protein: 19,
        carbs: 1,
        fat: 5,
        fiber: 0,
        calories: 125
    },
    eggs: {
        servingSize: 1,
        servingUnit: 'piece',
        protein: 6.3,
        carbs: 0.4,
        fat: 4.8,
        fiber: 0,
        calories: 70
    },
    // Dessert items
    yogurt: {
        servingSize: 170,
        servingUnit: 'gram',
        protein: 18,
        carbs: 5,
        fat: 0,
        fiber: 0,
        calories: 92
    },
    creatine: {
        servingSize: 5,
        servingUnit: 'gram',
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        calories: 0
    },
    ancientGrains: {
        servingSize: 55,
        servingUnit: 'gram',
        protein: 5,
        carbs: 39,
        fat: 9,
        fiber: 0,
        calories: 257
    },
    almondButter: {
        servingSize: 32,
        servingUnit: 'gram',
        protein: 6,
        carbs: 7,
        fat: 17,
        fiber: 0,
        calories: 205
    }
};

// Function to calculate nutrition for a given amount
function calculateNutrition(itemId, amount, unit) {
    // Check if it's a user-added item (starts with 'user_')
    if (itemId.startsWith('user_')) {
        // For user-added items, return their nutrition directly
        // since it's already calculated for their specified amount
        const userItem = config.dietItems.find(item => item.id === itemId);
        if (userItem && userItem.nutrition) {
            return userItem.nutrition;
        }
        console.warn(`No nutritional information found for user item ${itemId}`);
        return null;
    }

    // Handle built-in items
    const info = nutritionalInfo[itemId];
    if (!info) {
        console.warn(`No nutritional information found for ${itemId}`);
        return null;
    }

    // Convert amount to the same unit as serving size if needed
    let multiplier = amount / info.servingSize;

    return {
        protein: Math.round(info.protein * multiplier * 10) / 10,
        carbs: Math.round(info.carbs * multiplier * 10) / 10,
        fat: Math.round(info.fat * multiplier * 10) / 10,
        fiber: Math.round(info.fiber * multiplier * 10) / 10,
        calories: Math.round(info.calories * multiplier * 10) / 10
    };
}

export { nutritionalInfo, calculateNutrition };
