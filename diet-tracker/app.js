// Import configurations
import config from './config.js';
import { calculateNutrition } from './nutritional-info.js';
import { formatUnit } from './units.js';
import { showAddItemModal } from './modal.js';

// Format number with comma separators
function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Track custom items for the day
let customItems = [];

// Initialize the app
function initApp() {
    const container = document.getElementById('dietItems');
    
    // Add reset button functionality
    document.getElementById('resetButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data? This will clear all items and progress for today.')) {
            localStorage.removeItem('dietTrackerState');
            location.reload();
        }
    });
    
    // Create sections for each meal category
    const categories = ['breakfast', 'lunch', 'dinner', 'dessert'];
    
    // Create nutrition summary element
    const nutritionSummary = document.createElement('div');
    nutritionSummary.id = 'nutritionSummary';
    nutritionSummary.className = 'nutrition-summary';
    container.appendChild(nutritionSummary);
    
    categories.forEach(category => {
        // Create category section
        const section = document.createElement('div');
        section.className = 'meal-category';
        
        // Add category header with add button
        const headerContainer = document.createElement('div');
        headerContainer.className = 'category-header';
        
        const header = document.createElement('h2');
        header.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        
        const addButton = document.createElement('button');
        addButton.className = 'add-btn';
        addButton.innerHTML = '+';
        addButton.title = 'Add item';
        addButton.onclick = () => showAddItemModal(category);
        
        headerContainer.appendChild(header);
        headerContainer.appendChild(addButton);
        section.appendChild(headerContainer);

        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'items-container';
        itemsContainer.id = `${category}Items`;
        
        // Get and sort items for this category by amount (descending)
        const categoryItems = config.dietItems
            .filter(item => item.category === category)
            .sort((a, b) => b.amount - a.amount);

        categoryItems.forEach(item => {
            addItemToContainer(item, itemsContainer);
        });
        
        section.appendChild(itemsContainer);

        // Add meal summary table
        const summaryTable = document.createElement('div');
        summaryTable.className = 'meal-summary-table';
        summaryTable.id = `${category}Summary`;
        section.appendChild(summaryTable);
        
        container.appendChild(section);
    });
    
    // Listen for custom item additions
    document.addEventListener('item-added', (e) => {
        const { item } = e.detail;
        customItems.push(item);
        const container = document.getElementById(`${item.category}Items`);
        if (container) {
            addItemToContainer(item, container);
            updateAllNutritionSummaries();
        }
    });
    
    // Load saved state and update nutrition
    loadState();
    updateAllNutritionSummaries();
}

// Add item to container
function addItemToContainer(item, container) {
    const div = document.createElement('div');
    div.className = 'diet-item';
    if (item.isCustom) {
        div.dataset.customId = item.id;
    }
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = item.id;
    input.checked = true; // Set checkbox to checked by default
    
    const label = document.createElement('label');
    label.htmlFor = item.id;
    
    if (item.isCustom) {
        label.textContent = item.name;
        const nutritionInfo = document.createElement('div');
        nutritionInfo.className = 'nutrition-info';
        const roundedNutrition = {
            calories: Math.round(item.nutrition.calories),
            protein: Math.round(item.nutrition.protein),
            carbs: Math.round(item.nutrition.carbs),
            fat: Math.round(item.nutrition.fat)
        };
        nutritionInfo.textContent = `Cal:${formatNumber(roundedNutrition.calories)} P:${roundedNutrition.protein} C:${roundedNutrition.carbs} F:${roundedNutrition.fat}`;
        label.appendChild(nutritionInfo);
    } else {
        label.textContent = `${item.name} (${formatUnit(item.amount, item.unit)})`;
        const nutrition = calculateNutrition(item.id, item.amount, item.unit);
        if (nutrition) {
            const nutritionInfo = document.createElement('div');
            nutritionInfo.className = 'nutrition-info';
            const roundedNutrition = {
                calories: Math.round(nutrition.calories),
                protein: Math.round(nutrition.protein),
                carbs: Math.round(nutrition.carbs),
                fat: Math.round(nutrition.fat)
            };
            nutritionInfo.textContent = `Cal:${formatNumber(roundedNutrition.calories)} P:${roundedNutrition.protein} C:${roundedNutrition.carbs} F:${roundedNutrition.fat}`;
            label.appendChild(nutritionInfo);
        }
    }

    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Hide for today';
    deleteBtn.onclick = (e) => {
        e.preventDefault(); // Prevent label click
        div.classList.add('hidden');
        saveState();
        updateAllNutritionSummaries();
    };
    
    div.appendChild(input);
    div.appendChild(label);
    div.appendChild(deleteBtn);
    container.appendChild(div);
    
    // Add change event listener
    input.addEventListener('change', () => {
        saveState();
        updateAllNutritionSummaries();
    });
}

// Calculate nutrition totals for a specific meal
function calculateMealNutrition(category) {
    const totals = {
        planned: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        consumed: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    };

    // Calculate goals from original diet items (unaffected by hidden state)
    config.dietItems
        .filter(item => item.category === category && !item.isUserAdded)
        .forEach(item => {
            const nutrition = calculateNutrition(item.id, item.amount, item.unit);
            if (nutrition) {
                // Add to planned totals (goals)
                totals.planned.protein += Math.round(nutrition.protein);
                totals.planned.carbs += Math.round(nutrition.carbs);
                totals.planned.fat += Math.round(nutrition.fat);
                totals.planned.calories += Math.round(nutrition.calories);
            }
        });

    // Calculate consumed from visible items (including custom items)
    // Regular items
    config.dietItems
        .filter(item => item.category === category && !item.isUserAdded)
        .forEach(item => {
            const checkbox = document.getElementById(item.id);
            if (checkbox && !checkbox.closest('.diet-item').classList.contains('hidden') && checkbox.checked) {
                const nutrition = calculateNutrition(item.id, item.amount, item.unit);
                if (nutrition) {
                    totals.consumed.protein += Math.round(nutrition.protein);
                    totals.consumed.carbs += Math.round(nutrition.carbs);
                    totals.consumed.fat += Math.round(nutrition.fat);
                    totals.consumed.calories += Math.round(nutrition.calories);
                }
            }
        });

    // Custom items (only affect consumed totals when checked)
    customItems
        .filter(item => item.category === category)
        .forEach(item => {
            const element = document.querySelector(`[data-custom-id="${item.id}"]`);
            if (element && !element.classList.contains('hidden')) {
                const checkbox = element.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    totals.consumed.protein += Math.round(item.nutrition.protein);
                    totals.consumed.carbs += Math.round(item.nutrition.carbs);
                    totals.consumed.fat += Math.round(item.nutrition.fat);
                    totals.consumed.calories += Math.round(item.nutrition.calories);
                }
            }
        });

    return totals;
}

// Update all nutrition summaries
function updateAllNutritionSummaries() {
    const categories = ['breakfast', 'lunch', 'dinner', 'dessert'];
    const dailyTotals = {
        planned: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        consumed: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    };

    // Calculate each meal's totals
    categories.forEach(category => {
        const mealTotals = calculateMealNutrition(category);
        updateMealSummary(category, mealTotals);
        
        // Add to daily totals
        Object.keys(dailyTotals.planned).forEach(macro => {
            dailyTotals.planned[macro] += mealTotals.planned[macro];
            dailyTotals.consumed[macro] += mealTotals.consumed[macro];
        });
    });

    // Update daily summary
    updateDailySummary(dailyTotals);
}

// Update the meal summary display
function updateMealSummary(category, totals) {
    const summary = document.getElementById(`${category}Summary`);
    if (summary) {
        const remaining = {
            protein: Math.round(totals.planned.protein - totals.consumed.protein),
            carbs: Math.round(totals.planned.carbs - totals.consumed.carbs),
            fat: Math.round(totals.planned.fat - totals.consumed.fat),
            calories: Math.round(totals.planned.calories - totals.consumed.calories)
        };

        summary.innerHTML = `
            <table>
                <tr>
                    <th></th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                </tr>
                <tr class="planned-row">
                    <td>Goal</td>
                    <td>${formatNumber(totals.planned.calories)}</td>
                    <td>${Math.round(totals.planned.protein)}</td>
                    <td>${Math.round(totals.planned.carbs)}</td>
                    <td>${Math.round(totals.planned.fat)}</td>
                </tr>
                <tr class="consumed-row">
                    <td>Eaten</td>
                    <td>${formatNumber(totals.consumed.calories)}</td>
                    <td>${Math.round(totals.consumed.protein)}</td>
                    <td>${Math.round(totals.consumed.carbs)}</td>
                    <td>${Math.round(totals.consumed.fat)}</td>
                </tr>
                <tr class="remaining-row ${remaining.calories <= 0 ? 'complete' : ''}">
                    <td>Left</td>
                    <td class="${remaining.calories < 0 ? 'negative' : ''}">${formatNumber(remaining.calories)}</td>
                    <td class="${remaining.protein < 0 ? 'negative' : ''}">${remaining.protein}</td>
                    <td class="${remaining.carbs < 0 ? 'negative' : ''}">${remaining.carbs}</td>
                    <td class="${remaining.fat < 0 ? 'negative' : ''}">${remaining.fat}</td>
                </tr>
            </table>
        `;
    }
}

// Update the daily summary display
function updateDailySummary(totals) {
    const summary = document.getElementById('nutritionSummary');
    if (summary) {
        const remaining = {
            protein: Math.round(totals.planned.protein - totals.consumed.protein),
            carbs: Math.round(totals.planned.carbs - totals.consumed.carbs),
            fat: Math.round(totals.planned.fat - totals.consumed.fat),
            calories: Math.round(totals.planned.calories - totals.consumed.calories)
        };

        summary.innerHTML = `
            <h3>Daily Totals</h3>
            <table>
                <tr>
                    <th></th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                </tr>
                <tr class="planned-row">
                    <td>Goal</td>
                    <td>${formatNumber(totals.planned.calories)}</td>
                    <td>${Math.round(totals.planned.protein)}g</td>
                    <td>${Math.round(totals.planned.carbs)}g</td>
                    <td>${Math.round(totals.planned.fat)}g</td>
                </tr>
                <tr class="consumed-row">
                    <td>Eaten</td>
                    <td>${formatNumber(totals.consumed.calories)}</td>
                    <td>${Math.round(totals.consumed.protein)}g</td>
                    <td>${Math.round(totals.consumed.carbs)}g</td>
                    <td>${Math.round(totals.consumed.fat)}g</td>
                </tr>
                <tr class="remaining-row ${remaining.calories <= 0 ? 'complete' : ''}">
                    <td>Left</td>
                    <td class="${remaining.calories < 0 ? 'negative' : ''}">${formatNumber(remaining.calories)}</td>
                    <td class="${remaining.protein < 0 ? 'negative' : ''}">${remaining.protein}g</td>
                    <td class="${remaining.carbs < 0 ? 'negative' : ''}">${remaining.carbs}g</td>
                    <td class="${remaining.fat < 0 ? 'negative' : ''}">${remaining.fat}g</td>
                </tr>
            </table>
        `;
    }
}

// Save the current state
function saveState() {
    const state = {
        checked: {},
        hidden: {},
        customItems: customItems // Save the entire customItems array
    };
    
    // Save regular items state
    config.dietItems.forEach(item => {
        const itemElement = document.getElementById(item.id);
        if (itemElement) {
            state.checked[item.id] = itemElement.checked;
            state.hidden[item.id] = itemElement.closest('.diet-item').classList.contains('hidden');
        }
    });

    // Save custom items state
    customItems.forEach(item => {
        const element = document.querySelector(`[data-custom-id="${item.id}"]`);
        if (element) {
            const checkbox = element.querySelector('input[type="checkbox"]');
            state.checked[item.id] = checkbox?.checked || false;
            state.hidden[item.id] = element.classList.contains('hidden');
        }
    });
    
    // Save state with timestamp
    const data = {
        state: state,
        date: new Date().toDateString()
    };
    localStorage.setItem('dietTrackerState', JSON.stringify(data));
}

// Load the saved state
function loadState() {
    const saved = localStorage.getItem('dietTrackerState');
    if (!saved) return;
    
    const data = JSON.parse(saved);
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (data.date !== today) {
        config.dietItems.forEach(item => {
            const checkbox = document.getElementById(item.id);
            if (checkbox) {
                checkbox.checked = false;
                checkbox.closest('.diet-item').classList.remove('hidden');
            }
        });
        customItems = []; // Reset custom items
        saveState();
        return;
    }
    
    // Restore custom items
    customItems = data.state.customItems || [];
    
    // Restore regular items state
    config.dietItems.forEach(item => {
        const checkbox = document.getElementById(item.id);
        if (checkbox) {
            checkbox.checked = data.state.checked[item.id] ?? checkbox.checked;
            if (data.state.hidden[item.id]) {
                checkbox.closest('.diet-item').classList.add('hidden');
            }
        }
    });

    // Re-add custom items to the DOM
    customItems.forEach(item => {
        const container = document.getElementById(`${item.category}Items`);
        if (container) {
            addItemToContainer(item, container);
            // Restore custom item state
            const element = document.querySelector(`[data-custom-id="${item.id}"]`);
            if (element) {
                const checkbox = element.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = data.state.checked[item.id] ?? checkbox.checked;
                }
                if (data.state.hidden[item.id]) {
                    element.classList.add('hidden');
                }
            }
        }
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initApp);
