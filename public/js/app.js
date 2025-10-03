// Client bootstrap
document.addEventListener('DOMContentLoaded', function(){
  // Search Tab Functionality
  const searchTabs = document.querySelectorAll('.search-tab');
  
  searchTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      searchTabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');
    });
  });
  
  // Property Grid Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const isNext = this.classList.contains('next-btn');
      const section = this.closest('.homes-section');
      const grid = section.querySelector('.homes-grid');
      
      if (grid) {
        const scrollAmount = 320; // Width of one card plus gap
        const currentScroll = grid.scrollLeft;
        
        if (isNext) {
          grid.scrollTo({
            left: currentScroll + scrollAmount,
            behavior: 'smooth'
          });
        } else {
          grid.scrollTo({
            left: currentScroll - scrollAmount,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // Heart/Favorite Button Animation
  const favoriteButtons = document.querySelectorAll('.favorite-btn');
  favoriteButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const heart = this.querySelector('i');
      if (heart.classList.contains('bi-heart')) {
        heart.classList.remove('bi-heart');
        heart.classList.add('bi-heart-fill');
        heart.style.color = '#ff385c';
      } else {
        heart.classList.remove('bi-heart-fill');
        heart.classList.add('bi-heart');
        heart.style.color = 'white';
      }
    });
  });
  
  // Property Card Hover Effects
  const propertyCards = document.querySelectorAll('.property-card');
  propertyCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
  
  // Search Form Enhancement
  const searchFields = document.querySelectorAll('.search-field');
  searchFields.forEach(field => {
    field.addEventListener('click', function() {
      // Remove focus from other fields
      searchFields.forEach(f => f.classList.remove('focused'));
      // Add focus to clicked field
      this.classList.add('focused');
    });
  });
  
  // Close search field focus when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-field')) {
      searchFields.forEach(f => f.classList.remove('focused'));
    }
  });
});


