// Smooth scrolling and interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add click animation to CTA button
    const ctaButton = document.querySelector('.cta');
    ctaButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
        
        // Simulate app launch
        setTimeout(() => {
            alert('MyStoryVerse app would launch here! 🚀');
        }, 300);
    });
    
    // Add hover effects to features
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        feature.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        feature.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Parallax effect for phone mockup
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const phone = document.querySelector('.phone-mockup');
        const rate = scrolled * -0.5;
        
        if (phone) {
            phone.style.transform = `translateY(${rate}px)`;
        }
    });
    
    // Handle video playback in phone mockup
    const video = document.querySelector('.app-demo-video');
    if (video) {
        video.addEventListener('loadeddata', function() {
            this.play().catch(() => {
                // Fallback to gradient background if video fails
                this.style.display = 'none';
            });
        });
        
        // Restart video when it ends
        video.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        });
    }
    
    // Add floating animation to phone
    const phone = document.querySelector('.phone');
    if (phone) {
        setInterval(() => {
            phone.style.transform += ' translateY(-5px)';
            setTimeout(() => {
                phone.style.transform = phone.style.transform.replace(' translateY(-5px)', '');
            }, 1000);
        }, 2000);
    }
    
    // Screenshot hover effects
    const screenshots = document.querySelectorAll('.screenshot');
    screenshots.forEach(screenshot => {
        screenshot.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        screenshot.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Download button tracking
    const downloadBtns = document.querySelectorAll('.download-btn');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('App store link would open here! 📱');
        });
    });
    
    // Contact item animations
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Add ripple effect CSS
const style = document.createElement('style');
style.textContent = `
    .cta {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);