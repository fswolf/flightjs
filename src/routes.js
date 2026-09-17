
export const Routes = {
    "/": () => import("./pages/products.js"),
    "/items": () => import("./pages/products.js"),
    "/items/:category": () => import("./pages/products.js"), 
    "/search/:item": () => import("./pages/products.js"),
    "/item": () => import("./pages/product.js"),
    "/cart": () => import("./pages/cart.js"),
    "/signin": () => import("./pages/signin.js")
};

export const Configs = {
    "/": {
        product_lists: [
            {
                element: "featured-items",
                endpoint: "/api/items/featured"
            },
            {
                element: "newest-items",
                endpoint: "/api/items/newest"
            }
        ]
    },
    "/items": {
        product_lists: [
            {
                element: "browse-items",
                endpoint: "/api/items/browse"
            }
        ]
    },
    "/items/:category": {
        product_lists: [
            {
                element: "browse-items",
                endpoint: "/api/items/category"
            }
        ]
    },
    "/search/:item": {
        product_lists: [
            {
                element: "browse-items",
                endpoint: "/api/items/search"
            }
        ]
    },
    "/signin": {
        form: "login-form",
        endpoint: "/api/auth/signin",
    }
};