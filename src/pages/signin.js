import FormHandler from "../tools/form_handler.js";

export default class Signin {
    constructor(options = {}) {
        // key for localStorage
        this.storageKey = "signin.remember";

        this.form = new FormHandler({
            form: options.form,
            endpoint: options.endpoint,
            validate: this.validate,
            onSuccess: this.onSuccess.bind(this),
            onError: this.onError,
        });

        this.loadEmail();
    }

    validate(data) {
        if (!data.email || !data.password) {
            window.notify.error("Please fill in all fields.");
            return false;
        }

        if (!data.csrf_token) {
            window.notify.error("Frontend error, please try again later.");
            return false;
        }

        return true;
    }

    onSuccess(result) {
        const data = JSON.parse(result.data);

        if (!data.success) {
            window.notify.error(data.error || "Unknown error");
            return;
        }

        this.saveEmail(this.form.form.elements.email.value, this.form.form.elements.remember.checked);
        window.location.href = "/";
    }

    onError(result) {
        window.notify.error(result.error || "Network error.");
    }

    saveEmail(email, remember) {
        if (remember) {
            localStorage.setItem(this.storageKey, email);
        } else {
            localStorage.removeItem(this.storageKey);
        }
    }

    loadEmail() {
        const savedEmail = localStorage.getItem(this.storageKey);
        if (savedEmail) {
            this.form.form.elements.email.value = savedEmail;
            this.form.form.elements.remember.checked = true;
        }
    }
}