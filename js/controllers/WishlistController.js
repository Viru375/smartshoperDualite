export class WishlistController {
    constructor(wishlistService, productService, notificationService, uiController) {
        this.wishlistService = wishlistService;
        this.productService = productService;
        this.notificationService = notificationService;
        this.uiController = uiController;
        this.wishlistModalBody = document.getElementById('wishlistModalBody');
    }

    async showWishlistModal() {
        this.wishlistModalBody.innerHTML = '<div class="spinner"></div>';
        this.uiController.showModal('wishlist');
        
        const wishlistProductIds = this.wishlistService.getWishlist();
        
        if (wishlistProductIds.length === 0) {
            this.wishlistModalBody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❤️</div>
                    <h3>Your wishlist is empty</h3>
                    <p>Add products to your wishlist to track them here.</p>
                </div>
            `;
            return;
        }

        try {
            const wishlistProducts = await Promise.all(
                wishlistProductIds.map(id => this.productService.getProduct(id))
            );
            this.renderWishlist(wishlistProducts);
        } catch (error) {
            this.notificationService.show('Could not load wishlist.', 'error');
            this.wishlistModalBody.innerHTML = '<p>Error loading wishlist.</p>';
        }
    }

    renderWishlist(products) {
        this.wishlistModalBody.innerHTML = products.map(product => `
            <div class="wishlist-item" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.title}">
                <div class="wishlist-item-info">
                    <h4>${product.title}</h4>
                    <p>$${Math.min(...product.prices.map(p => p.price)).toFixed(2)}</p>
                </div>
                <button class="btn btn-sm btn-danger" data-action="remove-wishlist" data-product-id="${product.id}">Remove</button>
            </div>
        `).join('');

        this.wishlistModalBody.querySelectorAll('[data-action="remove-wishlist"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.wishlistService.removeFromWishlist(productId);
                this.notificationService.show('Removed from wishlist', 'success');
                document.dispatchEvent(new Event('wishlistUpdated'));
                this.showWishlistModal(); // Refresh the modal
            });
        });
    }

    toggleWishlist(productId) {
        const { added } = this.wishlistService.toggleWishlist(productId);
        this.notificationService.show(added ? 'Added to wishlist!' : 'Removed from wishlist', 'success');
        document.dispatchEvent(new Event('wishlistUpdated'));
    }
}
