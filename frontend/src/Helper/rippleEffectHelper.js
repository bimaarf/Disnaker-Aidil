export function applyRippleEffect(e) {
  const button = e.currentTarget;

  // Buat elemen ripple
  const ripple = document.createElement("span");

  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;

  // Posisi klik relatif
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

  // Tambahkan class
  ripple.className = "absolute rounded-full animate-ripple";

  // Append ripple
  button.appendChild(ripple);

  // Hapus setelah animasi selesai
  setTimeout(() => ripple.remove(), 600);
}
