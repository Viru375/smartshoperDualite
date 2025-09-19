export class UIController {
    constructor() {
        this.modals = {
            auth: document.getElementById('authModal'),
            product: document.getElementById('productModal'),
            wishlist: document.getElementById('wishlistModal'),
        };

        // General modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                this.closeAllModals();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    showModal(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.remove('active');
            // Only restore scroll if no other modals are open
            if (!Object.values(this.modals).some(m => m.classList.contains('active'))) {
                document.body.style.overflow = '';
            }
        }
    }

    closeAllModals() {
        Object.keys(this.modals).forEach(id => this.closeModal(id));
    }

    renderSkeletonLoader(count, container) {
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="product-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text title"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            `;
        }
        container.innerHTML = skeletons;
    }
}
