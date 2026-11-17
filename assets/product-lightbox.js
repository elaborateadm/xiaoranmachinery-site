(() => {
  if (!location.pathname.includes('/products/')) return;
  const images = [...document.querySelectorAll('.detail-image img, .detail-gallery img, .config-image img, .attachment-reference-grid img, .attachment-photo svg')].filter(el => !el.closest('a'));
  if (!images.length) return;
  const lang = document.documentElement.lang.split('-')[0];
  const labels = ({zh:['放大查看图片','关闭','上一张','下一张','放大 / 适应屏幕','产品图片'],fr:['Agrandir l’image','Fermer','Précédente','Suivante','Zoom / Ajuster','Image du produit'],es:['Ampliar imagen','Cerrar','Anterior','Siguiente','Zoom / Ajustar','Imagen del producto'],ar:['تكبير الصورة','إغلاق','السابق','التالي','تكبير / ملاءمة','صورة المنتج']})[lang] || ['Enlarge image','Close','Previous','Next','Zoom / Fit','Product image'];
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/product-lightbox.css'; document.head.append(css);
  const dialog = document.createElement('dialog'); dialog.className = 'product-lightbox'; dialog.setAttribute('aria-label', labels[5]);
  dialog.innerHTML = '<div class="zoom-toolbar"><span class="zoom-count" aria-live="polite"></span><button type="button" class="zoom-toggle"></button><button type="button" class="zoom-close">×</button></div><div class="zoom-stage"></div><div class="zoom-footer"><button type="button" class="zoom-prev">‹</button><p class="zoom-caption" aria-live="polite"></p><button type="button" class="zoom-next">›</button></div>';
  document.body.append(dialog);
  const stage = dialog.querySelector('.zoom-stage'), caption = dialog.querySelector('.zoom-caption'), count = dialog.querySelector('.zoom-count');
  const close = dialog.querySelector('.zoom-close'), previous = dialog.querySelector('.zoom-prev'), next = dialog.querySelector('.zoom-next'), zoom = dialog.querySelector('.zoom-toggle');
  close.setAttribute('aria-label', labels[1]); previous.setAttribute('aria-label', labels[2]); next.setAttribute('aria-label', labels[3]); zoom.textContent = labels[4];
  let index = 0, trigger, oldOverflow;
  function show(number) {
    index = (number + images.length) % images.length;
    const source = images[index], copy = source.cloneNode(true);
    copy.removeAttribute('id'); copy.removeAttribute('loading'); copy.removeAttribute('tabindex'); copy.removeAttribute('style');
    if (copy.tagName === 'IMG') { copy.src = source.currentSrc || source.src; copy.removeAttribute('srcset'); copy.removeAttribute('sizes'); }
    stage.classList.remove('is-zoomed'); stage.replaceChildren(copy); stage.scrollTo(0,0);
    caption.textContent = source.getAttribute('alt') || source.getAttribute('aria-label') || labels[5];
    count.textContent = `${index + 1} / ${images.length}`; zoom.setAttribute('aria-pressed','false');
    previous.hidden = next.hidden = images.length < 2;
  }
  images.forEach((source, number) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'product-image-zoom';
    button.setAttribute('aria-label', `${labels[0]}: ${source.getAttribute('alt') || source.getAttribute('aria-label') || labels[5]}`);
    source.replaceWith(button); button.append(source);
    button.addEventListener('click', () => { trigger = button; show(number); oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.showModal(); close.focus(); });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = oldOverflow; trigger?.focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  previous.addEventListener('click', () => show(index - 1)); next.addEventListener('click', () => show(index + 1));
  zoom.addEventListener('click', () => { const enlarged = stage.classList.toggle('is-zoomed'); zoom.setAttribute('aria-pressed', String(enlarged)); });
  dialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') {event.preventDefault(); show(index - 1);} if (event.key === 'ArrowRight') {event.preventDefault(); show(index + 1);} });
  let startX, startY;
  stage.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; startY = event.changedTouches[0].clientY; }, {passive:true});
  stage.addEventListener('touchend', event => { if (stage.classList.contains('is-zoomed')) return; const dx = event.changedTouches[0].clientX - startX, dy = event.changedTouches[0].clientY - startY; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1)); }, {passive:true});
})();
