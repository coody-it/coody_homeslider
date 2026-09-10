{if $coody_homeslider.slides|count}
<section class="coody-homeslider{if $coody_homeslider.nav_arrows_dots} coody-homeslider--arrows-dots{/if}" aria-label="{l s='Slider strony głównej' d='Modules.CoodyHomeslider.Shop'}">
  <div class="coody-homeslider__inner">
    <div class="coody-homeslider__carousel owl-carousel" role="region" aria-roledescription="{l s='karuzela' d='Shop.Theme.Global'}" data-coody-speed="{$coody_homeslider.speed|intval}" data-coody-nav="{if $coody_homeslider.nav_arrows_dots}arrows-dots{else}titles{/if}">
      {foreach from=$coody_homeslider.slides item=slide name=coody_hs}
        <div class="coody-homeslider__slide" role="group" aria-roledescription="{l s='slajd' d='Shop.Theme.Global'}" aria-label="{$slide.legend|default:$slide.title|escape:'htmlall':'UTF-8'}" data-coody-image-desktop="{$slide.image_url|escape:'html':'UTF-8'}" data-coody-image-mobile="{$slide.image_mobile_url|escape:'html':'UTF-8'}">
          {if $slide.url}
            <a href="{$slide.url|escape:'htmlall':'UTF-8'}"{if $slide.legend} title="{$slide.legend|escape:'htmlall':'UTF-8'}"{/if}>
          {/if}
              <figure>
                {if $slide.image_mobile_url && $slide.image_url}
                  <picture>
                    <source media="(max-width: 767px)" srcset="{$slide.image_mobile_url|escape:'html':'UTF-8'}">
                    <img class="coody-homeslider__image coody-homeslider__image--desktop" src="{$slide.image_url|escape:'html':'UTF-8'}" alt="{$slide.legend|default:$slide.title|escape:'htmlall':'UTF-8'}">
                  </picture>
                {elseif $slide.image_url}
                  <img class="coody-homeslider__image" src="{$slide.image_url|escape:'html':'UTF-8'}" alt="{$slide.legend|default:$slide.title|escape:'htmlall':'UTF-8'}">
                {elseif $slide.image_mobile_url}
                  <img class="coody-homeslider__image coody-homeslider__image--mobile-only" src="{$slide.image_mobile_url|escape:'html':'UTF-8'}" alt="{$slide.legend|default:$slide.title|escape:'htmlall':'UTF-8'}">
                {/if}

                {if $slide.description}
                  <figcaption class="caption">
                    <div class="desc">
                      <div>{$slide.description nofilter}</div>
                    </div>
                  </figcaption>
                {/if}
              </figure>
          {if $slide.url}
            </a>
          {/if}
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
{/if}
