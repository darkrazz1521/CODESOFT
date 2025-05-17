document.addEventListener("DOMContentLoaded", function () {
    const heroImg = document.querySelector(".hero-img");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    heroImg.classList.add("show");
                } else {
                    heroImg.classList.remove("show"); // Reset animation
                }
            });
        },
        { threshold: 0.3 } // Jab 30% image dikhne lage tab animation chale
    );

    observer.observe(heroImg);
});