"use client";

/**
 * PageTransition
 * Envuelve el contenido de una página (sin Header/BottomNav) y aplica
 * la animación page-enter cada vez que el componente se monta,
 * lo que ocurre tanto en la carga del skeleton (loading.tsx)
 * como en la llegada de los datos reales (page.tsx).
 */
export default function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`page-enter ${className}`}>
      {children}
    </div>
  );
}
