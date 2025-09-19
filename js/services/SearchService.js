export class SearchService {
    constructor(productService) {
        this.productService = productService;
        this.history = JSON.parse(localStorage.getItem('smartshoper_searchHistory')) || [];
    }

    async search(query, filters = {}) {
        const lowerCaseQuery = query.toLowerCase();
        const products = await this.productService.getProducts(filters);
        
        return products.filter(product => 
            product.title.toLowerCase().includes(lowerCaseQuery) ||
            product.brand.toLowerCase().includes(lowerCaseQuery) ||
            product.description.toLowerCase().includes(lowerCaseQuery)
        );
    }

    async getSuggestions(query) {
        if (!query) return [];
        const lowerCaseQuery = query.toLowerCase();
        const products = await this.productService.getProducts();
        const suggestions = new Set();

        products.forEach(product => {
            if (product.title.toLowerCase().startsWith(lowerCaseQuery)) {
                suggestions.add(product.title);
            }
            if (product.brand.toLowerCase().startsWith(lowerCaseQuery)) {
                suggestions.add(product.brand);
            }
        });

        return Array.from(suggestions).slice(0, 5);
    }

    addToHistory(query) {
        // Remove existing entry to move it to the top
        this.history = this.history.filter(item => item !== query);
        this.history.unshift(query);
        // Keep history limited
        if (this.history.length > 10) {
            this.history.pop();
        }
        localStorage.setItem('smartshoper_searchHistory', JSON.stringify(this.history));
    }

    getHistory() {
        return this.history;
    }
}
