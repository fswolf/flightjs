export default class Cart {
	constructor() {
		
		this.listen_buttons();
	}

	listen_buttons() {
		const checkoutBtn = document.querySelector('.checkout-btn');

		if (!checkoutBtn) return;

		checkoutBtn.addEventListener('click', (e) => {
			e.preventDefault();
			// redirect to checkout page
			window.location.href = '/cart/checkout';
		});
	}
}