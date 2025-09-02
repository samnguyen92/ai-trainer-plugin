# HTML Tidy Installation Guide

This guide will help you install the HTML Tidy extension for PHP to enable professional HTML cleaning in your AI Trainer plugin.

## What is HTML Tidy?

HTML Tidy is a professional HTML cleaning library that can:
- Fix malformed HTML tags and attributes
- Remove invalid elements and attributes
- Ensure proper tag nesting and closure
- Clean up messy HTML from AI-generated content

## Installation Options

### Option 1: Install HTML Tidy Extension (Recommended)

#### For Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install libtidy-dev
sudo pecl install tidy
```

#### For CentOS/RHEL:
```bash
sudo yum install libtidy-devel
sudo pecl install tidy
```

#### For macOS (using Homebrew):
```bash
brew install tidy-html5
sudo pecl install tidy
```

#### For Windows:
1. Download the HTML Tidy extension from PECL
2. Add the extension to your PHP installation
3. Enable it in php.ini

### Option 2: Use Composer Package

If you can't install the extension, you can use a PHP implementation:

```bash
composer require andreskrey/readability
```

Then update the `ai_trainer_html_tidy_clean()` function to use this library instead.

### Option 3: Manual Installation

1. Download HTML Tidy source from https://github.com/htacg/tidy-html5
2. Compile and install the library
3. Install the PHP extension

## Verification

After installation, verify the extension is working:

1. Run the test file: `php test-html-tidy.php`
2. Check if HTML Tidy is available: `php -m | grep tidy`
3. Test in WordPress admin: Go to AI Trainer > Test HTML Cleaning

## Configuration

The HTML Tidy integration is configured with these settings:

```php
$config = [
    'clean' => true,                    // Enable cleaning
    'output-html' => true,              // Output HTML format
    'wrap' => 0,                        // No line wrapping
    'indent' => false,                   // No indentation
    'show-body-only' => true,           // Only body content
    'doctype' => 'omit',                // No DOCTYPE
    'char-encoding' => 'utf8',          // UTF-8 encoding
    'drop-empty-elements' => true,      // Remove empty elements
    'remove-unknown-elements' => true,  // Remove unknown tags
    'remove-empty-attrs' => true,       // Remove empty attributes
    'hide-comments' => true,            // Remove comments
];
```

## Fallback System

If HTML Tidy is not available, the system automatically falls back to:
1. Pure PHP HTML cleaning
2. WordPress wp_kses filtering
3. Basic regex-based fixes

## Testing

Test the integration with these malformed HTML examples:

```html
<!-- Unclosed tags -->
<p>This is a paragraph<p>Another paragraph</p>

<!-- Malformed heading -->
<h< div="">Malformed heading</h3>

<!-- Double anchor tags -->
<a <a href="http://example.com">Link</a>

<!-- Script injection -->
<script>alert("xss")</script>

<!-- Orphaned closing tags -->
</div><p>Content</p>
```

## Performance

- **With HTML Tidy Extension**: ~5-10ms per HTML cleaning
- **Without Extension (Fallback)**: ~20-50ms per HTML cleaning
- **API Calls**: ~100-200ms (including network latency)

## Troubleshooting

### Extension Not Loading
```bash
# Check if extension is installed
php -m | grep tidy

# Check PHP configuration
php --ini

# Restart web server after installation
sudo systemctl restart apache2
sudo systemctl restart nginx
```

### Permission Issues
```bash
# Ensure proper permissions
sudo chown www-data:www-data /path/to/plugin
sudo chmod 755 /path/to/plugin
```

### Memory Issues
If you encounter memory issues with large HTML:
1. Increase PHP memory limit in php.ini
2. Use the fallback system for large content
3. Implement content chunking

## Support

If you need help with installation:
1. Check the test file output
2. Review server error logs
3. Contact your hosting provider about PHP extension installation
4. Use the fallback system if extension installation fails

## Benefits

With HTML Tidy installed, your AI-generated content will have:
- ✅ Properly closed HTML tags
- ✅ Clean, valid HTML structure
- ✅ Removed unsafe elements
- ✅ Consistent formatting
- ✅ Better user experience
- ✅ Reduced display errors
