'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, Button, Badge, Modal, Input, StatsCard } from '@/components';
import { apiRequest } from '@/services/apiClient';

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  priority: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  createdAt: string;
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  summary: {
    activeCount: number;
    endedCount: number;
    totalCount: number;
  };
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summary, setSummary] = useState({ activeCount: 0, endedCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
    priority: '0',
    startAt: '',
    endAt: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await apiRequest<AnnouncementsResponse>('/api/admin/announcements');
      setAnnouncements(data.announcements || []);
      setSummary(data.summary || { activeCount: 0, endedCount: 0, totalCount: 0 });
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      linkUrl: '',
      linkText: '',
      priority: '0',
      startAt: '',
      endAt: '',
    });
    setEditingId(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      imageUrl: announcement.imageUrl || '',
      linkUrl: announcement.linkUrl || '',
      linkText: announcement.linkText || '',
      priority: String(announcement.priority),
      startAt: format(new Date(announcement.startAt), "yyyy-MM-dd'T'HH:mm"),
      endAt: format(new Date(announcement.endAt), "yyyy-MM-dd'T'HH:mm"),
    });
    setEditingId(announcement.id);
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || null,
        linkUrl: formData.linkUrl || null,
        linkText: formData.linkText || null,
        priority: Number(formData.priority),
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      };

      if (editingId) {
        await apiRequest(`/api/admin/announcements/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      resetForm();
      loadAnnouncements();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '操作失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) return;

    try {
      await apiRequest(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });
      loadAnnouncements();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除失败';
      setError(message);
    }
  };

  const isActiveNow = (announcement: Announcement) => {
    const now = new Date();
    return (
      announcement.isActive &&
      new Date(announcement.startAt) <= now &&
      new Date(announcement.endAt) >= now
    );
  };

  return (
    <div className="min-h-screen bg-ink p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              ← 返回仪表板
            </Button>
            <h1 className="text-2xl font-bold text-text-primary mt-2">公告管理</h1>
          </div>
          <Button onClick={openCreateModal}>+ 新增公告</Button>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard
              title="公告总数"
              value={summary.totalCount}
              trend={{ value: '条公告', isPositive: true }}
            />
            <StatsCard
              title="进行中"
              value={summary.activeCount}
              trend={{ value: '条生效中', isPositive: true }}
            />
            <StatsCard
              title="已结束"
              value={summary.endedCount}
              trend={{ value: '条已过期', isPositive: false }}
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="md" className="animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-5 skeleton-base rounded w-16" />
                  <div className="h-8 skeleton-base rounded w-24" />
                </div>
                <div className="h-6 skeleton-base rounded w-1/2 mb-2" />
                <div className="h-4 skeleton-base rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-text-secondary">暂无公告</p>
            <Button className="mt-4" onClick={openCreateModal}>
              创建第一条公告
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} padding="md">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📢</span>
                      <Badge variant={isActiveNow(announcement) ? 'success' : 'neutral'}>
                        {isActiveNow(announcement) ? '进行中' : '已结束'}
                      </Badge>
                      {announcement.priority > 0 && (
                        <Badge variant="warning" size="sm">
                          优先级 {announcement.priority}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {format(new Date(announcement.startAt), 'yyyy/MM/dd HH:mm')} - {format(new Date(announcement.endAt), 'yyyy/MM/dd HH:mm')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(announcement)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? '编辑公告' : '新增公告'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="公告标题"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="公告内容"
              rows={4}
              required
              className="w-full px-3 py-2 border border-border-subtle rounded-xl focus:ring-2 focus:ring-accent focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              配图链接
            </label>
            <Input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                跳转链接
              </label>
              <Input
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                按钮文字
              </label>
              <Input
                value={formData.linkText}
                onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                placeholder="了解更多"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              优先级
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              placeholder="0"
            />
            <p className="text-xs text-text-tertiary mt-1">数字越大显示越靠前</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                开始时间 <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                结束时间 <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              fullWidth
            >
              取消
            </Button>
            <Button type="submit" fullWidth loading={submitting}>
              {editingId ? '保存' : '创建'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
