# Psybrary Modern UI - Feature Documentation

## Overview
The Psybrary plugin has been updated with a modern, dark-themed user interface that provides an enhanced user experience similar to modern AI chat interfaces. This update includes new visual elements, improved functionality, and better user interactions.

## New Features

### 1. Modern Dark Theme
- **Background**: Deep dark theme (#0C0012) with subtle borders and shadows
- **Typography**: Improved font weights and spacing for better readability
- **Color Scheme**: Consistent use of white text with green accents (#3bb273)

### 2. Tabbed Interface
The new interface includes three main tabs:

#### Answer Tab (Default)
- Displays the main answer content
- Shows source cards with horizontal scrolling
- Contains the full response from the AI

#### Images Tab
- Placeholder for future image functionality
- Will display relevant images when implemented

#### Sources Tab
- Placeholder for detailed source information
- Will show expanded source details when implemented

### 3. Enhanced Source Cards
- **Horizontal Scrolling**: Smooth scrolling through multiple sources
- **Navigation Arrows**: Previous/Next buttons for easy navigation
- **Hover Effects**: Subtle animations and visual feedback
- **Responsive Design**: Adapts to different screen sizes

### 4. Action Buttons
New action buttons provide enhanced functionality:

#### Share Button
- Copies a shareable link to the clipboard
- Integrates with native sharing when available

#### Export Button
- Downloads the answer as a text file
- Includes question and answer content

#### Rewrite Button
- Regenerates the answer using AI
- Shows loading indicator during processing

### 5. Enhanced Reaction System
- **Like/Dislike**: Visual feedback with counts
- **Save**: Bookmark answers for later reference
- **More Options**: Dropdown with additional actions

### 6. Improved User Experience
- **Smooth Transitions**: CSS animations for tab switching
- **Loading States**: Visual indicators during processing
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Focus states and keyboard navigation

## Technical Implementation

### CSS Classes
The new UI uses the `.modern-ui` class as a wrapper for all modern styling:

```css
.modern-ui {
    background: #0C0012;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### JavaScript Functions
New functions have been added to handle the enhanced functionality:

- `createModernAnswerBlock()` - Creates the new tabbed interface
- `createModernSourceCards()` - Generates source cards with navigation
- `addModernReactionBar()` - Adds action buttons and reaction system
- `exportAnswer()` - Handles answer export functionality
- `rewriteAnswer()` - Manages answer regeneration
- `showMoreOptions()` - Displays additional action options

### Event Handling
The new interface includes comprehensive event handling for:
- Tab switching
- Source card navigation
- Action button interactions
- Reaction system
- Modal dialogs

## Usage

### Basic Implementation
To use the new modern UI, simply add the `modern-ui` class to your answer blocks:

```html
<div class="answer-block modern-ui">
    <!-- Content will automatically use modern styling -->
</div>
```

### Tab Switching
Users can click on any tab to switch between different content views:

```javascript
// Tab switching is handled automatically
$(document).on('click', '.tab-btn', function(e) {
    const tabName = $(this).data('tab');
    // Tab content switching logic
});
```

### Source Navigation
Source cards can be navigated using the arrow buttons:

```javascript
// Navigation is handled automatically
document.querySelectorAll('.slider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Scroll logic
    });
});
```

## Customization

### Colors
The color scheme can be customized by modifying CSS variables:

```css
:root {
    --primary-color: #3bb273;
    --background-color: #0C0012;
    --border-color: rgba(255, 255, 255, 0.1);
}
```

### Spacing
Adjust spacing by modifying padding and margin values:

```css
.modern-ui {
    padding: 24px; /* Adjust overall padding */
}

.modern-ui .answer-header {
    margin-bottom: 24px; /* Adjust header spacing */
}
```

### Animations
Customize transitions and animations:

```css
.modern-ui .tab-content {
    transition: all 0.3s ease; /* Adjust transition timing */
}
```

## Browser Support
The modern UI is designed to work with:
- Modern browsers (Chrome 80+, Firefox 75+, Safari 13+)
- Mobile browsers (iOS Safari 13+, Chrome Mobile 80+)
- Progressive enhancement for older browsers

## Future Enhancements
Planned features for upcoming releases:
- Image gallery integration
- Advanced source filtering
- Enhanced export formats (PDF, Markdown)
- Collaborative features
- Advanced search filters

## Troubleshooting

### Common Issues
1. **Tabs not switching**: Ensure jQuery is loaded and event handlers are bound
2. **Source cards not scrolling**: Check for CSS conflicts or JavaScript errors
3. **Styling not applied**: Verify the `modern-ui` class is present

### Debug Mode
Enable debug logging by adding this to your JavaScript:

```javascript
window.DEBUG_MODE = true;
```

## Support
For technical support or feature requests, please refer to the main plugin documentation or contact the development team.

---

*Last updated: December 2024*
*Version: 2.0.0*
