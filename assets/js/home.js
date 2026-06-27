function filterChannelGrids(query) {
  const grids = [
    document.getElementById('priorityChannels'),
    document.getElementById('allChannels'),
  ].filter(Boolean);
  if (grids.length === 0) return 0;

  const cards = grids.flatMap((grid) => [...grid.querySelectorAll('.channel-card')]);
  const q = query.toLowerCase().trim();
  let visible = 0;

  cards.forEach((card) => {
    const name = card.dataset.name || card.textContent.toLowerCase();
    const show = !q || name.includes(q);
    card.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  const empty = document.getElementById('filterEmpty');
  if (empty) empty.hidden = visible > 0;
  return visible;
}

document.addEventListener('DOMContentLoaded', () => {
  const filter = document.getElementById('channelFilter');
  const heroSearch = document.getElementById('heroSearch');
  const grids = [
    document.getElementById('priorityChannels'),
    document.getElementById('allChannels'),
  ].filter(Boolean);
  if (grids.length === 0) return;

  const applyFilter = (value) => {
    filterChannelGrids(value);
    if (heroSearch && heroSearch.value !== value) heroSearch.value = value;
    if (filter && filter.value !== value) filter.value = value;
  };

  filter?.addEventListener('input', () => applyFilter(filter.value));
  heroSearch?.addEventListener('input', () => applyFilter(heroSearch.value));

  const headerSearch = document.getElementById('searchInput');
  headerSearch?.addEventListener('input', () => applyFilter(headerSearch.value));

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
});
