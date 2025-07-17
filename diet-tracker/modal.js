// Import master list for autocomplete
import { nutritionalInfo } from './nutritional-info.js';
import config from './config.js';

let selectedItemId = null; // Track selected item
const modal = document.getElementById('addItemModal');
const form = document.getElementById('addItemForm');
const nameInput = document.getElementById('itemName');
const existingItemFields = document.getElementById('existingItemFields');
const newItemFields = document.getElementById('newItemFields');
const autocompleteResults = document.getElementById('autocompleteResults');
const categorySelect = document.getElementById('mealCategory');

// Calculate calories from macros
function calculateCalories(protein, carbs, fat) {
    return (protein * 4) + (carbs * 4) + (fat * 9);
}

// Show modal
export function showAddItemModal() {
    console.log('Opening add item modal');
    modal.classList.add('show');
    nameInput.value = '';
    categorySelect.value = '';
    existingItemFields.style.display = 'none';
    newItemFields.style.display = 'none';
    selectedItemId = null; // Reset selected item
    
    // Reset all required attributes
    document.getElementById('itemAmount').required = false;
    document.getElementById('newAmount').required = false;
    document.getElementById('newUnit').required = false;
    document.getElementById('protein').required = false;
    document.getElementById('carbs').required = false;
    document.getElementById('fat').required = false;
    
    nameInput.focus();
}

// Close modal
function closeModal() {
    console.log('Closing modal');
    modal.classList.remove('show');
    form.reset();
    selectedItemId = null; // Reset selected item
    
    // Reset all required attributes
    document.getElementById('itemAmount').required = false;
    document.getElementById('newAmount').required = false;
    document.getElementById('newUnit').required = false;
    document.getElementById('protein').required = false;
    document.getElementById('carbs').required = false;
    document.getElementById('fat').required = false;
}

// Format display name from ID
function formatDisplayName(id) {
    return id
        .split(/[_-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Handle autocomplete
function handleAutocomplete(input) {
    const value = input.toLowerCase();
    if (!value) {
        autocompleteResults.classList.remove('show');
        return;
    }

    // Get all items from master list that match the input
    const matches = Object.entries(nutritionalInfo)
        .filter(([id, info]) => {
            // Check if the item has a servingSize property to ensure it's from the master list
            if (!info.servingSize) return false;
            // Convert everything to lowercase for case-insensitive comparison
            const itemName = id.toLowerCase().replace(/[_-]/g, ' ');
            const displayName = formatDisplayName(id).toLowerCase();
            return itemName.includes(value) || displayName.includes(value);
        })
        .slice(0, 5);

    console.log('Autocomplete matches:', matches);

    if (matches.length > 0) {
        // Group milk items together and sort them first
        const sortedMatches = matches.sort((a, b) => {
            const aIsMilk = a[0].toLowerCase().includes('milk');
            const bIsMilk = b[0].toLowerCase().includes('milk');
            if (aIsMilk && !bIsMilk) return -1;
            if (!aIsMilk && bIsMilk) return 1;
            return 0;
        });

        autocompleteResults.innerHTML = sortedMatches
            .map(([id, info]) => {
                const displayName = id.toLowerCase().includes('milk') 
                    ? formatDisplayName(id.replace(/milk/i, '')) + ' Milk'
                    : formatDisplayName(id);
                return `
                    <div class="autocomplete-item" data-id="${id}">
                        ${displayName}
                    </div>
                `;
            }).join('');
        autocompleteResults.classList.add('show');
    } else {
        autocompleteResults.classList.remove('show');
        showNewItemFields();
    }
}

// Show existing item fields
function showExistingItemFields(itemId) {
    console.log('Showing existing item fields for:', itemId);
    const item = nutritionalInfo[itemId];
    if (!item) {
        console.error('No item found for ID:', itemId);
        return;
    }

    selectedItemId = itemId; // Store the selected item ID
    
    // Set display name using the same format as autocomplete
    const displayName = itemId.toLowerCase().includes('milk')
        ? formatDisplayName(itemId.replace(/milk/i, '')) + ' Milk'
        : formatDisplayName(itemId);
    nameInput.value = displayName;
    
    // Configure existing item fields
    const itemAmountInput = document.getElementById('itemAmount');
    itemAmountInput.value = item.servingSize;
    itemAmountInput.required = true;
    document.getElementById('unitLabel').textContent = item.servingUnit;
    
    // Show/hide appropriate fields
    existingItemFields.style.display = 'block';
    newItemFields.style.display = 'none';
    
    // Disable requirements for new item fields
    document.getElementById('newAmount').required = false;
    document.getElementById('newUnit').required = false;
    document.getElementById('protein').required = false;
    document.getElementById('carbs').required = false;
    document.getElementById('fat').required = false;
    
    // Hide save to master option for existing items
    document.querySelector('.save-to-master').style.display = 'none';
    autocompleteResults.classList.remove('show');
}

// Show new item fields
function showNewItemFields() {
    console.log('Showing new item fields');
    selectedItemId = null; // Clear selected item
    
    // Hide/show appropriate fields
    existingItemFields.style.display = 'none';
    newItemFields.style.display = 'block';
    
    // Enable requirements for new item fields
    document.getElementById('newAmount').required = true;
    document.getElementById('newUnit').required = true;
    document.getElementById('protein').required = true;
    document.getElementById('carbs').required = true;
    document.getElementById('fat').required = true;
    
    // Disable requirements for existing item fields
    document.getElementById('itemAmount').required = false;
    
    // Show save to master option for new items
    document.querySelector('.save-to-master').style.display = 'block';
    
    // Clear input fields
    document.getElementById('protein').value = '';
    document.getElementById('carbs').value = '';
    document.getElementById('fat').value = '';
    document.getElementById('calories').textContent = '0';
    document.getElementById('newAmount').value = '';
}

// Update calories when macros change
function updateCalories() {
    const protein = parseFloat(document.getElementById('protein').value) || 0;
    const carbs = parseFloat(document.getElementById('carbs').value) || 0;
    const fat = parseFloat(document.getElementById('fat').value) || 0;
    
    const calories = calculateCalories(protein, carbs, fat);
    document.getElementById('calories').textContent = Math.round(calories);
}

// Event Listeners
document.querySelector('.close-btn').addEventListener('click', closeModal);
document.querySelector('.cancel-btn').addEventListener('click', closeModal);

nameInput.addEventListener('input', (e) => {
    selectedItemId = null; // Clear selected item when input changes
    handleAutocomplete(e.target.value);
});

autocompleteResults.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
        showExistingItemFields(item.dataset.id);
    }
});

['protein', 'carbs', 'fat'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateCalories);
});

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const category = categorySelect.value;
    console.log('Selected category:', category);
    
    if (!category) {
        alert('Please select a meal category');
        return;
    }
    
    const name = nameInput.value;
    if (!name) {
        alert('Please enter an item name');
        return;
    }

    let nutrition;
    let amount;
    let unit;

    console.log('Selected item ID:', selectedItemId);
    console.log('Existing fields display:', existingItemFields.style.display);

    if (existingItemFields.style.display === 'block' && selectedItemId) {
        console.log('Processing existing item');
        // Handle existing item
        amount = parseFloat(document.getElementById('itemAmount').value);
        if (!amount || isNaN(amount)) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Calculate nutrition based on amount
        const baseItem = nutritionalInfo[selectedItemId];
        const ratio = amount / baseItem.servingSize;
        unit = baseItem.servingUnit;
        
        nutrition = {
            protein: Math.round(baseItem.protein * ratio * 10) / 10,
            carbs: Math.round(baseItem.carbs * ratio * 10) / 10,
            fat: Math.round(baseItem.fat * ratio * 10) / 10,
            calories: Math.round(baseItem.calories * ratio)
        };

        console.log('Calculated nutrition:', nutrition);
    } else {
        console.log('Processing new item');
        // Handle new item
        amount = parseFloat(document.getElementById('newAmount').value);
        unit = document.getElementById('newUnit').value;
        
        if (!amount || isNaN(amount)) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (!unit) {
            alert('Please select a unit');
            return;
        }

        const protein = parseFloat(document.getElementById('protein').value);
        const carbs = parseFloat(document.getElementById('carbs').value);
        const fat = parseFloat(document.getElementById('fat').value);

        if (isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
            alert('Please enter valid numbers for protein, carbs, and fat');
            return;
        }

        nutrition = {
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            calories: Math.round(calculateCalories(protein, carbs, fat))
        };

        console.log('New item nutrition:', nutrition);

        // If saving to master list, save the item
        if (document.getElementById('saveToMasterListCheckbox').checked) {
            const masterItem = {
                name,
                category,
                amount,
                unit,
                nutrition
            };

            console.log('Saving to master list:', masterItem);
            if (config.addUserItem(masterItem)) {
                console.log('Item saved to master list');
            } else {
                console.error('Failed to save item to master list');
            }
        }
    }

    // Create custom item for today
    const customItem = {
        id: `custom_${Date.now()}`,
        name,
        category,
        amount,
        unit,
        nutrition,
        isCustom: true
    };

    console.log('Dispatching item-added event with:', customItem);

    // Add to today's items
    const event = new CustomEvent('item-added', {
        detail: { item: customItem }
    });
    document.dispatchEvent(event);

    closeModal();
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});
