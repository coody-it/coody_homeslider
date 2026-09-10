<?php
/**
 * BO configuration for Coody Home Slider (Coody → Slider → Konfiguracja).
 *
 * @author    coody.it
 * @copyright 2026 coody.it
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminCoodyHomeSliderConfigController extends ModuleAdminController
{
    public function __construct()
    {
        $this->bootstrap = true;
        parent::__construct();
    }

    public function initContent()
    {
        if ($this->module instanceof Coody_Homeslider) {
            $this->content .= $this->module->getContent();
        } else {
            $this->errors[] = $this->trans('Module not found.', [], 'Admin.Modules.Notification');
        }

        parent::initContent();
    }
}
