export class NotificationService {
    constructor() {
        this.notificationElement = document.getElementById('notification');
        this.messageElement = document.getElementById('notificationMessage');
        this.closeButton = document.getElementById('notificationClose');
        this.timeoutId = null;

        this.closeButton?.addEventListener('click', () => this.hide());
    }

    show(message, type = 'info', duration = 3000) {
        if (!this.notificationElement || !this.messageElement) return;

        clearTimeout(this.timeoutId);

        this.messageElement.textContent = message;
        this.notificationElement.className = 'notification'; // Reset classes
        this.notificationElement.classList.add(type);
        this.notificationElement.classList.add('active');

        this.timeoutId = setTimeout(() => this.hide(), duration);
    }

    hide() {
        if (!this.notificationElement) return;
        this.notificationElement.classList.remove('active');
    }
}
