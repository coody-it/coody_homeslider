<?php
/**
 * Warstwy slajdu (tekst, przycisk, obraz, kształt) — normalizacja danych z edytora BO
 * i przygotowanie do renderu na froncie.
 *
 * Format JSON (pole `layers` w coody_homeslider_slide_lang):
 * {
 *   "v": 1,
 *   "scrim": {"d": "left", "m": "bottom", "color": "#0b1226", "strength": 70},
 *   "layers": [{
 *     "id": "l1", "type": "text|button|image|shape",
 *     "text": "...", "link": "...", "newtab": false, "src": "plik.png", "alt": "...",
 *     "variant": "primary|light|outline|link", "arrow": true,
 *     "style": {"color": "#fff", "bg": "#1d2f67", "bgOpacity": 100, "opacity": 100, "weight": 700,
 *               "upper": false, "spacing": 0, "lh": 1.1, "align": "left", "shadow": false,
 *               "radius": 0, "blur": 0, "decor": "none"},
 *     "d": {"x": 6, "y": 30, "w": 45, "h": 0, "fs": 52, "hide": false},
 *     "m": {"x": 6, "y": 50, "w": 88, "h": 0, "fs": 26, "hide": false},
 *     "anim": {"type": "up", "delay": 200, "dur": 800}
 *   }]
 * }
 *
 * Pozycje i wymiary w % slajdu, rozmiar tekstu w px przy szerokości referencyjnej
 * (komputer 1296 px, telefon 375 px) — front skaluje go jednostkami cqi.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class CoodyHomeSlideLayers
{
    public const VERSION = 1;
    public const MAX_LAYERS = 20;

    public const TYPES = ['text', 'button', 'image', 'shape'];
    public const BUTTON_VARIANTS = ['primary', 'light', 'outline', 'link'];
    public const ALIGNS = ['left', 'center', 'right'];
    public const DECORS = ['none', 'line'];
    public const ANIMS = ['none', 'fade', 'up', 'down', 'left', 'right', 'zoom'];
    public const SCRIMS = ['none', 'left', 'right', 'bottom', 'top', 'full'];
    public const WEIGHTS = [300, 400, 500, 600, 700, 800];

    public const IMAGE_DIR = 'img/layers/';

    /**
     * @return array<string, mixed>
     */
    public static function empty(): array
    {
        return [
            'v' => self::VERSION,
            'scrim' => ['d' => 'none', 'm' => 'none', 'color' => '#0b1226', 'strength' => 70],
            'layers' => [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function decode(?string $json): array
    {
        if ($json === null || trim($json) === '') {
            return self::empty();
        }

        $data = json_decode($json, true);

        return is_array($data) ? self::normalize($data) : self::empty();
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function encode(array $data): string
    {
        return (string) json_encode(self::normalize($data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Whitelist + zakresy. Wszystko, czego nie znamy, jest odrzucane.
     *
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public static function normalize(array $data): array
    {
        $scrim = is_array($data['scrim'] ?? null) ? $data['scrim'] : [];
        $out = [
            'v' => self::VERSION,
            'scrim' => [
                'd' => self::oneOf($scrim['d'] ?? 'none', self::SCRIMS, 'none'),
                'm' => self::oneOf($scrim['m'] ?? 'none', self::SCRIMS, 'none'),
                'color' => self::color($scrim['color'] ?? '', '#0b1226'),
                'strength' => self::int($scrim['strength'] ?? 70, 0, 100),
            ],
            'layers' => [],
        ];

        $layers = is_array($data['layers'] ?? null) ? array_values($data['layers']) : [];
        $ids = [];

        foreach (array_slice($layers, 0, self::MAX_LAYERS) as $index => $layer) {
            if (!is_array($layer)) {
                continue;
            }

            $type = self::oneOf($layer['type'] ?? '', self::TYPES, '');
            if ($type === '') {
                continue;
            }

            $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($layer['id'] ?? ''));
            if ($id === '' || isset($ids[$id])) {
                $id = 'l' . ($index + 1) . substr(md5((string) mt_rand()), 0, 4);
            }
            $ids[$id] = true;

            $style = is_array($layer['style'] ?? null) ? $layer['style'] : [];
            $anim = is_array($layer['anim'] ?? null) ? $layer['anim'] : [];

            $item = [
                'id' => $id,
                'type' => $type,
                'text' => self::text($layer['text'] ?? '', $type === 'button' ? 80 : 400),
                'link' => self::link($layer['link'] ?? ''),
                'newtab' => !empty($layer['newtab']),
                'src' => self::fileName($layer['src'] ?? ''),
                'alt' => self::text($layer['alt'] ?? '', 160),
                'variant' => self::oneOf($layer['variant'] ?? 'primary', self::BUTTON_VARIANTS, 'primary'),
                'arrow' => array_key_exists('arrow', $layer) ? !empty($layer['arrow']) : true,
                'style' => [
                    'color' => self::color($style['color'] ?? '', '#ffffff'),
                    'bg' => self::color($style['bg'] ?? '', ''),
                    'bgOpacity' => self::int($style['bgOpacity'] ?? 100, 0, 100),
                    'opacity' => self::int($style['opacity'] ?? 100, 0, 100),
                    'weight' => self::weight($style['weight'] ?? 400),
                    'upper' => !empty($style['upper']),
                    'italic' => !empty($style['italic']),
                    'spacing' => self::float($style['spacing'] ?? 0, -0.1, 0.5, 3),
                    'lh' => self::float($style['lh'] ?? 1.2, 0.8, 2.5, 2),
                    'align' => self::oneOf($style['align'] ?? 'left', self::ALIGNS, 'left'),
                    'shadow' => !empty($style['shadow']),
                    'radius' => self::int($style['radius'] ?? 0, 0, 999),
                    'blur' => self::int($style['blur'] ?? 0, 0, 40),
                    'decor' => self::oneOf($style['decor'] ?? 'none', self::DECORS, 'none'),
                ],
                'd' => self::geometry($layer['d'] ?? [], 52),
                'm' => self::geometry($layer['m'] ?? ($layer['d'] ?? []), 26),
                'anim' => [
                    'type' => self::oneOf($anim['type'] ?? 'up', self::ANIMS, 'up'),
                    'delay' => self::int($anim['delay'] ?? 0, 0, 6000),
                    'dur' => self::int($anim['dur'] ?? 800, 100, 4000),
                ],
            ];

            if ($type === 'image' && $item['src'] === '') {
                continue;
            }

            // Obraz i kształt muszą mieć szerokość (i kształt wysokość) w %, inaczej nie skalują się ze slajdem.
            if ($type === 'image' || $type === 'shape') {
                foreach (['d' => 20, 'm' => 40] as $device => $defaultWidth) {
                    if ($item[$device]['w'] <= 0) {
                        $item[$device]['w'] = $defaultWidth;
                    }
                    if ($type === 'shape' && $item[$device]['h'] <= 0) {
                        $item[$device]['h'] = 30;
                    }
                }
            }

            $out['layers'][] = $item;
        }

        return $out;
    }

    /**
     * Dane do szablonu: gotowe klasy, style inline (tylko zmienne CSS) i treść.
     *
     * @param array<string, mixed> $data znormalizowane dane
     *
     * @return array<string, mixed>
     */
    public static function toFront(array $data, string $imageBaseUrl): array
    {
        $scrim = $data['scrim'];
        $rgb = self::hexToRgb($scrim['color']);
        $layers = [];

        foreach ($data['layers'] as $layer) {
            if ($layer['type'] !== 'image' && $layer['type'] !== 'shape' && trim($layer['text']) === '') {
                continue;
            }

            $classes = ['chs-layer', 'chs-layer--' . $layer['type'], 'chs-anim--' . $layer['anim']['type']];
            if ($layer['type'] === 'button') {
                $classes[] = 'chs-btn--' . $layer['variant'];
            }
            if ($layer['d']['hide']) {
                $classes[] = 'chs-layer--hide-d';
            }
            if ($layer['m']['hide']) {
                $classes[] = 'chs-layer--hide-m';
            }
            if ($layer['style']['upper']) {
                $classes[] = 'chs-layer--upper';
            }
            if ($layer['style']['italic']) {
                $classes[] = 'chs-layer--italic';
            }
            if ($layer['style']['shadow']) {
                $classes[] = 'chs-layer--shadow';
            }
            if ($layer['style']['decor'] === 'line' && $layer['type'] === 'text') {
                $classes[] = 'chs-layer--decor-line';
            }
            if ($layer['style']['bg'] !== '' && $layer['type'] === 'text') {
                $classes[] = 'chs-layer--boxed';
            }

            $layers[] = [
                'type' => $layer['type'],
                'class' => implode(' ', $classes),
                'style' => self::styleVars($layer),
                'html' => nl2br(htmlspecialchars($layer['text'], ENT_QUOTES, 'UTF-8'), false),
                'text' => $layer['text'],
                'link' => $layer['link'],
                'newtab' => $layer['newtab'],
                'arrow' => $layer['arrow'] && in_array($layer['variant'], ['primary', 'light', 'link'], true),
                'src' => $layer['src'] !== '' ? $imageBaseUrl . rawurlencode($layer['src']) : '',
                'alt' => $layer['alt'],
            ];
        }

        return [
            'scrim_d' => $scrim['d'],
            'scrim_m' => $scrim['m'],
            'scrim_style' => '--chs-scrim:' . $rgb . ';--chs-scrim-a:' . round($scrim['strength'] / 100, 2) . ';',
            'layers' => $layers,
        ];
    }

    /**
     * Stary napis (nazwa jako tytuł, opis, przycisk) → warstwy. Używane przy upgradzie do 1.1.0.
     *
     * @return array<string, mixed>
     */
    public static function fromLegacy(string $heading, string $descriptionHtml, string $buttonTitle, string $buttonLink): array
    {
        $data = self::empty();
        $description = trim(html_entity_decode(strip_tags(str_replace(['</p>', '<br>', '<br />', '<br/>'], "\n", $descriptionHtml)), ENT_QUOTES, 'UTF-8'));
        $description = trim((string) preg_replace("/\n{2,}/", "\n", $description));

        if ($heading === '' && $description === '' && ($buttonTitle === '' || $buttonLink === '')) {
            return $data;
        }

        $data['scrim'] = ['d' => 'left', 'm' => 'bottom', 'color' => '#0b1226', 'strength' => 70];
        $y = 28;

        if ($heading !== '') {
            $data['layers'][] = [
                'id' => 'heading', 'type' => 'text', 'text' => $heading,
                'style' => ['color' => '#ffffff', 'weight' => 700, 'lh' => 1.08, 'spacing' => -0.02],
                'd' => ['x' => 6, 'y' => $y, 'w' => 45, 'fs' => 52],
                'm' => ['x' => 6, 'y' => 40, 'w' => 88, 'fs' => 24],
                'anim' => ['type' => 'up', 'delay' => 150, 'dur' => 800],
            ];
            $y += 26;
        }
        if ($description !== '') {
            $data['layers'][] = [
                'id' => 'text', 'type' => 'text', 'text' => $description,
                'style' => ['color' => '#ffffff', 'weight' => 400, 'lh' => 1.55, 'opacity' => 90],
                'd' => ['x' => 6, 'y' => $y, 'w' => 38, 'fs' => 18],
                'm' => ['x' => 6, 'y' => 62, 'w' => 88, 'fs' => 14, 'hide' => true],
                'anim' => ['type' => 'up', 'delay' => 300, 'dur' => 800],
            ];
            $y += 16;
        }
        if ($buttonTitle !== '' && $buttonLink !== '') {
            $data['layers'][] = [
                'id' => 'button', 'type' => 'button', 'text' => $buttonTitle, 'link' => $buttonLink,
                'variant' => 'light', 'arrow' => true,
                'style' => ['color' => '#1d2f67', 'bg' => '#ffffff', 'weight' => 600, 'radius' => 999],
                'd' => ['x' => 6, 'y' => min(80, $y + 4), 'w' => 0, 'fs' => 16],
                'm' => ['x' => 6, 'y' => 76, 'w' => 0, 'fs' => 14],
                'anim' => ['type' => 'up', 'delay' => 450, 'dur' => 800],
            ];
        }

        return self::normalize($data);
    }

    /**
     * @param array<string, mixed> $layer
     */
    private static function styleVars(array $layer): string
    {
        $vars = [];
        foreach (['d' => '', 'm' => 'm'] as $device => $suffix) {
            $g = $layer[$device];
            $vars['--x' . $suffix] = $g['x'] . '%';
            $vars['--y' . $suffix] = $g['y'] . '%';
            $vars['--w' . $suffix] = $g['w'] > 0 ? $g['w'] . '%' : 'max-content';
            $vars['--h' . $suffix] = $g['h'] > 0 ? $g['h'] . '%' : 'auto';
            $vars['--fs' . $suffix] = (string) $g['fs'];
        }

        $s = $layer['style'];
        $vars['--c'] = $s['color'];
        $vars['--op'] = (string) round($s['opacity'] / 100, 2);
        $vars['--fw'] = (string) $s['weight'];
        $vars['--ls'] = $s['spacing'] . 'em';
        $vars['--lh'] = (string) $s['lh'];
        $vars['--ta'] = $s['align'];
        $vars['--r'] = (string) $s['radius'];
        $vars['--blur'] = $s['blur'] . 'px';
        $vars['--delay'] = $layer['anim']['delay'] . 'ms';
        $vars['--dur'] = $layer['anim']['dur'] . 'ms';

        if ($s['bg'] !== '') {
            $vars['--bg'] = 'rgb(' . self::hexToRgb($s['bg']) . ' / ' . round($s['bgOpacity'] / 100, 2) . ')';
        }

        $css = '';
        foreach ($vars as $name => $value) {
            $css .= $name . ':' . $value . ';';
        }

        return $css;
    }

    /**
     * @param mixed $g
     *
     * @return array<string, mixed>
     */
    private static function geometry($g, int $defaultFs): array
    {
        $g = is_array($g) ? $g : [];

        return [
            'x' => self::float($g['x'] ?? 6, -50, 150, 2),
            'y' => self::float($g['y'] ?? 30, -50, 150, 2),
            'w' => self::float($g['w'] ?? 0, 0, 100, 2),
            'h' => self::float($g['h'] ?? 0, 0, 100, 2),
            'fs' => self::int($g['fs'] ?? $defaultFs, 6, 200),
            'hide' => !empty($g['hide']),
        ];
    }

    /**
     * @param mixed $value
     * @param array<int, string> $allowed
     */
    private static function oneOf($value, array $allowed, string $default): string
    {
        $value = (string) $value;

        return in_array($value, $allowed, true) ? $value : $default;
    }

    /**
     * @param mixed $value
     */
    private static function int($value, int $min, int $max): int
    {
        return max($min, min($max, (int) round((float) $value)));
    }

    /**
     * @param mixed $value
     */
    private static function float($value, float $min, float $max, int $precision): float
    {
        return round(max($min, min($max, (float) $value)), $precision);
    }

    /**
     * @param mixed $value
     */
    private static function weight($value): int
    {
        $value = (int) $value;
        $closest = 400;
        foreach (self::WEIGHTS as $weight) {
            if (abs($weight - $value) < abs($closest - $value)) {
                $closest = $weight;
            }
        }

        return $closest;
    }

    /**
     * @param mixed $value
     */
    private static function color($value, string $default): string
    {
        $value = trim((string) $value);

        return preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? strtolower($value) : $default;
    }

    /**
     * @param mixed $value
     */
    private static function text($value, int $max): string
    {
        $value = str_replace(["\r\n", "\r"], "\n", (string) $value);
        $value = (string) preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $value);

        return Tools::substr($value, 0, $max);
    }

    /**
     * Pełny URL http(s), adres względny lub kotwica. Inne schematy (javascript: itd.) odrzucone.
     *
     * @param mixed $value
     */
    private static function link($value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }
        if (preg_match('#^(https?://|/|\#|\?)#i', $value) && Validate::isUrl($value)) {
            return Tools::substr($value, 0, 500);
        }
        if (preg_match('#^https?://#i', $value) && Validate::isAbsoluteUrl($value)) {
            return Tools::substr($value, 0, 500);
        }

        return '';
    }

    /**
     * @param mixed $value
     */
    private static function fileName($value): string
    {
        $value = basename((string) $value);

        return $value !== '' && Validate::isFileName($value) && preg_match('/\.(jpe?g|png|gif|webp)$/i', $value) ? $value : '';
    }

    private static function hexToRgb(string $hex): string
    {
        $hex = ltrim($hex, '#');

        return hexdec(substr($hex, 0, 2)) . ' ' . hexdec(substr($hex, 2, 2)) . ' ' . hexdec(substr($hex, 4, 2));
    }
}
