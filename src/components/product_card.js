export default class ProductCard {
    constructor(product) {
        this.product = product;
    }

    render() {
        const product = this.product;

        const card = document.createElement("div");
        card.className = "product-card";

        const badge = this.getBadge(product.badge);
        const image = this.getImage(product);

        card.innerHTML = `
            ${badge}
            ${image}

            <h3>
                <a href="/item/${product.id}">
                    ${product.name}
                </a>
            </h3>

            <p class="price">$${Number(product.price).toFixed(2)}</p>

            <button>Add to Cart</button>
        `;

        return card;
    }

    getBadge(badge) {
        switch (Number(badge)) {
            case 1:
                return `<span class="badge new">New</span>`;
            case 2:
                return `<span class="badge sale">Sale</span>`;
            case 3:
                return `<span class="badge disc">Discontinued</span>`;
            default:
                return "";
        }
    }

    getImage(product) {
        if (product.image) {
            return `
                <div class="product-image">
                    <img src="/${product.image}" alt="${product.name}" loading="lazy">
                </div>
            `;
        }

        return `<div class="product-image-holder"></div>`;
    }
}