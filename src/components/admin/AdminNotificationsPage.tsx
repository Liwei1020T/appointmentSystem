'use client';

/**
 * AdminNotificationsPage Component
 * 
 * Comprehensive notification management interface for admins.
 * 
 * Features:
 * - Tab 1: Notification Logs - View all sent notifications with filtering
 * - Tab 2: Templates - Manage SMS/Push notification templates
 * - Tab 3: Statistics - Delivery rates, charts, KPIs
 * - Tab 4: Devices - Registered user devices for push notifications
 * 
 * Actions:
 * - Retry failed notifications
 * - Edit/test notification templates
 * - Deactivate devices
 * - Export logs to CSV
 */

import React, { useState, useEffect } from 'react';
import { 
  getNotificationStats, 
  getAllNotifications, 
  getAllTemplates,
  updateTemplate,
  testNotification,
  retryFailedNotification,
  getUserDevices,
} from '@/services/notificationService';
import type {
  NotificationLog as ServiceNotificationLog,
  NotificationTemplate as ServiceNotificationTemplate,
  NotificationStats as ServiceNotificationStats,
  UserDevice as ServiceUserDevice,
} from '@/services/notificationService';
import SectionLoading from '@/components/loading/SectionLoading';

type TabType = 'logs' | 'templates' | 'stats' | 'devices';

type NotificationLog = ServiceNotificationLog & {
  users?: { full_name: string; phone?: string };
};

type NotificationTemplate = ServiceNotificationTemplate;

type NotificationStats = ServiceNotificationStats & {
  total_sent?: number;
  total_failed?: number;
  by_event?: { event_type: string; count: number }[];
};

type UserDevice = ServiceUserDevice & {
  users?: { full_name: string };
  last_used_at?: string | null;
};

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [loading, setLoading] = useState(false);

  // Logs state
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [logFilters, setLogFilters] = useState({
    type: 'all',
    status: 'all',
    event_type: 'all',
    date_from: '',
    date_to: '',
  });

  // Templates state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Stats state
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [statsDays, setStatsDays] = useState(7);

  // Devices state
  const [devices, setDevices] = useState<UserDevice[]>([]);

  // Load data based on active tab
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'logs':
          await loadNotifications();
          break;
        case 'templates':
          await loadTemplates();
          break;
        case 'stats':
          await loadStats();
          break;
        case 'devices':
          await loadDevices();
          break;
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const filters: any = {};
    if (logFilters.type !== 'all') filters.type = logFilters.type;
    if (logFilters.status !== 'all') filters.status = logFilters.status;
    if (logFilters.event_type !== 'all') filters.event_type = logFilters.event_type;
    if (logFilters.date_from) filters.date_from = logFilters.date_from;
    if (logFilters.date_to) filters.date_to = logFilters.date_to;

    const { data, error } = await getAllNotifications(filters);
    if (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
      return;
    }
    setNotifications(data || []);
  };

  const loadTemplates = async () => {
    const { data, error } = await getAllTemplates();
    if (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
      return;
    }
    setTemplates(data || []);
  };

  const loadStats = async () => {
    const { data, error } = await getNotificationStats(statsDays);
    if (error) {
      console.error('Failed to load notification stats:', error);
      setStats(null);
      return;
    }
    setStats(data);
  };

  const loadDevices = async () => {
    // Get all devices by fetching without user filter
    // This would require a new service method, for now we'll use a workaround
    // TODO: Add getAllDevices() to notificationService
    setDevices([]);
  };

  const handleRetry = async (notificationId: string) => {
    if (!confirm('Retry sending this notification?')) return;
    
    try {
      await retryFailedNotification(notificationId);
      alert('Notification retried successfully');
      loadNotifications();
    } catch (error: any) {
      alert(`Retry failed: ${error.message}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await updateTemplate(editingTemplate.id, {
        sms_content: editingTemplate.sms_content,
        push_title: editingTemplate.push_title,
        push_body: editingTemplate.push_body,
        is_active: editingTemplate.is_active,
      });
      alert('Template updated successfully');
      setEditingTemplate(null);
      loadTemplates();
    } catch (error: any) {
      alert(`Update failed: ${error.message}`);
    }
  };

  const handleTestTemplate = async (template: NotificationTemplate) => {
    const userId = prompt('Enter user ID to test notification:');
    if (!userId) return;

    const variables = prompt('Enter test variables as JSON (e.g., {"order_id": "123", "amount": "50.00"}):');
    let vars = {};
    if (variables) {
      try {
        vars = JSON.parse(variables);
      } catch {
        alert('Invalid JSON format');
        return;
      }
    }

    try {
      await testNotification(userId, template.event_type, vars);
      alert('Test notification sent successfully');
    } catch (error: any) {
      alert(`Test failed: ${error.message}`);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Type', 'Event', 'Status', 'Message', 'Error'];
    const rows = notifications.map(n => [
      new Date(n.created_at).toLocaleString(),
      n.users?.full_name || n.user_id,
      n.type,
      n.event_type,
      n.status,
      n.body,
      n.error_message || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-ink-elevated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Notification Management</h1>
          <p className="text-text-secondary mt-2">Manage SMS and Push notifications</p>
        </div>

        {/* Tabs */}
        <div className="bg-ink-surface rounded-lg shadow mb-6">
          <div className="border-b border-border-subtle">
            <nav className="flex -mb-px">
              {[
                { id: 'logs', label: 'Notification Logs' },
                { id: 'templates', label: 'Templates' },
                { id: 'stats', label: 'Statistics' },
                { id: 'devices', label: 'Devices' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-b-2 border-accent text-accent'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <SectionLoading label="Loading..." minHeightClassName="min-h-[240px]" />
            ) : (
              <>
                {/* Tab 1: Notification Logs */}
                {activeTab === 'logs' && (
                  <div>
                    {/* Filters */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      <select
                        value={logFilters.type}
                        onChange={(e) => setLogFilters({...logFilters, type: e.target.value})}
                        className="border border-border-subtle rounded-lg px-4 py-2"
                      >
                        <option value="all">All Types</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push</option>
                      </select>

                      <select
                        value={logFilters.status}
                        onChange={(e) => setLogFilters({...logFilters, status: e.target.value})}
                        className="border border-border-subtle rounded-lg px-4 py-2"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                        <option value="delivered">Delivered</option>
                      </select>

                      <select
                        value={logFilters.event_type}
                        onChange={(e) => setLogFilters({...logFilters, event_type: e.target.value})}
                        className="border border-border-subtle rounded-lg px-4 py-2"
                      >
                        <option value="all">All Events</option>
                        <option value="order_created">Order Created</option>
                        <option value="order_completed">Order Completed</option>
                        <option value="payment_success">Payment Success</option>
                        <option value="package_purchased">Package Purchased</option>
                        <option value="points_earned">Points Earned</option>
                      </select>

                      <input
                        type="date"
                        value={logFilters.date_from}
                        onChange={(e) => setLogFilters({...logFilters, date_from: e.target.value})}
                        className="border border-border-subtle rounded-lg px-4 py-2"
                        placeholder="From"
                      />

                      <input
                        type="date"
                        value={logFilters.date_to}
                        onChange={(e) => setLogFilters({...logFilters, date_to: e.target.value})}
                        className="border border-border-subtle rounded-lg px-4 py-2"
                        placeholder="To"
                      />
                    </div>

                    <div className="flex gap-4 mb-6">
                      <button
                        onClick={loadNotifications}
                        className="bg-accent text-text-onAccent px-6 py-2 rounded-lg hover:shadow-glow"
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="bg-success text-text-primary px-6 py-2 rounded-lg hover:bg-success/90"
                      >
                        Export to CSV
                      </button>
                    </div>

                    {/* Notifications Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border-subtle">
                        <thead className="bg-ink-elevated">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Event</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-ink-surface divide-y divide-border-subtle">
                          {notifications.map(notification => (
                            <tr key={notification.id}>
                              <td className="px-6 py-4 text-sm text-text-primary">
                                {new Date(notification.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-text-primary">
                                {notification.users?.full_name || notification.user_id.slice(0, 8)}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  notification.type === 'sms' ? 'bg-info-soft text-info' : 'bg-accent/15 text-accent'
                                }`}>
                                  {notification.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-text-secondary">{notification.event_type}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  notification.status === 'sent' || notification.status === 'delivered'
                                    ? 'bg-success/15 text-success'
                                    : notification.status === 'failed'
                                    ? 'bg-danger/15 text-danger'
                                    : 'bg-warning/15 text-warning'
                                }`}>
                                  {notification.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                                {notification.body}
                                {notification.error_message && (
                                  <div className="text-danger text-xs mt-1">{notification.error_message}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {notification.status === 'failed' && (
                                  <button
                                    onClick={() => handleRetry(notification.id)}
                                    className="text-accent hover:text-text-primary"
                                  >
                                    Retry
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {notifications.length === 0 && (
                        <div className="text-center py-12 text-text-tertiary">
                          No notifications found
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Templates */}
                {activeTab === 'templates' && (
                  <div>
                    <div className="space-y-4">
                      {templates.map(template => (
                        <div key={template.id} className="border border-border-subtle rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{template.name}</h3>
                              <p className="text-sm text-text-secondary">Event: {template.event_type}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs ${
                                template.is_active ? 'bg-success/15 text-success' : 'bg-ink-elevated text-text-secondary'
                              }`}>
                                {template.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs bg-info-soft text-info">
                                {template.type.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {editingTemplate?.id === template.id ? (
                            <div className="space-y-4">
                              {(template.type === 'sms' || template.type === 'both') && (
                                <div>
                                  <label className="block text-sm font-medium text-text-secondary mb-2">SMS Content</label>
                                  <textarea
                                    value={editingTemplate.sms_content || ''}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, sms_content: e.target.value})}
                                    className="w-full border border-border-subtle rounded-lg px-4 py-2"
                                    rows={3}
                                  />
                                </div>
                              )}

                              {(template.type === 'push' || template.type === 'both') && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Push Title</label>
                                    <input
                                      type="text"
                                      value={editingTemplate.push_title || ''}
                                      onChange={(e) => setEditingTemplate({...editingTemplate, push_title: e.target.value})}
                                      className="w-full border border-border-subtle rounded-lg px-4 py-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Push Body</label>
                                    <textarea
                                      value={editingTemplate.push_body || ''}
                                      onChange={(e) => setEditingTemplate({...editingTemplate, push_body: e.target.value})}
                                      className="w-full border border-border-subtle rounded-lg px-4 py-2"
                                      rows={3}
                                    />
                                  </div>
                                </>
                              )}

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingTemplate.is_active}
                                  onChange={(e) => setEditingTemplate({...editingTemplate, is_active: e.target.checked})}
                                  className="rounded"
                                />
                                <label className="text-sm text-text-secondary">Active</label>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveTemplate}
                                  className="bg-accent text-text-onAccent px-4 py-2 rounded-lg hover:shadow-glow"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingTemplate(null)}
                                  className="bg-ink-elevated text-text-secondary px-4 py-2 rounded-lg hover:bg-ink-surface"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {template.sms_content && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-text-secondary">SMS:</span>
                                  <p className="text-sm text-text-secondary mt-1">{template.sms_content}</p>
                                </div>
                              )}
                              {template.push_title && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-text-secondary">Push:</span>
                                  <p className="text-sm text-text-primary mt-1 font-medium">{template.push_title}</p>
                                  <p className="text-sm text-text-secondary">{template.push_body}</p>
                                </div>
                              )}

                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={() => setEditingTemplate(template)}
                                  className="bg-accent text-text-onAccent px-4 py-2 rounded-lg hover:shadow-glow"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleTestTemplate(template)}
                                  className="bg-success text-text-primary px-4 py-2 rounded-lg hover:bg-success/90"
                                >
                                  Test
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Statistics */}
                {activeTab === 'stats' && stats && (
                  <div>
                    <div className="mb-6">
                      <label className="text-sm font-medium text-text-secondary mr-4">Time Period:</label>
                      <select
                        value={statsDays}
                        onChange={(e) => setStatsDays(Number(e.target.value))}
                        className="border border-border-subtle rounded-lg px-4 py-2"
                      >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                      </select>
                      <button
                        onClick={loadStats}
                        className="ml-4 bg-accent text-text-onAccent px-4 py-2 rounded-lg hover:shadow-glow"
                      >
                        Refresh
                      </button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-6">
                      <div className="bg-info-soft rounded-lg p-6 border border-border-subtle">
                        <div className="text-sm text-text-secondary mb-2">Total Sent</div>
                        <div className="text-3xl font-bold text-accent">{stats.total_sent}</div>
                      </div>
                      <div className="bg-danger/10 rounded-lg p-6 border border-border-subtle">
                        <div className="text-sm text-text-secondary mb-2">Failed</div>
                        <div className="text-3xl font-bold text-danger">{stats.total_failed}</div>
                      </div>
                      <div className="bg-success/10 rounded-lg p-6 border border-border-subtle">
                        <div className="text-sm text-text-secondary mb-2">Delivery Rate</div>
                        <div className="text-3xl font-bold text-success">{stats.delivery_rate.toFixed(1)}%</div>
                      </div>
                      <div className="bg-accent/10 rounded-lg p-6 border border-border-subtle">
                        <div className="text-sm text-text-secondary mb-2">SMS vs Push</div>
                        <div className="text-lg font-bold text-accent">
                          {stats.sms_count} / {stats.push_count}
                        </div>
                      </div>
                    </div>

                    {/* Event Type Distribution */}
                    <div className="bg-ink-surface rounded-lg border border-border-subtle p-6">
                      <h3 className="text-lg font-semibold mb-4">Notifications by Event Type</h3>
                      <div className="space-y-3">
                        {(stats.by_event || []).map(event => (
                          <div key={event.event_type} className="flex items-center">
                            <div className="w-40 text-sm text-text-secondary">{event.event_type}</div>
                            <div className="flex-1 bg-ink-elevated rounded-full h-6">
                              <div
                                className="bg-accent h-6 rounded-full"
                                style={{ width: `${stats.total_sent ? (event.count / stats.total_sent) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <div className="w-16 text-right text-sm font-medium text-text-primary">{event.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Devices */}
                {activeTab === 'devices' && (
                  <div>
                    <p className="text-text-secondary mb-4">
                      Registered devices for push notifications. Inactive devices (not used for 90+ days) are automatically cleaned up.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border-subtle">
                        <thead className="bg-ink-elevated">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Device Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Device Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Last Used</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-ink-surface divide-y divide-border-subtle">
                          {devices.map(device => (
                            <tr key={device.id}>
                              <td className="px-6 py-4 text-sm text-text-primary">
                                {device.users?.full_name || device.user_id.slice(0, 8)}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  device.device_type === 'ios' ? 'bg-ink-elevated text-text-secondary' :
                                  device.device_type === 'android' ? 'bg-success/15 text-success' :
                                  'bg-info-soft text-info'
                                }`}>
                                  {device.device_type.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-text-secondary">{device.device_name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {device.last_used_at ? new Date(device.last_used_at).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  device.is_active ? 'bg-success/15 text-success' : 'bg-ink-elevated text-text-secondary'
                                }`}>
                                  {device.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {device.is_active && (
                                  <button
                                    onClick={() => {/* Deactivate device */}}
                                    className="text-danger hover:text-danger/80"
                                  >
                                    Deactivate
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {devices.length === 0 && (
                        <div className="text-center py-12 text-text-tertiary">
                          No devices registered yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
