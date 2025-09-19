export class AuthController {
    constructor(userService, notificationService, uiController) {
        this.userService = userService;
        this.notificationService = notificationService;
        this.uiController = uiController;
        this.authModal = document.getElementById('authModal');
        this.authModalBody = document.getElementById('authModalBody');
        this.authModalTitle = document.getElementById('authModalTitle');
    }

    showAuthModal(view = 'login') {
        if (view === 'login') {
            this.renderLoginForm();
        } else {
            this.renderSignupForm();
        }
        this.uiController.showModal('auth');
    }

    renderLoginForm() {
        this.authModalTitle.textContent = 'Sign In';
        this.authModalBody.innerHTML = `
            <form class="auth-form" id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Sign In</button>
                </div>
                <p class="auth-switch">
                    Don't have an account? <button type="button" id="showSignup">Sign Up</button>
                </p>
            </form>
        `;
        document.getElementById('loginForm').addEventListener('submit', e => this.handleLogin(e));
        document.getElementById('showSignup').addEventListener('click', () => this.renderSignupForm());
    }

    renderSignupForm() {
        this.authModalTitle.textContent = 'Sign Up';
        this.authModalBody.innerHTML = `
            <form class="auth-form" id="signupForm">
                <div class="form-group">
                    <label for="signupName">Name</label>
                    <input type="text" id="signupName" required>
                </div>
                <div class="form-group">
                    <label for="signupEmail">Email</label>
                    <input type="email" id="signupEmail" required>
                </div>
                <div class="form-group">
                    <label for="signupPassword">Password</label>
                    <input type="password" id="signupPassword" required minlength="6">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Sign Up</button>
                </div>
                <p class="auth-switch">
                    Already have an account? <button type="button" id="showLogin">Sign In</button>
                </p>
            </form>
        `;
        document.getElementById('signupForm').addEventListener('submit', e => this.handleSignup(e));
        document.getElementById('showLogin').addEventListener('click', () => this.renderLoginForm());
    }

    handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            const user = this.userService.login(email, password);
            this.notificationService.show(`Welcome back, ${user.name}!`, 'success');
            this.uiController.closeModal('auth');
            // Dispatch a custom event to notify the main app
            document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
        } catch (error) {
            this.notificationService.show(error.message, 'error');
        }
    }

    handleSignup(event) {
        event.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        try {
            const user = this.userService.signup(name, email, password);
            this.notificationService.show('Account created successfully! You are now logged in.', 'success');
            this.uiController.closeModal('auth');
             // Dispatch a custom event to notify the main app
            document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
        } catch (error) {
            this.notificationService.show(error.message, 'error');
        }
    }
}
