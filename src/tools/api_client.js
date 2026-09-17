export default class ApiClient {
	constructor(baseURL = "") {
		this.baseURL = baseURL;
	}

	async request(endpoint, options = {}) {
		const config = {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				...options.headers
			},
			...options
		};

		// attach JSON body automatically if object
		if (config.body && typeof config.body === "object") {
			config.body = JSON.stringify(config.body);
		}

		try {
			const res = await fetch(this.baseURL + endpoint, config);

			const contentType = res.headers.get("content-type");
			const isJson = contentType?.includes("application/json");

			const data = isJson ? await res.json() : await res.text();

			if (!res.ok) {
				return {
					success: false,
					status: res.status,
					error: data?.error || "Request failed",
					raw: data
				};
			}

			return {
				success: true,
				status: res.status,
				data
			};

		} catch (err) {
			return {
				success: false,
				status: 0,
				error: "Network error",
				raw: err
			};
		}
	}

	get(endpoint, options = {}) {
		const { params, ...rest } = options;

		if (params && Object.keys(params).length) {
			const query = new URLSearchParams(params).toString();
			endpoint += (endpoint.includes("?") ? "&" : "?") + query;
		}

		return this.request(endpoint, { ...rest, method: "GET" });
	}

	post(endpoint, body, options = {}) {
		return this.request(endpoint, {
			...options,
			method: "POST",
			body
		});
	}

	put(endpoint, body, options = {}) {
		return this.request(endpoint, {
			...options,
			method: "PUT",
			body
		});
	}

	delete(endpoint, body = null, options = {}) {
		return this.request(endpoint, {
			...options,
			method: "DELETE",
			...(body ? { body } : {})
		});
	}
}