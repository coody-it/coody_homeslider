<?php
/**
 * @author    coody.it
 * @copyright 2026 coody.it
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

require_once _PS_MODULE_DIR_ . 'coody_homeslider/classes/CoodyHomeSlide.php';
require_once _PS_MODULE_DIR_ . 'coody_homeslider/classes/CoodyHomeSlideLayers.php';

class AdminCoodyHomeSliderController extends ModuleAdminController
{
    /** @var string */
    private $slideImageDir;

    public function __construct()
    {
        $this->bootstrap = true;
        $this->table = 'coody_homeslider_slide';
        $this->className = 'CoodyHomeSlide';
        $this->lang = true;
        $this->identifier = 'id_coody_homeslider_slide';
        $this->_defaultOrderBy = 'position';
        $this->_defaultOrderWay = 'ASC';
        $this->position_identifier = 'id_coody_homeslider_slide';
        $this->slideImageDir = _PS_MODULE_DIR_ . 'coody_homeslider/img/';

        parent::__construct();

        // Must be set after parent::__construct() — AdminController overwrites tpl_folder from controller name.
        $this->tpl_folder = '_configure/';
    }

    public function initProcess()
    {
        parent::initProcess();

        if (isset($_GET['duplicate' . $this->table]) && (int) Tools::getValue($this->identifier) > 0) {
            if ($this->access('add')) {
                $this->action = 'duplicate';
            } else {
                $this->errors[] = $this->trans('You do not have permission to add this.', [], 'Admin.Notifications.Error');
            }
        }
    }

    public function processDuplicate()
    {
        $idSlide = (int) Tools::getValue($this->identifier);
        $source = new CoodyHomeSlide($idSlide);

        if (!Validate::isLoadedObject($source)) {
            $this->errors[] = $this->trans('An error occurred while loading the object.', [], 'Admin.Notifications.Error');

            return false;
        }

        $duplicate = new CoodyHomeSlide();
        $duplicate->active = (bool) $source->active;
        $duplicate->position = 0;

        foreach (Language::getLanguages(false) as $language) {
            $idLang = (int) $language['id_lang'];

            foreach (CoodyHomeSlide::LANG_FIELDS as $field) {
                $values = $source->{$field};
                if (is_array($values) && isset($values[$idLang])) {
                    if (!is_array($duplicate->{$field})) {
                        $duplicate->{$field} = [];
                    }
                    $duplicate->{$field}[$idLang] = $values[$idLang];
                }
            }
        }

        if (!$duplicate->add()) {
            $this->errors[] = $this->trans('An error occurred while creating an object.', [], 'Admin.Notifications.Error');

            return false;
        }

        if (isset($this->module) && $this->module instanceof Coody_Homeslider) {
            $this->module->clearCache();
        }

        $this->redirect_after = self::$currentIndex . '&conf=19&token=' . $this->token;

        return $duplicate;
    }

    public function renderList()
    {
        $this->addRowAction('edit');
        $this->addRowAction('duplicate');
        $this->addRowAction('delete');

        $this->fields_list = [
            'id_coody_homeslider_slide' => [
                'title' => $this->module->l('ID'),
                'align' => 'center',
                'class' => 'fixed-width-xs',
            ],
            'image' => [
                'title' => $this->module->l('Obraz'),
                'align' => 'center',
                'callback' => 'displaySlideThumbnail',
                'orderby' => false,
                'filter' => false,
                'search' => false,
            ],
            'title' => [
                'title' => $this->module->l('Nazwa'),
            ],
            'position' => [
                'title' => $this->module->l('Pozycja'),
                'align' => 'center',
                'class' => 'fixed-width-xs',
                'position' => 'position',
            ],
            'active' => [
                'title' => $this->module->l('Aktywny'),
                'active' => 'status',
                'type' => 'bool',
                'align' => 'center',
                'class' => 'fixed-width-xs',
            ],
        ];

        return parent::renderList();
    }

    public function displaySlideThumbnail(string $value): string
    {
        if ($value === '') {
            return '-';
        }

        $url = __PS_BASE_URI__ . 'modules/coody_homeslider/img/' . rawurlencode($value);

        return '<img src="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" alt="" class="img-thumbnail" style="max-width:90px;height:auto;" />';
    }

    public function getTemplateFormVars()
    {
        return array_merge(parent::getTemplateFormVars(), [
            'image_baseurl' => __PS_BASE_URI__ . 'modules/coody_homeslider/img/',
            'chs_preview' => $this->getPreviewConfig(),
            'chs_slide' => $this->getSlideFieldValues(),
        ]);
    }

    /**
     * Pola slajdu (grafiki, aktywność, nazwa, link, alt) wyświetlane w panelu „Slajd” edytora.
     * Po błędzie walidacji pokazujemy wartości z POST.
     *
     * @return array<string, mixed>
     */
    private function getSlideFieldValues(): array
    {
        $object = $this->object && Validate::isLoadedObject($this->object) ? $this->object : null;
        $values = [
            'active' => (int) Tools::getValue('active', $object ? (int) $object->active : 1),
            'langs' => [],
        ];

        foreach (Language::getLanguages(false) as $language) {
            $idLang = (int) $language['id_lang'];
            $row = [];
            foreach (['title', 'url', 'legend'] as $field) {
                $current = $object && is_array($object->{$field}) ? (string) ($object->{$field}[$idLang] ?? '') : '';
                $row[$field] = (string) Tools::getValue($field . '_' . $idLang, $current);
            }
            foreach (['image', 'image_mobile'] as $field) {
                $row[$field] = $object && is_array($object->{$field}) ? (string) ($object->{$field}[$idLang] ?? '') : '';
            }
            $values['langs'][$idLang] = $row;
        }

        return $values;
    }

    public function setMedia($isNewTheme = false)
    {
        parent::setMedia($isNewTheme);

        if ($this->display === 'add' || $this->display === 'edit' || Tools::getIsset('add' . $this->table) || Tools::getIsset('update' . $this->table)) {
            $base = _MODULE_DIR_ . 'coody_homeslider/views/';
            $dir = _PS_MODULE_DIR_ . 'coody_homeslider/views/';
            // Wersja = data modyfikacji pliku, żeby przeglądarka nie trzymała starego edytora.
            $version = static function (string $file) use ($dir): string {
                return '?v=' . (int) @filemtime($dir . $file);
            };
            $this->addCSS($base . 'css/front.css' . $version('css/front.css'), 'all', null, false);
            $this->addCSS($base . 'css/admin-slide.css' . $version('css/admin-slide.css'), 'all', null, false);
            $this->addJS($base . 'js/admin-slide.js' . $version('js/admin-slide.js'), false);
        }
    }

    /**
     * Ustawienia globalne potrzebne podglądowi (układ, akcent, nawigacja).
     *
     * @return array<string, mixed>
     */
    private function getPreviewConfig(): array
    {
        /** @var Coody_Homeslider $module */
        $module = $this->module;
        $accent = $module->normalizeAccent((string) Configuration::get(Coody_Homeslider::CONFIG_ACCENT));

        $activeSlides = (int) Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'coody_homeslider_slide` WHERE `active` = 1'
        );

        return [
            'layout' => $module->normalizeLayout((string) Configuration::get(Coody_Homeslider::CONFIG_LAYOUT)),
            'accent' => $accent,
            'accent_contrast' => $module->getContrastColor($accent),
            'has_nav' => $activeSlides > 1 && !(int) Configuration::get(Coody_Homeslider::CONFIG_NAV_ARROWS_DOTS),
            'config_url' => $this->context->link->getAdminLink('AdminCoodyHomeSliderConfig'),
            'upload_url' => $this->context->link->getAdminLink('AdminCoodyHomeSlider') . '&ajax=1&action=uploadLayerImage',
            'layer_image_base' => __PS_BASE_URI__ . 'modules/coody_homeslider/' . CoodyHomeSlideLayers::IMAGE_DIR,
        ];
    }

    public function renderForm()
    {
        if ($this->object && Validate::isLoadedObject($this->object)) {
            $this->fields_value['image'] = $this->object->image;
            $this->fields_value['image_mobile'] = $this->object->image_mobile;
        }

        $layersValue = [];
        foreach (Language::getLanguages(false) as $language) {
            $idLang = (int) $language['id_lang'];
            $raw = Tools::getValue('layers_' . $idLang, null);
            if ($raw === null && $this->object && Validate::isLoadedObject($this->object) && is_array($this->object->layers)) {
                $raw = $this->object->layers[$idLang] ?? '';
            }
            $layersValue[$idLang] = CoodyHomeSlideLayers::encode(CoodyHomeSlideLayers::decode((string) $raw));
        }
        $this->fields_value['layers'] = $layersValue;

        $this->fields_form = [
            'legend' => [
                'title' => $this->module->l('Slajd'),
                'icon' => 'icon-picture',
            ],
            'input' => [
                [
                    'type' => 'coody_layers',
                    'name' => 'layers',
                    'lang' => true,
                ],
            ],
            'submit' => [
                'title' => $this->module->l('Zapisz'),
            ],
            'buttons' => [
                'save-and-stay' => [
                    'title' => $this->module->l('Zapisz i zostań'),
                    'name' => 'submitAdd' . $this->table . 'AndStay',
                    'type' => 'submit',
                    'class' => 'btn btn-default pull-right',
                    'icon' => 'process-icon-save',
                ],
            ],
        ];

        return parent::renderForm();
    }

    protected function copyFromPost(&$object, $table)
    {
        if (Validate::isLoadedObject($object) && (int) $object->id > 0) {
            $existing = new CoodyHomeSlide((int) $object->id);
            if (Validate::isLoadedObject($existing)) {
                $object->image = $existing->image;
                $object->image_mobile = $existing->image_mobile;
            }
        }

        parent::copyFromPost($object, $table);

        // Warstwy: tylko znormalizowany JSON trafia do bazy.
        foreach (Language::getLanguages(false) as $language) {
            $idLang = (int) $language['id_lang'];
            $raw = Tools::getValue('layers_' . $idLang, null);
            if ($raw === null) {
                continue;
            }
            if (!is_array($object->layers)) {
                $object->layers = [];
            }
            $object->layers[$idLang] = CoodyHomeSlideLayers::encode(CoodyHomeSlideLayers::decode((string) $raw));
        }

        foreach (Language::getLanguages(false) as $language) {
            $idLang = (int) $language['id_lang'];

            foreach (['image', 'image_mobile'] as $field) {
                $oldValue = Tools::getValue($field . '_old_' . $idLang);
                if ($oldValue !== '' && Validate::isFileName($oldValue)) {
                    if (!is_array($object->{$field})) {
                        $object->{$field} = [];
                    }
                    $object->{$field}[$idLang] = $oldValue;
                }
            }
        }
    }

    protected function postImage($id)
    {
        $object = new CoodyHomeSlide((int) $id);
        if (!Validate::isLoadedObject($object)) {
            $this->errors[] = $this->trans('Unable to load object.', [], 'Admin.Notifications.Error');

            return false;
        }

        $hasUpload = false;

        foreach (Language::getLanguages(false) as $language) {
            $idLang = (int) $language['id_lang'];

            foreach (['image', 'image_mobile'] as $field) {
                $fileKey = $field . '_' . $idLang;

                if (!isset($_FILES[$fileKey]) || empty($_FILES[$fileKey]['tmp_name'])) {
                    continue;
                }

                $filename = $this->uploadSlideImage($_FILES[$fileKey]);
                if ($filename === false) {
                    return false;
                }

                if (!is_array($object->{$field})) {
                    $object->{$field} = [];
                }

                $this->deleteSlideImageFile($object->{$field}[$idLang] ?? '');
                $object->{$field}[$idLang] = $filename;
                $hasUpload = true;
            }
        }

        if ($hasUpload && !$object->update()) {
            $this->errors[] = $this->trans('An error occurred while updating an object.', [], 'Admin.Notifications.Error');

            return false;
        }

        return !count($this->errors);
    }

  /**
     * @param array<string, mixed> $file
     */
    private function uploadSlideImage(array $file, ?string $targetDir = null, bool $withWebp = true): string|false
    {
        $targetDir = $targetDir ?? $this->slideImageDir;

        if ($error = ImageManager::validateUpload($file, Tools::getMaxUploadSize())) {
            $this->errors[] = $error;

            return false;
        }

        $extension = strtolower((string) pathinfo((string) $file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($extension, $allowed, true)) {
            $this->errors[] = $this->trans('Invalid image format.', [], 'Admin.Notifications.Error');

            return false;
        }

        if (!is_dir($targetDir) && !@mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            $this->errors[] = $this->trans('An error occurred while uploading the image.', [], 'Admin.Notifications.Error');

            return false;
        }

        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '-', basename((string) $file['name']));
        $destName = sha1(uniqid((string) mt_rand(), true)) . '_' . $safeName;
        $destPath = $targetDir . $destName;

        $tempName = tempnam(_PS_TMP_IMG_DIR_, 'PS');
        if (!$tempName || !move_uploaded_file($file['tmp_name'], $tempName)) {
            $this->errors[] = $this->trans('An error occurred while uploading the image.', [], 'Admin.Notifications.Error');

            return false;
        }

        // Obrazy warstw (logo, naklejki) zachowują format i przezroczystość; grafiki slajdu jak dotąd.
        $resized = $withWebp
            ? ImageManager::resize($tempName, $destPath)
            : ImageManager::resize($tempName, $destPath, null, null, $extension === 'jpeg' ? 'jpg' : $extension);

        if (!$resized) {
            @unlink($tempName);
            $this->errors[] = $this->trans('An error occurred while uploading the image.', [], 'Admin.Notifications.Error');

            return false;
        }

        // Keep a WebP sibling for front-office <picture> sources.
        if ($withWebp && !preg_match('/\.webp$/i', $destName)) {
            $webpName = (string) preg_replace('/\.(jpe?g|png|gif)$/i', '.webp', $destName);
            if ($webpName && $webpName !== $destName) {
                $webpPath = $targetDir . $webpName;
                $quality = (int) Configuration::get('PS_WEBP_QUALITY') ?: 80;
                ImageManager::resize($tempName, $webpPath, null, null, 'webp', false, $webpError, $tw, $th, $quality);
            }
        }

        @unlink($tempName);

        return $destName;
    }

    private function deleteSlideImageFile(string $filename): void
    {
        if ($filename === '' || !Validate::isFileName($filename)) {
            return;
        }

        $path = $this->slideImageDir . $filename;
        if (is_file($path)) {
            @unlink($path);
        }

        // Also remove generated WebP sibling, if any.
        if (!preg_match('/\.webp$/i', $filename)) {
            $webpName = (string) preg_replace('/\.(jpe?g|png|gif)$/i', '.webp', $filename);
            if ($webpName && $webpName !== $filename) {
                $webpPath = $this->slideImageDir . $webpName;
                if (is_file($webpPath)) {
                    @unlink($webpPath);
                }
            }
        }
    }

    public function postProcess()
    {
        parent::postProcess();

        if (Tools::isSubmit('submitAdd' . $this->table) || Tools::isSubmit('submitAdd' . $this->table . 'AndStay') || Tools::isSubmit('submitUpdate' . $this->table)) {
            if (isset($this->module) && $this->module instanceof Coody_Homeslider) {
                $this->module->clearCache();
            }
        }
    }

    public function processDelete()
    {
        $result = parent::processDelete();

        if ($result && isset($this->module) && $this->module instanceof Coody_Homeslider) {
            $this->module->clearCache();
        }

        return $result;
    }

    /**
     * Edytor warstw: upload obrazu warstwy (logo, naklejka). Zwraca nazwę pliku w img/layers/.
     */
    public function ajaxProcessUploadLayerImage()
    {
        header('Content-Type: application/json');

        if (!$this->access('edit') && !$this->access('add')) {
            $this->ajaxRender(json_encode(['success' => false, 'error' => $this->trans('You do not have permission to edit this.', [], 'Admin.Notifications.Error')]));

            return;
        }

        if (!isset($_FILES['file']) || empty($_FILES['file']['tmp_name'])) {
            $this->ajaxRender(json_encode(['success' => false, 'error' => $this->module->l('Nie wybrano pliku.')]));

            return;
        }

        $dir = _PS_MODULE_DIR_ . 'coody_homeslider/' . CoodyHomeSlideLayers::IMAGE_DIR;
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
            @copy(_PS_MODULE_DIR_ . 'coody_homeslider/img/index.php', $dir . 'index.php');
        }

        $filename = $this->uploadSlideImage($_FILES['file'], $dir, false);
        if ($filename === false) {
            $this->ajaxRender(json_encode(['success' => false, 'error' => implode(' ', $this->errors)]));

            return;
        }

        $size = @getimagesize($dir . $filename);

        $this->ajaxRender(json_encode([
            'success' => true,
            'file' => $filename,
            'url' => __PS_BASE_URI__ . 'modules/coody_homeslider/' . CoodyHomeSlideLayers::IMAGE_DIR . rawurlencode($filename),
            'width' => $size ? (int) $size[0] : 0,
            'height' => $size ? (int) $size[1] : 0,
        ]));
    }

    public function ajaxProcessUpdatePositions()
    {
        $positions = Tools::getValue('coody_homeslider_slide');
        if (!is_array($positions)) {
            $this->ajaxRender(json_encode(['hasError' => true]));

            return;
        }

        foreach ($positions as $position => $idSlide) {
            Db::getInstance()->update(
                'coody_homeslider_slide',
                ['position' => (int) $position],
                'id_coody_homeslider_slide = ' . (int) $idSlide
            );
        }

        if (isset($this->module) && $this->module instanceof Coody_Homeslider) {
            $this->module->clearCache();
        }

        $this->ajaxRender(json_encode(['hasError' => false]));
    }
}
