export default class Product {
	constructor() {
		
		this.initCarousel();
		this.initImages();
	}

	initCarousel() {
	    const track = document.querySelector('.related-track');

	    if (!track) return;

	    document.querySelector('.next-btn')?.addEventListener('click', () => {
	        track.scrollBy({
	            left: 300,
	            behavior: 'smooth'
	        });
	    });

	    document.querySelector('.prev-btn')?.addEventListener('click', () => {
	        track.scrollBy({
	            left: -300,
	            behavior: 'smooth'
	        });
	    });
	}

	initImages() {
		document.querySelectorAll('.thumbnail').forEach(thumb => {
		    thumb.addEventListener('click', () => {
		        document.getElementById('main-image').src = thumb.src;
		        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
		        thumb.classList.add('active');
		    });
		});
	}

}