/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { AppNotification } from '../types';
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount,
} from '../utils/notifications';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(() => loadNotifications());
  const [unread, setUnread] = useState(() => unreadCount());

  useEffect(() => {
    const refresh = () => {
      setItems(loadNotifications());
      setUnread(unreadCount());
    };
    window.addEventListener('notifications_updated', refresh);
    return () => window.removeEventListener('notifications_updated', refresh);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markAllNotificationsRead();
                    setOpen(false);
                  }}
                  className="text-[10px] text-emerald-400 font-bold cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">No notifications yet</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 text-xs ${n.read ? 'opacity-60' : 'bg-slate-950/50'}`}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-bold text-white">{n.title}</p>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className="text-emerald-400 cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-[9px] text-slate-600 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
