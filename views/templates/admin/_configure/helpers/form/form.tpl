{extends file="helpers/form/form.tpl"}

{block name="input_row"}
  {if $input.type == 'coody_layers'}
    <div class="form-group chs-editor-row">
      <div class="col-lg-12">
        <div
          class="chs-editor"
          id="chs-editor"
          data-layout="{$chs_preview.layout|escape:'html':'UTF-8'}"
          data-accent="{$chs_preview.accent|escape:'html':'UTF-8'}"
          data-accent-contrast="{$chs_preview.accent_contrast|escape:'html':'UTF-8'}"
          data-has-nav="{if $chs_preview.has_nav}1{else}0{/if}"
          data-image-base="{$image_baseurl|escape:'html':'UTF-8'}"
          data-layer-image-base="{$chs_preview.layer_image_base|escape:'html':'UTF-8'}"
          data-upload-url="{$chs_preview.upload_url|escape:'html':'UTF-8'}"
          data-config-url="{$chs_preview.config_url|escape:'html':'UTF-8'}"
          data-default-lang="{$defaultFormLanguage|intval}"
        >
          {foreach from=$languages item=language}
            <textarea class="chs-editor__data" name="{$input.name}_{$language.id_lang}" data-lang="{$language.id_lang}" data-lang-iso="{$language.iso_code|escape:'html':'UTF-8'}" data-lang-name="{$language.name|escape:'html':'UTF-8'}" hidden>{$fields_value[$input.name][$language.id_lang]|escape:'html':'UTF-8'}</textarea>
          {/foreach}

          {* Ustawienia slajdu — przenoszone przez admin-slide.js do panelu „Slajd”. Nazwy pól jak w ObjectModel. *}
          <div class="chs-slide-fields" hidden>
            <input type="hidden" name="active" value="{$chs_slide.active|intval}" data-chs-active>
            {foreach from=$languages item=language}
              {assign var=chs_row value=$chs_slide.langs[$language.id_lang]}
              <div class="chs-slide-lang" data-lang="{$language.id_lang}">
                <div class="chs-ed-field chs-slide-image" data-field="image">
                  <span class="chs-ed-field__label">{l s='Grafika — komputer' mod='coody_homeslider'}</span>
                  <div class="chs-slide-image__box">
                    <span class="chs-slide-image__thumb">{if $chs_row.image}<img src="{$image_baseurl}{$chs_row.image|escape:'html':'UTF-8'}" alt="">{/if}</span>
                    <span class="chs-slide-image__body">
                      <span class="chs-slide-image__name">{if $chs_row.image}{$chs_row.image|regex_replace:'/^[0-9a-f]{40}_/':''|escape:'html':'UTF-8'}{else}{l s='Brak grafiki' mod='coody_homeslider'}{/if}</span>
                      <label class="btn btn-default btn-xs chs-slide-image__btn">
                        <i class="icon-upload"></i> {if $chs_row.image}{l s='Zmień' mod='coody_homeslider'}{else}{l s='Wybierz plik' mod='coody_homeslider'}{/if}
                        <input type="file" name="image_{$language.id_lang}" accept="image/jpeg,image/png,image/gif,image/webp">
                      </label>
                    </span>
                  </div>
                  {if $chs_row.image}<input type="hidden" name="image_old_{$language.id_lang}" value="{$chs_row.image|escape:'html':'UTF-8'}">{/if}
                  <span class="chs-ed-help">{l s='Zalecane 2592 × 900 px. Zostaw spokojne miejsce na napis.' mod='coody_homeslider'}</span>
                </div>
                <div class="chs-ed-field chs-slide-image" data-field="image_mobile">
                  <span class="chs-ed-field__label">{l s='Grafika — telefon (opcjonalnie)' mod='coody_homeslider'}</span>
                  <div class="chs-slide-image__box">
                    <span class="chs-slide-image__thumb">{if $chs_row.image_mobile}<img src="{$image_baseurl}{$chs_row.image_mobile|escape:'html':'UTF-8'}" alt="">{/if}</span>
                    <span class="chs-slide-image__body">
                      <span class="chs-slide-image__name">{if $chs_row.image_mobile}{$chs_row.image_mobile|regex_replace:'/^[0-9a-f]{40}_/':''|escape:'html':'UTF-8'}{else}{l s='Używana grafika na komputer' mod='coody_homeslider'}{/if}</span>
                      <label class="btn btn-default btn-xs chs-slide-image__btn">
                        <i class="icon-upload"></i> {if $chs_row.image_mobile}{l s='Zmień' mod='coody_homeslider'}{else}{l s='Wybierz plik' mod='coody_homeslider'}{/if}
                        <input type="file" name="image_mobile_{$language.id_lang}" accept="image/jpeg,image/png,image/gif,image/webp">
                      </label>
                    </span>
                  </div>
                  {if $chs_row.image_mobile}<input type="hidden" name="image_mobile_old_{$language.id_lang}" value="{$chs_row.image_mobile|escape:'html':'UTF-8'}">{/if}
                  <span class="chs-ed-help">{l s='Ok. 1500 × 970 px.' mod='coody_homeslider'}</span>
                </div>
                <label class="chs-ed-field">
                  <span class="chs-ed-field__label">{l s='Nazwa slajdu' mod='coody_homeslider'}</span>
                  <input type="text" class="form-control input-sm" name="title_{$language.id_lang}" value="{$chs_row.title|escape:'html':'UTF-8'}" maxlength="255">
                  <span class="chs-ed-help">{l s='Na liście slajdów i w pasku nawigacji pod sliderem.' mod='coody_homeslider'}</span>
                </label>
                <label class="chs-ed-field">
                  <span class="chs-ed-field__label">{l s='Link całego slajdu' mod='coody_homeslider'}</span>
                  <input type="text" class="form-control input-sm" name="url_{$language.id_lang}" value="{$chs_row.url|escape:'html':'UTF-8'}" maxlength="255" placeholder="https://…">
                  <span class="chs-ed-help">{l s='Opcjonalnie — klik w grafikę poza przyciskami.' mod='coody_homeslider'}</span>
                </label>
                <label class="chs-ed-field">
                  <span class="chs-ed-field__label">{l s='Tekst alternatywny (alt)' mod='coody_homeslider'}</span>
                  <input type="text" class="form-control input-sm" name="legend_{$language.id_lang}" value="{$chs_row.legend|escape:'html':'UTF-8'}" maxlength="255">
                  <span class="chs-ed-help">{l s='Opis grafiki dla Google i czytników ekranu.' mod='coody_homeslider'}</span>
                </label>
              </div>
            {/foreach}
          </div>

          <noscript>{l s='Edytor slajdu wymaga włączonego JavaScriptu.' mod='coody_homeslider'}</noscript>
        </div>
      </div>
    </div>
  {else}
    {$smarty.block.parent}
  {/if}
{/block}
