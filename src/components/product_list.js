import ApiClient from "../tools/api_client.js";
import ProductCard from "../components/product_card.js";

export default class ProductList {
    api = new ApiClient();

    constructor({ element, endpoint, params = {} }) {
        this.element = document.getElementById(element);
        this.endpoint = endpoint;
        this.params = params;

        this.load();
    }

    async load() {
        let endpoint = this.endpoint;
        const options = {};

        if (this.params.category) {
            endpoint += `/${encodeURIComponent(this.params.category)}`;
        }

        // /search/:item -> /api/items/search?q=term
        if (this.params.item) {
            options.params = { q: decodeURIComponent(this.params.item) };
        }

        try {
            const result = await this.api.get(endpoint, options);

            if (!result.success) {
                window.notify.error("Failed to load.");
                return;
            }

            this.render(result.data.products);
        } catch (error) {
            console.error("Fetch failed:", error);
        }

    }

    render(products = []) {
        this.element.innerHTML = "";

        if (!products.length) {
            this.element.innerHTML = `<p class="no-results">No products found.</p>`;
            return;
        }

        products.forEach(product => {
            this.element.appendChild(new ProductCard(product).render());
        });
    }
}
