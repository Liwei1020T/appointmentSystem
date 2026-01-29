# Photo Management System

**String Service Platform — Order Photo Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The photo management system allows admins to upload, organize, and display photos for completed orders. This provides customers with visual documentation of their stringing work.

---

## Features

- Upload multiple photos per order
- Drag-and-drop reordering
- Photo preview with zoom
- Delete individual photos
- Automatic thumbnail generation
- User-facing photo gallery

---

## API Endpoints

### 1. Get Order Photos

**Endpoint:** `GET /api/orders/{id}/photos`
**Auth Required:** Yes (Order owner or Admin)

**Response:**

```json
{
  "ok": true,
  "data": {
    "photos": [
      {
        "id": "photo-uuid",
        "url": "/uploads/orders/order-id/photo-1.jpg",
        "thumbnailUrl": "/uploads/orders/order-id/thumb-1.jpg",
        "sortOrder": 1,
        "createdAt": "2026-01-27T10:00:00Z"
      }
    ]
  }
}
```

---

### 2. Upload Order Photo

**Endpoint:** `POST /api/orders/{id}/photos`
**Auth Required:** Yes (Admin only)
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `photo` | File | Yes | Image file (JPEG, PNG, WebP) |
| `sortOrder` | number | No | Display order (default: append) |

**Request Example:**

```bash
curl -X POST https://your-domain.com/api/orders/{id}/photos \
  -H "Cookie: next-auth.session-token=..." \
  -F "photo=@/path/to/image.jpg" \
  -F "sortOrder=1"
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "photo-uuid",
    "url": "/uploads/orders/order-id/photo-1.jpg",
    "thumbnailUrl": "/uploads/orders/order-id/thumb-1.jpg",
    "sortOrder": 1
  }
}
```

**Validation:**
- File size: Max 5MB
- File types: JPEG, PNG, WebP
- Max photos per order: 10

---

### 3. Delete Order Photo

**Endpoint:** `DELETE /api/orders/{id}/photos/{photoId}`
**Auth Required:** Yes (Admin only)

**Response:**

```json
{
  "ok": true,
  "data": {
    "deleted": true
  }
}
```

---

### 4. Reorder Photos

**Endpoint:** `POST /api/orders/{id}/photos/reorder`
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "photoIds": ["photo-3", "photo-1", "photo-2"]
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "reordered": true
  }
}
```

---

## Database Schema

```prisma
model OrderPhoto {
  id        String   @id @default(cuid())
  orderId   String
  url       String
  thumbnailUrl String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_photos")
}
```

---

## File Storage

### Directory Structure

```
public/
  uploads/
    orders/
      {order-id}/
        photo-1.jpg
        thumb-1.jpg
        photo-2.jpg
        thumb-2.jpg
```

### Storage Configuration

| Setting | Value |
|---------|-------|
| Base Path | `/public/uploads/orders/` |
| Max File Size | 5MB |
| Thumbnail Size | 200x200 |
| Allowed Types | image/jpeg, image/png, image/webp |

---

## Components

### OrderPhotosUpload (Admin)

**File:** `src/components/admin/OrderPhotosUploader.tsx`

Admin component for uploading and managing photos:

```tsx
<OrderPhotosUploader
  orderId="order-uuid"
  photos={photos}
  onUpload={handleUpload}
  onDelete={handleDelete}
  onReorder={handleReorder}
/>
```

**Features:**
- Drag-and-drop upload
- Preview thumbnails
- Reorder via drag
- Delete with confirmation

---

### OrderPhotosDisplay (User)

**File:** `src/components/OrderPhotosDisplay.tsx`

User-facing component for viewing photos:

```tsx
<OrderPhotosDisplay
  photos={photos}
  showZoom={true}
/>
```

**Features:**
- Responsive gallery grid
- Click to zoom
- Swipe navigation (mobile)
- Loading placeholders

---

## Admin Workflow

### Uploading Photos

1. Navigate to **Admin > Orders > [Order Detail]**
2. Scroll to **Photos** section
3. Click **Upload Photos** or drag files
4. Wait for upload to complete
5. Reorder photos by dragging
6. Click save if reordering

### Best Practices

- Upload photos immediately after completing stringing
- Include close-up of string bed
- Include full racket view
- Add before/after comparison if applicable
- Maximum 5-10 photos per order

---

## User Experience

### Order Detail Page

Users see photos in a gallery format on their order detail page:

1. Photos appear after order is marked "In Progress" or "Completed"
2. Users can tap to zoom
3. Users can swipe through gallery
4. Download option available

### Notification

When photos are uploaded, users receive a notification:

```
"Your stringing photos are ready!"
"View the completed work for Order #12345"
```

---

## Security

### Access Control

- **Upload/Delete/Reorder:** Admin only
- **View:** Order owner or Admin

### Validation

```typescript
// File validation
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxSize = 5 * 1024 * 1024; // 5MB

if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

if (file.size > maxSize) {
  throw new Error('File too large');
}
```

### Storage Security

- Files stored outside of sensitive directories
- Unique filenames to prevent collisions
- Access logged for audit trail

---

## Error Handling

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `UPLOAD_FILE_TOO_LARGE` | File exceeds 5MB | Compress image |
| `UPLOAD_INVALID_TYPE` | Not an allowed image type | Use JPEG/PNG/WebP |
| `ORDER_NOT_FOUND` | Order doesn't exist | Check order ID |
| `FORBIDDEN` | Not authorized | Admin access required |
| `MAX_PHOTOS_EXCEEDED` | More than 10 photos | Delete some photos |

---

## Performance

### Image Optimization

- Thumbnails generated on upload (200x200)
- Full images served with lazy loading
- WebP format supported for smaller sizes

### Caching

- Thumbnails cached aggressively (1 year)
- Full images cached (1 month)
- CDN recommended for production

---

**End of Photo Management Documentation**
