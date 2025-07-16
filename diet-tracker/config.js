// Diet items configuration with meal categories
const builtInItems = [
    // Breakfast items
    { id: 'powderedGreens', name: 'Powdered Greens', category: 'breakfast', amount: 1, unit: 'scoop' },
    { id: 'sourdough', name: 'Sourdough', category: 'breakfast', amount: 50, unit: 'gram' },
    { id: 'peanutButter', name: 'Peanut Butter', category: 'breakfast', amount: 25, unit: 'gram' },
    { id: 'wheyIsolate', name: 'MyProtein Whey Isolate', category: 'breakfast', amount: 25, unit: 'gram' },
    { id: 'vitaminGummy', name: 'Multivitamin Gummy', category: 'breakfast', amount: 1, unit: 'piece' },
    { id: 'breakfastMilk', name: 'Milk', category: 'breakfast', amount: 400, unit: 'gram' },
    { id: 'breakfastBanana', name: 'Banana', category: 'breakfast', amount: 100, unit: 'gram' },

    // Lunch items
    { id: 'sweetPotato', name: 'Sweet Potato', category: 'lunch', amount: 200, unit: 'gram' },
    { id: 'lunchMilk', name: 'Milk', category: 'lunch', amount: 220, unit: 'gram' },
    { id: 'chickenThighs', name: 'Chicken Thighs', category: 'lunch', amount: 150, unit: 'gram' },
    { id: 'butter', name: 'Butter', category: 'lunch', amount: 4, unit: 'gram' },
    { id: 'broccoli', name: 'Broccoli', category: 'lunch', amount: 100, unit: 'gram' },

    // Dinner items
    { id: 'whiteRice', name: 'White Rice', category: 'dinner', amount: 50, unit: 'gram' },
    { id: 'spinach', name: 'Spinach', category: 'dinner', amount: 100, unit: 'gram' },
    { id: 'sirloin', name: 'Sous-Vide Sirloin', category: 'dinner', amount: 125, unit: 'gram' },
    { id: 'dinnerMilk', name: 'Milk', category: 'dinner', amount: 200, unit: 'gram' },
    { id: 'eggs', name: 'Eggs', category: 'dinner', amount: 2, unit: 'piece' },

    // Dessert items
    { id: 'yogurt', name: 'Yogurt 0%', category: 'dessert', amount: 250, unit: 'gram' },
    { id: 'creatine', name: 'MyProtein Creatine', category: 'dessert', amount: 5, unit: 'gram' },
    { id: 'dessertMilk', name: 'Milk', category: 'dessert', amount: 100, unit: 'gram' },
    { id: 'ancientGrains', name: 'Kirkland Ancient Grains', category: 'dessert', amount: 25, unit: 'gram' },
    { id: 'dessertBanana', name: 'Banana', category: 'dessert', amount: 100, unit: 'gram' },
    { id: 'almondButter', name: 'Almond Butter', category: 'dessert', amount: 25, unit: 'gram' }
];

// Load user-added items from localStorage
function loadUserItems() {
    const saved = localStorage.getItem('dietTrackerUserItems');
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.error('Error loading user items:', e);
        return [];
    }
}

// Save user-added items to localStorage
function saveUserItems(items) {
    try {
        localStorage.setItem('dietTrackerUserItems', JSON.stringify(items));
        return true;
    } catch (e) {
        console.error('Error saving user items:', e);
        return false;
    }
}

// Add a new item to the user items list
function addUserItem(item) {
    const userItems = loadUserItems();
    
    // Generate a unique ID for the new item
    const timestamp = new Date().getTime();
    const newItem = {
        ...item,
        id: `user_${timestamp}`,
        isUserAdded: true,
        dateAdded: new Date().toISOString(),
        lastUsed: new Date().toISOString()
    };

    userItems.push(newItem);
    return saveUserItems(userItems);
}

// Get all items (built-in + user-added)
function getAllItems() {
    return [...builtInItems, ...loadUserItems()];
}

// Initialize the combined items list
const dietItems = getAllItems();

// Export everything
export default {
    dietItems,
    addUserItem,
    loadUserItems,
    saveUserItems,
    getAllItems
};
