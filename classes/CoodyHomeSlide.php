<?php
/**
 * @author    coody.it
 * @copyright 2026 coody.it
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class CoodyHomeSlide extends ObjectModel
{
    /** Lang fields copied by duplicate. Cały slajd (warstwy + grafiki) jest osobny dla każdego języka. */
    public const LANG_FIELDS = [
        'title', 'description', 'url', 'legend', 'image', 'image_mobile', 'button_title', 'button_link', 'layers',
    ];

    public $active = true;
    public $position = 0;

    /** @var string|array JSON warstw (CoodyHomeSlideLayers), per język */
    public $layers;

    /** @var string */
    public $title;

    /** @var string */
    public $description;

    /** @var string */
    public $url;

    /** @var string */
    public $legend;

    /** @var string */
    public $image;

    /** @var string */
    public $image_mobile;

    /** @var string */
    public $button_title;

    /** @var string */
    public $button_link;

    public static $definition = [
        'table' => 'coody_homeslider_slide',
        'primary' => 'id_coody_homeslider_slide',
        'multilang' => true,
        'fields' => [
            'active' => ['type' => self::TYPE_BOOL, 'validate' => 'isBool', 'required' => true],
            'position' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedInt', 'required' => true],
            'title' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isGenericName', 'size' => 255],
            'description' => ['type' => self::TYPE_HTML, 'lang' => true, 'validate' => 'isCleanHtml', 'size' => 4000],
            'url' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isUrl', 'size' => 255],
            'legend' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isGenericName', 'size' => 255],
            'image' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isGenericName', 'size' => 255],
            'image_mobile' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isGenericName', 'size' => 255],
            'button_title' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isGenericName', 'size' => 255],
            'button_link' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isUrl', 'size' => 255],
            // JSON — normalizowany przez CoodyHomeSlideLayers przed zapisem; TYPE_HTML, żeby pSQL nie wycinał znaków < >.
            'layers' => ['type' => self::TYPE_HTML, 'lang' => true, 'validate' => 'isString', 'size' => 65000],
        ],
    ];

    public function add($autoDate = true, $nullValues = false)
    {
        $context = Context::getContext();
        $idShop = (int) $context->shop->id;

        if ((int) $this->position <= 0) {
            $this->position = (int) Db::getInstance()->getValue(
                'SELECT IFNULL(MAX(s.`position`), -1) + 1
                FROM `' . _DB_PREFIX_ . 'coody_homeslider_slide` s
                INNER JOIN `' . _DB_PREFIX_ . 'coody_homeslider` hs
                    ON hs.`id_coody_homeslider_slide` = s.`id_coody_homeslider_slide`
                WHERE hs.`id_shop` = ' . $idShop
            );
        }

        $result = parent::add($autoDate, $nullValues);

        if ($result && $idShop > 0) {
            $result &= Db::getInstance()->insert('coody_homeslider', [
                'id_shop' => $idShop,
                'id_coody_homeslider_slide' => (int) $this->id,
            ]);
        }

        return (bool) $result;
    }

    public function delete()
    {
        $context = Context::getContext();
        $idShop = (int) $context->shop->id;

        $this->deleteImageFiles();
        $result = Db::getInstance()->delete(
            'coody_homeslider',
            'id_coody_homeslider_slide = ' . (int) $this->id
        );

        $result = $result && parent::delete();

        if ($result) {
            self::normalizePositions($idShop);
        }

        return $result;
    }

    /**
     * PrestaShop BO displays position as (db_value + 1), so positions are stored from 0.
     */
    public static function normalizePositions(?int $idShop = null): void
    {
        $idShop = $idShop ?? (int) Context::getContext()->shop->id;
        if ($idShop <= 0) {
            return;
        }

        $rows = Db::getInstance()->executeS(
            'SELECT s.`id_coody_homeslider_slide`
            FROM `' . _DB_PREFIX_ . 'coody_homeslider_slide` s
            INNER JOIN `' . _DB_PREFIX_ . 'coody_homeslider` hs
                ON hs.`id_coody_homeslider_slide` = s.`id_coody_homeslider_slide`
            WHERE hs.`id_shop` = ' . (int) $idShop . '
            ORDER BY s.`position` ASC, s.`id_coody_homeslider_slide` ASC'
        );

        if (!is_array($rows)) {
            return;
        }

        foreach ($rows as $position => $row) {
            Db::getInstance()->update(
                'coody_homeslider_slide',
                ['position' => (int) $position],
                'id_coody_homeslider_slide = ' . (int) $row['id_coody_homeslider_slide']
            );
        }
    }

    protected function deleteImageFiles(): void
    {
        $imgDir = _PS_MODULE_DIR_ . 'coody_homeslider/img/';
        $images = array_merge(
            is_array($this->image) ? $this->image : [],
            is_array($this->image_mobile) ? $this->image_mobile : []
        );

        foreach (array_unique(array_filter($images)) as $file) {
            $path = $imgDir . $file;
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}
