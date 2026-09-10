<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * BO submenu: Slider → Konfiguracja / Slajdy.
 *
 * @param Coody_Homeslider $module
 */
function upgrade_module_1_0_13($module)
{
    if (!($module instanceof Coody_Homeslider)) {
        return false;
    }

    if (!$module->ensureAdminCoodyParentTab()) {
        return false;
    }

    return $module->ensureSliderSubmenuTabs();
}
