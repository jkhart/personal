// Navigation elements
const menuButton = document.getElementById('menuButton');
const closeMenuButton = document.getElementById('closeMenuButton');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');
const navItems = document.querySelectorAll('.nav-item');
const navTitle = document.querySelector('.nav-title');

// Open menu
menuButton.addEventListener('click', () => {
    navMenu.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
});

// Close menu
function closeMenu() {
    navMenu.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

closeMenuButton.addEventListener('click', closeMenu);
navOverlay.addEventListener('click', closeMenu);

// Handle navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = e.target.dataset.page;
        
        // Update active state
        navItems.forEach(navItem => {
            navItem.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update title
        navTitle.textContent = e.target.textContent;
        
        // Show selected page
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById(`${pageId}Page`).style.display = 'block';
        
        // Close menu
        closeMenu();
    });
});
