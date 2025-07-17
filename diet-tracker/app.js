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
window.customItems = [];

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

    // Add button functionality
    document.getElementById('addButton').addEventListener('click', () => {
        showAddItemModal();
    });
    
    // Create tables for each meal category
    const categories = ['breakfast', 'lunch', 'dinner', 'dessert'];
    
    categories.forEach(category => {
        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'items-container';
        itemsContainer.id = `${category}Items`;
        
        // Get and sort items for this category by amount (descending)
        const categoryItems = config.dietItems
            .filter(item => item.category === category)
            .sort((a, b) => b.amount - a.amount);

        // Create table structure
        const table = document.createElement('table');
        table.className = 'items-table';
        
        // Add header row with meal category name
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="item-name">${category.charAt(0).toUpperCase() + category.slice(1)}</th>
                <th>Calories</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fat</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        itemsContainer.appendChild(table);

        // Add items to the table
        categoryItems.forEach(item => {
            addItemToContainer(item, itemsContainer);
        });
        
        container.appendChild(itemsContainer);
    });
    
    // Listen for custom item additions
    document.addEventListener('item-added', (e) => {
        console.log('Received item-added event:', e.detail);
        const { item } = e.detail;
        customItems.push(item);
        console.log('Added item to customItems array:', customItems);
        const container = document.getElementById(`${item.category}Items`);
        console.log('Found container:', container, 'for category:', item.category);
        if (container) {
            addItemToContainer(item, container);
            updateAllNutritionSummaries();
            console.log('Item added to container and nutrition updated');
        } else {
            console.error('Container not found for category:', item.category);
        }
    });
    
    // Load saved state and update nutrition
    loadState();
    updateAllNutritionSummaries();
}

// Add item to container
function addItemToContainer(item, container) {
    // Get the table (it should already exist)
    const table = container.querySelector('table');
    if (!table) {
        console.error('Table not found in container');
        return;
    }
    
    // Create new row
    const tr = document.createElement('tr');
    tr.className = 'diet-item';
    if (item.isCustom) {
        tr.dataset.customId = item.id;
    }
    tr.dataset.itemId = item.id;
    
    // Create name cell with amount underneath
    const nameCell = document.createElement('td');
    nameCell.className = 'item-name';
    const nameSpan = document.createElement('div');
    nameSpan.className = 'item-name-text';
    nameSpan.textContent = item.name;
    const amountSpan = document.createElement('div');
    amountSpan.className = 'item-amount';
    amountSpan.textContent = formatUnit(item.amount, item.unit);
    nameCell.appendChild(nameSpan);
    nameCell.appendChild(amountSpan);
    
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
    const summaryRows = tbody.querySelectorAll('.goal-row, .summary-row, .remaining-row');
    if (summaryRows.length > 0) {
        tbody.insertBefore(tr, summaryRows[0]);
    } else {
        tbody.appendChild(tr);
    }
    
    // Add click event listener
    tr.addEventListener('click', () => {
        tr.classList.toggle('consumed');
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

    // Calculate planned totals from original diet items
    config.dietItems
        .filter(item => item.category === category && !item.isUserAdded)
        .forEach(item => {
            const nutrition = calculateNutrition(item.id, item.amount, item.unit);
            if (nutrition) {
                totals.planned.protein += Math.round(nutrition.protein);
                totals.planned.carbs += Math.round(nutrition.carbs);
                totals.planned.fat += Math.round(nutrition.fat);
                totals.planned.calories += Math.round(nutrition.calories);
            }
        });

    // Calculate consumed totals from checked items
    config.dietItems
        .filter(item => item.category === category && !item.isUserAdded)
        .forEach(item => {
            const row = document.querySelector(`tr[data-item-id="${item.id}"]`);
            if (row?.classList.contains('consumed')) {
                const nutrition = calculateNutrition(item.id, item.amount, item.unit);
                if (nutrition) {
                    totals.consumed.protein += Math.round(nutrition.protein);
                    totals.consumed.carbs += Math.round(nutrition.carbs);
                    totals.consumed.fat += Math.round(nutrition.fat);
                    totals.consumed.calories += Math.round(nutrition.calories);
                }
            }
        });

    // Add consumed totals from custom items
    customItems
        .filter(item => item.category === category)
        .forEach(item => {
            const row = document.querySelector(`tr[data-custom-id="${item.id}"]`);
            if (row?.classList.contains('consumed')) {
                totals.consumed.protein += Math.round(item.nutrition.protein);
                totals.consumed.carbs += Math.round(item.nutrition.carbs);
                totals.consumed.fat += Math.round(item.nutrition.fat);
                totals.consumed.calories += Math.round(item.nutrition.calories);
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
    
    // Remove existing summary rows
    tbody.querySelectorAll('.goal-row, .summary-row, .remaining-row').forEach(row => row.remove());

    // Add goal row
    const goalRow = document.createElement('tr');
    goalRow.className = 'goal-row';
    goalRow.innerHTML = `
        <td class="item-name">Goal</td>
        <td>${formatNumber(totals.planned.calories)}</td>
        <td>${Math.round(totals.planned.protein)}</td>
        <td>${Math.round(totals.planned.carbs)}</td>
        <td>${Math.round(totals.planned.fat)}</td>
    `;
    tbody.appendChild(goalRow);

    // Add eaten summary row
    const eatenRow = document.createElement('tr');
    eatenRow.className = 'summary-row';
    eatenRow.innerHTML = `
        <td class="item-name">Consumed</td>
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
    const tbody = document.getElementById('dailyTotalsBody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    const remaining = {
        protein: Math.round(totals.planned.protein - totals.consumed.protein),
        carbs: Math.round(totals.planned.carbs - totals.consumed.carbs),
        fat: Math.round(totals.planned.fat - totals.consumed.fat),
        calories: Math.round(totals.planned.calories - totals.consumed.calories)
    };

    // Add goal row
    const goalRow = document.createElement('tr');
    goalRow.className = 'goal-row';
    goalRow.innerHTML = `
        <td class="item-name">Goal</td>
        <td>${formatNumber(totals.planned.calories)}</td>
        <td>${Math.round(totals.planned.protein)}</td>
        <td>${Math.round(totals.planned.carbs)}</td>
        <td>${Math.round(totals.planned.fat)}</td>
    `;
    tbody.appendChild(goalRow);

    // Add consumed row
    const consumedRow = document.createElement('tr');
    consumedRow.className = 'summary-row';
    consumedRow.innerHTML = `
        <td class="item-name">Consumed</td>
        <td>${formatNumber(totals.consumed.calories)}</td>
        <td>${Math.round(totals.consumed.protein)}</td>
        <td>${Math.round(totals.consumed.carbs)}</td>
        <td>${Math.round(totals.consumed.fat)}</td>
    `;
    tbody.appendChild(consumedRow);

    // Add remaining row
    const remainingRow = document.createElement('tr');
    remainingRow.className = `remaining-row ${remaining.calories <= 0 ? 'complete' : ''}`;
    remainingRow.innerHTML = `
        <td class="item-name">Remaining</td>
        <td class="${remaining.calories < 0 ? 'negative' : ''}">${formatNumber(remaining.calories)}</td>
        <td class="${remaining.protein < 0 ? 'negative' : ''}">${remaining.protein}</td>
        <td class="${remaining.carbs < 0 ? 'negative' : ''}">${remaining.carbs}</td>
        <td class="${remaining.fat < 0 ? 'negative' : ''}">${remaining.fat}</td>
    `;
    tbody.appendChild(remainingRow);
}

// Save the current state
function saveState() {
    const state = {
        consumed: {},
        customItems: customItems // Save the entire customItems array
    };
    
    // Save regular items state
    config.dietItems.forEach(item => {
        const row = document.querySelector(`tr[data-item-id="${item.id}"]`);
        if (row) {
            state.consumed[item.id] = row.classList.contains('consumed');
        }
    });

    // Save custom items state
    customItems.forEach(item => {
        const row = document.querySelector(`tr[data-custom-id="${item.id}"]`);
        if (row) {
            state.consumed[item.id] = row.classList.contains('consumed');
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
    
    let data;
    try {
        data = JSON.parse(saved);
    } catch (e) {
        console.error('Error parsing saved state:', e);
        return;
    }

    // Initialize state if missing
    if (!data.state || !data.state.consumed) {
        data.state = { consumed: {}, customItems: [] };
    }
    
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (data.date !== today) {
        config.dietItems.forEach(item => {
            const row = document.querySelector(`tr[data-item-id="${item.id}"]`);
            if (row) {
                row.classList.remove('consumed');
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
        const row = document.querySelector(`tr[data-item-id="${item.id}"]`);
        if (row && data.state.consumed && data.state.consumed[item.id]) {
            row.classList.add('consumed');
        }
    });

    // Re-add custom items to the DOM
    customItems.forEach(item => {
        const container = document.getElementById(`${item.category}Items`);
        if (container) {
            addItemToContainer(item, container);
            // Restore custom item state
            const row = document.querySelector(`tr[data-custom-id="${item.id}"]`);
            if (row && data.state.consumed && data.state.consumed[item.id]) {
                row.classList.add('consumed');
            }
        }
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initApp);
