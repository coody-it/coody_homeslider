<?php
/**
 * Home slider
 *
 * @author    coody.it
 * @copyright 2026 coody.it
 * @license   Proprietary
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

require_once dirname(__FILE__) . '/classes/CoodyHomeSlide.php';

class Coody_Homeslider extends Module
{
    public const CONFIG_ENABLED = 'COODY_HOMESLIDER_ENABLED';
    public const CONFIG_SPEED = 'COODY_HOMESLIDER_SPEED';
    public const CONFIG_NAV_ARROWS_DOTS = 'COODY_HOMESLIDER_NAV_ARROWS_DOTS';
    public const TPL_SLIDER = 'module:coody_homeslider/views/templates/hook/slider.tpl';

    /** @var bool */
    private static $sliderRendered = false;

    public function __construct()
    {
        $this->name = 'coody_homeslider';
        $this->tab = 'front_office_features';
        $this->version = '1.0.14';
        $this->author = 'coody.it';
        $this->need_instance = 0;
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('Coody - Slider strony głównej');
        $this->description = $this->l('Slider banerów na stronie głównej z osobną grafiką na mobile.');
        $this->confirmUninstall = $this->l('Czy na pewno chcesz odinstalować ten moduł?');
        $this->ps_versions_compliancy = ['min' => '8.0.0', 'max' => '9.99.99'];
    }

    public function install(): bool
    {
        return parent::install()
            && $this->installDb()
            && $this->installTab()
            && Configuration::updateValue(self::CONFIG_ENABLED, 1)
            && Configuration::updateValue(self::CONFIG_SPEED, 5000)
            && Configuration::updateValue(self::CONFIG_NAV_ARROWS_DOTS, 0)
            && $this->registerHook('displayHeader')
            && $this->registerHook('displayWrapperTop')
            && $this->registerHook('displayHomeTop')
            && $this->registerHook('displayHomeSliders')
            && $this->registerHook('actionShopDataDuplication')
            && $this->ensureFrontHooks();
    }

    public function uninstall(): bool
    {
        return $this->uninstallTab()
            && $this->uninstallDb()
            && Configuration::deleteByName(self::CONFIG_ENABLED)
            && Configuration::deleteByName(self::CONFIG_SPEED)
            && Configuration::deleteByName(self::CONFIG_NAV_ARROWS_DOTS)
            && parent::uninstall();
    }

    public function getContent(): string
    {
        $output = '';

        if (Tools::isSubmit('submitCoodyHomeSliderConfig')) {
            $enabled = (int) Tools::getValue(self::CONFIG_ENABLED);
            $speed = max(1000, (int) Tools::getValue(self::CONFIG_SPEED));
            $navArrowsDots = (int) Tools::getValue(self::CONFIG_NAV_ARROWS_DOTS);

            $this->updateConfigForAllShops(self::CONFIG_ENABLED, $enabled);
            $this->updateConfigForAllShops(self::CONFIG_SPEED, $speed);
            $this->updateConfigForAllShops(self::CONFIG_NAV_ARROWS_DOTS, $navArrowsDots);

            $this->clearCache();
            $output .= $this->displayConfirmation($this->l('Ustawienia zostały zapisane.'));
        }

        $slidesUrl = $this->context->link->getAdminLink('AdminCoodyHomeSlider');

        $output .= $this->renderConfigurationForm();
        $output .= '<div class="panel">';
        $output .= '<div class="panel-heading">' . $this->l('Slajdy') . '</div>';
        $output .= '<p>' . $this->l('Dodawaj i edytuj slajdy (grafika desktop/mobile, nazwa, link, opis).') . '</p>';
        $output .= '<a class="btn btn-primary" href="' . htmlspecialchars($slidesUrl, ENT_QUOTES, 'UTF-8') . '">';
        $output .= '<i class="icon-picture"></i> ' . $this->l('Zarządzaj slajdami') . '</a>';
        $output .= '<p class="help-block" style="margin-top:12px;">';
        $output .= $this->l('Slider wyświetla się automatycznie na stronie głównej (displayWrapperTop / displayHomeTop). Nie wymaga zmian w motywie.');
        $output .= '</p></div>';

        return $output;
    }

    public function hookDisplayHeader(): void
    {
        if (!$this->isModuleActive() || !$this->isHomepage()) {
            return;
        }

        $this->context->controller->registerStylesheet(
            'module-coody-homeslider-owl',
            'modules/' . $this->name . '/views/css/owl.carousel.min.css',
            ['media' => 'all', 'priority' => 140]
        );

        $this->context->controller->registerStylesheet(
            'module-coody-homeslider',
            'modules/' . $this->name . '/views/css/front.css',
            ['media' => 'all', 'priority' => 250]
        );

        $this->context->controller->registerJavascript(
            'module-coody-homeslider-owl',
            'modules/' . $this->name . '/views/js/owl.carousel.min.js',
            ['position' => 'bottom', 'priority' => 190]
        );

        $this->context->controller->registerJavascript(
            'module-coody-homeslider',
            'modules/' . $this->name . '/views/js/front.js',
            ['position' => 'bottom', 'priority' => 200]
        );
    }

    public function hookDisplayWrapperTop(array $params): string
    {
        return $this->renderSliderOnce($params);
    }

    public function hookDisplayHomeTop(array $params): string
    {
        return $this->renderSliderOnce($params);
    }

    /**
     * IndexController calls displayHome in initContent (HOOK_HOME) before the layout.
     * Do not render here — it would set the once-only flag and block displayHomeSliders.
     */
    public function hookDisplayHome(array $params): string
    {
        return '';
    }

    public function hookDisplayHomeSliders(array $params): string
    {
        return $this->renderSliderOnce($params);
    }

    public function hookActionShopDataDuplication(array $params): void
    {
        if (empty($params['old_id_shop']) || empty($params['new_id_shop'])) {
            return;
        }

        $oldShop = (int) $params['old_id_shop'];
        $newShop = (int) $params['new_id_shop'];

        $rows = Db::getInstance()->executeS(
            'SELECT `id_coody_homeslider_slide`
            FROM `' . _DB_PREFIX_ . 'coody_homeslider`
            WHERE `id_shop` = ' . $oldShop
        );

        if (!is_array($rows)) {
            return;
        }

        foreach ($rows as $row) {
            Db::getInstance()->insert('coody_homeslider', [
                'id_shop' => $newShop,
                'id_coody_homeslider_slide' => (int) $row['id_coody_homeslider_slide'],
            ], false, true, Db::INSERT_IGNORE);
        }
    }

    public function getSlidesForFront(): array
    {
        $idLang = (int) $this->context->language->id;
        $idShop = (int) $this->context->shop->id;

        $sql = new DbQuery();
        $sql->select('s.*, sl.*');
        $sql->from('coody_homeslider_slide', 's');
        $sql->innerJoin(
            'coody_homeslider',
            'hs',
            'hs.`id_coody_homeslider_slide` = s.`id_coody_homeslider_slide` AND hs.`id_shop` = ' . $idShop
        );
        $sql->leftJoin(
            'coody_homeslider_slide_lang',
            'sl',
            's.`id_coody_homeslider_slide` = sl.`id_coody_homeslider_slide` AND sl.`id_lang` = ' . $idLang
        );
        $sql->where('s.`active` = 1');
        $sql->orderBy('s.`position` ASC');

        $rows = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);
        if (!is_array($rows) || $rows === []) {
            return [];
        }

        $imgBase = $this->_path . 'img/';
        $slides = [];
        $defaultLang = (int) Configuration::get('PS_LANG_DEFAULT');
        $fallbackRows = [];

        if ($idLang !== $defaultLang) {
            $slideIds = array_unique(array_map(static fn (array $row): int => (int) $row['id_coody_homeslider_slide'], $rows));
            if ($slideIds !== []) {
                $fallbackRows = $this->getSlideLangRows($slideIds, $defaultLang);
            }
        }

        foreach ($rows as $row) {
            $slideId = (int) $row['id_coody_homeslider_slide'];
            $image = (string) ($row['image'] ?? '');
            $imageMobile = (string) ($row['image_mobile'] ?? '');

            if (($image === '' || $imageMobile === '') && isset($fallbackRows[$slideId])) {
                if ($image === '') {
                    $image = (string) ($fallbackRows[$slideId]['image'] ?? '');
                }
                if ($imageMobile === '') {
                    $imageMobile = (string) ($fallbackRows[$slideId]['image_mobile'] ?? '');
                }
            }

            // Brak grafiki mobile → użyj desktop (front i <picture>).
            if ($imageMobile === '' && $image !== '') {
                $imageMobile = $image;
            }

            if ($image === '' && $imageMobile === '') {
                continue;
            }

            $slides[] = [
                'id' => $slideId,
                'title' => $this->resolveSlideLangValue($row, $fallbackRows, $slideId, 'title'),
                'description' => $this->resolveSlideLangValue($row, $fallbackRows, $slideId, 'description'),
                'url' => $this->resolveSlideLangValue($row, $fallbackRows, $slideId, 'url'),
                'legend' => $this->resolveSlideLangValue($row, $fallbackRows, $slideId, 'legend'),
                'button_title' => $this->resolveSlideLangValue($row, $fallbackRows, $slideId, 'button_title'),
                'button_link' => $this->resolveSlideLangValue($row, $fallbackRows, $slideId, 'button_link'),
                'image_url' => $image !== '' ? $imgBase . $image : '',
                'image_mobile_url' => $imageMobile !== '' ? $imgBase . $imageMobile : '',
                'image_webp_url' => $this->resolveWebpUrl($imgBase, $image),
                'image_mobile_webp_url' => $this->resolveWebpUrl($imgBase, $imageMobile),
            ];
        }

        return $slides;
    }

    /**
     * Return WebP sibling URL when a converted file exists next to the original.
     */
    private function resolveWebpUrl(string $imgBase, string $filename): string
    {
        if ($filename === '') {
            return '';
        }

        $webpName = (string) preg_replace('/\.(jpe?g|png|gif)$/i', '.webp', $filename);
        if ($webpName === '' || $webpName === $filename) {
            // Already webp (or unsupported)
            if (preg_match('/\.webp$/i', $filename)) {
                return $imgBase . $filename;
            }

            return '';
        }

        $webpPath = _PS_MODULE_DIR_ . 'coody_homeslider/img/' . $webpName;
        if (!is_file($webpPath)) {
            return '';
        }

        return $imgBase . $webpName;
    }

    /**
     * @param int[] $slideIds
     *
     * @return array<int, array<string, mixed>>
     */
    private function getSlideLangRows(array $slideIds, int $idLang): array
    {
        $slideIds = array_values(array_filter(array_map('intval', $slideIds)));
        if ($slideIds === []) {
            return [];
        }

        $result = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS(
            'SELECT `id_coody_homeslider_slide`, `title`, `description`, `url`, `legend`, `image`, `image_mobile`, `button_title`, `button_link`
            FROM `' . _DB_PREFIX_ . 'coody_homeslider_slide_lang`
            WHERE `id_lang` = ' . (int) $idLang . '
            AND `id_coody_homeslider_slide` IN (' . implode(',', $slideIds) . ')'
        );

        if (!is_array($result)) {
            return [];
        }

        $rows = [];
        foreach ($result as $row) {
            $rows[(int) $row['id_coody_homeslider_slide']] = $row;
        }

        return $rows;
    }

    /**
     * @param array<string, mixed> $row
     * @param array<int, array<string, mixed>> $fallbackRows
     */
    private function resolveSlideLangValue(array $row, array $fallbackRows, int $slideId, string $field): string
    {
        $value = (string) ($row[$field] ?? '');
        if ($value !== '' || !isset($fallbackRows[$slideId])) {
            return $value;
        }

        return (string) ($fallbackRows[$slideId][$field] ?? '');
    }

    public function clearCache(): bool
    {
        $this->_clearCache(self::TPL_SLIDER);

        return true;
    }

    protected function renderSliderOnce(array $params): string
    {
        if (self::$sliderRendered || !$this->isModuleActive() || !$this->isHomepage()) {
            return '';
        }

        $slides = $this->getSlidesForFront();
        if ($slides === []) {
            return '';
        }

        self::$sliderRendered = true;

        $navArrowsDots = (bool) (int) Configuration::get(self::CONFIG_NAV_ARROWS_DOTS);
        $speed = max(1000, (int) Configuration::get(self::CONFIG_SPEED));
        $cacheId = 'coody_homeslider|'
            . (int) $this->context->shop->id . '|'
            . (int) $this->context->language->id . '|'
            . (int) $navArrowsDots . '|'
            . $speed . '|'
            . md5(json_encode($slides));

        if (!$this->isCached(self::TPL_SLIDER, $cacheId)) {
            $this->context->smarty->assign([
                'coody_homeslider' => [
                    'slides' => $slides,
                    'speed' => $speed,
                    'nav_arrows_dots' => $navArrowsDots,
                    'placeholder_url' => $this->_path . 'img/placeholder.svg',
                ],
            ]);
        }

        return $this->fetch(self::TPL_SLIDER, $cacheId);
    }

    protected function isModuleActive(): bool
    {
        return (bool) Configuration::get(self::CONFIG_ENABLED);
    }

    /**
     * Zapisz konfigurację dla kontekstu globalnego i wszystkich sklepów
     * (unikamy sytuacji, gdy front sklepu 1 ma starą wartość 0).
     */
    private function updateConfigForAllShops(string $key, $value): void
    {
        Configuration::updateValue($key, $value);

        foreach (Shop::getShops(true, null, true) as $idShop) {
            Configuration::updateValue($key, $value, false, null, (int) $idShop);
        }
    }

    protected function isHomepage(): bool
    {
        return isset($this->context->controller->php_self)
            && $this->context->controller->php_self === 'index';
    }

    protected function renderConfigurationForm(): string
    {
        $fieldsForm = [
            'form' => [
                'legend' => [
                    'title' => $this->l('Ustawienia'),
                    'icon' => 'icon-cogs',
                ],
                'input' => [
                    [
                        'type' => 'switch',
                        'label' => $this->l('Włączony'),
                        'name' => self::CONFIG_ENABLED,
                        'is_bool' => true,
                        'values' => [
                            ['id' => 'active_on', 'value' => 1, 'label' => $this->l('Tak')],
                            ['id' => 'active_off', 'value' => 0, 'label' => $this->l('Nie')],
                        ],
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('Czas slajdu (ms)'),
                        'name' => self::CONFIG_SPEED,
                        'class' => 'fixed-width-sm',
                        'desc' => $this->l('Minimalnie 1000 ms. Czas wyświetlania pojedynczego slajdu.'),
                    ],
                    [
                        'type' => 'switch',
                        'label' => $this->l('Nawigacja: strzałki + kropki'),
                        'name' => self::CONFIG_NAV_ARROWS_DOTS,
                        'is_bool' => true,
                        'desc' => $this->l('Gdy włączone: strzałki lewo/prawo na slajdzie i kropki na dole zamiast paska z nazwami slajdów.'),
                        'values' => [
                            ['id' => 'nav_arrows_dots_on', 'value' => 1, 'label' => $this->l('Tak')],
                            ['id' => 'nav_arrows_dots_off', 'value' => 0, 'label' => $this->l('Nie')],
                        ],
                    ],
                ],
                'submit' => [
                    'title' => $this->l('Zapisz'),
                    'name' => 'submitCoodyHomeSliderConfig',
                ],
            ],
        ];

        $helper = new HelperForm();
        $helper->show_toolbar = false;
        $helper->module = $this;
        $helper->default_form_language = (int) Configuration::get('PS_LANG_DEFAULT');
        $helper->allow_employee_form_lang = (int) Configuration::get('PS_BO_ALLOW_EMPLOYEE_FORM_LANG');
        $helper->submit_action = 'submitCoodyHomeSliderConfig';

        // Formularz jest też na AdminCoodyHomeSliderConfig — token musi być tego kontrolera,
        // nie AdminModules (inaczej BO zwraca „Invalid security token”).
        $controllerName = '';
        if (isset($this->context->controller->controller_name)) {
            $controllerName = (string) $this->context->controller->controller_name;
        }

        if ($controllerName === 'AdminCoodyHomeSliderConfig') {
            $helper->currentIndex = AdminController::$currentIndex;
            $helper->token = Tools::getAdminTokenLite('AdminCoodyHomeSliderConfig');
        } else {
            $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;
            $helper->token = Tools::getAdminTokenLite('AdminModules');
        }

        $helper->fields_value = [
            self::CONFIG_ENABLED => (int) Configuration::get(self::CONFIG_ENABLED),
            self::CONFIG_SPEED => (int) Configuration::get(self::CONFIG_SPEED),
            self::CONFIG_NAV_ARROWS_DOTS => (int) Configuration::get(self::CONFIG_NAV_ARROWS_DOTS),
        ];

        return $helper->generateForm([$fieldsForm]);
    }

    private function installDb(): bool
    {
        $sql = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'coody_homeslider_slide` (
            `id_coody_homeslider_slide` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `active` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
            `position` INT UNSIGNED NOT NULL DEFAULT 0,
            `date_add` DATETIME NULL,
            `date_upd` DATETIME NULL,
            PRIMARY KEY (`id_coody_homeslider_slide`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        $sqlLang = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'coody_homeslider_slide_lang` (
            `id_coody_homeslider_slide` INT UNSIGNED NOT NULL,
            `id_lang` INT UNSIGNED NOT NULL,
            `title` VARCHAR(255) NULL,
            `description` TEXT NULL,
            `url` VARCHAR(255) NULL,
            `legend` VARCHAR(255) NULL,
            `image` VARCHAR(255) NULL,
            `image_mobile` VARCHAR(255) NULL,
            `button_title` VARCHAR(255) NULL,
            `button_link` VARCHAR(255) NULL,
            PRIMARY KEY (`id_coody_homeslider_slide`, `id_lang`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        $sqlShop = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'coody_homeslider` (
            `id_coody_homeslider_slide` INT UNSIGNED NOT NULL,
            `id_shop` INT UNSIGNED NOT NULL,
            PRIMARY KEY (`id_coody_homeslider_slide`, `id_shop`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        return Db::getInstance()->execute($sql)
            && Db::getInstance()->execute($sqlLang)
            && Db::getInstance()->execute($sqlShop);
    }

    private function uninstallDb(): bool
    {
        return Db::getInstance()->execute('DROP TABLE IF EXISTS `' . _DB_PREFIX_ . 'coody_homeslider`')
            && Db::getInstance()->execute('DROP TABLE IF EXISTS `' . _DB_PREFIX_ . 'coody_homeslider_slide_lang`')
            && Db::getInstance()->execute('DROP TABLE IF EXISTS `' . _DB_PREFIX_ . 'coody_homeslider_slide`');
    }

    private function installTab(): bool
    {
        if (!$this->ensureAdminCoodyParentTab()) {
            return false;
        }

        return $this->ensureSliderSubmenuTabs();
    }

    /**
     * Menu: Coody → Slider → Konfiguracja / Slajdy.
     */
    public function ensureSliderSubmenuTabs(): bool
    {
        $coodyId = (int) Tab::getIdFromClassName('AdminCoody');
        if ($coodyId <= 0) {
            return false;
        }

        $parentId = $this->ensureTab(
            'AdminCoodyHomeSliderParent',
            $coodyId,
            'image',
            [
                'pl' => 'Slider',
                'en' => 'Slider',
            ]
        );
        if ($parentId <= 0) {
            return false;
        }

        $configId = $this->ensureTab(
            'AdminCoodyHomeSliderConfig',
            $parentId,
            'settings',
            [
                'pl' => 'Konfiguracja',
                'en' => 'Configuration',
            ],
            0
        );
        if ($configId <= 0) {
            return false;
        }

        $slidesId = $this->ensureTab(
            'AdminCoodyHomeSlider',
            $parentId,
            'image',
            [
                'pl' => 'Slajdy',
                'en' => 'Slides',
            ],
            1
        );
        if ($slidesId <= 0) {
            return false;
        }

        $this->copyTabAccess('AdminCoodyHomeSlider', 'AdminCoodyHomeSliderParent');
        $this->copyTabAccess('AdminCoodyHomeSlider', 'AdminCoodyHomeSliderConfig');

        return true;
    }

    /**
     * @param array<string, string> $labelsByIso
     */
    private function ensureTab(string $className, int $parentId, string $icon, array $labelsByIso, int $position = 0): int
    {
        $tabId = (int) Tab::getIdFromClassName($className);
        $tab = $tabId > 0 ? new Tab($tabId) : new Tab();

        if ($tabId > 0 && !Validate::isLoadedObject($tab)) {
            return 0;
        }

        $tab->active = 1;
        $tab->class_name = $className;
        $tab->module = $this->name;
        $tab->id_parent = $parentId;
        $tab->icon = $icon;
        $tab->position = $position;

        foreach (Language::getLanguages(false) as $lang) {
            $iso = (string) $lang['iso_code'];
            $tab->name[(int) $lang['id_lang']] = $labelsByIso[$iso]
                ?? $labelsByIso['en']
                ?? $className;
        }

        $ok = $tabId > 0 ? (bool) $tab->update() : (bool) $tab->add();

        return $ok ? (int) $tab->id : 0;
    }

    /**
     * Copy profile access from an existing tab to a newly created sibling/parent.
     */
    private function copyTabAccess(string $fromClass, string $toClass): void
    {
        $fromId = (int) Tab::getIdFromClassName($fromClass);
        $toId = (int) Tab::getIdFromClassName($toClass);
        if ($fromId <= 0 || $toId <= 0 || $fromId === $toId) {
            return;
        }

        $fromRoles = Db::getInstance()->executeS(
            'SELECT ar.slug
            FROM `' . _DB_PREFIX_ . 'authorization_role` ar
            WHERE ar.slug LIKE "ROLE_MOD_TAB_' . bqSQL(Tools::strtoupper($fromClass)) . '_%"'
        );
        if (!is_array($fromRoles) || $fromRoles === []) {
            return;
        }

        foreach (['CREATE', 'READ', 'UPDATE', 'DELETE'] as $perm) {
            $fromSlug = 'ROLE_MOD_TAB_' . Tools::strtoupper($fromClass) . '_' . $perm;
            $toSlug = 'ROLE_MOD_TAB_' . Tools::strtoupper($toClass) . '_' . $perm;

            $fromRoleId = (int) Db::getInstance()->getValue(
                'SELECT `id_authorization_role` FROM `' . _DB_PREFIX_ . 'authorization_role`
                WHERE `slug` = "' . pSQL($fromSlug) . '"'
            );
            $toRoleId = (int) Db::getInstance()->getValue(
                'SELECT `id_authorization_role` FROM `' . _DB_PREFIX_ . 'authorization_role`
                WHERE `slug` = "' . pSQL($toSlug) . '"'
            );
            if ($fromRoleId <= 0 || $toRoleId <= 0) {
                continue;
            }

            $profiles = Db::getInstance()->executeS(
                'SELECT `id_profile` FROM `' . _DB_PREFIX_ . 'access`
                WHERE `id_authorization_role` = ' . $fromRoleId
            );
            if (!is_array($profiles)) {
                continue;
            }

            foreach ($profiles as $row) {
                $idProfile = (int) $row['id_profile'];
                $exists = (int) Db::getInstance()->getValue(
                    'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'access`
                    WHERE `id_profile` = ' . $idProfile . '
                      AND `id_authorization_role` = ' . $toRoleId
                );
                if ($exists) {
                    continue;
                }

                Db::getInstance()->insert('access', [
                    'id_profile' => $idProfile,
                    'id_authorization_role' => $toRoleId,
                ]);
            }
        }
    }

    /**
     * CTA fields on slide lang table (1.0.11+).
     */
    public function ensureButtonFields(): bool
    {
        $table = _DB_PREFIX_ . 'coody_homeslider_slide_lang';
        $columns = Db::getInstance()->executeS('SHOW COLUMNS FROM `' . bqSQL($table) . '`');
        if (!is_array($columns)) {
            return false;
        }

        $existing = [];
        foreach ($columns as $column) {
            $existing[(string) $column['Field']] = true;
        }

        $ok = true;
        if (!isset($existing['button_title'])) {
            $ok = $ok && Db::getInstance()->execute(
                'ALTER TABLE `' . bqSQL($table) . '` ADD `button_title` VARCHAR(255) NULL'
            );
        }
        if (!isset($existing['button_link'])) {
            $ok = $ok && Db::getInstance()->execute(
                'ALTER TABLE `' . bqSQL($table) . '` ADD `button_link` VARCHAR(255) NULL'
            );
        }

        return (bool) $ok;
    }

    /**
     * Grupa „Coody” w menu BO — tworzy tylko gdy nie istnieje.
     * Root musi mieć pustą ikonę: new-theme nav_bar.tpl przy icon != ''
     * renderuje jedną zakładkę bez dzieci (submenu znika).
     */
    public function ensureAdminCoodyParentTab(): bool
    {
        $id = (int) Tab::getIdFromClassName('AdminCoody');
        if ($id > 0) {
            $existing = new Tab($id);
            if (Validate::isLoadedObject($existing) && (string) $existing->icon !== '') {
                $existing->icon = '';
                $existing->update();
            }

            return true;
        }

        $tab = new Tab();
        $tab->active = 1;
        $tab->class_name = 'AdminCoody';
        $tab->id_parent = 0;
        if (Module::isInstalled('ds_checkout')) {
            $tab->module = 'ds_checkout';
        } else {
            $tab->module = $this->name;
        }
        $tab->icon = '';

        foreach (Language::getLanguages(false) as $lang) {
            $tab->name[(int) $lang['id_lang']] = 'Coody';
        }

        return (bool) $tab->add();
    }

    public function updateSliderTab(int $tabId, int $parentId): bool
    {
        // BC for older upgrades — rebuild full submenu instead.
        unset($tabId, $parentId);

        return $this->ensureSliderSubmenuTabs();
    }

    private function uninstallTab(): bool
    {
        $ok = true;
        foreach (['AdminCoodyHomeSlider', 'AdminCoodyHomeSliderConfig', 'AdminCoodyHomeSliderParent'] as $className) {
            $tabId = (int) Tab::getIdFromClassName($className);
            if ($tabId <= 0) {
                continue;
            }
            $ok = (bool) (new Tab($tabId))->delete() && $ok;
        }

        return $ok;
    }

    /**
     * Ustawia moduł na pierwszej pozycji wskazanego hooka (per sklep).
     */
    public function ensureFrontHooks(): bool
    {
        $idModule = (int) $this->id;
        if ($idModule <= 0) {
            return false;
        }

        $this->unregisterHook('displayHome');
        $this->registerHook('displayHeader');
        $this->registerHook('displayWrapperTop');
        $this->registerHook('displayHomeTop');
        $this->registerHook('displayHomeSliders');

        $ok = true;
        foreach (['displayHomeSliders', 'displayWrapperTop', 'displayHomeTop'] as $hookName) {
            if ((int) Hook::getIdByName($hookName) > 0) {
                $ok = $this->moveToHookTop($hookName) && $ok;
            }
        }

        return $ok;
    }

    private function moveToHookTop(string $hookName): bool
    {
        $idHook = (int) Hook::getIdByName($hookName);
        $idModule = (int) $this->id;

        if ($idHook <= 0 || $idModule <= 0) {
            return true;
        }

        $shops = Shop::getContextListShopID();
        foreach ($shops as $idShop) {
            $idShop = (int) $idShop;
            Db::getInstance()->execute(
                'UPDATE `' . _DB_PREFIX_ . 'hook_module`
                SET `position` = `position` + 1
                WHERE `id_hook` = ' . $idHook . ' AND `id_shop` = ' . $idShop . ' AND `id_module` != ' . $idModule
            );
            Db::getInstance()->update(
                'hook_module',
                ['position' => 0],
                'id_hook = ' . $idHook . ' AND id_shop = ' . $idShop . ' AND id_module = ' . $idModule
            );
        }

        return true;
    }
}
