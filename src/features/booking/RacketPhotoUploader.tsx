/**
 * 球拍照片上传组件
 * 
 * 用于多球拍订单中上传每支球拍的照片（必填）
 */

'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { uploadImage } from '@/services/imageUploadService';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/loading/LoadingSpinner';

interface RacketPhotoUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    disabled?: boolean;
    index?: number;
}

export default function RacketPhotoUploader({
    value,
    onChange,
    onRemove,
    disabled = false,
    index = 0,
}: RacketPhotoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (disabled) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            toast.error('请上传图片文件');
            return;
        }

        // 验证文件大小（最大 5MB）
        if (file.size > 5 * 1024 * 1024) {
            toast.error('图片大小不能超过 5MB');
            return;
        }

        setUploading(true);

        try {
            // 创建预览
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // 上传到服务器
            const { url, error } = await uploadImage(file, {
                bucket: 'rackets',
                folder: 'orders',
                fileName: `racket_${Date.now()}_${index}.jpg`,
                compress: true,
                maxWidth: 1920,
                maxHeight: 1920,
            });

            if (error) {
                toast.error('上传失败：' + error);
                setPreviewUrl(null);
            } else if (url) {
                setPreviewUrl(url);
                onChange(url);
                toast.success('球拍照片上传成功');
            }
        } catch (error: any) {
            console.error('Failed to upload racket photo:', error);
            toast.error('上传失败');
            setPreviewUrl(null);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // 清空 input 以允许重复选择同一文件
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onRemove?.();
    };

    return (
        <div className="relative">
            {!previewUrl ? (
                <div
                    className={`
            relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all
            ${dragActive
                            ? 'border-accent bg-accent/5'
                            : 'border-border-subtle bg-ink-elevated hover:border-accent hover:bg-accent/5'
                        }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
            ${disabled ? 'pointer-events-none opacity-40' : ''}
          `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploading || disabled}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                            <LoadingSpinner size="md" className="w-8 h-8" />
                            <p className="text-sm text-text-secondary">上传中...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                                <Camera className="h-7 w-7 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary">
                                    上传球拍照片
                                </p>
                                <p className="mt-1 text-xs text-text-tertiary">
                                    点击或拖拽上传（必填）
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-border-subtle bg-ink-elevated">
                    <img
                        src={previewUrl}
                        alt="球拍照片"
                        className="w-full h-40 object-cover"
                    />
                    {!disabled && (
                        <button
                            onClick={handleRemove}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center shadow-lg hover:bg-danger/90"
                            title="移除照片"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-xs text-white font-medium flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            球拍照片已上传
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
