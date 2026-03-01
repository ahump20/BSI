/**
 * Ref-counted scroll lock.
 *
 * Multiple components can independently call lockScroll/unlockScroll.
 * Body overflow is hidden when lockCount > 0 and restored when it
 * reaches zero. Prevents the race where one component restores
 * overflow while another still needs it locked.
 */
let lockCount = 0;

export function lockScroll(): void {
  if (lockCount++ === 0) {
    document.body.style.overflow = 'hidden';
  }
}

export function unlockScroll(): void {
  if (lockCount > 0 && --lockCount === 0) {
    document.body.style.overflow = '';
  }
}
