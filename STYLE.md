# STYLE.md

## True Voice Extension Style Guide

This document outlines the design principles, CSS conventions, and UI patterns used in the True Voice extension. Follow these guidelines to ensure visual consistency and maintainability.

---

## 1. Fonts & Typography

- **Primary Font:** Inter, system-ui, and platform-specific sans-serif fallbacks.
- **Font Weights:** Use 400 (regular), 500 (medium), and 600 (semi-bold) for emphasis.
- **Font Smoothing:** Enabled for better legibility.
- **Headings:**  
  - `h1`: 20px, 600 weight, left-aligned, subtle text-shadow.
- **Body Text:**  
  - 15px, 500 weight, white, slight shadow for contrast.

---

## 2. Colors

- **Backgrounds:**  
  - Gradient: `linear-gradient(135deg, #251c54 0%, #000 100%)`
  - Card/Container: `rgba(255,255,255,0.1)` with blur.
- **Text:**  
  - Primary: `#fff`
  - Secondary: `rgba(255,255,255,0.7)`
- **Accent:**  
  - Blue: `#4facfe`, `#00f2fe`
  - Error: `#ff6b6b`
  - Success: `#43e97b`, `#38f9d7`

---

## 3. Layout & Spacing

- **Container:**  
  - Flex column, 10px gap.
- **Padding:**  
  - Body: 16px
  - Upload: 28px 24px
  - File Item: 12px 44px 12px 16px
- **Border Radius:**  
  - Cards: 16px
  - File Items: 12px
  - Buttons/Pills: 8px–12px

---

## 4. Components

### Header
- Flex row, spaced between, 5px bottom margin.
- GitHub link: 28x28px, rounded, hover effect.

### Upload Container
- Flex column, centered.
- Blurred background, gradient border on hover.
- Drag-over and hover states with shine animation.

### File List & Items
- Flex column, 10px gap.
- File item: blurred, rounded, fade-in animation.
- Remove button: circular, error color, hover scale.

### Progress Bar
- 6px height, rounded, blurred.
- States: uploading (blue), complete (green), error (pink).
- Shine animation overlay.

### Prediction Result
- Flex row, 8px gap.
- Confidence pill: blurred, rounded, accent border.

### Error Message
- Bold, error color, blurred, rounded, shadowed.

---

## 5. Animations

- **fadeIn:** Opacity and Y translation for entrance.
- **fadeOutSlide:** Opacity, X translation, collapse for removal.
- **shine:** Diagonal gradient sweep on hover.
- **progress-shine:** Horizontal shine on progress bar.

---

## 6. Interactivity

- **Hover Effects:**  
  - Cards, buttons, links scale and shadow.
- **Pointer Events:**  
  - Upload container disables pointer events for children except file input.
- **Drag Over:**  
  - Upload container highlights with border and background.

---

## 7. Accessibility

- **Text Selection:**  
  - Disabled globally, enabled for input/textarea/contenteditable.
- **Contrast:**  
  - Ensure text and backgrounds meet WCAG AA contrast.

---

## 8. CSS Conventions

- **Class Naming:**  
  - Use kebab-case (`.file-item`, `.remove-btn`).
- **Keyframes:**  
  - Prefix with component or effect (`fadeIn`, `fadeOutSlide`).
- **Transitions:**  
  - Use `transition: all 0.3s ease` for smoothness.

---

## 9. Responsive Design

- **Width:**  
  - Fixed at 350px for extension popup.
- **Overflow:**  
  - `overflow-y: auto` for scrollable content.

---

## 10. Customization

- **Colors and fonts can be adjusted in `styles.css` for branding.**
- **Animations can be tuned for performance.**

---

## Example Usage

```html
<div class="upload-container">
  <input type="file" id="audio-upload" />
  <div class="upload-btn">
    <span class="icon">🎤</span>
    <span class="text">Upload Audio</span>
    <span class="hint">Supported: MP3, WAV</span>
  </div>
</div>
```

---

## References

- [Google Fonts: Inter](https://fonts.google.com/specimen/Inter)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum)

---

**Maintain consistency and clarity. Update this guide as new features are added.**