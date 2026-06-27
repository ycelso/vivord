function filterRadioGrids(query, scope = 'all') {
  const allGrids = [
    document.getElementById('priorityRadios'),
    document.getElementById('allRadios'),
    document.querySelector('.radio-featured'),
  ].filter(Boolean);
  const secondaryOnly = document.getElementById('allRadios');
  const grids =
    scope === 'secondary' && secondaryOnly ? [secondaryOnly] : allGrids;
  if (grids.length === 0) return 0;

  const cards = grids.flatMap((grid) => [...grid.querySelectorAll('.radio-card')]);
  const q = query.toLowerCase().trim();
  let visible = 0;

  cards.forEach((card) => {
    const name = card.dataset.name || card.textContent.toLowerCase();
    const show = !q || name.includes(q);
    card.hidden = !show;
    if (show) visible++;
  });

  const empty = document.getElementById('radioFilterEmpty');
  if (empty) empty.hidden = visible > 0;
  return visible;
}

document.addEventListener('DOMContentLoaded', () => {
  const filter = document.getElementById('radioFilter');
  const heroSearch = document.getElementById('heroRadioSearch');
  const headerSearch = document.getElementById('searchInput');

  const applyFilter = (value, scope = 'all') => {
    filterRadioGrids(value, scope);
    if (filter && filter.value !== value && scope !== 'secondary') filter.value = value;
    if (heroSearch && heroSearch.value !== value && scope !== 'secondary') {
      heroSearch.value = value;
    }
  };

  filter?.addEventListener('input', () => applyFilter(filter.value, 'secondary'));
  heroSearch?.addEventListener('input', () => applyFilter(heroSearch.value));

  heroSearch?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const term = heroSearch.value.trim();
    if (!term) return;
    applyFilter(term);
    const target = document.getElementById('radios-secundarias');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      document.getElementById('emisoras-principales')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });

  if (headerSearch && filter) {
    headerSearch.addEventListener('input', () => applyFilter(headerSearch.value));
  }
});
