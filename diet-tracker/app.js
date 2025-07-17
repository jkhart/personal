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
    // Create or get the table
    let table = container.querySelector('table');
    if (!table) {
        // Create table structure if it doesn't exist
        table = document.createElement('table');
        table.className = 'items-table';
        
        // Add header row
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="item-check"></th>
                <th class="item-name">Item</th>
                <th>Calories</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fat</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Add goal row
        const tbody = document.createElement('tbody');
        tbody.innerHTML = `
            <tr class="goal-row">
                <td class="item-check"></td>
                <td class="item-name">Daily Goal</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            </tr>
        `;
        table.appendChild(tbody);
        container.appendChild(table);
    }
    
    // Create new row
    const tr = document.createElement('tr');
    tr.className = 'diet-item';
    if (item.isCustom) {
        tr.dataset.customId = item.id;
    }
    
    // Create checkbox cell
    const checkCell = document.createElement('td');
    checkCell.className = 'item-check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = item.id;
    input.checked = true; // Set checkbox to checked by default
    checkCell.appendChild(input);
    
    // Create name cell
    const nameCell = document.createElement('td');
    nameCell.className = 'item-name';
    const label = document.createElement('label');
    label.htmlFor = item.id;
    if (item.isCustom) {
        label.textContent = item.name;
    } else {
        label.textContent = `${item.name} (${formatUnit(item.amount, item.unit)})`;
    }
    nameCell.appendChild(label);
    
    // Get nutrition values
    let nutrition;
    if (item.isCustom) {
        nutrition = {
            calories: Math.round(item.nutrition.calories),
            protein: Math.round(item.nutrition.protein),
            carbs: Math.round(item.nutrition.carbs),
            fat: Math.round(item.nutrition.fat)
        };
    } else {
        nutrition = calculateNutrition(item.id, item.amount, item.unit);
        if (nutrition) {
            nutrition = {
                calories: Math.round(nutrition.calories),
                protein: Math.round(nutrition.protein),
                carbs: Math.round(nutrition.carbs),
                fat: Math.round(nutrition.fat)
            };
        }
    }
    
    // Add cells to row
    tr.appendChild(checkCell);
    tr.appendChild(nameCell);
    
    // Add nutrition cells
    if (nutrition) {
        tr.appendChild(createCell(formatNumber(nutrition.calories)));
        tr.appendChild(createCell(nutrition.protein));
        tr.appendChild(createCell(nutrition.carbs));
        tr.appendChild(createCell(nutrition.fat));
    } else {
        // Add empty cells if no nutrition info
        for (let i = 0; i < 4; i++) {
            tr.appendChild(createCell('-'));
        }
    }
    
    // Insert row before the summary rows (if they exist)
    const tbody = table.querySelector('tbody');
    const summaryRows = tbody.querySelectorAll('.summary-row, .remaining-row');
    if (summaryRows.length > 0) {
        tbody.insertBefore(tr, summaryRows[0]);
    } else {
        tbody.appendChild(tr);
    }
    
    // Add change event listener
    input.addEventListener('change', () => {
        saveState();
        updateAllNutritionSummaries();
    });
}

// Helper function to create a table cell
function createCell(content) {
    const td = document.createElement('td');
    td.textContent = content;
    return td;
}

// Calculate nutrition totals for a specific meal
function calculateMealNutrition(category) {
    const totals = {
        planned: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        consumed: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    };

    // Calculate goals from original diet items
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

    // Calculate consumed items (including custom items)
    // Regular items
    config.dietItems
        .filter(item => item.category === category && !item.isUserAdded)
        .forEach(item => {
            const checkbox = document.getElementById(item.id);
            if (checkbox && checkbox.checked) {
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
            if (element) {
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
    const container = document.getElementById(`${category}Items`);
    const table = container.querySelector('.items-table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    
    // Update goal row
    const goalRow = tbody.querySelector('.goal-row');
    if (goalRow) {
        goalRow.innerHTML = `
            <td class="item-check"></td>
            <td class="item-name">Daily Goal</td>
            <td>${formatNumber(totals.planned.calories)}</td>
            <td>${Math.round(totals.planned.protein)}</td>
            <td>${Math.round(totals.planned.carbs)}</td>
            <td>${Math.round(totals.planned.fat)}</td>
        `;
    }

    // Remove existing summary rows
    tbody.querySelectorAll('.summary-row, .remaining-row').forEach(row => row.remove());

    // Add eaten summary row
    const eatenRow = document.createElement('tr');
    eatenRow.className = 'summary-row';
    eatenRow.innerHTML = `
        <td class="item-check"></td>
        <td class="item-name">Total Eaten</td>
        <td>${formatNumber(totals.consumed.calories)}</td>
        <td>${Math.round(totals.consumed.protein)}</td>
        <td>${Math.round(totals.consumed.carbs)}</td>
        <td>${Math.round(totals.consumed.fat)}</td>
    `;
    tbody.appendChild(eatenRow);

    // Calculate and add remaining row
    const remaining = {
        protein: Math.round(totals.planned.protein - totals.consumed.protein),
        carbs: Math.round(totals.planned.carbs - totals.consumed.carbs),
        fat: Math.round(totals.planned.fat - totals.consumed.fat),
        calories: Math.round(totals.planned.calories - totals.consumed.calories)
    };

    const remainingRow = document.createElement('tr');
    remainingRow.className = `remaining-row ${remaining.calories <= 0 ? 'complete' : ''}`;
    remainingRow.innerHTML = `
        <td class="item-check"></td>
        <td class="item-name">Remaining</td>
        <td class="${remaining.calories < 0 ? 'negative' : ''}">${formatNumber(remaining.calories)}</td>
        <td class="${remaining.protein < 0 ? 'negative' : ''}">${remaining.protein}</td>
        <td class="${remaining.carbs < 0 ? 'negative' : ''}">${remaining.carbs}</td>
        <td class="${remaining.fat < 0 ? 'negative' : ''}">${remaining.fat}</td>
    `;
    tbody.appendChild(remainingRow);
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
        customItems: customItems // Save the entire customItems array
    };
    
    // Save regular items state
    config.dietItems.forEach(item => {
        const itemElement = document.getElementById(item.id);
        if (itemElement) {
            state.checked[item.id] = itemElement.checked;
        }
    });

    // Save custom items state
    customItems.forEach(item => {
        const element = document.querySelector(`[data-custom-id="${item.id}"]`);
        if (element) {
            const checkbox = element.querySelector('input[type="checkbox"]');
            state.checked[item.id] = checkbox?.checked || false;
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
            }
        }
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initApp);
