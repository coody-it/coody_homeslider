<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Nav mode: side arrows + dots (optional, default off).
 *
 * @param Coody_Homeslider $module
 */
function upgrade_module_1_0_12($module)
{
    if (!($module instanceof Coody_Homeslider)) {
        return false;
    }

    if (!Configuration::hasKey(Coody_Homeslider::CONFIG_NAV_ARROWS_DOTS)) {
        Configuration::updateValue(Coody_Homeslider::CONFIG_NAV_ARROWS_DOTS, 0);
    }

    $module->clearCache();

    return true;
}
