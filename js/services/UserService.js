export class UserService {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('smartshoper_users')) || [];
        this.currentUser = JSON.parse(sessionStorage.getItem('smartshoper_currentUser')) || null;
    }

    _saveUsers() {
        localStorage.setItem('smartshoper_users', JSON.stringify(this.users));
    }

    signup(name, email, password) {
        if (this.users.find(u => u.email === email)) {
            throw new Error('User with this email already exists.');
        }
        const newUser = { id: Date.now().toString(), name, email, password }; // In a real app, hash the password
        this.users.push(newUser);
        this._saveUsers();
        return this.login(email, password);
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('Invalid email or password.');
        }
        this.currentUser = { id: user.id, name: user.name, email: user.email };
        sessionStorage.setItem('smartshoper_currentUser', JSON.stringify(this.currentUser));
        return this.currentUser;
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('smartshoper_currentUser');
    }

    getCurrentUser() {
        return this.currentUser;
    }
}
