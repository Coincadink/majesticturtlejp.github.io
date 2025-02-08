document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const items = document.querySelectorAll('.carousel-item');
    
    carousel.addEventListener('scroll', () => {
        const carouselRect = carousel.getBoundingClientRect();
        const centerThreshold = carouselRect.height / 2;
        
        items.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height/2 - carouselRect.top;
            const distanceFromCenter = Math.abs(centerThreshold - itemCenter);
            const scale = Math.max(1 - distanceFromCenter * 0.001, 0.9);
            
            item.style.transform = `scale(${scale})`;
            item.style.opacity = scale > 0.95 ? '1' : '0.6';
        });
    });
});