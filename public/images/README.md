# Images Directory

## TNG QR Code Setup

### Current Status
- 📁 **Placeholder:** `tng-qr-code-placeholder.svg` (示例占位图)
- 🎯 **Required:** `tng-qr-code.png` (真实收款码)

### How to Add Real TNG QR Code

1. **Generate QR Code from TNG eWallet:**
   - Open TNG eWallet app
   - Go to "Receive Money" or "My QR"
   - Save/Screenshot the QR code
   - Export as PNG or JPG

2. **Prepare the Image:**
   - Recommended size: 800x800px or larger
   - Format: PNG (preferred) or JPG
   - File name: `tng-qr-code.png`

3. **Place the File:**
   - Copy your QR code image to this directory
   - Rename it to: `tng-qr-code.png`
   - The app will automatically use it

### File Structure
```
public/
  images/
    tng-qr-code-placeholder.svg  ← Example placeholder (DO NOT DELETE)
    tng-qr-code.png               ← Your actual QR code (ADD THIS)
    README.md                     ← This file
```

### Testing
After adding the real QR code:
1. Restart your development server
2. Go to booking/payment page
3. Verify the QR code displays correctly
4. Test scanning with TNG eWallet app

### Security Notes
- ⚠️ The QR code will be publicly accessible
- ✅ This is safe - it's only for receiving payments
- 🔒 Never share private keys or sensitive credentials
