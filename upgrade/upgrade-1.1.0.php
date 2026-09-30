<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * 1.1.0: warstwy na slajdach (tekst, przycisk, obraz, kształt — edytor wizualny w BO),
 * migracja dotychczasowego napisu na warstwy oraz ustawienia globalne: układ, kolor akcentu, animacja.
 *
 * @param Coody_Homeslider $module
 */
function upgrade_module_1_1_0($module)
{
    if (!($module instanceof Coody_Homeslider)) {
        return false;
    }

    if (!$module->ensureButtonFields() || !$module->ensureLayerFields()) {
        return false;
    }

    if (!Configuration::hasKey(Coody_Homeslider::CONFIG_LAYOUT)) {
        Configuration::updateValue(Coody_Homeslider::CONFIG_LAYOUT, 'full');
    }
    if (!Configuration::hasKey(Coody_Homeslider::CONFIG_ACCENT)) {
        Configuration::updateValue(Coody_Homeslider::CONFIG_ACCENT, Coody_Homeslider::DEFAULT_ACCENT);
    }
    if (!Configuration::hasKey(Coody_Homeslider::CONFIG_ANIMATE)) {
        Configuration::updateValue(Coody_Homeslider::CONFIG_ANIMATE, 1);
    }

    $module->clearCache();

    return true;
}
