/**
 * Coody Home Slider — wizualny edytor warstw slajdu (BO).
 *
 * Dane: JSON w <textarea name="layers_{id_lang}"> (cały slajd per język, jak pola językowe PrestaShop).
 * Podgląd renderuje te same klasy i zmienne CSS co views/templates/hook/_caption.tpl
 * (CoodyHomeSlideLayers::toFront) i korzysta z views/css/front.css — slajd jest budowany
 * w szerokości referencyjnej (komputer 1296 px, telefon 375 px) i skalowany do ramki.
 */
(function () {
  'use strict';

  var REF = { desktop: 1296, mobile: 375 };
  var FULL_HEIGHT = { desktop: 410, mobile: 240 };
  var RATIO = { desktop: 1296 / 450, mobile: 743 / 480 };
  var SNAP_PX = 7;
  var MAX_LAYERS = 20;

  var ICONS = {
    text: 'icon-font',
    button: 'icon-hand-up',
    image: 'icon-picture',
    shape: 'icon-stop',
  };

  var TYPE_LABELS = { text: 'Tekst', button: 'Przycisk', image: 'Obraz', shape: 'Kształt' };

  var ANIMS = [
    ['up', 'Wjazd z dołu'],
    ['down', 'Wjazd z góry'],
    ['left', 'Wjazd z lewej'],
    ['right', 'Wjazd z prawej'],
    ['fade', 'Pojawienie'],
    ['zoom', 'Powiększenie'],
    ['none', 'Bez animacji'],
  ];

  var SCRIMS = [
    ['none', 'Brak'],
    ['left', 'Od lewej'],
    ['right', 'Od prawej'],
    ['bottom', 'Od dołu'],
    ['top', 'Od góry'],
    ['full', 'Całe zdjęcie'],
  ];

  var ARROW_SVG = '<svg class="chs-layer__arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">'
    + '<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg>';

  /* ------------------------------------------------------------------ helpers */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) {
        return;
      }
      if (key === 'class') {
        node.className = value;
      } else if (key === 'text') {
        node.textContent = value;
      } else if (key === 'html') {
        node.innerHTML = value;
      } else if (key.indexOf('on') === 0 && typeof value === 'function') {
        node.addEventListener(key.slice(2), value);
      } else {
        node.setAttribute(key, value === true ? '' : value);
      }
    });
    (children || []).forEach(function (child) {
      if (child) {
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      }
    });

    return node;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, digits) {
    var f = Math.pow(10, digits || 0);

    return Math.round(value * f) / f;
  }

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(h)) {
      return '255 255 255';
    }

    return parseInt(h.slice(0, 2), 16) + ' ' + parseInt(h.slice(2, 4), 16) + ' ' + parseInt(h.slice(4, 6), 16);
  }

  function uid() {
    return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ------------------------------------------------------------ data model */

  function defaultGeometry(fs) {
    return { x: 6, y: 30, w: 0, h: 0, fs: fs, hide: false };
  }

  function normalizeLayer(layer) {
    var l = layer || {};
    var style = l.style || {};

    return {
      id: l.id || uid(),
      type: l.type || 'text',
      text: l.text || '',
      link: l.link || '',
      newtab: !!l.newtab,
      src: l.src || '',
      alt: l.alt || '',
      variant: l.variant || 'primary',
      arrow: l.arrow !== false,
      style: {
        color: style.color || '#ffffff',
        bg: style.bg || '',
        bgOpacity: style.bgOpacity == null ? 100 : style.bgOpacity,
        opacity: style.opacity == null ? 100 : style.opacity,
        weight: style.weight || 400,
        upper: !!style.upper,
        italic: !!style.italic,
        spacing: style.spacing || 0,
        lh: style.lh || 1.2,
        align: style.align || 'left',
        shadow: !!style.shadow,
        radius: style.radius || 0,
        blur: style.blur || 0,
        decor: style.decor || 'none',
      },
      d: Object.assign(defaultGeometry(52), l.d || {}),
      m: Object.assign(defaultGeometry(26), l.m || l.d || {}),
      anim: Object.assign({ type: 'up', delay: 0, dur: 800 }, l.anim || {}),
    };
  }

  function normalizeDoc(doc) {
    var d = doc || {};
    var scrim = d.scrim || {};

    return {
      v: 1,
      scrim: {
        d: scrim.d || 'none',
        m: scrim.m || 'none',
        color: scrim.color || '#0b1226',
        strength: scrim.strength == null ? 70 : scrim.strength,
      },
      layers: (d.layers || []).map(normalizeLayer),
    };
  }

  function presetLayers(accent, contrast) {
    return {
      eyebrow: {
        label: 'Nadtytuł', hint: 'mały tekst z kreską',
        layer: { type: 'text', text: 'NOWOŚĆ', style: { weight: 600, upper: true, spacing: 0.16, lh: 1.3, decor: 'line' }, d: { w: 0, fs: 14 }, m: { w: 0, fs: 11 }, anim: { delay: 100 } },
      },
      heading: {
        label: 'Nagłówek', hint: 'główne hasło',
        layer: { type: 'text', text: 'Nagłówek slajdu', style: { weight: 700, lh: 1.08, spacing: -0.02 }, d: { w: 46, fs: 54 }, m: { w: 88, fs: 26 }, anim: { delay: 200 } },
      },
      subheading: {
        label: 'Podtytuł', hint: 'średni tekst',
        layer: { type: 'text', text: 'Podtytuł slajdu', style: { weight: 600, lh: 1.25, spacing: -0.01 }, d: { w: 40, fs: 26 }, m: { w: 88, fs: 17 }, anim: { delay: 300 } },
      },
      body: {
        label: 'Opis', hint: '1–2 zdania',
        layer: { type: 'text', text: 'Krótki opis oferty w jednym lub dwóch zdaniach.', style: { weight: 400, lh: 1.55, opacity: 90 }, d: { w: 36, fs: 18 }, m: { w: 88, fs: 14 }, anim: { delay: 350 } },
      },
      badge: {
        label: 'Naklejka', hint: 'tekst na kolorowym tle',
        layer: { type: 'text', text: '-20%', style: { weight: 700, bg: accent, bgOpacity: 100, color: contrast, radius: 999, lh: 1.1 }, d: { w: 0, fs: 18 }, m: { w: 0, fs: 13 }, anim: { type: 'zoom', delay: 500 } },
      },
      btnPrimary: {
        label: 'Przycisk główny', hint: 'w kolorze akcentu',
        layer: { type: 'button', text: 'Zobacz ofertę', variant: 'primary', style: { weight: 600, bg: accent, color: contrast, radius: 999 }, d: { w: 0, fs: 16 }, m: { w: 0, fs: 14 }, anim: { delay: 450 } },
      },
      btnLight: {
        label: 'Przycisk jasny', hint: 'biały, na ciemne zdjęcia',
        layer: { type: 'button', text: 'Zobacz ofertę', variant: 'light', style: { weight: 600, bg: '#ffffff', color: accent, radius: 999 }, d: { w: 0, fs: 16 }, m: { w: 0, fs: 14 }, anim: { delay: 450 } },
      },
      btnOutline: {
        label: 'Przycisk z obrysem', hint: 'przezroczysty',
        layer: { type: 'button', text: 'Więcej', variant: 'outline', arrow: false, style: { weight: 600, color: '#ffffff', radius: 999 }, d: { w: 0, fs: 16 }, m: { w: 0, fs: 14 }, anim: { delay: 550 } },
      },
      btnLink: {
        label: 'Link tekstowy', hint: 'podkreślony, ze strzałką',
        layer: { type: 'button', text: 'Katalog PDF', variant: 'link', style: { weight: 600, color: '#ffffff' }, d: { w: 0, fs: 16 }, m: { w: 0, fs: 14 }, anim: { delay: 550 } },
      },
      cardLight: {
        label: 'Jasna karta', hint: 'tło pod tekstem, z rozmyciem',
        layer: { type: 'shape', style: { bg: '#ffffff', bgOpacity: 86, radius: 22, blur: 14, shadow: true }, d: { x: 4, y: 12, w: 40, h: 76 }, m: { x: 4, y: 40, w: 92, h: 56 }, anim: { type: 'fade', delay: 0 } },
      },
      cardDark: {
        label: 'Ciemna karta', hint: 'półprzezroczysta',
        layer: { type: 'shape', style: { bg: '#0b1226', bgOpacity: 62, radius: 22, blur: 14 }, d: { x: 4, y: 12, w: 40, h: 76 }, m: { x: 4, y: 40, w: 92, h: 56 }, anim: { type: 'fade', delay: 0 } },
      },
      bar: {
        label: 'Pasek / linia', hint: 'akcent graficzny',
        layer: { type: 'shape', style: { bg: accent, bgOpacity: 100, radius: 4 }, d: { x: 6, y: 24, w: 5, h: 1.2 }, m: { x: 6, y: 30, w: 12, h: 1.5 }, anim: { type: 'left', delay: 100 } },
      },
    };
  }

  /* ------------------------------------------------------------ rendering */

  function layerClasses(layer, device, editing) {
    var s = layer.style;
    var c = ['chs-layer', 'chs-layer--' + layer.type, 'chs-anim--' + layer.anim.type];
    if (layer.type === 'button') {
      c.push('chs-btn--' + layer.variant);
    }
    if (s.upper) { c.push('chs-layer--upper'); }
    if (s.italic) { c.push('chs-layer--italic'); }
    if (s.shadow) { c.push('chs-layer--shadow'); }
    if (s.decor === 'line' && layer.type === 'text') { c.push('chs-layer--decor-line'); }
    if (s.bg && layer.type === 'text') { c.push('chs-layer--boxed'); }
    if (editing && layer[device === 'mobile' ? 'm' : 'd'].hide) { c.push('chs-ed-hidden'); }

    return c.join(' ');
  }

  function layerStyle(layer) {
    var vars = [];
    [['d', ''], ['m', 'm']].forEach(function (pair) {
      var g = layer[pair[0]];
      var sfx = pair[1];
      vars.push('--x' + sfx + ':' + round(g.x, 2) + '%');
      vars.push('--y' + sfx + ':' + round(g.y, 2) + '%');
      vars.push('--w' + sfx + ':' + (g.w > 0 ? round(g.w, 2) + '%' : 'max-content'));
      vars.push('--h' + sfx + ':' + (g.h > 0 ? round(g.h, 2) + '%' : 'auto'));
      vars.push('--fs' + sfx + ':' + g.fs);
    });
    var s = layer.style;
    vars.push('--c:' + s.color);
    vars.push('--op:' + round(s.opacity / 100, 2));
    vars.push('--fw:' + s.weight);
    vars.push('--ls:' + s.spacing + 'em');
    vars.push('--lh:' + s.lh);
    vars.push('--ta:' + s.align);
    vars.push('--r:' + s.radius);
    vars.push('--blur:' + s.blur + 'px');
    vars.push('--delay:' + layer.anim.delay + 'ms');
    vars.push('--dur:' + layer.anim.dur + 'ms');
    if (s.bg) {
      vars.push('--bg:rgb(' + hexToRgb(s.bg) + ' / ' + round(s.bgOpacity / 100, 2) + ')');
    }

    return vars.join(';') + ';';
  }

  function layerInnerHtml(layer, imageBase) {
    var text = escapeHtml(layer.text).replace(/\n/g, '<br>');
    if (layer.type === 'button') {
      var arrow = layer.arrow && ['primary', 'light', 'link'].indexOf(layer.variant) !== -1;

      return '<span class="chs-layer__inner">' + text + '</span>' + (arrow ? ARROW_SVG : '');
    }
    if (layer.type === 'image') {
      return '<img class="chs-layer__img" src="' + escapeHtml(imageBase + encodeURIComponent(layer.src)) + '" alt="" draggable="false">';
    }
    if (layer.type === 'shape') {
      return '';
    }

    return '<span class="chs-layer__inner">' + (text || '&nbsp;') + '</span>';
  }

  /* ---------------------------------------------------------------- editor */

  function Editor(root) {
    this.root = root;
    this.form = root.closest('form');
    this.cfg = root.dataset;
    this.layout = this.cfg.layout === 'contained' ? 'contained' : 'full';
    this.accent = this.cfg.accent || '#1d2f67';
    this.contrast = this.cfg.accentContrast || '#ffffff';
    this.presets = presetLayers(this.accent, this.contrast);
    this.device = 'desktop';
    this.selected = null;
    this.editingId = null;
    this.active = false;
    this.zoom = 1; // 1 = dopasuj do szerokości, >1 = powiększenie podglądu
    this.sideMode = 'slide';
    this.objectUrls = {};
    this.langs = [];
    this.docs = {};
    this.history = {};

    var self = this;
    root.querySelectorAll('textarea.chs-editor__data').forEach(function (ta) {
      var lang = ta.dataset.lang;
      var doc;
      try {
        doc = JSON.parse(ta.value || '{}');
      } catch (e) {
        doc = {};
      }
      self.langs.push({ id: lang, iso: ta.dataset.langIso, name: ta.dataset.langName, textarea: ta });
      self.docs[lang] = normalizeDoc(doc);
      self.history[lang] = { undo: [], redo: [], last: JSON.stringify(self.docs[lang]) };
    });

    this.lang = String(this.cfg.defaultLang || (this.langs[0] && this.langs[0].id));
    if (!this.docs[this.lang] && this.langs[0]) {
      this.lang = this.langs[0].id;
    }

    this.build();
    this.bindGlobal();
    this.renderAll();
    this.setSideMode('slide');
  }

  Editor.prototype.doc = function () {
    return this.docs[this.lang];
  };

  Editor.prototype.layer = function (id) {
    var list = this.doc().layers;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) {
        return list[i];
      }
    }

    return null;
  };

  Editor.prototype.geo = function (layer) {
    return layer[this.device === 'mobile' ? 'm' : 'd'];
  };

  /* ----- persist + history */

  Editor.prototype.save = function () {
    var lang = this.langs.filter(function (l) { return l.id === this.lang; }, this)[0];
    if (lang) {
      lang.textarea.value = JSON.stringify(this.doc());
    }
  };

  Editor.prototype.commit = function () {
    var h = this.history[this.lang];
    var now = JSON.stringify(this.doc());
    if (now === h.last) {
      return;
    }
    h.undo.push(h.last);
    if (h.undo.length > 80) {
      h.undo.shift();
    }
    h.redo = [];
    h.last = now;
    this.save();
    this.updateHistoryButtons();
  };

  Editor.prototype.undo = function () {
    var h = this.history[this.lang];
    if (!h.undo.length) {
      return;
    }
    h.redo.push(h.last);
    h.last = h.undo.pop();
    this.docs[this.lang] = normalizeDoc(JSON.parse(h.last));
    if (this.selected && !this.layer(this.selected)) {
      this.selected = null;
    }
    this.save();
    this.renderAll();
  };

  Editor.prototype.redo = function () {
    var h = this.history[this.lang];
    if (!h.redo.length) {
      return;
    }
    h.undo.push(h.last);
    h.last = h.redo.pop();
    this.docs[this.lang] = normalizeDoc(JSON.parse(h.last));
    if (this.selected && !this.layer(this.selected)) {
      this.selected = null;
    }
    this.save();
    this.renderAll();
  };

  /** Zmiana właściwości bez przebudowy panelu (żeby nie gubić fokusu w polach). */
  Editor.prototype.changed = function (options) {
    var opts = options || {};
    this.save();
    if (opts.stage !== false) {
      this.renderStage();
    }
    if (opts.list !== false) {
      this.renderList();
    }
    if (opts.inspector) {
      this.renderInspector();
    }
    if (opts.commit) {
      this.commit();
    }
  };

  /* ----- build UI */

  Editor.prototype.build = function () {
    var self = this;
    var root = this.root;

    this.fileInput = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/gif,image/webp', hidden: true });
    this.fileInput.addEventListener('change', function () { self.uploadImage(); });

    var toolbar = el('div', { class: 'chs-ed-toolbar' });

    this.deviceSwitch = el('div', { class: 'chs-ed-seg', role: 'group', 'aria-label': 'Urządzenie' }, [
      el('button', { type: 'button', class: 'chs-ed-seg__btn is-active', 'data-device': 'desktop', html: '<i class="icon-desktop"></i> Komputer' }),
      el('button', { type: 'button', class: 'chs-ed-seg__btn', 'data-device': 'mobile', html: '<i class="icon-mobile"></i> Telefon' }),
    ]);
    this.deviceSwitch.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-device]');
      if (btn) {
        self.setDevice(btn.dataset.device);
      }
    });
    toolbar.appendChild(this.deviceSwitch);

    toolbar.appendChild(el('span', { class: 'chs-ed-sep' }));
    toolbar.appendChild(this.menuButton('icon-font', 'Tekst', ['eyebrow', 'heading', 'subheading', 'body', 'badge']));
    toolbar.appendChild(this.menuButton('icon-hand-up', 'Przycisk', ['btnPrimary', 'btnLight', 'btnOutline', 'btnLink']));
    toolbar.appendChild(el('button', {
      type: 'button', class: 'btn btn-default chs-ed-add', html: '<i class="icon-picture"></i> Obraz',
      title: 'Logo, naklejka, zdjęcie produktu (PNG z przezroczystością)',
      onclick: function () { self.fileInput.click(); },
    }));
    toolbar.appendChild(this.menuButton('icon-stop', 'Kształt', ['cardLight', 'cardDark', 'bar']));

    toolbar.appendChild(el('span', { class: 'chs-ed-sep' }));
    this.undoBtn = el('button', { type: 'button', class: 'btn btn-default chs-ed-icon', title: 'Cofnij (Ctrl+Z)', html: '<i class="icon-undo"></i>', onclick: function () { self.undo(); } });
    this.redoBtn = el('button', { type: 'button', class: 'btn btn-default chs-ed-icon', title: 'Ponów (Ctrl+Shift+Z)', html: '<i class="icon-repeat"></i>', onclick: function () { self.redo(); } });
    toolbar.appendChild(this.undoBtn);
    toolbar.appendChild(this.redoBtn);
    toolbar.appendChild(el('button', {
      type: 'button', class: 'btn btn-default', html: '<i class="icon-play"></i> Animacja',
      title: 'Odtwórz animację wejścia warstw', onclick: function () { self.playAnimation(); },
    }));

    this.autoBtn = el('button', {
      type: 'button', class: 'btn btn-default chs-ed-mobile-only', html: '<i class="icon-magic"></i> Ułóż automatycznie',
      title: 'Ustawia warstwy jedna pod drugą na dole slajdu (wersja telefonu)',
      onclick: function () { self.autoLayoutMobile(); },
    });
    toolbar.appendChild(this.autoBtn);

    if (this.langs.length > 1) {
      toolbar.appendChild(el('span', { class: 'chs-ed-sep' }));
      this.langSelect = el('select', { class: 'chs-ed-lang', title: 'Język slajdu' }, this.langs.map(function (l) {
        return el('option', { value: l.id, text: l.name });
      }));
      this.langSelect.value = this.lang;
      this.langSelect.addEventListener('change', function () { self.setLang(self.langSelect.value); });
      toolbar.appendChild(this.langSelect);
      toolbar.appendChild(this.copyLangMenu());
    }

    this.zoomLabel = el('button', { type: 'button', class: 'btn btn-default chs-ed-zoom__label', title: 'Dopasuj do szerokości', onclick: function () { self.setZoom(1); } });
    toolbar.appendChild(el('span', { class: 'chs-ed-zoom' }, [
      el('button', { type: 'button', class: 'btn btn-default chs-ed-icon', title: 'Pomniejsz podgląd', html: '<i class="icon-zoom-out"></i>', onclick: function () { self.setZoom(self.zoom / 1.25); } }),
      this.zoomLabel,
      el('button', { type: 'button', class: 'btn btn-default chs-ed-icon', title: 'Powiększ podgląd (Ctrl + kółko myszy)', html: '<i class="icon-zoom-in"></i>', onclick: function () { self.setZoom(self.zoom * 1.25); } }),
    ]));

    var canvasWrap = el('div', { class: 'chs-ed-canvas' });
    this.scrimBar = el('div', { class: 'chs-ed-scrim' });
    this.viewport = el('div', { class: 'chs-ed-viewport' });
    this.sizer = el('div', { class: 'chs-ed-sizer' });
    this.stage = el('div', { class: 'chs-ed-stage' });
    this.sizer.appendChild(this.stage);
    this.viewport.appendChild(this.sizer);
    this.hint = el('p', { class: 'chs-ed-hint' });
    this.listEl = el('div', { class: 'chs-ed-strip', role: 'listbox', 'aria-label': 'Warstwy slajdu' });
    canvasWrap.appendChild(this.scrimBar);
    canvasWrap.appendChild(this.viewport);
    canvasWrap.appendChild(this.listEl);
    canvasWrap.appendChild(this.hint);

    this.viewport.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        self.setZoom(self.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
      }
    }, { passive: false });

    this.inspector = el('div', { class: 'chs-ed-inspector' });
    this.slidePanel = el('div', { class: 'chs-ed-slide-panel' });
    this.sideSwitch = el('div', { class: 'chs-ed-seg chs-ed-seg--block' }, [
      el('button', { type: 'button', class: 'chs-ed-seg__btn', 'data-mode': 'layer', html: '<i class="icon-font"></i> Warstwa' }),
      el('button', { type: 'button', class: 'chs-ed-seg__btn', 'data-mode': 'slide', html: '<i class="icon-picture"></i> Slajd' }),
    ]);
    this.sideSwitch.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mode]');
      if (btn) {
        self.setSideMode(btn.dataset.mode);
      }
    });
    this.buildSlidePanel();

    var side = el('aside', { class: 'chs-ed-side' }, [
      this.sideSwitch,
      this.inspector,
      this.slidePanel,
    ]);

    root.appendChild(toolbar);
    root.appendChild(el('div', { class: 'chs-ed-body' }, [canvasWrap, side]));
    root.appendChild(this.fileInput);

    this.stage.addEventListener('pointerdown', function (e) { self.onPointerDown(e); });
    this.stage.addEventListener('dblclick', function (e) { self.onDoubleClick(e); });

    if (typeof window.ResizeObserver === 'function') {
      new ResizeObserver(function () { self.fit(); }).observe(this.viewport);
    } else {
      window.addEventListener('resize', function () { self.fit(); });
    }
  };

  Editor.prototype.menuButton = function (icon, label, keys) {
    var self = this;
    var menu = el('ul', { class: 'dropdown-menu chs-ed-menu' }, keys.map(function (key) {
      var p = self.presets[key];

      return el('li', {}, [el('a', {
        href: '#', 'data-preset': key,
        html: '<strong>' + escapeHtml(p.label) + '</strong><small>' + escapeHtml(p.hint) + '</small>',
        onclick: function (e) {
          e.preventDefault();
          self.addLayer(clone(p.layer));
        },
      })]);
    }));

    return el('div', { class: 'btn-group chs-ed-add' }, [
      el('button', { type: 'button', class: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown', html: '<i class="' + icon + '"></i> ' + escapeHtml(label) + ' <span class="caret"></span>' }),
      menu,
    ]);
  };

  Editor.prototype.copyLangMenu = function () {
    var self = this;
    var menu = el('ul', { class: 'dropdown-menu chs-ed-menu' });
    var group = el('div', { class: 'btn-group' }, [
      el('button', { type: 'button', class: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown', html: '<i class="icon-copy"></i> Skopiuj z języka <span class="caret"></span>' }),
      menu,
    ]);
    group.addEventListener('show.bs.dropdown', function () { fill(); });
    group.querySelector('button').addEventListener('click', fill);

    function fill() {
      menu.innerHTML = '';
      self.langs.forEach(function (l) {
        if (l.id === self.lang) {
          return;
        }
        menu.appendChild(el('li', {}, [el('a', {
          href: '#', text: l.name,
          onclick: function (e) {
            e.preventDefault();
            if (window.confirm('Zastąpić układ w bieżącym języku układem z języka „' + l.name + '”? Teksty trzeba będzie przetłumaczyć.')) {
              self.docs[self.lang] = normalizeDoc(clone(self.docs[l.id]));
              self.selected = null;
              self.commit();
              self.renderAll();
            }
          },
        })]));
      });
    }

    return group;
  };

  Editor.prototype.bindGlobal = function () {
    var self = this;

    document.addEventListener('pointerdown', function (e) {
      self.active = self.root.contains(e.target);
    }, true);

    document.addEventListener('keydown', function (e) { self.onKey(e); });

    // Grafiki slajdu z zakładki „Grafiki” (upload albo istniejące pliki).
    this.form.addEventListener('change', function (e) {
      if (e.target && /^image(_mobile)?_\d+$/.test(e.target.name || '')) {
        self.renderStage();
      }
    });

    // Zakładka ukryta przy starcie → dopasuj skalę po pokazaniu.
    if (window.jQuery) {
      window.jQuery(document).on('shown.bs.tab', function () { self.fit(); });
    }

    window.addEventListener('load', function () { self.fit(); });
  };

  /* ----- state setters */

  Editor.prototype.setDevice = function (device) {
    this.device = device;
    this.deviceSwitch.querySelectorAll('[data-device]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.device === device);
    });
    this.root.classList.toggle('is-mobile', device === 'mobile');
    this.renderAll();
  };

  Editor.prototype.setLang = function (lang) {
    this.lang = String(lang);
    this.selected = null;
    this.showSlideLang();
    this.renderAll();
    this.setSideMode('slide');
  };

  Editor.prototype.setZoom = function (zoom) {
    this.zoom = clamp(zoom, 1, 4);
    this.fit();
  };

  Editor.prototype.select = function (id) {
    if (this.selected === id) {
      if (id) {
        this.setSideMode('layer');
      }

      return;
    }
    this.selected = id;
    this.renderSelection();
    this.renderList();
    this.renderInspector();
    this.setSideMode(id ? 'layer' : 'slide');
  };

  Editor.prototype.setSideMode = function (mode) {
    this.sideMode = mode === 'layer' && this.selected ? 'layer' : mode;
    this.sideSwitch.querySelectorAll('[data-mode]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.mode === this.sideMode);
    }, this);
    this.inspector.hidden = this.sideMode !== 'layer';
    this.slidePanel.hidden = this.sideMode !== 'slide';
  };

  /** Panel „Slajd”: grafiki, aktywność, nazwa, link, alt — prawdziwe pola formularza z form.tpl. */
  Editor.prototype.buildSlidePanel = function () {
    var self = this;
    var fields = this.root.querySelector('.chs-slide-fields');
    var panel = el('div', { class: 'chs-ed-panel' }, [el('div', { class: 'chs-ed-panel__title', text: 'Ustawienia slajdu' })]);
    this.slidePanel.appendChild(panel);
    if (!fields) {
      return;
    }

    var activeInput = fields.querySelector('[data-chs-active]');
    var body = el('div', { class: 'chs-ed-section' });
    if (activeInput) {
      var toggle = el('input', { type: 'checkbox' });
      toggle.checked = activeInput.value === '1';
      toggle.addEventListener('change', function () { activeInput.value = toggle.checked ? '1' : '0'; });
      body.appendChild(el('label', { class: 'chs-ed-switch' }, [toggle, el('span', { class: 'chs-ed-switch__track' }), el('span', { text: 'Slajd aktywny (widoczny na stronie)' })]));
    }
    panel.appendChild(body);

    fields.hidden = false;
    fields.classList.add('chs-ed-section');
    panel.appendChild(fields);

    fields.querySelectorAll('.chs-slide-image input[type="file"]').forEach(function (input) {
      input.addEventListener('change', function () {
        var box = input.closest('.chs-slide-image');
        var file = input.files && input.files[0];
        if (!box || !file) {
          return;
        }
        var thumb = box.querySelector('.chs-slide-image__thumb');
        thumb.innerHTML = '';
        thumb.appendChild(el('img', { src: URL.createObjectURL(file), alt: '' }));
        box.querySelector('.chs-slide-image__name').textContent = file.name + ' — zapisz, aby wgrać';
        self.renderStage();
      });
    });

    this.showSlideLang();
  };

  Editor.prototype.showSlideLang = function () {
    var lang = this.lang;
    this.root.querySelectorAll('.chs-slide-lang').forEach(function (node) {
      node.hidden = node.dataset.lang !== lang;
    });
  };

  /* ----- layers CRUD */

  Editor.prototype.addLayer = function (partial) {
    if (this.doc().layers.length >= MAX_LAYERS) {
      window.alert('Maksymalnie ' + MAX_LAYERS + ' warstw na slajd.');

      return;
    }
    var layer = normalizeLayer(Object.assign({ id: uid() }, partial));
    var style = partial.style || {};
    layer.style = Object.assign(normalizeLayer({}).style, style);
    layer.d = Object.assign(defaultGeometry(52), { x: 6, y: this.nextFreeY('d') }, partial.d || {});
    layer.m = Object.assign(defaultGeometry(26), { x: 6, y: this.nextFreeY('m') }, partial.m || {});
    if (partial.d && partial.d.y !== undefined) { layer.d.y = partial.d.y; }
    if (partial.m && partial.m.y !== undefined) { layer.m.y = partial.m.y; }

    // Kształty lądują pod tekstem.
    if (layer.type === 'shape') {
      this.doc().layers.unshift(layer);
    } else {
      this.doc().layers.push(layer);
    }
    this.selected = layer.id;
    this.commit();
    this.renderAll();
  };

  /** Pod ostatnią warstwą tekstową/przyciskiem — kolejne elementy układają się w kolumnę. */
  Editor.prototype.nextFreeY = function (device) {
    var maxBottom = 0;
    var self = this;
    this.doc().layers.forEach(function (layer) {
      if (layer.type === 'shape') {
        return;
      }
      var node = self.stage.querySelector('[data-id="' + layer.id + '"]');
      var g = layer[device];
      var h = 8;
      if (node && self.figure && device === (self.device === 'mobile' ? 'm' : 'd')) {
        h = node.offsetHeight / self.figure.offsetHeight * 100;
      }
      maxBottom = Math.max(maxBottom, g.y + h);
    });

    return maxBottom ? clamp(round(maxBottom + 3, 1), 4, 85) : (device === 'm' ? 45 : 22);
  };

  Editor.prototype.removeLayer = function (id) {
    var list = this.doc().layers;
    this.doc().layers = list.filter(function (l) { return l.id !== id; });
    if (this.selected === id) {
      this.selected = null;
    }
    this.commit();
    this.renderAll();
  };

  Editor.prototype.duplicateLayer = function (id) {
    var layer = this.layer(id);
    if (!layer || this.doc().layers.length >= MAX_LAYERS) {
      return;
    }
    var copy = clone(layer);
    copy.id = uid();
    copy.d.x = clamp(copy.d.x + 2, -50, 150);
    copy.d.y = clamp(copy.d.y + 3, -50, 150);
    copy.m.y = clamp(copy.m.y + 3, -50, 150);
    var list = this.doc().layers;
    list.splice(list.indexOf(layer) + 1, 0, copy);
    this.selected = copy.id;
    this.commit();
    this.renderAll();
  };

  Editor.prototype.moveLayer = function (id, delta) {
    var list = this.doc().layers;
    var index = list.indexOf(this.layer(id));
    var target = index + delta;
    if (index < 0 || target < 0 || target >= list.length) {
      return;
    }
    list.splice(target, 0, list.splice(index, 1)[0]);
    this.commit();
    this.renderAll();
  };

  /* ----- images */

  Editor.prototype.slideImage = function (field) {
    var lang = this.lang;
    var ids = [lang].concat(this.langs.map(function (l) { return l.id; }).filter(function (id) { return id !== lang; }));
    for (var i = 0; i < ids.length; i += 1) {
      var fileInput = this.form.querySelector('input[type="file"][name="' + field + '_' + ids[i] + '"]');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        var key = field + '_' + ids[i];
        var file = fileInput.files[0];
        if (!this.objectUrls[key] || this.objectUrls[key].file !== file) {
          if (this.objectUrls[key]) {
            URL.revokeObjectURL(this.objectUrls[key].url);
          }
          this.objectUrls[key] = { file: file, url: URL.createObjectURL(file) };
        }

        return this.objectUrls[key].url;
      }
      var old = this.form.querySelector('input[name="' + field + '_old_' + ids[i] + '"]');
      if (old && old.value) {
        return this.cfg.imageBase + encodeURIComponent(old.value);
      }
    }

    return '';
  };

  Editor.prototype.uploadImage = function () {
    var self = this;
    var file = this.fileInput.files && this.fileInput.files[0];
    if (!file) {
      return;
    }
    var data = new FormData();
    data.append('file', file);
    this.root.classList.add('is-uploading');

    fetch(this.cfg.uploadUrl, { method: 'POST', body: data, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.success) {
          throw new Error(res && res.error ? res.error : 'Nie udało się wgrać obrazu.');
        }
        var wD = clamp(round(Math.min(res.width || 200, 400) / REF.desktop * 100, 1), 4, 40);
        self.addLayer({
          type: 'image', src: res.file, alt: '',
          d: { x: 100 - wD - 5, y: 8, w: wD },
          m: { x: 100 - wD * 2 - 5, y: 6, w: clamp(wD * 2, 10, 60) },
          anim: { type: 'zoom', delay: 300 },
        });
      })
      .catch(function (err) { window.alert(err.message); })
      .then(function () {
        self.root.classList.remove('is-uploading');
        self.fileInput.value = '';
      });
  };

  /* ----- render */

  Editor.prototype.renderAll = function () {
    this.renderScrimBar();
    this.renderStage();
    this.renderList();
    this.renderInspector();
    this.updateHistoryButtons();
  };

  Editor.prototype.updateHistoryButtons = function () {
    var h = this.history[this.lang];
    this.undoBtn.disabled = !h.undo.length;
    this.redoBtn.disabled = !h.redo.length;
  };

  Editor.prototype.renderStage = function () {
    var device = this.device;
    var isMobile = device === 'mobile';
    var doc = this.doc();
    var image = isMobile ? (this.slideImage('image_mobile') || this.slideImage('image')) : this.slideImage('image');
    var hasNav = !isMobile && this.cfg.hasNav === '1';
    var classes = ['coody-homeslider', 'coody-homeslider--preview', 'coody-homeslider--editor'];
    if (this.layout === 'contained') { classes.push('coody-homeslider--contained'); }
    if (isMobile) { classes.push('coody-homeslider--preview-mobile'); }
    if (hasNav) { classes.push('coody-homeslider--has-nav'); }

    var figureStyle = '';
    if (this.layout === 'full') {
      figureStyle = 'height:' + FULL_HEIGHT[device] + 'px;';
    } else if (!image) {
      figureStyle = 'aspect-ratio:' + RATIO[device] + ';';
    }

    var media = image
      ? '<picture><img class="coody-homeslider__image" src="' + escapeHtml(image) + '" alt="" draggable="false"></picture>'
      : '<div class="chs-ed-empty"><i class="icon-picture"></i><span>Dodaj grafikę ' + (isMobile ? 'slajdu' : 'na komputer') + ' w zakładce „Grafiki”</span></div>';

    var layersHtml = doc.layers.map(function (layer) {
      var tag = layer.type === 'text' ? 'div' : 'span';

      return '<' + tag + ' class="' + layerClasses(layer, device, true) + '" style="' + escapeHtml(layerStyle(layer)) + '" data-id="' + escapeHtml(layer.id) + '">'
        + layerInnerHtml(layer, this.cfg.layerImageBase) + '</' + tag + '>';
    }, this).join('');

    var nav = hasNav
      ? '<div class="coody-homeslider__nav chs-ed-navmock" aria-hidden="true"><span class="coody-homeslider__nav-btn">&#8249;</span>'
        + '<ul class="coody-homeslider__titles"><li><span class="coody-homeslider__title-item is-active">Ten slajd</span></li><li><span class="coody-homeslider__title-item">Kolejny slajd</span></li></ul>'
        + '<span class="coody-homeslider__nav-btn">&#8250;</span></div>'
      : '';

    this.stage.style.width = REF[device] + 'px';
    this.stage.innerHTML = '<section class="' + classes.join(' ') + '" style="--chs-accent:' + escapeHtml(this.accent) + ';--chs-accent-contrast:' + escapeHtml(this.contrast) + ';">'
      + '<div class="coody-homeslider__inner"><div class="coody-homeslider__slide">'
      + '<figure' + (figureStyle ? ' style="' + figureStyle + '"' : '') + '>' + media
      + '<div class="coody-homeslider__layers" data-scrim-d="' + escapeHtml(doc.scrim.d) + '" data-scrim-m="' + escapeHtml(doc.scrim.m) + '"'
      + ' style="--chs-scrim:' + hexToRgb(doc.scrim.color) + ';--chs-scrim-a:' + round(doc.scrim.strength / 100, 2) + ';">' + layersHtml + '</div>'
      + '<div class="chs-ed-overlay"><div class="chs-ed-guides"></div><div class="chs-ed-select" hidden>'
      + '<span class="chs-ed-handle chs-ed-handle--e" data-handle="e"></span>'
      + '<span class="chs-ed-handle chs-ed-handle--s" data-handle="s"></span>'
      + '<span class="chs-ed-handle chs-ed-handle--se" data-handle="se"></span>'
      + '<span class="chs-ed-select__label"></span></div></div>'
      + '</figure></div>' + nav + '</div></section>';

    this.sectionEl = this.stage.querySelector('section');
    this.figure = this.stage.querySelector('figure');
    this.layersEl = this.stage.querySelector('.coody-homeslider__layers');
    this.selectBox = this.stage.querySelector('.chs-ed-select');
    this.guidesEl = this.stage.querySelector('.chs-ed-guides');

    var self = this;
    var img = this.stage.querySelector('img.coody-homeslider__image');
    if (img && !img.complete) {
      img.addEventListener('load', function () { self.fit(); self.renderSelection(); }, { once: true });
    }
    this.stage.querySelectorAll('.chs-layer__img').forEach(function (i) {
      if (!i.complete) {
        i.addEventListener('load', function () { self.fit(); self.renderSelection(); }, { once: true });
      }
    });

    this.hint.innerHTML = doc.layers.length
      ? (isMobile
        ? 'Wersja na telefon: pozycje i rozmiary są osobne. <b>Ułóż automatycznie</b> ustawi warstwy jedna pod drugą. Warstwy ukryte na telefonie są półprzezroczyste.'
        : 'Przeciągnij warstwę, żeby ją przesunąć (Alt — bez przyciągania). Uchwytem po prawej zmienisz szerokość. <b>Dwuklik</b> — edycja tekstu. Strzałki przesuwają zaznaczoną warstwę.')
      : 'Slajd nie ma jeszcze warstw. Dodaj <b>Tekst</b>, <b>Przycisk</b>, <b>Obraz</b> lub <b>Kształt</b> z paska powyżej.';

    this.fit();
    this.renderSelection();
  };

  Editor.prototype.renderLayer = function (layer) {
    var node = this.stage.querySelector('[data-id="' + layer.id + '"]');
    if (!node) {
      return;
    }
    node.className = layerClasses(layer, this.device, true) + (layer.id === this.editingId ? ' chs-ed-editing' : '');
    node.setAttribute('style', layerStyle(layer));
    if (layer.id !== this.editingId) {
      node.innerHTML = layerInnerHtml(layer, this.cfg.layerImageBase);
    }
    this.renderSelection();
  };

  Editor.prototype.fit = function () {
    if (!this.stage || !this.viewport.clientWidth) {
      return;
    }
    var width = REF[this.device];
    this.root.classList.toggle('is-zoomed', this.zoom > 1);
    var available = this.viewport.clientWidth;
    var fitScale = Math.min(1, available / width);
    this.scale = fitScale * this.zoom;
    this.stage.style.transform = 'scale(' + this.scale + ')';
    var w = Math.ceil(width * this.scale);
    var h = Math.ceil(this.stage.offsetHeight * this.scale);
    this.sizer.style.width = w + 'px';
    this.sizer.style.height = h + 'px';
    this.viewport.style.height = (this.zoom > 1 ? Math.min(h + 16, Math.round(window.innerHeight * 0.7)) : h) + 'px';
    if (this.zoomLabel) {
      this.zoomLabel.textContent = this.zoom > 1 ? Math.round(this.scale * 100) + '%' : 'Dopasuj · ' + Math.round(this.scale * 100) + '%';
    }
    this.renderSelection();
  };

  Editor.prototype.renderSelection = function () {
    if (!this.selectBox) {
      return;
    }
    var node = this.selected ? this.stage.querySelector('[data-id="' + this.selected + '"]') : null;
    this.stage.querySelectorAll('.chs-layer.is-selected').forEach(function (n) { n.classList.remove('is-selected'); });
    if (!node) {
      this.selectBox.hidden = true;

      return;
    }
    node.classList.add('is-selected');
    var layer = this.layer(this.selected);
    this.selectBox.hidden = false;
    this.selectBox.style.left = node.offsetLeft + 'px';
    this.selectBox.style.top = node.offsetTop + 'px';
    this.selectBox.style.width = node.offsetWidth + 'px';
    this.selectBox.style.height = node.offsetHeight + 'px';
    this.selectBox.dataset.type = layer.type;
    this.selectBox.style.setProperty('--inv', String(1 / (this.scale || 1)));
    var g = this.geo(layer);
    this.selectBox.querySelector('.chs-ed-select__label').textContent = TYPE_LABELS[layer.type]
      + (layer.type === 'text' || layer.type === 'button' ? ' · ' + g.fs + ' px' : '')
      + (g.w > 0 ? ' · szer. ' + round(g.w, 1) + '%' : '');
  };

  Editor.prototype.renderScrimBar = function () {
    var self = this;
    var doc = this.doc();
    var key = this.device === 'mobile' ? 'm' : 'd';
    this.scrimBar.innerHTML = '';

    var select = el('select', {}, SCRIMS.map(function (s) { return el('option', { value: s[0], text: s[1] }); }));
    select.value = doc.scrim[key];
    select.addEventListener('change', function () {
      doc.scrim[key] = select.value;
      self.changed({ list: false, commit: true });
      self.renderScrimBar();
    });

    var strength = el('input', { type: 'range', min: 0, max: 100, step: 5, value: doc.scrim.strength });
    strength.addEventListener('input', function () {
      doc.scrim.strength = parseInt(strength.value, 10);
      self.changed({ list: false });
    });
    strength.addEventListener('change', function () { self.commit(); });

    var color = el('input', { type: 'color', value: doc.scrim.color });
    color.addEventListener('input', function () {
      doc.scrim.color = color.value;
      self.changed({ list: false });
    });
    color.addEventListener('change', function () { self.commit(); });

    this.scrimBar.appendChild(el('span', { class: 'chs-ed-scrim__label', html: '<i class="icon-adjust"></i> Przyciemnienie zdjęcia (' + (key === 'm' ? 'telefon' : 'komputer') + '):' }));
    this.scrimBar.appendChild(select);
    if (doc.scrim[key] !== 'none') {
      this.scrimBar.appendChild(el('label', { class: 'chs-ed-scrim__field' }, ['Siła', strength]));
      this.scrimBar.appendChild(el('label', { class: 'chs-ed-scrim__field' }, ['Kolor', color]));
    }
  };

  /** Pasek warstw pod slajdem: kolejność jak na slajdzie (na wierzchu po lewej). */
  Editor.prototype.renderList = function () {
    var self = this;
    var key = this.device === 'mobile' ? 'm' : 'd';
    var layers = this.doc().layers.slice().reverse();
    this.listEl.innerHTML = '';
    this.listEl.appendChild(el('span', { class: 'chs-ed-strip__title', text: 'Warstwy (' + layers.length + ')' }));

    if (!layers.length) {
      this.listEl.appendChild(el('span', { class: 'chs-ed-strip__empty', text: 'brak — dodaj z paska narzędzi' }));

      return;
    }

    layers.forEach(function (layer) {
      var label = layer.type === 'image' ? (layer.alt || 'Obraz') : layer.type === 'shape' ? 'Kształt' : (layer.text || '(pusty)').replace(/\n/g, ' ');
      var hidden = layer[key].hide;
      var chip = el('span', {
        class: 'chs-ed-chip' + (layer.id === self.selected ? ' is-selected' : '') + (hidden ? ' is-hidden' : ''),
        role: 'option', tabindex: 0, 'aria-selected': layer.id === self.selected ? 'true' : 'false',
        'data-id': layer.id, title: label,
      }, [
        el('i', { class: ICONS[layer.type] + ' chs-ed-chip__icon' }),
        el('span', { class: 'chs-ed-chip__label', text: label }),
        el('button', {
          type: 'button', class: 'chs-ed-chip__eye', title: hidden ? 'Pokaż na tym urządzeniu' : 'Ukryj na tym urządzeniu',
          html: '<i class="' + (hidden ? 'icon-eye-close' : 'icon-eye-open') + '"></i>',
          onclick: function (e) {
            e.stopPropagation();
            layer[key].hide = !layer[key].hide;
            self.changed({ commit: true, inspector: true });
          },
        }),
      ]);
      chip.addEventListener('click', function () { self.select(layer.id); });
      chip.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          self.select(layer.id);
        }
      });
      self.listEl.appendChild(chip);
    });
  };

  /* ----- inspector */

  Editor.prototype.renderInspector = function () {
    var self = this;
    var layer = this.selected ? this.layer(this.selected) : null;
    this.inspector.innerHTML = '';

    if (!layer) {
      this.inspector.appendChild(el('div', { class: 'chs-ed-panel' }, [
        el('div', { class: 'chs-ed-panel__title', text: 'Ustawienia warstwy' }),
        el('p', { class: 'chs-ed-muted', text: 'Kliknij warstwę na slajdzie lub na liście, żeby zmienić jej treść, położenie, wygląd i animację.' }),
      ]));

      return;
    }

    var g = this.geo(layer);
    var s = layer.style;
    var isText = layer.type === 'text';
    var isButton = layer.type === 'button';
    var isImage = layer.type === 'image';
    var isShape = layer.type === 'shape';
    var deviceName = this.device === 'mobile' ? 'telefon' : 'komputer';

    function update(fn, opts) {
      return function (value) {
        fn(value);
        self.renderLayer(layer);
        self.save();
        if (!opts || opts.list !== false) {
          self.renderList();
        }
      };
    }

    var head = el('div', { class: 'chs-ed-panel__title chs-ed-panel__title--actions' }, [
      el('span', { html: '<i class="' + ICONS[layer.type] + '"></i> ' + TYPE_LABELS[layer.type] }),
      el('span', { class: 'chs-ed-actions' }, [
        el('button', { type: 'button', class: 'chs-ed-row__btn', title: 'Na wierzch (wyżej)', html: '<i class="icon-chevron-up"></i>', onclick: function () { self.moveLayer(layer.id, 1); } }),
        el('button', { type: 'button', class: 'chs-ed-row__btn', title: 'Pod spód (niżej)', html: '<i class="icon-chevron-down"></i>', onclick: function () { self.moveLayer(layer.id, -1); } }),
        el('button', { type: 'button', class: 'chs-ed-row__btn', title: 'Duplikuj (Ctrl+D)', html: '<i class="icon-copy"></i>', onclick: function () { self.duplicateLayer(layer.id); } }),
        el('button', { type: 'button', class: 'chs-ed-row__btn chs-ed-row__btn--danger', title: 'Usuń (Delete)', html: '<i class="icon-trash"></i>', onclick: function () { self.removeLayer(layer.id); } }),
      ]),
    ]);

    var panel = el('div', { class: 'chs-ed-panel' }, [head]);

    /* Treść */
    var content = this.section('Treść');
    if (isText || isButton) {
      content.appendChild(this.field(isButton ? 'Tekst przycisku' : 'Tekst', this.textInput(layer.text, !isButton, update(function (v) {
        layer.text = isButton ? v.replace(/\n/g, ' ') : v;
      }))));
      content.appendChild(el('span', { class: 'chs-ed-help', text: isButton ? 'Możesz też kliknąć dwukrotnie przycisk na slajdzie.' : 'Enter — nowa linia. Możesz też pisać bezpośrednio na slajdzie (dwuklik).' }));
    }
    if (isButton || isText || isImage) {
      content.appendChild(this.field(isButton ? 'Link' : 'Link (opcjonalnie)', this.input('text', layer.link, update(function (v) { layer.link = v.trim(); }, { list: false }), { placeholder: 'https://…' })));
      content.appendChild(this.check('Otwórz w nowej karcie', layer.newtab, update(function (v) { layer.newtab = v; }, { list: false })));
    }
    if (isImage) {
      content.appendChild(this.field('Tekst alternatywny', this.input('text', layer.alt, update(function (v) { layer.alt = v; }), { placeholder: 'np. Logo producenta' })));
      content.appendChild(el('button', { type: 'button', class: 'btn btn-default btn-sm', html: '<i class="icon-upload"></i> Zmień obraz', onclick: function () {
        self.replaceImageFor = layer.id;
        self.fileInput.click();
      } }));
    }
    if (content.children.length > 1) {
      panel.appendChild(content);
    }

    /* Rozmiar i położenie (przesuwanie myszą na slajdzie) */
    var pos = this.section('Rozmiar i położenie — ' + deviceName);
    if (isText || isButton) {
      pos.appendChild(this.field('Rozmiar tekstu', this.fontSize(g, function () {
        self.renderLayer(layer);
        self.save();
      })));
    }
    pos.appendChild(el('div', { class: 'chs-ed-btnrow' }, [
      el('button', { type: 'button', class: 'btn btn-default btn-sm', html: '<i class="icon-resize-horizontal"></i> Środek poziomo', onclick: function () { self.centerLayer(layer, 'x'); } }),
      el('button', { type: 'button', class: 'btn btn-default btn-sm', html: '<i class="icon-resize-vertical"></i> Środek pionowo', onclick: function () { self.centerLayer(layer, 'y'); } }),
      (isText || isButton) && g.w > 0
        ? el('button', { type: 'button', class: 'btn btn-default btn-sm', html: '<i class="icon-text-width"></i> Szerokość auto', title: 'Warstwa dopasuje szerokość do tekstu', onclick: function () { g.w = 0; self.changed({ commit: true, inspector: true }); } })
        : null,
      this.device === 'mobile'
        ? el('button', { type: 'button', class: 'btn btn-default btn-sm', html: '<i class="icon-desktop"></i> Jak na komputerze', title: 'Skopiuj położenie z wersji na komputer (z przeliczeniem rozmiaru)', onclick: function () { self.copyFromDesktop(layer); } })
        : null,
    ]));
    pos.appendChild(el('span', { class: 'chs-ed-help', text: 'Przesuwaj warstwę myszą na slajdzie. Uchwyt z prawej — szerokość' + (isText || isButton ? ', uchwyt w rogu — rozmiar tekstu.' : '.') }));
    pos.appendChild(this.check('Ukryj na urządzeniu: ' + deviceName, g.hide, function (v) {
      g.hide = v;
      self.changed({ commit: true });
    }));
    panel.appendChild(pos);

    /* Wygląd */
    var look = this.section('Wygląd');
    if (isButton) {
      look.appendChild(this.field('Rodzaj', this.segmented([['primary', 'Pełny'], ['light', 'Jasny'], ['outline', 'Obrys'], ['link', 'Link']], layer.variant, function (v) {
        layer.variant = v;
        if (v === 'primary') { s.bg = self.accent; s.color = self.contrast; }
        if (v === 'light') { s.bg = '#ffffff'; s.color = self.accent; }
        if (v === 'outline' || v === 'link') { s.bg = ''; }
        self.changed({ commit: true, inspector: true });
      })));
    }
    if (isText || isButton) {
      look.appendChild(this.field('Kolor tekstu', this.colorPicker(s.color, update(function (v) { s.color = v; }, { list: false }))));
    }
    if ((isText || isButton || isShape) && !(isButton && (layer.variant === 'outline' || layer.variant === 'link'))) {
      look.appendChild(this.field(isShape ? 'Kolor' : 'Tło', this.colorPicker(s.bg, update(function (v) { s.bg = v; }, { list: false }), !isShape && !isButton)));
      if (s.bg || isShape) {
        look.appendChild(this.field('Krycie tła %', this.range(s.bgOpacity, 0, 100, 5, update(function (v) { s.bgOpacity = v; }, { list: false }))));
      }
    }
    if (isText || isButton) {
      look.appendChild(this.grid([
        this.field('Grubość', this.selectInput([[300, 'Cienka'], [400, 'Normalna'], [500, 'Średnia'], [600, 'Półgruba'], [700, 'Gruba'], [800, 'Bardzo gruba']], s.weight, update(function (v) { s.weight = parseInt(v, 10); }, { list: false }))),
        isText ? this.field('Wyrównanie', this.segmented([['left', '<i class="icon-align-left"></i>'], ['center', '<i class="icon-align-center"></i>'], ['right', '<i class="icon-align-right"></i>']], s.align, update(function (v) { s.align = v; }, { list: false }), true)) : null,
        isText ? this.field('Interlinia', this.number(s.lh, 0.8, 2.5, 0.05, update(function (v) { s.lh = v; }, { list: false }))) : null,
        this.field('Odstęp liter', this.number(s.spacing, -0.1, 0.5, 0.01, update(function (v) { s.spacing = v; }, { list: false }))),
      ]));
      look.appendChild(el('div', { class: 'chs-ed-checks' }, [
        this.check('WERSALIKI', s.upper, update(function (v) { s.upper = v; }, { list: false })),
        this.check('Kursywa', s.italic, update(function (v) { s.italic = v; }, { list: false })),
        isText ? this.check('Kreska przed', s.decor === 'line', update(function (v) { s.decor = v ? 'line' : 'none'; }, { list: false })) : null,
        isText ? this.check('Cień tekstu', s.shadow, update(function (v) { s.shadow = v; }, { list: false })) : null,
        isButton ? this.check('Strzałka', layer.arrow, update(function (v) { layer.arrow = v; }, { list: false })) : null,
      ]));
    }
    if (isShape || isImage || isButton || (isText && s.bg)) {
      look.appendChild(this.field('Zaokrąglenie px', this.number(s.radius, 0, 999, 1, update(function (v) { s.radius = v; }, { list: false }))));
    }
    if (isShape) {
      look.appendChild(this.field('Rozmycie tła px', this.range(s.blur, 0, 40, 1, update(function (v) { s.blur = v; }, { list: false }))));
    }
    if (isShape || isImage || isButton) {
      look.appendChild(this.check('Cień', s.shadow, update(function (v) { s.shadow = v; }, { list: false })));
    }
    look.appendChild(this.field('Krycie warstwy %', this.range(s.opacity, 0, 100, 5, update(function (v) { s.opacity = v; }, { list: false }))));
    panel.appendChild(look);

    /* Animacja */
    var anim = this.section('Animacja wejścia');
    var replay = function () { self.playLayer(layer.id); };
    var effect = this.selectInput(ANIMS, layer.anim.type, update(function (v) { layer.anim.type = v; }, { list: false }));
    effect.addEventListener('change', replay);
    var delay = this.number(layer.anim.delay, 0, 6000, 50, update(function (v) { layer.anim.delay = v; }, { list: false }));
    var dur = this.number(layer.anim.dur, 100, 4000, 50, update(function (v) { layer.anim.dur = v; }, { list: false }));
    delay.addEventListener('change', replay);
    dur.addEventListener('change', replay);
    anim.appendChild(this.field('Efekt', effect));
    anim.appendChild(this.grid([
      this.field('Opóźnienie ms', delay),
      this.field('Czas ms', dur),
    ]));
    anim.appendChild(el('button', { type: 'button', class: 'btn btn-default btn-sm', html: '<i class="icon-play"></i> Odtwórz tę warstwę', onclick: replay }));
    panel.appendChild(anim);

    this.inspector.appendChild(panel);
  };

  /* inspector widgets — każda zmiana: onInput (na żywo) + commit przy 'change' */

  Editor.prototype.section = function (title) {
    return el('div', { class: 'chs-ed-section' }, [el('div', { class: 'chs-ed-section__title', text: title })]);
  };

  Editor.prototype.field = function (label, control) {
    return el('label', { class: 'chs-ed-field' }, [el('span', { class: 'chs-ed-field__label', text: label }), control]);
  };

  Editor.prototype.grid = function (children) {
    return el('div', { class: 'chs-ed-grid' }, children);
  };

  Editor.prototype.bindCommit = function (node) {
    var self = this;
    node.addEventListener('change', function () { self.commit(); });

    return node;
  };

  Editor.prototype.input = function (type, value, onInput, attrs) {
    var node = el('input', Object.assign({ type: type, class: 'form-control input-sm', value: value }, attrs || {}));
    node.addEventListener('input', function () { onInput(node.value); });

    return this.bindCommit(node);
  };

  Editor.prototype.textInput = function (value, multiline, onInput) {
    var node = multiline
      ? el('textarea', { class: 'form-control chs-ed-textarea', rows: 2 })
      : el('input', { type: 'text', class: 'form-control chs-ed-textinput' });
    node.value = value;
    var autosize = function () {
      if (multiline) {
        node.style.height = 'auto';
        node.style.height = Math.min(260, node.scrollHeight + 2) + 'px';
      }
    };
    node.addEventListener('input', function () { autosize(); onInput(node.value); });
    setTimeout(autosize, 0);

    return this.bindCommit(node);
  };

  Editor.prototype.number = function (value, min, max, step, onInput) {
    var node = el('input', { type: 'number', class: 'form-control input-sm', min: min, max: max, step: step, value: value });
    node.addEventListener('input', function () {
      var v = parseFloat(node.value);
      if (!isNaN(v)) {
        onInput(clamp(v, min, max));
      }
    });

    return this.bindCommit(node);
  };

  /** Rozmiar tekstu: A− / suwak / A+ / px (per urządzenie). */
  Editor.prototype.fontSize = function (g, onInput) {
    var self = this;
    var out = el('input', { type: 'number', class: 'form-control input-sm chs-ed-fs__num', min: 6, max: 200, step: 1, value: g.fs });
    var slider = el('input', { type: 'range', min: 8, max: 120, step: 1, value: Math.min(120, g.fs) });

    function set(v, commit) {
      g.fs = clamp(Math.round(v), 6, 200);
      out.value = g.fs;
      slider.value = Math.min(120, g.fs);
      onInput();
      if (commit) {
        self.commit();
      }
    }

    slider.addEventListener('input', function () { set(parseFloat(slider.value)); });
    slider.addEventListener('change', function () { self.commit(); });
    out.addEventListener('input', function () { var v = parseFloat(out.value); if (!isNaN(v)) { set(v); } });
    out.addEventListener('change', function () { self.commit(); });

    return el('span', { class: 'chs-ed-fs' }, [
      el('button', { type: 'button', class: 'btn btn-default btn-sm', title: 'Mniejszy tekst', html: 'A<small>−</small>', onclick: function () { set(g.fs > 20 ? g.fs * 0.9 : g.fs - 1, true); } }),
      slider,
      el('button', { type: 'button', class: 'btn btn-default btn-sm chs-ed-fs__big', title: 'Większy tekst', html: 'A<small>+</small>', onclick: function () { set(g.fs >= 20 ? g.fs * 1.1 : g.fs + 1, true); } }),
      out,
      el('span', { class: 'chs-ed-fs__unit', text: 'px' }),
    ]);
  };

  Editor.prototype.range = function (value, min, max, step, onInput) {
    var out = el('output', { text: String(value) });
    var node = el('input', { type: 'range', min: min, max: max, step: step, value: value });
    node.addEventListener('input', function () {
      out.textContent = node.value;
      onInput(parseFloat(node.value));
    });
    this.bindCommit(node);

    return el('span', { class: 'chs-ed-range' }, [node, out]);
  };

  Editor.prototype.selectInput = function (options, value, onInput) {
    var node = el('select', { class: 'form-control input-sm' }, options.map(function (o) {
      return el('option', { value: o[0], text: o[1] });
    }));
    node.value = String(value);
    node.addEventListener('change', function () { onInput(node.value); });

    return this.bindCommit(node);
  };

  Editor.prototype.check = function (label, checked, onInput) {
    var box = el('input', { type: 'checkbox' });
    box.checked = !!checked;
    box.addEventListener('change', function () { onInput(box.checked); });
    this.bindCommit(box);

    return el('label', { class: 'chs-ed-check' }, [box, ' ' + label]);
  };

  Editor.prototype.segmented = function (options, value, onInput, isHtml) {
    var self = this;
    var group = el('span', { class: 'chs-ed-seg chs-ed-seg--sm' });
    options.forEach(function (o) {
      var btn = el('button', { type: 'button', class: 'chs-ed-seg__btn' + (String(o[0]) === String(value) ? ' is-active' : ''), 'data-value': o[0] });
      if (isHtml || /^</.test(o[1])) {
        btn.innerHTML = o[1];
      } else {
        btn.textContent = o[1];
      }
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        group.querySelectorAll('.chs-ed-seg__btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        onInput(o[0]);
        self.commit();
      });
      group.appendChild(btn);
    });

    return group;
  };

  Editor.prototype.colorPicker = function (value, onInput, allowNone) {
    var self = this;
    var wrap = el('span', { class: 'chs-ed-color' });
    var swatches = ['#ffffff', '#0b1226', this.accent, '#f4b400', '#e53935'];
    var picker = el('input', { type: 'color', value: value || '#ffffff', title: 'Własny kolor' });

    function set(v) {
      picker.value = v || '#ffffff';
      wrap.querySelectorAll('.chs-ed-swatch').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.color === (v || ''));
      });
      onInput(v);
    }

    if (allowNone) {
      wrap.appendChild(el('button', {
        type: 'button', class: 'chs-ed-swatch chs-ed-swatch--none' + (!value ? ' is-active' : ''), 'data-color': '', title: 'Brak',
        onclick: function (e) { e.preventDefault(); set(''); self.commit(); self.renderInspector(); },
      }));
    }
    swatches.forEach(function (c) {
      wrap.appendChild(el('button', {
        type: 'button', class: 'chs-ed-swatch' + (c === value ? ' is-active' : ''), 'data-color': c, style: 'background:' + c, title: c,
        onclick: function (e) {
          e.preventDefault();
          var wasNone = !value;
          set(c);
          value = c;
          self.commit();
          if (wasNone && allowNone) { self.renderInspector(); }
        },
      }));
    });
    picker.addEventListener('input', function () { set(picker.value); value = picker.value; });
    this.bindCommit(picker);
    wrap.appendChild(picker);

    return wrap;
  };

  /* ----- geometry helpers */

  Editor.prototype.nodeBox = function (id) {
    var node = this.stage.querySelector('[data-id="' + id + '"]');
    if (!node || !this.figure) {
      return null;
    }
    var fw = this.figure.offsetWidth;
    var fh = this.figure.offsetHeight;

    return {
      x: node.offsetLeft / fw * 100,
      y: node.offsetTop / fh * 100,
      w: node.offsetWidth / fw * 100,
      h: node.offsetHeight / fh * 100,
    };
  };

  Editor.prototype.centerLayer = function (layer, axis) {
    var box = this.nodeBox(layer.id);
    if (!box) {
      return;
    }
    var g = this.geo(layer);
    if (axis === 'x') {
      g.x = round((100 - box.w) / 2, 2);
      if (layer.type === 'text') {
        layer.style.align = 'center';
      }
    } else {
      g.y = round((100 - box.h) / 2, 2);
    }
    this.renderLayer(layer);
    this.changed({ commit: true, inspector: true });
  };

  Editor.prototype.copyFromDesktop = function (layer) {
    var d = layer.d;
    layer.m = {
      x: d.x, y: d.y,
      w: d.w > 0 ? round(Math.min(100 - Math.max(d.x, 0), d.w * 1.9), 2) : 0,
      h: d.h,
      fs: Math.max(10, Math.round(d.fs * 0.5)),
      hide: layer.m.hide,
    };
    this.changed({ commit: true, inspector: true });
  };

  /** Telefon: widoczne warstwy tekst/przycisk/obraz jedna pod drugą, przy dolnej krawędzi. */
  Editor.prototype.autoLayoutMobile = function () {
    var self = this;
    var doc = this.doc();
    var items = doc.layers.filter(function (l) { return !l.m.hide && l.type !== 'shape'; })
      .sort(function (a, b) { return a.d.y - b.d.y || a.d.x - b.d.x; });
    if (!items.length) {
      return;
    }

    items.forEach(function (l) {
      l.m.x = 6;
      if (l.type === 'text' && l.d.w > 0) {
        l.m.w = 88;
      }
      if (l.type === 'image') {
        l.m.w = clamp(l.d.w * 2, 10, 50);
      }
      if (l.type === 'text' || l.type === 'button') {
        l.m.fs = Math.max(10, Math.round(l.d.fs * 0.5));
      }
    });
    this.renderStage();

    var gap = 3;
    var heights = items.map(function (l) { var b = self.nodeBox(l.id); return b ? b.h : 8; });
    var total = heights.reduce(function (a, b) { return a + b; }, 0) + gap * (items.length - 1);
    var y = Math.max(4, 94 - total);

    items.forEach(function (l, i) {
      l.m.y = round(y, 2);
      y += heights[i] + gap;
    });

    // Tło pod tekstem (kształty) — za blokiem tekstu.
    doc.layers.forEach(function (l) {
      if (l.type === 'shape' && !l.m.hide) {
        l.m.x = 3;
        l.m.w = 94;
        l.m.y = round(Math.max(1, 94 - total - 3), 2);
        l.m.h = round(Math.min(98, total + 6), 2);
      }
    });

    if (doc.scrim.d !== 'none' && doc.scrim.m === 'none') {
      doc.scrim.m = 'bottom';
    }
    this.commit();
    this.renderAll();
  };

  /* ----- pointer interaction */

  Editor.prototype.onPointerDown = function (e) {
    if (e.button !== 0) {
      return;
    }
    var handle = e.target.closest('.chs-ed-handle');
    var node = e.target.closest('.chs-layer');

    if (this.editingId && node && node.dataset.id === this.editingId) {
      return; // klik w edytowany tekst — kursor tekstowy
    }
    if (this.editingId) {
      this.stopEditing();
    }

    if (!handle && !node) {
      this.select(null);

      return;
    }

    var id = handle ? this.selected : node.dataset.id;
    var layer = this.layer(id);
    if (!layer) {
      return;
    }
    this.select(id);
    e.preventDefault();

    var g = this.geo(layer);
    var rect = this.figure.getBoundingClientRect();
    var box = this.nodeBox(id);
    this.drag = {
      id: id,
      mode: handle ? handle.dataset.handle : 'move',
      startX: e.clientX,
      startY: e.clientY,
      g0: { x: g.x, y: g.y, w: g.w > 0 ? g.w : box.w, h: g.h > 0 ? g.h : box.h, fs: g.fs, autoW: !(g.w > 0) },
      box0: box,
      fw: rect.width,
      fh: rect.height,
      moved: false,
    };
    // Bez setPointerCapture — przechwycenie zmieniałoby cel dblclick (edycja tekstu) na slajd.
    var self = this;
    var move = function (ev) { self.onPointerMove(ev); };
    var up = function (ev) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      self.onPointerUp(ev);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  Editor.prototype.onPointerMove = function (e) {
    var d = this.drag;
    if (!d) {
      return;
    }
    var dxPct = (e.clientX - d.startX) / d.fw * 100;
    var dyPct = (e.clientY - d.startY) / d.fh * 100;
    if (!d.moved && Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) < 3) {
      return;
    }
    d.moved = true;
    this.root.classList.add('is-dragging');

    var layer = this.layer(d.id);
    var g = this.geo(layer);
    var snap = !e.altKey;
    var guides = [];

    if (d.mode === 'move') {
      var x = d.g0.x + dxPct;
      var y = d.g0.y + dyPct;
      if (snap) {
        var sx = this.snapAxis(x, d.box0.w, 'x', d.id, d.fw);
        var sy = this.snapAxis(y, d.box0.h, 'y', d.id, d.fh);
        x = sx.value;
        y = sy.value;
        guides = sx.guides.concat(sy.guides);
      }
      g.x = round(x, 2);
      g.y = round(y, 2);
    } else if (d.mode === 'se' && (layer.type === 'text' || layer.type === 'button')) {
      // Róg warstwy tekstowej: skalowanie tekstu (jak w edytorach graficznych).
      var ratio = clamp((d.box0.w + dxPct) / d.box0.w, 0.2, 6);
      g.fs = clamp(Math.round(d.g0.fs * ratio), 6, 200);
      if (!d.g0.autoW) {
        g.w = round(clamp(d.g0.w * ratio, 2, 100), 2);
      }
    } else {
      if (d.mode === 'e' || d.mode === 'se') {
        var w = clamp(d.g0.w + dxPct, 2, 100);
        if (snap) {
          var right = this.snapAxis(d.g0.x + w, 0, 'x', d.id, d.fw, true);
          w = right.value - d.g0.x;
          guides = guides.concat(right.guides);
        }
        g.w = round(clamp(w, 2, 100), 2);
      }
      if ((d.mode === 's' || d.mode === 'se') && layer.type === 'shape') {
        g.h = round(clamp(d.g0.h + dyPct, 1, 100), 2);
      }
    }

    this.renderLayer(layer);
    this.renderGuides(guides);
  };

  Editor.prototype.onPointerUp = function () {
    var d = this.drag;
    this.drag = null;
    this.root.classList.remove('is-dragging');
    this.renderGuides([]);
    if (d && d.moved) {
      this.save();
      this.commit();
      this.renderInspector();
    }
  };

  /**
   * Przyciąganie do: marginesów 5% / 95%, środka slajdu i krawędzi/środków innych warstw.
   * edgeOnly — tylko dla pojedynczej krawędzi (zmiana szerokości).
   */
  Editor.prototype.snapAxis = function (start, size, axis, id, pxSize, edgeOnly) {
    var threshold = SNAP_PX / pxSize * 100;
    var lines = [5, 50, 95, 0, 100];
    var self = this;
    this.doc().layers.forEach(function (l) {
      if (l.id === id || l[self.device === 'mobile' ? 'm' : 'd'].hide) {
        return;
      }
      var b = self.nodeBox(l.id);
      if (!b) {
        return;
      }
      var s0 = axis === 'x' ? b.x : b.y;
      var sz = axis === 'x' ? b.w : b.h;
      lines.push(s0, s0 + sz / 2, s0 + sz);
    });

    var points = edgeOnly ? [[0, 0]] : [[0, 0], [size / 2, 0.5], [size, 1]];
    var best = null;
    points.forEach(function (p) {
      lines.forEach(function (line) {
        var diff = line - (start + p[0]);
        if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) {
          best = { diff: diff, line: line };
        }
      });
    });

    if (!best) {
      return { value: start, guides: [] };
    }

    return { value: start + best.diff, guides: [{ axis: axis, pos: best.line }] };
  };

  Editor.prototype.renderGuides = function (guides) {
    if (!this.guidesEl) {
      return;
    }
    this.guidesEl.innerHTML = guides.map(function (g) {
      return '<span class="chs-ed-guide chs-ed-guide--' + g.axis + '" style="' + (g.axis === 'x' ? 'left' : 'top') + ':' + g.pos + '%"></span>';
    }).join('');
  };

  /* ----- inline text editing */

  Editor.prototype.onDoubleClick = function (e) {
    var node = e.target.closest('.chs-layer');
    if (!node) {
      return;
    }
    var layer = this.layer(node.dataset.id);
    if (!layer || (layer.type !== 'text' && layer.type !== 'button')) {
      return;
    }
    this.startEditing(layer, node);
  };

  Editor.prototype.startEditing = function (layer, node) {
    var self = this;
    var inner = node.querySelector('.chs-layer__inner');
    if (!inner) {
      return;
    }
    this.editingId = layer.id;
    node.classList.add('chs-ed-editing');
    inner.textContent = layer.text;
    try {
      inner.contentEditable = 'plaintext-only';
    } catch (err) {
      inner.contentEditable = 'true';
    }
    if (inner.contentEditable !== 'plaintext-only') {
      inner.contentEditable = 'true';
    }
    inner.focus();
    var range = document.createRange();
    range.selectNodeContents(inner);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    inner.addEventListener('input', function onInput() {
      if (self.editingId !== layer.id) {
        inner.removeEventListener('input', onInput);

        return;
      }
      var text = inner.innerText.replace(/ /g, ' ').replace(/\n$/, '');
      layer.text = layer.type === 'button' ? text.replace(/\n/g, ' ') : text;
      self.save();
      self.renderSelection();
      self.renderList();
    });
    inner.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' || (ev.key === 'Enter' && (layer.type === 'button' || ev.ctrlKey || ev.metaKey))) {
        ev.preventDefault();
        self.stopEditing();
      }
    });
    inner.addEventListener('blur', function () { self.stopEditing(); }, { once: true });
  };

  Editor.prototype.stopEditing = function () {
    if (!this.editingId) {
      return;
    }
    var layer = this.layer(this.editingId);
    this.editingId = null;
    if (layer) {
      this.renderLayer(layer);
    }
    this.commit();
    this.renderInspector();
  };

  /* ----- keyboard */

  Editor.prototype.onKey = function (e) {
    if (!this.active || this.editingId) {
      return;
    }
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
      return;
    }
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) { this.redo(); } else { this.undo(); }

      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.redo();

      return;
    }
    if (!this.selected) {
      return;
    }
    var layer = this.layer(this.selected);
    if (!layer) {
      return;
    }
    if (mod && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      this.duplicateLayer(layer.id);

      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.removeLayer(layer.id);

      return;
    }
    var step = e.shiftKey ? 2 : 0.25;
    var g = this.geo(layer);
    var moves = { ArrowLeft: ['x', -step], ArrowRight: ['x', step], ArrowUp: ['y', -step], ArrowDown: ['y', step] };
    if (moves[e.key]) {
      e.preventDefault();
      g[moves[e.key][0]] = round(g[moves[e.key][0]] + moves[e.key][1], 2);
      this.renderLayer(layer);
      this.save();
      clearTimeout(this.nudgeTimer);
      var self = this;
      this.nudgeTimer = setTimeout(function () { self.commit(); self.renderInspector(); }, 400);
    }
    if (e.key === 'Enter' && (layer.type === 'text' || layer.type === 'button')) {
      e.preventDefault();
      this.startEditing(layer, this.stage.querySelector('[data-id="' + layer.id + '"]'));
    }
  };

  /** Odtwarza animację wejścia jednej warstwy (po zmianie efektu, opóźnienia lub czasu). */
  Editor.prototype.playLayer = function (id) {
    var node = this.stage.querySelector('[data-id="' + id + '"]');
    var layer = this.layer(id);
    if (!node || !layer || layer.anim.type === 'none') {
      return;
    }
    node.classList.remove('chs-ed-play');
    void node.offsetWidth; // restart animacji
    node.classList.add('chs-ed-play');
    clearTimeout(this.playLayerTimer);
    this.playLayerTimer = setTimeout(function () { node.classList.remove('chs-ed-play'); }, layer.anim.delay + layer.anim.dur + 200);
  };

  Editor.prototype.playAnimation = function () {
    var section = this.sectionEl;
    if (!section) {
      return;
    }
    section.classList.remove('is-playing');
    void section.offsetWidth; // restart animacji
    section.classList.add('is-playing');
    var max = 0;
    this.doc().layers.forEach(function (l) { max = Math.max(max, l.anim.delay + l.anim.dur); });
    clearTimeout(this.playTimer);
    this.playTimer = setTimeout(function () { section.classList.remove('is-playing'); }, max + 300);
  };

  /* ----- image replace (Zmień obraz) */

  var originalUpload = Editor.prototype.uploadImage;
  Editor.prototype.uploadImage = function () {
    var self = this;
    var targetId = this.replaceImageFor;
    this.replaceImageFor = null;
    if (!targetId) {
      originalUpload.call(this);

      return;
    }
    var file = this.fileInput.files && this.fileInput.files[0];
    if (!file) {
      return;
    }
    var data = new FormData();
    data.append('file', file);
    fetch(this.cfg.uploadUrl, { method: 'POST', body: data, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.success) {
          throw new Error(res && res.error ? res.error : 'Nie udało się wgrać obrazu.');
        }
        var layer = self.layer(targetId);
        if (layer) {
          layer.src = res.file;
          self.commit();
          self.renderAll();
        }
      })
      .catch(function (err) { window.alert(err.message); })
      .then(function () { self.fileInput.value = ''; });
  };

  function init() {
    var root = document.getElementById('chs-editor');
    if (root && !root.chsEditor) {
      root.chsEditor = new Editor(root);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
