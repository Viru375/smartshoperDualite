import { faker } from '@faker-js/faker';

const CATEGORIES = [
    { id: 'electronics', name: 'Electronics', icon: '💻' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'home-garden', name: 'Home & Garden', icon: '🏡' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'toys-games', name: 'Toys & Games', icon: '🎮' },
];

const RETAILERS = ['Amazon', 'Best Buy', 'Walmart', 'Target', 'Apple Store'];

export class ProductService {
    constructor() {
        this.products = [];
    }

    async init() {
        this.products = this.getProductsFromStorage() || this.generateMockProducts(500);
        this.saveProductsToStorage();
    }

    getProductsFromStorage() {
        try {
            const storedProducts = localStorage.getItem('smartshoper_products');
            return storedProducts ? JSON.parse(storedProducts) : null;
        } catch (e) {
            console.error("Failed to parse products from localStorage", e);
            return null;
        }
    }

    saveProductsToStorage() {
        localStorage.setItem('smartshoper_products', JSON.stringify(this.products));
    }

    generateMockProducts(count) {
        const products = [];
        for (let i = 0; i < count; i++) {
            const category = faker.helpers.arrayElement(CATEGORIES);
            const basePrice = faker.commerce.price({ min: 10, max: 2000, dec: 0 });

            products.push({
                id: faker.string.uuid(),
                title: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                brand: faker.company.name(),
                category: category.id,
                image: faker.image.urlLoremFlickr({ category: 'technics', width: 640, height: 480 }),
                rating: faker.number.float({ min: 2.5, max: 5, precision: 0.1 }),
                reviewCount: faker.number.int({ min: 10, max: 5000 }),
                prices: faker.helpers.arrayElements(RETAILERS, {min: 2, max: 4}).map(source => ({
                    source,
                    price: parseFloat((basePrice * faker.number.float({ min: 0.9, max: 1.2, precision: 0.01 })).toFixed(2)),
                    url: '#'
                })),
                priceHistory: Array.from({ length: 30 }, (_, i) => ({
                    date: faker.date.recent({ days: 30 - i }),
                    price: parseFloat((basePrice * faker.number.float({ min: 0.85, max: 1.25, precision: 0.01 })).toFixed(2))
                })).sort((a, b) => a.date - b.date),
                createdAt: faker.date.recent({ days: 90 }),
            });
        }
        return products;
    }

    async getProducts(filters = {}) {
        // Simulate async operation
        await new Promise(res => setTimeout(res, 100));
        let filteredProducts = this.products;

        if (filters.category) {
            filteredProducts = filteredProducts.filter(p => p.category === filters.category);
        }
        // Add more filtering logic here as needed

        return filteredProducts;
    }

    async getProduct(id) {
        await new Promise(res => setTimeout(res, 50));
        const product = this.products.find(p => p.id === id);
        if (!product) throw new Error('Product not found');
        return product;
    }

    getCategories() {
        return CATEGORIES.map(cat => ({
            ...cat,
            count: this.products.filter(p => p.category === cat.id).length
        }));
    }
    
    getCategory(id) {
        return CATEGORIES.find(c => c.id === id);
    }

    async getProductsByCategory(categoryId, filters = {}) {
        const allProducts = await this.getProducts({ ...filters, category: categoryId });
        return allProducts;
    }

    async getFeaturedProducts(limit = 8) {
        return [...this.products].sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount).slice(0, limit);
    }

    async getTodaysDeals(limit = 6) {
        return [...this.products].sort((a, b) => Math.min(...a.prices.map(p => p.price)) - Math.min(...b.prices.map(p => p.price))).slice(0, limit);
    }
}
