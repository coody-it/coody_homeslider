<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * 1.0.14 — BO config save (multishop) + token/icon fixes; docs.
 *
 * @param Coody_Homeslider $module
 */
function upgrade_module_1_0_14($module)
{
    if (!($module instanceof Coody_Homeslider)) {
        return false;
    }

    if (!$module->ensureAdminCoodyParentTab()) {
        return false;
    }

    if (!$module->ensureSliderSubmenuTabs()) {
        return false;
    }

    $module->clearCache();

    return true;
}
