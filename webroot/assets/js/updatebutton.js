document.querySelectorAll('.toggle-description').forEach(button => {
    button.addEventListener('click', function () {
        this.textContent = this.getAttribute('aria-expanded') === 'true'
            ? 'Show Less'
            : 'Read More';
    });
});