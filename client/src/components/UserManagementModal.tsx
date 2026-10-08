import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Shield, 
  UserCheck, 
  ChefHat, 
  X, 
  AlertCircle,
  ArrowRightLeft,
  Lock
} from 'lucide-react';
import type { User } from '../types';

interface UserManagementModalProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  currentUser,
  onSwitchUser,
  onClose
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'switch' | 'manage'>('switch');
  const [selectedUserToLogin, setSelectedUserToLogin] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Form state for Add / Edit user
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formUserId, setFormUserId] = useState<string | number | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<'Cashier' | 'Kitchen' | 'Admin'>('Cashier');
  const [formStatus, setFormStatus] = useState<string>('Active');
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Fetch users from server or fallback
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          localStorage.setItem('rxs_users_cache', JSON.stringify(data));
          return;
        }
      }
    } catch (e) {
      console.warn('Using cached users list');
    }

    const cached = localStorage.getItem('rxs_users_cache');
    if (cached) {
      try {
        setUsers(JSON.parse(cached));
      } catch (e) {}
    } else {
      // Default initial users
      const defaults: User[] = [
        { id: 1, username: 'admin', name: 'Ceddy (Super Admin)', role: 'Admin', status: 'Active' },
        { id: 2, username: 'cashier1', name: 'Maria (Cashier)', role: 'Cashier', status: 'Active' },
        { id: 3, username: 'cashier2', name: 'John (Cashier)', role: 'Cashier', status: 'Active' },
        { id: 4, username: 'chef', name: 'Chief Ken (Kitchen)', role: 'Kitchen', status: 'Active' },
      ];
      setUsers(defaults);
      localStorage.setItem('rxs_users_cache', JSON.stringify(defaults));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Quick Account Login / Switch
  const handleConfirmLogin = async (user: User) => {
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: pinInput.trim() || '123'
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onSwitchUser(data.user);
        onClose();
        return;
      } else {
        setLoginError(data.error || 'Invalid PIN/Password.');
        return;
      }
    } catch (e) {
      // Offline fallback: PIN is 123 or matches
      if (pinInput.trim() === '123' || !pinInput.trim()) {
        onSwitchUser(user);
        onClose();
        return;
      }
      setLoginError('Invalid PIN. Default PIN is 123');
    }
  };

  // Save (Create or Update) User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formName.trim() || !formUsername.trim()) {
      setFormError('Staff name and username are required.');
      return;
    }

    const payload = {
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      password: formPassword.trim() || '123',
      role: formRole,
      status: formStatus
    };

    try {
      if (formUserId) {
        // UPDATE
        const res = await fetch(`/api/users/${formUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setFormSuccess('Staff account updated successfully!');
        }
      } else {
        // CREATE
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setFormSuccess('New staff account registered successfully!');
        }
      }

      await fetchUsers();
      resetForm();
    } catch (e) {
      // Offline update to localStorage
      const updatedList = formUserId
        ? users.map((u) => (u.id === formUserId ? { ...u, ...payload } : u))
        : [...users, { id: Date.now(), ...payload }];
      setUsers(updatedList);
      localStorage.setItem('rxs_users_cache', JSON.stringify(updatedList));
      setFormSuccess('Saved to offline storage!');
      resetForm();
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string | number) => {
    if (String(userId) === String(currentUser.id)) {
      alert('You cannot delete the currently active user account.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this staff account?')) return;

    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      await fetchUsers();
    } catch (e) {
      const updatedList = users.filter((u) => u.id !== userId);
      setUsers(updatedList);
      localStorage.setItem('rxs_users_cache', JSON.stringify(updatedList));
    }
  };

  const startEditUser = (user: User) => {
    setIsEditing(true);
    setFormUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword('');
    setFormRole(user.role);
    setFormStatus(user.status || 'Active');
    setFormError('');
    setFormSuccess('');
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('Cashier');
    setFormStatus('Active');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#12161f] border border-[#212833] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#212833] flex items-center justify-between bg-[#0f1217]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0ca1e1]/10 border border-[#0ca1e1]/30 flex items-center justify-center text-[#0ca1e1]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">
                Staff Accounts & Shift Switcher
              </h3>
              <p className="text-xs text-gray-400">
                Logged in as: <span className="text-[#fed428] font-bold">{currentUser.name}</span> ({currentUser.role})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#18202b] hover:bg-[#202733] text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 pt-4 border-b border-[#212833] gap-4 bg-[#12161f]">
          <button
            type="button"
            onClick={() => setActiveTab('switch')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer touch-manipulation ${
              activeTab === 'switch'
                ? 'border-[#0ca1e1] text-[#0ca1e1]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Switch Cashier / Account</span>
          </button>

          {currentUser.role === 'Admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer touch-manipulation ${
                activeTab === 'manage'
                  ? 'border-[#fed428] text-[#fed428]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Database (CRUD)</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: QUICK SWITCH ACCOUNT */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Select your staff profile to change shifts. The live dashboard and kitchen orders will remain fully real-time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => {
                  const isCurrent = String(u.id) === String(currentUser.id) || u.username === currentUser.username;
                  const isSelected = selectedUserToLogin?.username === u.username;

                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUserToLogin(u);
                        setPinInput('');
                        setLoginError('');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer touch-manipulation ${
                        isSelected
                          ? 'bg-[#182333] border-[#0ca1e1] shadow-lg shadow-[#0ca1e1]/15'
                          : isCurrent
                          ? 'bg-[#18202b] border-[#fed428]/40'
                          : 'bg-[#151a21] border-[#212833] hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === 'Admin' ? 'bg-[#fed428]/20 text-[#fed428]' :
                            u.role === 'Cashier' ? 'bg-[#0ca1e1]/20 text-[#0ca1e1]' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {u.role === 'Admin' ? <Shield className="w-4 h-4" /> :
                             u.role === 'Cashier' ? <UserCheck className="w-4 h-4" /> :
                             <ChefHat className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fed428] text-black font-extrabold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 font-mono">@{u.username}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          u.role === 'Admin' ? 'bg-[#fed428]/15 text-[#fed428]' :
                          u.role === 'Cashier' ? 'bg-[#0ca1e1]/15 text-[#0ca1e1]' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enter PIN Prompt */}
              {selectedUserToLogin && (
                <div className="p-4 rounded-2xl bg-[#0f1217] border border-[#0ca1e1]/40 space-y-3 mt-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#0ca1e1]" />
                      <span>Log in as <strong>{selectedUserToLogin.name}</strong></span>
                    </span>
                    <span className="text-[11px] text-gray-500">Default PIN: 123</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Enter 3 or 4-digit PIN..."
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmLogin(selectedUserToLogin);
                      }}
                      autoFocus
                      className="flex-1 bg-[#151a21] border border-[#212833] rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-[#0ca1e1]"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmLogin(selectedUserToLogin)}
                      className="px-5 py-2.5 rounded-xl bg-[#0ca1e1] hover:bg-[#0ca1e1]/90 text-black text-xs font-black transition-all cursor-pointer touch-manipulation active:scale-95 shadow-lg shadow-[#0ca1e1]/20"
                    >
                      Login Now
                    </button>
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{loginError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER DATABASE (CRUD) */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Add / Edit Form */}
              <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-[#212833] pb-2">
                  <span className="text-xs font-bold text-[#fed428] uppercase tracking-wider flex items-center gap-1.5">
                    {isEditing ? <Edit3 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{isEditing ? `Edit User (@${formUsername})` : 'Create New Staff Account'}</span>
                  </span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[11px] text-gray-400 hover:text-white"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveUser} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 block mb-1">Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah (Cashier)"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#fed428]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 block mb-1">Username / ID</label>
                      <input
                        type="text"
                        placeholder="e.g. sarah2"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="w-full bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#fed428]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 block mb-1">Role / Permissions</label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as any)}
                        className="w-full bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#fed428]"
                      >
                        <option value="Cashier">Cashier (POS & Sales)</option>
                        <option value="Kitchen">Kitchen (KDS & Prep)</option>
                        <option value="Admin">Admin (Full Control)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 block mb-1">
                        PIN / Password {isEditing && '(Leave blank to keep)'}
                      </label>
                      <input
                        type="password"
                        placeholder="e.g. 1234"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#fed428]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 block mb-1">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#fed428]"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive / Suspended</option>
                      </select>
                    </div>
                  </div>

                  {formError && (
                    <div className="text-xs text-rose-400 font-semibold">{formError}</div>
                  )}
                  {formSuccess && (
                    <div className="text-xs text-emerald-400 font-semibold">{formSuccess}</div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black text-xs font-black transition-all cursor-pointer touch-manipulation active:scale-95 shadow-md shadow-[#fed428]/20"
                    >
                      {isEditing ? 'Save Changes' : '+ Register Staff Account'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Users List Table */}
              <div className="bg-[#151a21] border border-[#212833] rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0f1217] text-gray-400 uppercase font-bold text-[11px] border-b border-[#212833]">
                    <tr>
                      <th className="py-3 px-4">Staff Name</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#212833]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1a212b]">
                        <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                        <td className="py-3 px-4 text-gray-400 font-mono">@{u.username}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            u.role === 'Admin' ? 'bg-[#fed428]/20 text-[#fed428]' :
                            u.role === 'Cashier' ? 'bg-[#0ca1e1]/20 text-[#0ca1e1]' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-400 font-semibold">{u.status || 'Active'}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditUser(u)}
                              className="p-1.5 rounded-lg bg-[#0c0e11] hover:bg-[#202733] text-gray-300 hover:text-white border border-[#212833]"
                              title="Edit User"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#fed428]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-[#0c0e11] hover:bg-rose-950/40 text-gray-300 hover:text-rose-400 border border-[#212833]"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
