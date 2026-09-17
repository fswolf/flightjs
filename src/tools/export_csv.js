import ApiClient from "../tools/api_client.js";

export default class ExportCSV {
    api = new ApiClient();

    constructor({
        button,
        endpoint = null,
        rows = null,
        filename = "export",
        select = null,
        select_key = "uuid",
        data = {},
        columns = null,
        method = "POST",
        signin_path = "/signin",
        bom = true,
        safe = true,
        onExport = null,
    }) {
        this.button = document.getElementById(button);

        if (!this.button) {
            console.warn(`ExportCSV: button '${button}' not found.`);
            return;
        }

        if (!endpoint && !rows) {
            console.warn("ExportCSV: 'endpoint' or 'rows' is required.");
            return;
        }

        this.select = select && document.getElementById(select);
        if (select && !this.select) console.warn(`ExportCSV: select '${select}' not found.`);

        Object.assign(this, { endpoint, rows, filename, select_key, data, columns, signin_path, bom, safe, onExport });
        this.method = method.toUpperCase();

        this.button.addEventListener("click", e => {
            e.preventDefault();
            this.export();
        });
    }

    async export() {
        this.button.disabled = true;

        try {
            const rows = this.endpoint ? await this.fetch_rows() : await this.value(this.rows);
            if (!rows) return;

            if (!rows.length) {
                this.error("Nothing to export.");
                return;
            }

            const name = this.file_name();
            ExportCSV.download(ExportCSV.to_csv(rows, this), name, this);
            this.onExport?.(rows, name);
            return rows;
        } finally {
            this.button.disabled = false;
        }
    }

    async fetch_rows() {
        const payload = { ...(await this.value(this.data)) };
        if (this.select) payload[this.select_key] = this.select.value;

        const result = this.method === "GET"
            ? await this.api.get(this.endpoint, { params: payload })
            : await this.api.post(this.endpoint, payload);

        const data = typeof result.data === "string" ? this.parse(result.data) : result.data;

        if (data?.signin || data?.relog) {
            window.location = this.signin_path;
            return;
        }

        if (!result.success || !data?.success) {
            this.error(data?.error || result.error || "Export failed.");
            return;
        }

        return data.rows ?? data.file ?? [];
    }

    file_name() {
        const name = typeof this.filename === "function" ? this.filename(this) : this.filename;
        return /\.csv$/i.test(name) ? name : `${name}.csv`;
    }

    /* -- Static helpers (usable without an instance) -- */

    static to_csv(rows, { columns = null, safe = true } = {}) {
        const map = Array.isArray(columns)
            ? Object.fromEntries(columns.map(k => [k, k]))
            : columns ?? Object.fromEntries([...new Set(rows.flatMap(Object.keys))].map(k => [k, k]));

        const keys = Object.keys(map);
        const lines = [Object.values(map), ...rows.map(row => keys.map(k => row[k]))];

        return lines.map(line => line.map(v => ExportCSV.cell(v, safe)).join(",")).join("\r\n");
    }

    static cell(value, safe = true) {
        if (value === null || value === undefined) return "";
        if (value instanceof Date) value = value.toISOString();
        else if (typeof value === "object") value = JSON.stringify(value);

        let text = String(value);

        // block spreadsheet formula injection (=, +, -, @) on non-numeric text
        if (safe && typeof value === "string" && /^[=+\-@\t\r]/.test(text) && isNaN(text)) text = `'${text}`;

        return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    static download(csv, filename = "export.csv", { bom = true } = {}) {
        const blob = new Blob([bom ? "﻿" : "", csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement("a"), { href: url, download: filename, hidden: true });

        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /* -- Helpers -- */

    async value(v) {
        return typeof v === "function" ? v(this) : v;
    }

    parse(text) {
        try { return JSON.parse(text); } catch { return null; }
    }

    error(text) {
        if (window.notify) window.notify.error(text);
        else console.error("ExportCSV:", text);
    }
}
