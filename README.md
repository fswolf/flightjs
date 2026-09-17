# FlightJS

A small, modular JavaScript front end built to sit on top of [FlightPHP](https://docs.flightphp.com). It mirrors the way a Flight app is organised — routes, pages, reusable pieces — so the browser side of your project reads the same way as the PHP side.

- **No build step.** Plain ES modules loaded straight from `assets/js`. Edit, refresh, done.
- **No dependencies.** Nothing to install; the whole thing is a handful of small files.
- **Lazy by default.** Each URL loads only the page module it needs, and that page imports only the components and tools it uses.
- **API-first.** Pages talk to Flight's JSON routes through a thin fetch wrapper. HTML stays in Flight's views; JS fills in the dynamic parts.

The `components/` and `pages/` in this repo come from a working storefront ([iB Store](https://store.imbored.me)) and are there as **examples** of the pattern. Keep the core and tools, replace the examples with your own.

## How it maps to FlightPHP

| FlightPHP | FlightJS | |
| --- | --- | --- |
| `routes.php` | `routes.js` | URL → handler. `@name` in PHP is `:name` in JS. |
| Controllers | `pages/` | One class per screen, given the route's config and params. |
| Views / includes | `components/` | Reusable bits of UI that render into an element. |
| Libraries | `tools/` | Framework-agnostic helpers: API client, forms, tables, CSV. |
| `Flight::before()` | `global_ui.js` | Runs on every page: menu, search box, nav state, toasts. |

A typical request: Flight renders the view with the static shell, then FlightJS resolves the same URL on the client, loads the matching page and fetches the dynamic data from your `/api/...` routes.

## Layout

```
assets/js/
├── app.js            entry point — waits for the DOM, starts Core
├── core.js           route matching + page loading
├── routes.js         Routes (URL → page) and Configs (URL → options)
├── global_ui.js      site-wide behaviour, runs on every page
├── pages/            one module per screen (examples)
├── components/       notify, product_card, product_list (examples)
└── tools/            api_client, form_handler, tablesorter, export_csv
```

## Quick start

1. Copy `src/` into your Flight project as `public/assets/js/` (or wherever you serve static files).
2. Add the entry script to your layout / views:

```html
<script type="module" src="/assets/js/app.js"></script>
```

3. Register your pages in `routes.js`.

That's it. `app.js` runs `Core`, which matches `window.location.pathname` against `Routes`, imports that page and constructs it.

## Routes and Configs

`routes.js` exports two objects.

```js
export const Routes = {
    "/":                 () => import("./pages/products.js"),
    "/items":            () => import("./pages/products.js"),
    "/items/:category":  () => import("./pages/products.js"),
    "/search/:item":     () => import("./pages/products.js"),
    "/signin":           () => import("./pages/signin.js")
};

export const Configs = {
    "/items/:category": {
        product_lists: [{ element: "browse-items", endpoint: "/api/items/category" }]
    },
    "/signin": { form: "login-form", endpoint: "/api/auth/signin" }
};
```

- **Routes** map a path to a dynamic `import()`. The module is only downloaded when that URL is visited.
- **Configs** hold per-route options. Whatever you put here is passed to the page's constructor, so pages stay generic and the route decides what they do.
- **Matching** tries an exact path first, then patterns. A `:name` segment matches exactly one URL segment and is exposed as `params.name`. Segment counts must match: `/item/:uuid` matches `/item/42` but not `/item` or `/item/42/edit`.
- The same page can serve many routes. `products.js` handles the home page, the shop, categories and search; only the config changes.

## Pages

A page is a default-exported class. `Core` constructs it with the route's config plus `params`:

```js
// pages/products.js
import ProductList from "../components/product_list.js";

export default class Products {
    product_lists = [];
    params = {};

    constructor(options = {}) {
        Object.assign(this, options);   // { product_lists, params }

        this.product_lists.forEach(cfg =>
            new ProductList({ ...cfg, params: this.params })
        );
    }
}
```

Nothing else is required. A page can be as small as attaching a click handler (`pages/cart.js`) or can wire up several tools.

## Global UI

`global_ui.js` runs before the page on every request. It looks for elements by id and quietly skips any that aren't on the page:

| Element | Behaviour |
| --- | --- |
| `#menu-toggle` + `#nav-container` | Mobile menu toggle (`.active`) |
| `.nav-links a` | Adds `.active` to the link matching the current path |
| `#search` | Enter navigates to `/search/<term>`; the box is pre-filled on search pages |
| `#year` | Filled with the current year |

It also creates the `Notify` toaster, so `window.notify` is available everywhere.

## Tools

Tools are standalone modules with no knowledge of routing. Import what you need.

### `ApiClient`

Thin `fetch` wrapper that always resolves — no try/catch needed at the call site.

```js
import ApiClient from "../tools/api_client.js";
const api = new ApiClient();

const r = await api.get("/api/items/search", { params: { q: "mouse" } });
const r = await api.post("/api/auth/signin", { email, password });
// r = { success: true,  status, data }
// r = { success: false, status, error, raw }
```

Objects passed as a body are JSON-encoded; JSON responses are decoded. `put` and `delete` work the same way.

### `FormHandler`

Turns a normal `<form>` into an AJAX form.

```js
new FormHandler({
    form: "login-form",            // form id
    endpoint: "/api/auth/signin",
    method: "POST",                // GET sends fields as query params
    validate:   data => true,      // return false to stop
    beforeSend: data => {},
    onSuccess:  (result, form) => {},
    onError:    (result, form) => {}
});
```

Fields are collected with `FormData`. If the submit button has `data-csrf="..."`, it's sent as `csrf_token`. Inputs are disabled while the request is in flight.

### `TableSorter`

Server-side paging, sorting and search for a `<table>`. The browser never sorts what's on screen — every change asks the API for the right rows.

```html
<input id="orders-search">
<select id="orders-rows"><option>10</option><option>25</option></select>
<table id="orders">
  <thead><tr>
    <th data-sort="id">#</th>
    <th data-sort="created_at">Date</th>
    <th data-key="status">Status</th>   <!-- not sortable -->
  </tr></thead>
  <tbody></tbody>
</table>
<div id="orders-info"></div>
<ul id="orders-pager" class="pagination"></ul>
```

```js
const table = new TableSorter({
    table: "orders", endpoint: "/api/orders",
    rows_select: "orders-rows", info: "orders-info",
    pager: "orders-pager", search: "orders-search",
    sort: "created_at", order: "desc",
    columns: [null, null, { key: "total", render: v => `$${Number(v).toFixed(2)}` }]
});
```

Other options: `rows` (default 10), `pages_shown` (5), `search_delay` (ms, 0 = Enter only), `method` (`POST`/`GET`), `signin_path`, `empty_text`, `autoload`, `onLoad(rows, table)`. Methods: `go(page)`, `sort_by(key)`, `search(text)`, `set_rows(n)`, `refresh()`. The last loaded rows are on `table.data`.

**Request** `{ request: "page" | "search", input?, rows, offset, sort?, order? }`
**Response** `{ success: true, rows: [...], total: 123 }` — or `{ success: false, signin: true }` to redirect to sign-in.

Whitelist `sort` on the PHP side; `ORDER BY` can't take a bound parameter:

```php
$in    = Flight::request()->data;
$cols  = ['id' => 'o.id', 'created_at' => 'o.created_at', 'total' => 'o.total'];
$sort  = $cols[$in->sort ?? ''] ?? 'o.id';
$order = strtolower($in->order ?? '') === 'desc' ? 'DESC' : 'ASC';
$rows  = min(max((int)($in->rows ?? 10), 1), 100);
$off   = max((int)($in->offset ?? 0), 0);
// SELECT ... ORDER BY $sort $order LIMIT :rows OFFSET :off
Flight::json(['success' => true, 'rows' => $list, 'total' => $count]);
```

### `ExportCSV`

Download rows as a CSV, from an endpoint or from data already in the page.

```js
// from the API
new ExportCSV({ button: "export-btn", endpoint: "/api/orders/export", select: "store-list", filename: "orders" });

// from a TableSorter's current page
new ExportCSV({ button: "export-page", rows: () => table.data, columns: { id: "Order #", total: "Total" } });

// no button at all
ExportCSV.download(ExportCSV.to_csv(rows), "orders.csv");
```

Options: `columns` (array of keys, or `{ key: "Header" }`), `data` (extra request fields), `select` / `select_key`, `method`, `filename` (string or function), `bom` (UTF-8 BOM for Excel), `safe` (neutralise `=`/`+`/`-`/`@` formula injection), `onExport`. The endpoint returns `{ success: true, rows: [...] }`.

### `Notify`

Created by `GlobalUI`; no CSS required.

```js
window.notify.success("Saved.");
window.notify.error("Something went wrong.");
window.notify.info("Heads up.");
```

## Components (examples)

- **`ProductList`** — `{ element, endpoint, params }`. Fetches `endpoint` (appending `/params.category` or `?q=params.item` when present) and renders a `ProductCard` per product into `#element`.
- **`ProductCard`** — builds one card from `{ id, name, price, image, badge }`.

These are specific to the storefront and are meant to be copied, not kept.

## Adding a page

```js
// pages/contact.js
import FormHandler from "../tools/form_handler.js";

export default class Contact {
    constructor({ form, endpoint }) {
        new FormHandler({
            form, endpoint,
            onSuccess: () => window.notify.success("Sent!"),
            onError:   r  => window.notify.error(r.error)
        });
    }
}
```

```js
// routes.js
Routes["/contact"]  = () => import("./pages/contact.js");
Configs["/contact"] = { form: "contact-form", endpoint: "/api/contact" };
```

## Conventions

- Files and options are `snake_case`; classes are `PascalCase`.
- Every tool takes a single options object and warns in the console (rather than throwing) if an element is missing.
- API responses are `{ success: bool, ... }`. Return `signin: true` to send the user to the sign-in page.
- Tools report failures through `window.notify.error` when it exists, otherwise `console.error`.

## License

[MIT](LICENSE) © Ryan Autet
