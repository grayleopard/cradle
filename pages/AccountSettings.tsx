import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, AlertTriangle, Lock, Mail, Shield } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { deleteUserAccount, updateUserPassword, isEmailAuthAvailable } from '../services/supabase';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useStore();
  const { showToast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!currentUser) return null;

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUserAccount(currentUser.id);
      logout();
      showToast('Your account has been deleted', 'success');
      navigate('/', { replace: true });
    } catch (error: any) {
      showToast(error.message || 'Failed to delete account', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updateUserPassword(newPassword);
      showToast('Password updated successfully', 'success');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast(error.message || 'Failed to update password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-full pb-20 bg-[#FFFCF9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E8DDD4] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-[#F5EDE6] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <h1 className="font-serif text-xl font-semibold text-[#4A3F37]">Account Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Security Section */}
        <section className="bg-white rounded-2xl shadow-warm-sm border border-[#E8DDD4] overflow-hidden">
          <div className="p-4 border-b border-[#E8DDD4]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2D9B8C]" />
              <h2 className="font-serif text-lg font-semibold text-[#4A3F37]">Security</h2>
            </div>
          </div>

          <div className="divide-y divide-[#E8DDD4]">
            {/* Email */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#B8A395]" />
                  <div>
                    <p className="font-medium text-[#4A3F37]">Email Address</p>
                    <p className="text-sm text-[#6B5D52]">{currentUser.email || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            {isEmailAuthAvailable() && (
              <div className="p-4">
                {!showPasswordChange ? (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <Lock className="w-5 h-5 text-[#B8A395]" />
                    <div>
                      <p className="font-medium text-[#4A3F37]">Change Password</p>
                      <p className="text-sm text-[#6B5D52]">Update your account password</p>
                    </div>
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="w-5 h-5 text-[#2D9B8C]" />
                      <p className="font-medium text-[#4A3F37]">Change Password</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6B5D52] mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DDD4] text-[#4A3F37] focus:outline-none focus:ring-1 focus:ring-[#2D9B8C]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6B5D52] mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DDD4] text-[#4A3F37] focus:outline-none focus:ring-1 focus:ring-[#2D9B8C]"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="flex-1 py-3 rounded-full border border-[#E8DDD4] text-[#6B5D52] font-medium hover:bg-[#F5EDE6] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPassword || !newPassword || !confirmPassword}
                        className="flex-1 py-3 rounded-full bg-[#2D9B8C] text-white font-medium hover:bg-[#247A6F] disabled:opacity-50 transition-colors"
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-2xl shadow-warm-sm border border-red-200 overflow-hidden">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-serif text-lg font-semibold text-red-700">Danger Zone</h2>
            </div>
          </div>

          <div className="p-4">
            {!showDeleteConfirm ? (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#4A3F37]">Delete Account</p>
                    <p className="text-sm text-[#6B5D52]">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-full border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
                >
                  Delete My Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-700">Are you absolutely sure?</p>
                      <p className="text-sm text-red-600 mt-1">
                        This will permanently delete:
                      </p>
                      <ul className="text-sm text-red-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Your profile and personal information</li>
                        <li>All your listings</li>
                        <li>Your message history</li>
                        <li>Transaction records</li>
                        <li>Trust verification badges</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5D52] mb-2">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-red-200 text-[#4A3F37] focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 py-3 rounded-full border border-[#E8DDD4] text-[#6B5D52] font-medium hover:bg-[#F5EDE6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                    className="flex-1 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Privacy Links */}
        <div className="text-center text-sm text-[#B8A395] space-y-2">
          <p>
            Read our{' '}
            <a href="#/privacy" className="text-[#2D9B8C] hover:underline">Privacy Policy</a>
            {' '}to understand how we handle your data.
          </p>
          <p>
            For data export requests, contact{' '}
            <a href="mailto:privacy@pipit.app" className="text-[#2D9B8C] hover:underline">
              privacy@pipit.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
