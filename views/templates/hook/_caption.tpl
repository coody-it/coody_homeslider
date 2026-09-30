{*
 * Warstwy slajdu. Struktura, klasy i zmienne CSS muszą zgadzać się z edytorem w BO (views/js/admin-slide.js).
 * Style inline zawierają wyłącznie zmienne CSS przygotowane w CoodyHomeSlideLayers::toFront().
 *}
{if $slide.layers.layers|count || $slide.layers.scrim_d != 'none' || $slide.layers.scrim_m != 'none'}
  <div
    class="coody-homeslider__layers"
    data-scrim-d="{$slide.layers.scrim_d|escape:'html':'UTF-8'}"
    data-scrim-m="{$slide.layers.scrim_m|escape:'html':'UTF-8'}"
    style="{$slide.layers.scrim_style|escape:'html':'UTF-8'}"
  >
    {foreach from=$slide.layers.layers item=layer}
      {if $layer.type == 'button'}
        <a class="{$layer.class|escape:'html':'UTF-8'}" style="{$layer.style|escape:'html':'UTF-8'}" href="{if $layer.link}{$layer.link|escape:'htmlall':'UTF-8'}{else}#{/if}"{if $layer.newtab} target="_blank" rel="noopener"{/if}>
          <span class="chs-layer__inner">{$layer.html nofilter}</span>
          {if $layer.arrow}
            <svg class="chs-layer__arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          {/if}
        </a>
      {elseif $layer.type == 'image'}
        {if $layer.link}<a class="{$layer.class|escape:'html':'UTF-8'}" style="{$layer.style|escape:'html':'UTF-8'}" href="{$layer.link|escape:'htmlall':'UTF-8'}"{if $layer.newtab} target="_blank" rel="noopener"{/if}>{else}<span class="{$layer.class|escape:'html':'UTF-8'}" style="{$layer.style|escape:'html':'UTF-8'}">{/if}
          <img class="chs-layer__img" src="{$layer.src|escape:'html':'UTF-8'}" alt="{$layer.alt|escape:'htmlall':'UTF-8'}" loading="lazy">
        {if $layer.link}</a>{else}</span>{/if}
      {elseif $layer.type == 'shape'}
        <span class="{$layer.class|escape:'html':'UTF-8'}" style="{$layer.style|escape:'html':'UTF-8'}" aria-hidden="true"></span>
      {else}
        {if $layer.link}
          <a class="{$layer.class|escape:'html':'UTF-8'} chs-layer--link" style="{$layer.style|escape:'html':'UTF-8'}" href="{$layer.link|escape:'htmlall':'UTF-8'}"{if $layer.newtab} target="_blank" rel="noopener"{/if}><span class="chs-layer__inner">{$layer.html nofilter}</span></a>
        {else}
          <p class="{$layer.class|escape:'html':'UTF-8'}" style="{$layer.style|escape:'html':'UTF-8'}"><span class="chs-layer__inner">{$layer.html nofilter}</span></p>
        {/if}
      {/if}
    {/foreach}
  </div>
{/if}
