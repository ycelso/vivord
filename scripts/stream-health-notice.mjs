import { escapeHtml } from './description-format.mjs';

/** Aviso no intrusivo en fichas con reproductor no saludable (W1). */
export function streamHealthNoticeHtml() {
  return `<p class="stream-health-notice" role="status">Señal no disponible temporalmente</p>`;
}

export function wrapPlayerWithHealthNotice(playerHtml, healthy) {
  if (healthy) return playerHtml;
  return `${streamHealthNoticeHtml()}\n${playerHtml}`;
}
