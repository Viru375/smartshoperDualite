export class WishlistService {
    constructor() {
        this.wishlist = JSON.parse(localStorage.getItem('smartshoper_wishlist')) || [];
    }

    _saveWishlist() {
        localStorage.setItem('smartshoper_wishlist', JSON.stringify(this.wishlist));
    }

    addToWishlist(productId) {
        if (!this.isInWishlist(productId)) {
            this.wishlist.push(productId);
            this._saveWishlist();
            return true;
        }
        return false;
    }

    removeFromWishlist(productId) {
        const index = this.wishlist.indexOf(productId);
        if (index > -1) {
            this.wishlist.splice(index, 1);
            this._saveWishlist();
            return true;
        }
        return false;
    }

    toggleWishlist(productId) {
        if (this.isInWishlist(productId)) {
            this.removeFromWishlist(productId);
            return { added: false };
        } else {
            this.addToWishlist(productId);
            return { added: true };
        }
    }

    isInWishlist(productId) {
        return this.wishlist.includes(productId);
    }

    getWishlist() {
        return this.wishlist;
    }

    getCount() {
        return this.wishlist.length;
    }
}
