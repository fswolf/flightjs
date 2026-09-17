import ApiClient from "../tools/api_client.js";

export default class TableSorter {
    api = new ApiClient();

    page = 1;
    total = 0;
    query = "";
    sort = null;
    order = "asc";
    request_id = 0;
    data = [];

    constructor({
        table,
        endpoint,
        rows_select = null,
        info = null,
        pager = null,
        search = null,
        rows = 10,
        total = 0,
        sort = null,
        order = "asc",
        columns = null,
        pages_shown = 5,
        search_delay = 0,
        method = "POST",
        signin_path = "/signin",
        empty_text = "No entries found.",
        autoload = true,
        onLoad = null,
    }) {
        this.table = document.getElementById(table);

        if (!this.table || !endpoint) {
            console.warn(`TableSorter: table '${table}' not found or endpoint missing.`);
            return;
        }

        this.tbody = this.table.tBodies[0] ?? this.table.createTBody();
        this.headers = [...this.table.querySelectorAll("thead th")];

        this.rows_select = rows_select && document.getElementById(rows_select);
        this.info = info && document.getElementById(info);
        this.pager = pager && document.getElementById(pager);
        this.search_box = search && document.getElementById(search);

        this.endpoint = endpoint;
        this.method = method.toUpperCase();
        this.signin_path = signin_path;
        this.empty_text = empty_text;
        this.pages_shown = pages_shown;
        this.search_delay = search_delay;
        this.onLoad = onLoad;

        this.rows = Number(this.rows_select?.value) || rows;
        this.total = total;
        this.sort = sort;
        this.order = order;
        this.columns = this.normalize_columns(columns);

        this.listen();
        this.render_headers();

        if (autoload) this.load();
        else this.render_footer();
    }

    /* -- Public API -- */

    get pages() {
        return Math.max(1, Math.ceil(this.total / this.rows));
    }

    go(page) {
        page = Math.min(Math.max(1, page), this.pages);
        if (page === this.page) return;
        this.page = page;
        return this.load();
    }

    sort_by(key, order = null) {
        this.order = order ?? (this.sort === key && this.order === "asc" ? "desc" : "asc");
        this.sort = key;
        this.page = 1;
        this.render_headers();
        return this.load();
    }

    set_rows(rows) {
        this.rows = Number(rows) || this.rows;
        this.page = 1;
        return this.load();
    }

    search(query = "") {
        query = query.trim();
        if (query === this.query) return;
        this.query = query;
        this.page = 1;
        return this.load();
    }

    refresh() {
        return this.load();
    }

    async load() {
        const id = ++this.request_id;
        const payload = this.clean({
            request: this.query ? "search" : "page",
            input: this.query,
            rows: this.rows,
            offset: (this.page - 1) * this.rows,
            sort: this.sort,
            order: this.sort ? this.order : null,
        });

        this.busy(true);

        const result = this.method === "GET"
            ? await this.api.get(this.endpoint, { params: payload })
            : await this.api.post(this.endpoint, payload);

        if (id !== this.request_id) return; // a newer request superseded this one
        this.busy(false);

        if (!result.success) return this.error(result.error);

        const data = this.parse(result.data);

        if (data?.signin || data?.relog) {
            window.location = this.signin_path;
            return;
        }

        if (!data?.success) return this.error(data?.error);

        this.total = Number(data.total ?? data.rowCount ?? this.total);

        // page fell off the end (rows deleted, rows-per-page changed)
        if (this.page > this.pages) {
            this.page = this.pages;
            return this.load();
        }

        const rows = data.rows ?? data.newRows ?? [];
        this.data = rows;
        this.render_rows(rows);
        this.render_footer();
        this.onLoad?.(rows, this);

        return rows;
    }

    /* -- Rendering -- */

    render_rows(rows) {
        if (!rows.length) {
            const td = document.createElement("td");
            td.colSpan = this.headers.length || 1;
            td.className = "table-empty";
            td.textContent = this.empty_text;
            this.tbody.replaceChildren(this.wrap_row(td));
            return;
        }

        this.tbody.replaceChildren(...rows.map(row => {
            const tr = document.createElement("tr");
            const values = Object.values(row);

            this.columns.forEach((col, i) => {
                const td = tr.insertCell();
                const value = col.key != null ? row[col.key] : values[i];
                const out = col.render ? col.render(value, row, td) : value;

                if (out instanceof Node) td.append(out);
                else td.textContent = out ?? "";
            });

            return tr;
        }));
    }

    render_headers() {
        this.headers.forEach(th => {
            const key = th.dataset.sort;
            if (!key) return;

            const active = key === this.sort;
            th.classList.toggle("sort-asc", active && this.order === "asc");
            th.classList.toggle("sort-desc", active && this.order === "desc");
            th.setAttribute("aria-sort", active ? (this.order === "asc" ? "ascending" : "descending") : "none");
        });
    }

    render_footer() {
        this.render_info();
        this.render_pager();
    }

    render_info() {
        if (!this.info) return;

        if (!this.total) {
            this.info.textContent = this.empty_text;
            return;
        }

        const start = (this.page - 1) * this.rows + 1;
        const end = Math.min(this.page * this.rows, this.total);
        this.info.innerHTML = `Showing <b>${start}</b> to <b>${end}</b> of <b>${this.total}</b> entries`;
    }

    render_pager() {
        if (!this.pager) return;

        const { page, pages, pages_shown } = this;
        const start = Math.max(1, Math.min(page - Math.floor(pages_shown / 2), pages - pages_shown + 1));
        const end = Math.min(pages, start + pages_shown - 1);

        const items = [{ label: "«", page: page - 1, disabled: page <= 1, aria: "Previous" }];
        for (let n = start; n <= end; n++) items.push({ label: n, page: n, active: n === page });
        items.push({ label: "»", page: page + 1, disabled: page >= pages, aria: "Next" });

        this.pager.replaceChildren(...items.map(item => {
            const li = document.createElement("li");
            li.className = "page-item";
            li.classList.toggle("active", !!item.active);
            li.classList.toggle("disabled", !!item.disabled);

            const a = document.createElement("a");
            a.className = "page-link";
            a.href = "#";
            a.dataset.page = item.page;
            a.textContent = item.label;
            if (item.aria) a.setAttribute("aria-label", item.aria);
            if (item.active) a.setAttribute("aria-current", "page");

            li.append(a);
            return li;
        }));
    }

    /* -- Events -- */

    listen() {
        this.headers.forEach(th => {
            const key = th.dataset.sort;
            if (!key) return;

            th.tabIndex = 0;
            th.classList.add("sortable");
            th.addEventListener("click", () => this.sort_by(key));
            th.addEventListener("keydown", e => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                this.sort_by(key);
            });
        });

        this.pager?.addEventListener("click", e => {
            const link = e.target.closest(".page-link");
            if (!link) return;
            e.preventDefault();
            if (!link.closest(".disabled")) this.go(Number(link.dataset.page));
        });

        this.rows_select?.addEventListener("change", e => this.set_rows(e.target.value));

        if (!this.search_box) return;

        let timer;
        this.search_box.addEventListener("keydown", e => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            clearTimeout(timer);
            this.search(this.search_box.value);
        });

        this.search_box.addEventListener("input", () => {
            clearTimeout(timer);
            if (!this.search_box.value) return this.search("");
            if (this.search_delay) timer = setTimeout(() => this.search(this.search_box.value), this.search_delay);
        });
    }

    /* -- Helpers -- */

    normalize_columns(columns) {
        const keys = this.headers.map(th => th.dataset.key ?? th.dataset.sort ?? null);
        if (!columns) return keys.map(key => ({ key }));

        return columns.map((col, i) =>
            typeof col === "string" || col == null ? { key: col ?? keys[i] } : { key: keys[i], ...col }
        );
    }

    wrap_row(td) {
        const tr = document.createElement("tr");
        tr.append(td);
        return tr;
    }

    busy(state) {
        this.table.classList.toggle("is-loading", state);
        this.table.setAttribute("aria-busy", state);
    }

    parse(data) {
        if (typeof data !== "string") return data;
        try { return JSON.parse(data); } catch { return null; }
    }

    clean(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== ""));
    }

    error(text = "Failed to load table.") {
        this.busy(false);
        if (window.notify) window.notify.error(text);
        else console.error("TableSorter:", text);
    }
}
