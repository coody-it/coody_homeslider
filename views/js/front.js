/**
 * Coody Home Slider — karuzela + nawigacja (tytuły albo strzałki + kropki).
 *
 * Theme may add .coody-homeslider--contained (e.g. hummingbird): then skip
 * full-bleed syncFullWidth and widescreen peek (>=1921) to avoid side flicker.
 *
 * .coody-homeslider--arrows-dots: side arrows + Owl dots (no title bar).
 */
$(function () {
  var $section = $('.coody-homeslider');
  var $slider = $section.find('.coody-homeslider__carousel');

  if (!$slider.length || typeof $.fn.owlCarousel !== 'function') {
    return;
  }

  var isContained = $section.hasClass('coody-homeslider--contained');
  var useArrowsDots = $section.hasClass('coody-homeslider--arrows-dots')
    || $slider.data('coody-nav') === 'arrows-dots';
  var speed = parseInt($slider.data('coody-speed'), 10) || 5000;
  var $titleItems = $section.find('.coody-homeslider__title-item');
  var slideCount = useArrowsDots
    ? $slider.children().length
    : ($titleItems.length || $slider.children().length);
  var mobileQuery = window.matchMedia('(max-width: 767px)');
  var widePeekQuery = window.matchMedia('(min-width: 1921px)');
  var hasMultipleSlides = slideCount > 1;
  var centerSlideMaxWidth = 1920;
  var resizeTimer = null;
  var isSyncingLayout = false;

  var flatLayout = {
    center: false,
    stagePadding: 0,
    margin: 0,
    loop: hasMultipleSlides,
  };

  function isPeekMode() {
    if (isContained) {
      return false;
    }

    return (mobileQuery.matches && hasMultipleSlides) || (widePeekQuery.matches && hasMultipleSlides);
  }

  function getViewportWidth() {
    return document.documentElement.clientWidth;
  }

  function getWideStagePadding() {
    return Math.max(0, Math.round((getViewportWidth() - centerSlideMaxWidth) / 2));
  }

  function syncFullWidth() {
    if (isContained) {
      return;
    }

    var section = $section[0];

    if (!section) {
      return;
    }

    section.style.width = '';
    section.style.maxWidth = '';
    section.style.marginLeft = '';
    section.style.marginRight = '';

    var viewportWidth = getViewportWidth();
    var rect = section.getBoundingClientRect();

    section.style.width = viewportWidth + 'px';
    section.style.maxWidth = viewportWidth + 'px';
    section.style.marginLeft = -rect.left + 'px';
    section.style.marginRight = (viewportWidth - rect.right) + 'px';
  }

  function updateWidePeekClass() {
    if (isContained) {
      $section.removeClass('coody-homeslider--wide-peek');
      return;
    }

    $section.toggleClass('coody-homeslider--wide-peek', widePeekQuery.matches && hasMultipleSlides);
  }

  function getLayoutSettings() {
    if (isContained) {
      return flatLayout;
    }

    if (mobileQuery.matches) {
      return {
        center: false,
        stagePadding: 0,
        margin: 0,
        loop: hasMultipleSlides,
      };
    }

    if (widePeekQuery.matches && hasMultipleSlides) {
      return {
        center: true,
        stagePadding: getWideStagePadding(),
        margin: 16,
        loop: true,
      };
    }

    return flatLayout;
  }

  function repairSlideImages() {
    $slider.find('.coody-homeslider__slide, .carousel-item').each(function () {
      var $slide = $(this);
      var $img = $slide.find('figure img').first();

      if (!$img.length) {
        return;
      }

      var src = $img.attr('src');

      if (src && src.indexOf('placeholder') === -1) {
        return;
      }

      var desktopSrc = $slide.data('coody-image-desktop') || $img.data('coody-image-desktop');
      var mobileSrc = $slide.data('coody-image-mobile') || $img.data('coody-image-mobile');
      var nextSrc = mobileQuery.matches && mobileSrc ? mobileSrc : desktopSrc;

      if (nextSrc) {
        $img.attr('src', nextSrc);
      }
    });
  }

  function eagerLoadSlideImages() {
    $slider.find('img.owl-lazy').each(function () {
      var $img = $(this);

      if ($img.closest('picture').length) {
        var $source = $img.closest('picture').find('source[media*="767px"]');
        var mobileSrc = $source.attr('srcset');

        if (mobileSrc && mobileQuery.matches) {
          $img.attr('src', mobileSrc);
        } else {
          var desktopSrc = $img.attr('data-src');

          if (desktopSrc) {
            $img.attr('src', desktopSrc);
          }
        }

        $img.removeClass('owl-lazy');
        return;
      }

      var src = $img.attr('data-src');

      if (src) {
        $img.attr('src', src).removeClass('owl-lazy');
      }
    });
  }

  function whenSlideImagesReady() {
    var promises = $slider.find('figure img').map(function () {
      var img = this;

      if (img.complete) {
        return $.Deferred().resolve().promise();
      }

      return $.Deferred(function (deferred) {
        $(img).one('load error', deferred.resolve);
      }).promise();
    }).get();

    return promises.length ? $.when.apply($, promises) : $.Deferred().resolve().promise();
  }

  function settlePeekCarouselPosition() {
    if (!isPeekMode()) {
      return;
    }

    var owl = $slider.data('owl.carousel');

    if (!owl) {
      return;
    }

    var current = owl.relative(owl.current());

    owl.to(current, 0, true);
    $slider.trigger('next.owl.carousel', [0]);
    $slider.trigger('prev.owl.carousel', [0]);
    owl.to(current, 0, true);
  }

  function syncCarouselLayout(repositionPeek) {
    var owl = $slider.data('owl.carousel');

    if (!owl || isSyncingLayout) {
      return;
    }

    isSyncingLayout = true;

    var layout = getLayoutSettings();
    var widePadding = isContained ? 0 : getWideStagePadding();

    updateWidePeekClass();

    if (owl.options.responsive) {
      if (owl.options.responsive[0]) {
        $.extend(owl.options.responsive[0], flatLayout);
      }

      if (owl.options.responsive[768]) {
        $.extend(owl.options.responsive[768], flatLayout);
      }

      if (owl.options.responsive[1921]) {
        if (isContained) {
          $.extend(owl.options.responsive[1921], flatLayout);
        } else {
          $.extend(owl.options.responsive[1921], {
            center: true,
            stagePadding: widePadding,
            margin: 16,
            loop: hasMultipleSlides,
          });
        }
      }
    }

    $.extend(owl.settings, layout);

    if (typeof owl.invalidate === 'function') {
      owl.invalidate('width');
    }

    $slider.trigger('refresh.owl.carousel');
    repairSlideImages();

    if (repositionPeek && isPeekMode()) {
      settlePeekCarouselPosition();
      $slider.trigger('refresh.owl.carousel');
      repairSlideImages();
    }

    isSyncingLayout = false;
  }

  function setActiveTitle(index) {
    if (!$titleItems.length) {
      return;
    }

    $titleItems
      .removeClass('is-active')
      .attr('aria-selected', 'false')
      .filter('[data-slide="' + index + '"]')
      .addClass('is-active')
      .attr('aria-selected', 'true');
  }

  function initCarousel() {
    var wideBreakpoint = isContained
      ? flatLayout
      : {
          center: true,
          stagePadding: getWideStagePadding(),
          margin: 16,
          loop: hasMultipleSlides,
        };

    $slider.owlCarousel({
      loop: hasMultipleSlides,
      nav: false,
      lazyLoad: false,
      autoplay: hasMultipleSlides,
      autoplayTimeout: speed,
      autoplayHoverPause: true,
      dots: useArrowsDots && hasMultipleSlides,
      items: 1,
      smartSpeed: 450,
      center: false,
      stagePadding: 0,
      startPosition: 0,
      responsive: {
        0: $.extend({}, flatLayout),
        768: $.extend({}, flatLayout),
        1921: $.extend({}, wideBreakpoint),
      },
    });
  }

  function bootCarousel() {
    syncFullWidth();
    updateWidePeekClass();
    initCarousel();
  }

  function scheduleLayoutSync(repositionPeek) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      syncFullWidth();
      syncCarouselLayout(repositionPeek);
    }, 100);
  }

  syncFullWidth();

  $slider.on('initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel', function (e) {
    if (!e.namespace) {
      return;
    }

    repairSlideImages();

    if (e.type === 'changed' || e.type === 'initialized') {
      var carousel = e.relatedTarget;
      setActiveTitle(carousel.relative(carousel.current()));
    }
  });

  $slider.on('initialized.owl.carousel', function () {
    if (isContained) {
      // Contained: no full-bleed / peek reflow after init (avoids side flicker).
      return;
    }

    syncFullWidth();
    syncCarouselLayout(true);
    setTimeout(function () {
      syncFullWidth();
      syncCarouselLayout(true);
    }, 100);
  });

  $slider.on('resized.owl.carousel', function () {
    if (!isContained && widePeekQuery.matches && hasMultipleSlides) {
      scheduleLayoutSync(false);
    }
  });

  $(window).on('load', function () {
    if (isContained) {
      return;
    }

    syncFullWidth();

    if (isPeekMode()) {
      eagerLoadSlideImages();
    }

    syncCarouselLayout(true);
  });

  $(window).on('resize', function () {
    scheduleLayoutSync(true);
  });

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', function () {
      scheduleLayoutSync(true);
    });

    if (!isContained) {
      widePeekQuery.addEventListener('change', function () {
        scheduleLayoutSync(true);
      });
    }
  }

  $section.find('.coody-homeslider__nav-btn--prev, .coody-homeslider__arrow--prev').on('click', function () {
    $slider.trigger('prev.owl.carousel');
  });

  $section.find('.coody-homeslider__nav-btn--next, .coody-homeslider__arrow--next').on('click', function () {
    $slider.trigger('next.owl.carousel');
  });

  $titleItems.on('click', function () {
    var index = parseInt($(this).data('slide'), 10);

    if (!isNaN(index)) {
      $slider.trigger('to.owl.carousel', [index, 300, true]);
    }
  });

  if (isPeekMode()) {
    eagerLoadSlideImages();
    whenSlideImagesReady().always(bootCarousel);
  } else {
    bootCarousel();
  }
});
