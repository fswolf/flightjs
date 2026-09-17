import ApiClient from "../tools/api_client.js";

export default class FormHandler {
    api = new ApiClient();

    constructor({ form, endpoint, method = "POST", validate = null, beforeSend = null, onSuccess = null, onError = null }) {
        this.form = document.getElementById(form);

        if (!this.form) {
            console.warn(`Form '${form}' not found.`);
            return;
        }

        this.submit_btn = this.form.querySelector('button[type="submit"], input[type="submit"]');

        this.endpoint = endpoint;
        this.method = method.toUpperCase();

        this.validate = validate;
        this.beforeSend = beforeSend;
        this.onSuccess = onSuccess;
        this.onError = onError;

        this.listen();
    }

    listen() {
        this.form.addEventListener("submit", (event) => {
            event.preventDefault();

            this.submit();
        });
    }

    async submit() {
        const data = this.getData();

        if (this.validate && !this.validate(data)) {
            return;
        }

        this.disable();
        this.beforeSend?.(data);

        let result;

        switch (this.method) {
            case "GET":
                result = await this.api.get(this.endpoint, { params: data });
                break;
            case "PUT":
                result = await this.api.put(this.endpoint, data);
                break;
            case "DELETE":
                result = await this.api.delete(this.endpoint, data);
                break;
            case "POST":
            default:
                result = await this.api.post(this.endpoint, data);
                break;
        }

        if (result.success) {
            this.onSuccess?.(result, this.form);
        } else {
            this.onError?.(result, this.form);
        }

        this.enable();

        return result;
    }

    getData() {
        const data = Object.fromEntries(
            new FormData(this.form)
        );

        const csrf_token = this.submit_btn ? this.submit_btn.dataset.csrf : null;

        if (csrf_token) {
            data.csrf_token = csrf_token;
        }

        return data;
    }

    disable() {
        this.form
            .querySelectorAll("button, input, select, textarea")
            .forEach(element => {
                element.disabled = true;
            });
    }

    enable() {
        this.form
            .querySelectorAll("button, input, select, textarea")
            .forEach(element => {
                element.disabled = false;
            });
    }
}