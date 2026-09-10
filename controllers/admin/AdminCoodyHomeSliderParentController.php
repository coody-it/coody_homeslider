<?php
/**
 * Parent menu tab: Coody → Slider (redirects to first child).
 *
 * @author    coody.it
 * @copyright 2026 coody.it
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminCoodyHomeSliderParentController extends ModuleAdminController
{
    public function init()
    {
        $candidates = [
            'AdminCoodyHomeSliderConfig',
            'AdminCoodyHomeSlider',
        ];

        foreach ($candidates as $className) {
            $tabId = (int) Tab::getIdFromClassName($className);
            if ($tabId <= 0) {
                continue;
            }

            $token = Tools::getAdminToken($className . $tabId . (int) $this->context->employee->id);
            Tools::redirectAdmin('index.php?controller=' . $className . '&token=' . $token);
        }

        parent::init();
    }
}
