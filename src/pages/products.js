import ProductList from "../components/product_list.js";

export default class Products {
    product_lists = [];
    params = {};
    
    constructor(options = {}) {
        Object.assign(this, options);

        this.product_lists?.forEach(config => {
            new ProductList({
                element: config.element,
                endpoint: config.endpoint,
                params: this.params
            });
        });
    }
}