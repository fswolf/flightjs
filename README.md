# FlightJS

A lean, modular JavaScript front end for [FlightPHP](https://docs.flightphp.com) apps. There's no build step, no dependencies and no bundle: each page loads only the modules it uses.

The code in `src/` is taken from a working storefront (iB Store) and serves as the example of how it's used.

## How it works

```
app.js ─► core.js ─► routes.js ─► pages/*.js ─► components/*.js
                                             └► tools/*.js
```

1. **`app.js`** waits for the DOM and starts `Core` with your `Routes` and `Configs`.
2. **`core.js`** loads `GlobalUI` (menu, search, active nav link, footer year, toasts), matches the current URL against `Routes` and lazy-loads that one page module.
3. **`routes.js`** maps URLs to pages. `:name` segments become `params`, which works like Flight's `@name`. `Configs` holds each route's options.
4. **`pages/`** are classes constructed with `{ ...config, params }`. A page imports only the components and tools it needs.
5. **`components/`** and **`tools/`** are standalone modules imported by path.

```html
<script type="module" src="/js/app.js"></script>
```

## Routes and Configs

```js
export const Routes = {
    "/items/:category": () => import("./pages/products.js"),
    "/signin": () => import("./pages/signin.js")
};

export const Configs = {
    "/items/:category": {
        product_lists: [{ element: "browse-items", endpoint: "/api/items/category" }]
    },
    "/signin": { form: "login-form", endpoint: "/api/auth/signin" }
};
```

The same page can serve several routes with different configs. For example, `products.js` handles `/`, `/items`, `/items/:category` and `/search/:item`.

## Modules

| Module | What it does |
| --- | --- |
| `global_ui.js` | Mobile menu toggle, `/search/:term` search box, active nav link, footer year |
| `components/notify.js` | Toasts via `window.notify.success / error / info` |
| `components/product_list.js` | Loads products from an endpoint and renders `ProductCard`s |
| `components/product_card.js` | A single product card |
| `tools/api_client.js` | `fetch` wrapper with `get/post/put/delete` that returns `{ success, status, data \| error }` |
| `tools/form_handler.js` | AJAX form submit with validate / success / error callbacks, sending the button's `data-csrf` as `csrf_token` |
| `tools/tablesorter.js` | Server-side paginated, sortable, searchable tables |
| `tools/export_csv.js` | CSV export from an endpoint or local rows |

## Adding a page

```js
// pages/about.js
import FormHandler from "../tools/form_handler.js";

export default class About {
    constructor(options = {}) {
        new FormHandler({ form: options.form, endpoint: options.endpoint });
    }
}
```

Then register it in `routes.js` (and add a `Configs` entry if it needs options).

## License

[MIT](LICENSE) © Ryan Autet
