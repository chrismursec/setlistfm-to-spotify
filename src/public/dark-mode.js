document.getElementById('theme_toggle').addEventListener('click', function () {
	document.body.classList.toggle('dark-theme');
	document.querySelector('nav').classList.toggle('dark-theme');
	document.querySelector('footer').classList.toggle('dark-theme');

	if (document.body.classList.contains('dark-theme')) {
		localStorage.setItem('theme', 'dark');
	} else {
		localStorage.setItem('theme', 'light');
	}
});

window.addEventListener('DOMContentLoaded', (event) => {
	event.preventDefault();
	if (localStorage.getItem('theme') === 'dark') {
		document.body.classList.add('dark-theme');
		document.querySelector('nav').classList.add('dark-theme');
		document.querySelector('footer').classList.add('dark-theme');
	}
});
