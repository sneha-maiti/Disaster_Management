/* ==========================================================================
   BENTO GRID MOUSEMOVE 3D SPATIAL TILT & PARALLAX EFFECT
   Adds luxury 3D perspective shifts, glowing specular highlights, and tilt.
   ========================================================================== */

(function () {
  function initBentoEffects() {
    const cards = document.querySelectorAll('.bento-card, .glass-panel');

    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });
  }

  function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8; // Max 8 deg tilt
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    card.style.borderColor = 'rgba(0, 240, 255, 0.4)';
    card.style.boxShadow = `
      ${-rotateY * 2}px ${rotateX * 2}px 30px rgba(0, 0, 0, 0.8),
      0 0 25px rgba(0, 240, 255, 0.2)
    `;
  }

  function handleMouseLeave(e) {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    card.style.borderColor = '';
    card.style.boxShadow = '';
  }

  window.addEventListener('DOMContentLoaded', initBentoEffects);
})();
