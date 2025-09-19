import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export class ProductController {
    constructor(productService, wishlistService, notificationService, uiController) {
        this.productService = productService;
        this.wishlistService = wishlistService;
        this.notificationService = notificationService;
        this.uiController = uiController;
        this.productModalBody = document.getElementById('productModalBody');
        this.productModalTitle = document.getElementById('productModalTitle');
        this.chartInstance = null;
    }

    async showProductDetails(productId) {
        this.productModalBody.innerHTML = '<div class="spinner"></div>';
        this.uiController.showModal('product');
        try {
            const product = await this.productService.getProduct(productId);
            this.renderProductDetails(product);
        } catch (error) {
            this.notificationService.show('Could not load product details.', 'error');
            this.uiController.closeModal('product');
        }
    }

    renderProductDetails(product) {
        this.productModalTitle.textContent = product.title;
        const isInWishlist = this.wishlistService.isInWishlist(product.id);
        const bestPrice = Math.min(...product.prices.map(p => p.price));
        const bestPriceSource = product.prices.find(p => p.price === bestPrice);

        this.productModalBody.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image-wrapper">
                    <img src="${product.image}" alt="${product.title}" class="product-detail-image">
                </div>
                <div class="product-detail-info">
                    <h3>${product.title}</h3>
                    <div class="product-brand">${product.brand}</div>
                    <div class="product-rating">
                        <span class="stars">${this.renderStars(product.rating)}</span>
                        <span>${product.rating.toFixed(1)} (${product.reviewCount} reviews)</span>
                    </div>
                    <p class="product-description">${product.description}</p>
                    
                    <h4>Price Comparison</h4>
                    <div class="price-comparison">
                        ${product.prices.map(p => `
                            <div class="price-item ${p.price === bestPrice ? 'best-price' : ''}">
                                <span class="price-source">${p.source}</span>
                                <a href="${p.url}" target="_blank" class="price-value">$${p.price.toFixed(2)}</a>
                            </div>
                        `).join('')}
                    </div>

                    <div class="price-history">
                        <h4>Price History (30 days)</h4>
                        <div class="chart-container">
                            <canvas id="priceHistoryChart"></canvas>
                        </div>
                    </div>

                    <div class="product-detail-actions">
                        <a href="${bestPriceSource.url}" target="_blank" class="btn btn-primary btn-lg">
                            Buy Now for $${bestPrice.toFixed(2)}
                        </a>
                        <button class="btn btn-secondary" id="productDetailWishlistBtn" data-product-id="${product.id}">
                            ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        </button>
                         <button class="btn btn-outline" id="setPriceAlertBtn">
                            Set Price Alert
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.renderPriceChart(product.priceHistory);

        document.getElementById('productDetailWishlistBtn').addEventListener('click', (e) => {
            const result = this.wishlistService.toggleWishlist(product.id);
            this.notificationService.show(result.added ? 'Added to wishlist!' : 'Removed from wishlist', 'success');
            e.target.textContent = result.added ? 'Remove from Wishlist' : 'Add to Wishlist';
            document.dispatchEvent(new Event('wishlistUpdated'));
        });
        
        document.getElementById('setPriceAlertBtn').addEventListener('click', () => {
            this.notificationService.show('Price alert has been set!', 'success');
        });
    }

    renderPriceChart(priceHistory) {
        const ctx = document.getElementById('priceHistoryChart')?.getContext('2d');
        if (!ctx) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const labels = priceHistory.map(h => new Date(h.date).toLocaleDateString());
        const data = priceHistory.map(h => h.price);

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price',
                    data: data,
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(255, 149, 0, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        ticks: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '★';
            } else if (i - 0.5 <= rating) {
                stars += '★'; // Represent half star with full for simplicity, can be improved
            } else {
                stars += '☆';
            }
        }
        return stars;
    }
}
