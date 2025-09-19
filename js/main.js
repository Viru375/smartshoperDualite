import { ProductService } from './services/ProductService.js';
import { UserService } from './services/UserService.js';
import { WishlistService } from './services/WishlistService.js';
import { SearchService } from './services/SearchService.js';
import { NotificationService } from './services/NotificationService.js';
import { UIController } from './controllers/UIController.js';
import { ThemeController } from './controllers/ThemeController.js';
import { AuthController } from './controllers/AuthController.js';
import { ProductController } from './controllers/ProductController.js';
import { WishlistController } from './controllers/WishlistController.js';
import { SearchController } from './controllers/SearchController.js';

class SmartshoperApp {
    constructor() {
        this.services = {
            notification: new NotificationService(),
            product: new ProductService(),
            user: new UserService(),
            wishlist: new WishlistService(),
        };
        this.services.search = new SearchService(this.services.product);
        
        this.controllers = {
            ui: new UIController(),
            theme: new ThemeController(),
        };
        this.controllers.auth = new AuthController(this.services.user, this.services.notification, this.controllers.ui);
        this.controllers.product = new ProductController(this.services.product, this.services.wishlist, this.services.notification, this.controllers.ui);
        this.controllers.wishlist = new WishlistController(this.services.wishlist, this.services.product, this.services.notification, this.controllers.ui);
        this.controllers.search = new SearchController(this.services.search, this.services.product);
        
        this.currentUser = null;
        this.currentView = 'home';
        this.currentFilters = {};
    }
    
    async init() {
        try {
            this.controllers.ui.renderSkeletonLoader(8, document.getElementById('mainContent'));
            
            this.controllers.theme.init();
            
            await this.services.product.init();
            this.currentUser = this.services.user.getCurrentUser();
            
            this.initializeEventListeners();
            this.updateUserUI();
            this.renderHomePage();
            
            this.controllers.search.init();
            
            this.updateWishlistCount();
            
            console.log('Smartshoper app initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.services.notification.show('Failed to initialize application', 'error');
        }
    }
    
    initializeEventListeners() {
        // Logo click
        document.querySelector('.logo').addEventListener('click', () => this.renderHomePage());

        // Mobile menu
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('mainNav')?.classList.toggle('mobile-open');
        });
        
        // Search
        document.getElementById('searchBtn')?.addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // User Auth
        document.getElementById('userBtn')?.addEventListener('click', () => {
            if (this.currentUser) this.showUserMenu();
            else this.controllers.auth.showAuthModal();
        });
        document.addEventListener('userLoggedIn', (e) => this.handleLoginSuccess(e.detail));

        // Wishlist
        document.getElementById('wishlistBtn')?.addEventListener('click', () => this.controllers.wishlist.showWishlistModal());
        document.addEventListener('wishlistUpdated', () => this.handleWishlistUpdate());
        
        // Dynamic content clicks
        document.addEventListener('click', (e) => {
            const navCategory = e.target.closest('.nav-category');
            if (navCategory) this.handleCategoryClick(navCategory.dataset.category);

            const categoryCard = e.target.closest('.category-card');
            if (categoryCard) this.handleCategoryClick(categoryCard.dataset.category);

            const productCard = e.target.closest('.product-card');
            if (productCard && !e.target.closest('.product-actions') && !e.target.closest('.wishlist-btn-product')) {
                this.controllers.product.showProductDetails(productCard.dataset.productId);
            }

            const wishlistBtn = e.target.closest('.wishlist-btn-product');
            if (wishlistBtn) {
                this.controllers.wishlist.toggleWishlist(wishlistBtn.dataset.productId);
                wishlistBtn.classList.toggle('active');
                const icon = wishlistBtn.querySelector('svg path');
                if (wishlistBtn.classList.contains('active')) {
                    icon.setAttribute('fill', 'currentColor');
                } else {
                    icon.setAttribute('fill', 'none');
                }
            }

            const viewDetailsBtn = e.target.closest('[data-action="view-details"]');
            if(viewDetailsBtn) {
                this.controllers.product.showProductDetails(viewDetailsBtn.dataset.productId);
            }
        });
    }

    handleLoginSuccess(user) {
        this.currentUser = user;
        this.updateUserUI();
        this.updateWishlistCount(); // User-specific wishlist might load
    }

    handleWishlistUpdate() {
        this.updateWishlistCount();
        // Potentially re-render current view to update wishlist icons
        if (this.currentView === 'home') this.renderHomePage();
        else if (this.currentView === 'search') this.applyFilters();
        else if (this.currentView === 'category') this.applyFilters();
    }
    
    updateUserUI() {
        const userBtnText = document.getElementById('userBtnText');
        if (userBtnText) {
            userBtnText.textContent = this.currentUser ? this.currentUser.name.split(' ')[0] : 'Sign In';
        }
    }
    
    updateWishlistCount() {
        const count = this.services.wishlist.getCount();
        const countElement = document.getElementById('wishlistCount');
        if (countElement) {
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }
    
    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const category = document.getElementById('searchCategory').value;
        if (!query) return;
        
        this.currentView = 'search';
        this.currentFilters = { query, category };
        this.services.search.addToHistory(query);
        await this.applyFilters();
    }
    
    async handleCategoryClick(category) {
        if (!category) return;
        
        this.currentView = 'category';
        this.currentFilters = { category };
        document.querySelectorAll('.nav-category').forEach(nav => {
            nav.classList.toggle('active', nav.dataset.category === category);
        });
        await this.applyFilters();
    }
    
    showUserMenu() {
        // Simple alert for now, can be expanded to a dropdown
        const confirmed = confirm(`Signed in as ${this.currentUser.name}. Do you want to sign out?`);
        if (confirmed) {
            this.services.user.logout();
            this.currentUser = null;
            this.updateUserUI();
            this.updateWishlistCount();
            this.services.notification.show('Signed out successfully', 'success');
            this.renderHomePage();
        }
    }
    
    async renderHomePage() {
        this.currentView = 'home';
        this.currentFilters = {};
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        try {
            const categories = this.services.product.getCategories();
            const [featuredProducts, todaysDeals] = await Promise.all([
                this.services.product.getFeaturedProducts(8),
                this.services.product.getTodaysDeals(6)
            ]);
            
            mainContent.innerHTML = `
                <div class="hero">
                    <h2>Find the Best Deals Across the Web</h2>
                    <p>Compare prices from multiple retailers and save money on every purchase.</p>
                </div>
                <div class="categories-section">
                    <h2 class="section-title">Shop by Category</h2>
                    <div class="categories-grid">
                        ${categories.map(c => this.renderCategoryCard(c)).join('')}
                    </div>
                </div>
                <div class="products-section">
                    <h2 class="section-title">Featured Products</h2>
                    <div class="products-grid">
                        ${featuredProducts.map(p => this.renderProductCard(p)).join('')}
                    </div>
                </div>
                <div class="products-section">
                    <h2 class="section-title">Today's Best Deals</h2>
                    <div class="products-grid">
                        ${todaysDeals.map(p => this.renderProductCard(p)).join('')}
                    </div>
                </div>
            `;
            this.updateNavigation(categories);
        } catch (error) {
            console.error('Failed to render home page:', error);
            mainContent.innerHTML = '<div class="empty-state"><h3>Failed to load content</h3><p>Please refresh the page to try again.</p></div>';
        }
    }

    renderCategoryCard(category) {
        return `
            <div class="category-card" data-category="${category.id}">
                <span class="category-icon">${category.icon}</span>
                <div class="category-name">${category.name}</div>
                <div class="category-count">${category.count} items</div>
            </div>
        `;
    }
    
    renderProductCard(product) {
        const isInWishlist = this.services.wishlist.isInWishlist(product.id);
        const bestPrice = Math.min(...product.prices.map(p => p.price));
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <button class="wishlist-btn-product ${isInWishlist ? 'active' : ''}" data-product-id="${product.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isInWishlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <div class="product-card-content">
                    <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy">
                    <div class="product-brand">${product.brand}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-rating">
                        <div class="stars">${this.renderStars(product.rating)}</div>
                        <span class="rating-count">(${product.reviewCount})</span>
                    </div>
                    <div class="product-prices">
                        <div class="price-item best-price">
                            <span class="price-source">Best Price</span>
                            <span class="price-value">$${bestPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-outline btn-sm" data-action="view-details" data-product-id="${product.id}">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '★' : '☆';
        }
        return stars;
    }
    
    updateNavigation(categories) {
        const navCategories = document.getElementById('navCategories');
        const searchCategory = document.getElementById('searchCategory');
        if (navCategories) {
            navCategories.innerHTML = categories.map(c => `<div class="nav-category" data-category="${c.id}">${c.name}</div>`).join('');
        }
        if (searchCategory) {
            searchCategory.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    }
    
    async applyFilters() {
        const mainContent = document.getElementById('mainContent');
        const filters = {
            category: document.getElementById('categoryFilter')?.value || this.currentFilters.category,
            minPrice: parseFloat(document.getElementById('minPrice')?.value) || 0,
            maxPrice: parseFloat(document.getElementById('maxPrice')?.value) || Infinity,
            brand: document.getElementById('brandFilter')?.value || '',
            rating: document.querySelector('input[name="rating"]:checked')?.value || 0
        };
        
        let products = [];
        let title = 'Results';

        mainContent.innerHTML = this.renderFiltersAndProductsLayout();
        const productsGrid = document.getElementById('productsGrid');
        this.controllers.ui.renderSkeletonLoader(12, productsGrid);

        if (this.currentView === 'search') {
            products = await this.services.search.search(this.currentFilters.query, {});
            title = `Search Results for "${this.currentFilters.query}"`;
        } else if (this.currentView === 'category') {
            const category = this.services.product.getCategory(this.currentFilters.category);
            products = await this.services.product.getProductsByCategory(this.currentFilters.category);
            title = category.name;
        }

        products = products.filter(p => {
            const bestPrice = Math.min(...p.prices.map(pr => pr.price));
            return (
                (!filters.category || p.category === filters.category) &&
                (bestPrice >= filters.minPrice && bestPrice <= filters.maxPrice) &&
                (!filters.brand || p.brand.toLowerCase() === filters.brand.toLowerCase()) &&
                (p.rating >= parseFloat(filters.rating))
            );
        });

        this.sortProducts(products, document.getElementById('sortBy')?.value);

        document.querySelector('.products-section h3').textContent = title;
        document.querySelector('.products-count').textContent = `${products.length} results`;
        productsGrid.innerHTML = products.length > 0 
            ? products.map(p => this.renderProductCard(p)).join('') 
            : '<div class="empty-state"><h3>No products found</h3><p>Try adjusting your search or filters.</p></div>';

        this.attachFilterEventListeners();
    }

    renderFiltersAndProductsLayout() {
        const categories = this.services.product.getCategories();
        return `
            <div class="filters-section">
                <div class="filters-header">
                    <h3>Filters</h3>
                    <button class="filters-toggle" id="filtersToggle">Show Filters</button>
                </div>
                <div class="filters-content" id="filtersContent">
                    <div class="filter-group">
                        <label class="filter-label">Category</label>
                        <select id="categoryFilter">
                            <option value="">All</option>
                            ${categories.map(c => `<option value="${c.id}" ${this.currentFilters.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Price Range</label>
                        <div class="price-range">
                            <input type="number" id="minPrice" placeholder="Min" min="0"><span>-</span><input type="number" id="maxPrice" placeholder="Max" min="0">
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Rating</label>
                        <div class="rating-filter">
                            ${[4, 3, 2].map(r => `
                                <label class="rating-option">
                                    <input type="radio" name="rating" value="${r}"> <span class="stars">${'★'.repeat(r)}${'☆'.repeat(5-r)}</span> & Up
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-group">
                        <button class="btn btn-primary" id="applyFilters">Apply</button>
                        <button class="btn btn-secondary" id="clearFilters">Clear</button>
                    </div>
                </div>
            </div>
            <div class="products-section">
                <div class="products-header">
                    <div><h3></h3><div class="products-count"></div></div>
                    <div class="sort-controls">
                        <select id="sortBy">
                            <option value="relevance">Relevance</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                        </select>
                    </div>
                </div>
                <div class="products-grid" id="productsGrid"></div>
            </div>
        `;
    }

    attachFilterEventListeners() {
        document.getElementById('applyFilters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters')?.addEventListener('click', () => {
            document.querySelectorAll('#filtersContent input, #filtersContent select').forEach(el => {
                if (el.type === 'radio') el.checked = false;
                else el.value = '';
            });
            if (this.currentView === 'home') this.currentFilters = {};
            if (this.currentView === 'search') this.currentFilters.category = '';
            this.applyFilters();
        });
        document.getElementById('sortBy')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filtersToggle')?.addEventListener('click', () => {
            document.getElementById('filtersContent').classList.toggle('mobile-open');
        });
    }

    sortProducts(products, sortBy) {
        products.sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return Math.min(...a.prices.map(p=>p.price)) - Math.min(...b.prices.map(p=>p.price));
                case 'price-high': return Math.min(...b.prices.map(p=>p.price)) - Math.min(...a.prices.map(p=>p.price));
                case 'rating': return b.rating - a.rating;
                default: return 0;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new SmartshoperApp();
    window.app = app; // For debugging
    app.init();
});
