// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
}

// Hide mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    
    if (mobileMenu && mobileMenuButton && !mobileMenu.contains(event.target) && 
        !mobileMenuButton.contains(event.target) && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
    }
});

// Update getActiveTab function to handle mobile dropdown
function getActiveTab() {
    if (window.innerWidth < 768) {
        return document.getElementById('mobile-filter').value;
    } else {
        const activeTab = document.querySelector('.tabs .tab-active');
        return activeTab ? activeTab.textContent.trim() : 'all';
    }
}

// Sync mobile dropdown with desktop tabs and vice versa
function syncFilters() {
    const mobileFilter = document.getElementById('mobile-filter');
    const desktopTabs = document.querySelectorAll('.tabs .tab');
    
    if (mobileFilter && desktopTabs.length > 0) {
        // Mobile to desktop sync
        mobileFilter.addEventListener('change', function() {
            desktopTabs.forEach(tab => {
                if (tab.textContent.trim().toLowerCase() === this.value.toLowerCase() || 
                    (this.value === 'all' && tab.textContent.trim() === 'All')) {
                    tab.classList.add('tab-active');
                } else {
                    tab.classList.remove('tab-active');
                }
            });
        });
        
        // Desktop to mobile sync
        desktopTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                desktopTabs.forEach(t => t.classList.remove('tab-active'));
                this.classList.add('tab-active');
                
                const value = this.textContent.trim() === 'All' ? 'all' : this.textContent.trim();
                mobileFilter.value = value;
            });
        });
    }
}

// Initialize responsive features on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set up mobile menu button click handler
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }
    
    // Initialize filter sync
    syncFilters();
});