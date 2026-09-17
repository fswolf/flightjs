import Notify from "./components/notify.js"

export default class GlobalUI {
    path;

    menu_button;
    menu_nav;
    menu_nav_link;
    search_input;

    footer_date;

    notify;

	constructor(properties = {}) {
		Object.assign(this, properties);

		this.notify = new Notify();
        this.init();
	}

    init() {
        this.menu_button ??= document.getElementById('menu-toggle');
        this.menu_nav ??= document.getElementById('nav-container');
        this.menu_nav_link ??= document.querySelectorAll('.nav-links a');
        this.search_input ??= document.getElementById('search');

	    this.footer_date ??= document.getElementById('year');

        this.active_link();
		this.handle_menu();
		this.handle_search();

		if (this.footer_date) {
        	this.footer_date.textContent = new Date().getFullYear();
        }
    }

	handle_menu() {
		/* Mobile Toggle */
	    if (this.menu_button && this.menu_nav) {
	        this.menu_button.addEventListener('click', () => {
	            this.menu_nav.classList.toggle('active');
	        });
	    }
	}

	handle_search() {
	    if (!this.search_input) return;

	    // prefill on /search/:item
	    const match = this.path.match(/^\/search\/([^/]+)/);
	    if (match) this.search_input.value = decodeURIComponent(match[1]);

	    this.search_input.addEventListener('keydown', (e) => {
	        if (e.key !== 'Enter') return;
	        e.preventDefault();

	        // Apache 404s on encoded slashes (%2F), so strip them
	        const term = this.search_input.value.replace(/\//g, ' ').trim();
	        if (!term) return;

	        window.location.href = `/search/${encodeURIComponent(term)}`;
	    });
	}

	active_link() {
	    const path = this.path.replace(/\/$/, '');

	    this.menu_nav_link.forEach(link => {
	        if (link.getAttribute('href') === '#') return;

	        const href = new URL(link.href).pathname.replace(/\/$/, '');

	        if (href === path) {
	            link.classList.add('active');
	        }
	    });
	}
}
