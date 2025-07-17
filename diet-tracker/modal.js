// Import master list for autocomplete
import { nutritionalInfo } from './nutritional-info.js';
import config from './config.js';

let currentCategory = null;
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
    modal.classList.add('show');
    nameInput.value = '';
    categorySelect.value = '';
    existingItemFields.style.display = 'none';
    newItemFields.style.display = 'none';
    nameInput.focus();
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    form.reset();
    currentCategory = null;
}

// Format display name from ID
function formatDisplayName(id) {
    return id
        .split('_')
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
            const itemName = id.toLowerCase().replace(/_/g, ' ');
            return itemName.includes(value);
        })
        .slice(0, 5);

    if (matches.length > 0) {
        autocompleteResults.innerHTML = matches
            .map(([id, info]) => `
                <div class="autocomplete-item" data-id="${id}">
                    ${formatDisplayName(id)}
                </div>
            `).join('');
        autocompleteResults.classList.add('show');
    } else {
        autocompleteResults.classList.remove('show');
        showNewItemFields();
    }
}

// Show existing item fields
function showExistingItemFields(itemId) {
    const item = nutritionalInfo[itemId];
    if (!item) return;

    currentCategory = categorySelect.value;
    nameInput.value = formatDisplayName(itemId);
    document.getElementById('itemAmount').value = item.servingSize;
    document.getElementById('unitLabel').textContent = item.servingUnit;
    
    existingItemFields.style.display = 'block';
    newItemFields.style.display = 'none';
    document.getElementById('saveToMasterList').style.display = 'none';
    autocompleteResults.classList.remove('show');
}

// Show new item fields
function showNewItemFields() {
    currentCategory = categorySelect.value;
    existingItemFields.style.display = 'none';
    newItemFields.style.display = 'block';
    document.getElementById('saveToMasterList').style.display = 'block';
    
    // Clear and enable input fields
    document.getElementById('protein').value = '';
    document.getElementById('carbs').value = '';
    document.getElementById('fat').value = '';
    document.getElementById('calories').value = '';
}

// Update calories when macros change
function updateCalories() {
    const protein = parseFloat(document.getElementById('protein').value) || 0;
    const carbs = parseFloat(document.getElementById('carbs').value) || 0;
    const fat = parseFloat(document.getElementById('fat').value) || 0;
    
    const calories = calculateCalories(protein, carbs, fat);
    document.getElementById('calories').value = Math.round(calories);
}

// Event Listeners
document.querySelector('.close-btn').addEventListener('click', closeModal);
document.querySelector('.cancel-btn').addEventListener('click', closeModal);

nameInput.addEventListener('input', (e) => handleAutocomplete(e.target.value));

autocompleteResults.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
        showExistingItemFields(item.dataset.id);
    }
});

['protein', 'carbs', 'fat'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateCalories);
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!categorySelect.value) {
        alert('Please select a meal category');
        return;
    }
    
    const name = nameInput.value;
    let nutrition;
    let amount;
    let unit;

    if (existingItemFields.style.display === 'block') {
        // Handle existing item
        amount = parseFloat(document.getElementById('itemAmount').value);
        if (!amount) {
            alert('Please enter an amount');
            return;
        }
        
        if (!selectedItemId) {
            alert('Please select an item from the list');
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
    } else {
        // Handle new item
        amount = parseFloat(document.getElementById('newAmount').value);
        unit = document.getElementById('newUnit').value;
        
        if (!amount || !unit) {
            alert('Please enter an amount and unit');
            return;
        }

        nutrition = {
            protein: Math.round(parseFloat(document.getElementById('protein').value) || 0),
            carbs: Math.round(parseFloat(document.getElementById('carbs').value) || 0),
            fat: Math.round(parseFloat(document.getElementById('fat').value) || 0),
            calories: Math.round(parseFloat(document.getElementById('calories').value) || 0)
        };

        // If saving to master list, save the item
        if (document.getElementById('saveToMasterListCheckbox').checked) {
            const masterItem = {
                name,
                category: categorySelect.value,
                amount,
                unit,
                nutrition
            };

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
        category: categorySelect.value,
        amount,
        unit,
        nutrition,
        isCustom: true
    };

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
