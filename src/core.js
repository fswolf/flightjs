import GlobalUI from "./global_ui.js";

export class Core {
    path = window.location.pathname;
    global_ui;

    constructor(properties = {}) {
        Object.assign(this, properties);

        this.global_ui = new GlobalUI({ path: this.path });
    }

    resolve_page(routes) {
        // exact match first
        if (routes[this.path]) {
            return {
                loader: routes[this.path],
                params: {}
            };
        }

        // dynamic routes
        for (const route in routes) {
            const params = {};
            const routeParts = route.split("/");
            const pathParts = this.path.split("/");

            if (routeParts.length !== pathParts.length) {
                continue;
            }

            let matched = true;
            for (let i = 0; i < routeParts.length; i++) {
                const routePart = routeParts[i];
                const pathPart = pathParts[i];

                if (routePart.startsWith(":")) {
                    const name = routePart.substring(1);
                    params[name] = pathPart;
                } 
                else if (routePart !== pathPart) {
                    matched = false;
                    break;
                }
            }

            if (matched) {
                return { loader: routes[route], params };
            }
        }

        return null;
    }

    matchRoute(route, path) {
        const routeParts = route.split("/");
        const pathParts = path.split("/");

        if (routeParts.length !== pathParts.length) {
            return false;
        }

        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (!routePart.startsWith(":") && routePart !== pathPart) {
                return false;
            }
        }
        return true;
    }

    async start(routes, configs) {
        const route = this.resolve_page(routes);
        if (!route) return;

        const { default: Page } = await route.loader();

        const config = 
            configs[this.path] ??
            configs[Object.keys(configs).find(key => 
                this.matchRoute(key, this.path)
            )] ?? {};


        new Page({
            ...config,
            params: route.params
        });
    }
}