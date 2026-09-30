CREATE TABLE IF NOT EXISTS `PREFIX_coody_homeslider_slide` (
    `id_coody_homeslider_slide` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    `position` INT UNSIGNED NOT NULL DEFAULT 0,
    `date_add` DATETIME NULL,
    `date_upd` DATETIME NULL,
    PRIMARY KEY (`id_coody_homeslider_slide`)
) ENGINE=ENGINE_TYPE DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIX_coody_homeslider_slide_lang` (
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
    `layers` MEDIUMTEXT NULL,
    PRIMARY KEY (`id_coody_homeslider_slide`, `id_lang`)
) ENGINE=ENGINE_TYPE DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIX_coody_homeslider` (
    `id_coody_homeslider_slide` INT UNSIGNED NOT NULL,
    `id_shop` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id_coody_homeslider_slide`, `id_shop`)
) ENGINE=ENGINE_TYPE DEFAULT CHARSET=utf8mb4;
