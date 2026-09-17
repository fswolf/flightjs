export default class Notify {
	colors = {
		success: "#16a34a",
		error: "#dc2626",
		info: "#2563eb"
	};

	timeout = 8000;

	constructor(properties = {}) {
		Object.assign(this, properties);

	    window.notify ??= {
	        success: (msg) => this.notify(msg, "success"),
	        error: (msg) => this.notify(msg, "error"),
	        info: (msg) => this.notify(msg, "info")
	    };
	}

	getContainer() {
	    let container = document.getElementById("toast-container");
	    if (container) return container;

	    container = document.createElement("div");
	    container.id = "toast-container";

	    Object.assign(container.style, {
	        position: "fixed",
	        bottom: "1rem",
	        right: "1rem",
	        zIndex: "9999",
	        display: "flex",
	        flexDirection: "column",
	        gap: "0.5rem",
	        maxWidth: "300px"
	    });

	    document.body.appendChild(container);

	    return container;
	}

	notify(message, type = "info") {
	    const container = this.getContainer();

	    const toast = document.createElement("div");
	    toast.textContent = message;

	    Object.assign(toast.style, {
	        background: this.colors[type] ?? this.colors.info,
	        color: "white",
	        padding: "0.75rem 1rem",
	        borderRadius: "8px",
	        boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
	        fontSize: "0.9rem",
	        opacity: "0",
	        transform: "translateY(-10px)",
	        transition: "all 0.25s ease"
	    });

	    container.appendChild(toast);

	    requestAnimationFrame(() => {
	        toast.style.opacity = "1";
	        toast.style.transform = "translateY(0)";
	    });

	    setTimeout(() => {
	        toast.style.opacity = "0";
	        toast.style.transform = "translateY(10px)";
	        setTimeout(() => toast.remove(), 250);
	    }, this.timeout);
	}

}