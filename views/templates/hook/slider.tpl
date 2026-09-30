{if $coody_homeslider.slides|count}
{if $coody_homeslider.layout == 'contained'}<div class="container">{/if}
<section
  class="coody-homeslider{if $coody_homeslider.layout == 'contained'} coody-homeslider--contained{/if}{if $coody_homeslider.nav_arrows_dots} coody-homeslider--arrows-dots{/if}{if $coody_homeslider.animate} coody-homeslider--animate{/if}{if $coody_homeslider.slides|count > 1} coody-homeslider--has-nav{/if}"
  style="--chs-accent: {$coody_homeslider.accent|escape:'html':'UTF-8'}; --chs-accent-contrast: {$coody_homeslider.accent_contrast|escape:'html':'UTF-8'};"
  aria-label="{l s='Slider strony głównej' d='Modules.CoodyHomeslider.Shop'}"
>
  <div class="coody-homeslider__inner">
    <div class="coody-homeslider__carousel owl-carousel" role="region" aria-roledescription="{l s='karuzela' d='Shop.Theme.Global'}" data-coody-speed="{$coody_homeslider.speed|intval}" data-coody-nav="{if $coody_homeslider.nav_arrows_dots}arrows-dots{else}titles{/if}">
      {foreach from=$coody_homeslider.slides item=slide name=coody_hs}
        <div class="coody-homeslider__slide" role="group" aria-roledescription="{l s='slajd' d='Shop.Theme.Global'}" aria-label="{$slide.legend|default:$slide.title|escape:'htmlall':'UTF-8'}" data-coody-image-desktop="{$slide.image_url|escape:'html':'UTF-8'}" data-coody-image-mobile="{$slide.image_mobile_url|escape:'html':'UTF-8'}">
          <figure>
            {if $slide.url}
              <a class="coody-homeslider__media-link" href="{$slide.url|escape:'htmlall':'UTF-8'}"{if $slide.legend} title="{$slide.legend|escape:'htmlall':'UTF-8'}"{/if}>
            {/if}
              <picture>
                {if $slide.image_mobile_webp_url}
                  <source type="image/webp" media="(max-width: 767px)" srcset="{$slide.image_mobile_webp_url|escape:'html':'UTF-8'}">
                {/if}
                {if $slide.image_mobile_url}
                  <source media="(max-width: 767px)" srcset="{$slide.image_mobile_url|escape:'html':'UTF-8'}">
                {/if}
                {if $slide.image_webp_url}
                  <source type="image/webp" srcset="{$slide.image_webp_url|escape:'html':'UTF-8'}">
                {/if}
                <img
                  class="coody-homeslider__image{if !$slide.image_url} coody-homeslider__image--mobile-only{/if}"
                  src="{if $slide.image_url}{$slide.image_url|escape:'html':'UTF-8'}{else}{$slide.image_mobile_url|escape:'html':'UTF-8'}{/if}"
                  width="1320"
                  height="450"
                  {if $smarty.foreach.coody_hs.first}fetchpriority="high"{else}loading="lazy"{/if}
                  alt="{$slide.legend|default:$slide.title|escape:'htmlall':'UTF-8'}"
                >
              </picture>
            {if $slide.url}
              </a>
            {/if}

            {include file='module:coody_homeslider/views/templates/hook/_caption.tpl' slide=$slide}
          </figure>
        </div>
      {/foreach}
    </div>

    {if $coody_homeslider.slides|count > 1}
      {if $coody_homeslider.nav_arrows_dots}
        <button type="button" class="coody-homeslider__arrow coody-homeslider__arrow--prev" aria-label="{l s='Poprzedni slajd' d='Shop.Theme.Global'}">
          <svg class="coody-homeslider__arrow-icon" width="20" height="20" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M10.5 2.5 4 8.5l6.5 6 1.2-1.3L6.4 8.5l5.3-4.7z"/>
          </svg>
        </button>
        <button type="button" class="coody-homeslider__arrow coody-homeslider__arrow--next" aria-label="{l s='Następny slajd' d='Shop.Theme.Global'}">
          <svg class="coody-homeslider__arrow-icon" width="20" height="20" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M5.5 2.5 12 8.5l-6.5 6-1.2-1.3L9.6 8.5 4.3 3.8z"/>
          </svg>
        </button>
      {else}
        <div class="coody-homeslider__nav" aria-label="{l s='Nawigacja slidera' d='Modules.CoodyHomeslider.Shop'}">
          <button type="button" class="coody-homeslider__nav-btn coody-homeslider__nav-btn--prev" aria-label="{l s='Poprzedni slajd' d='Shop.Theme.Global'}">
            <svg class="coody-homeslider__nav-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M10.5 2.5 4 8.5l6.5 6 1.2-1.3L6.4 8.5l5.3-4.7z"/>
            </svg>
          </button>

          <ul class="coody-homeslider__titles" role="tablist">
            {foreach from=$coody_homeslider.slides item=slide name=coody_hs_nav}
              <li role="presentation">
                <button
                  type="button"
                  role="tab"
                  class="coody-homeslider__title-item{if $smarty.foreach.coody_hs_nav.first} is-active{/if}"
                  data-slide="{$smarty.foreach.coody_hs_nav.index}"
                  aria-selected="{if $smarty.foreach.coody_hs_nav.first}true{else}false{/if}"
                >
                  {$slide.title|default:''|escape:'htmlall':'UTF-8'}
                </button>
              </li>
            {/foreach}
          </ul>

          <button type="button" class="coody-homeslider__nav-btn coody-homeslider__nav-btn--next" aria-label="{l s='Następny slajd' d='Shop.Theme.Global'}">
            <svg class="coody-homeslider__nav-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M5.5 2.5 12 8.5l-6.5 6-1.2-1.3L9.6 8.5 4.3 3.8z"/>
            </svg>
          </button>
        </div>
      {/if}
    {/if}
  </div>
</section>
{if $coody_homeslider.layout == 'contained'}</div>{/if}
{/if}
