import React, { useState, useEffect } from "react";
import { XMarkIcon, TrashIcon, PencilIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import { emailService } from "../services/emailService";
import { configService } from "../services/configService";
import type { EmailSender, CreateEmailRequest, UpdateEmailRequest, SendTestEmailRequest } from "../types";
import SuccessBanner from "../components/SuccessBanner";
import ErrorBanner from "../components/ErrorBanner";

const AppSettings: React.FC = () => {
  const [emails, setEmails] = useState<EmailSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [appName, setAppName] = useState('Application');
  const [recoveryEmailSenderId, setRecoveryEmailSenderId] = useState<number | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Email management dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailSender | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    email: "",
  });

  // Test email dialog state
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmailFormData, setTestEmailFormData] = useState({
    fromEmail: "",
    toEmails: [] as string[],
    ccEmails: [] as string[],
    bccEmails: [] as string[],
    subject: "",
    content: "",
    attachments: [] as File[],
  });
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [toEmailInput, setToEmailInput] = useState("");
  const [ccEmailInput, setCcEmailInput] = useState("");
  const [bccEmailInput, setBccEmailInput] = useState("");

  // Delete email confirmation dialog state
  const [deleteEmailDialogOpen, setDeleteEmailDialogOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<EmailSender | null>(null);

  useEffect(() => {
    loadEmails();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { config } = await configService.getConfig();
      setTwoFactorEnabled(config.twoFactorEnabled);
      setAppName(config.appName || 'Application');
      setRecoveryEmailSenderId(config.recoveryEmailSenderId || null);
    } catch (err: any) {
      console.error('Failed to load config:', err);
    }
  };

  const handleToggleTwoFactor = async (enabled: boolean) => {
    try {
      setLoadingConfig(true);
      setError(null);
      
      // Check if trying to enable without email senders
      if (enabled && emails.length === 0) {
        setError('Cannot enable 2FA. At least one email sender must be configured.');
        setLoadingConfig(false);
        return;
      }

      const { config } = await configService.updateConfig({ twoFactorEnabled: enabled });
      setTwoFactorEnabled(config.twoFactorEnabled);
      setSuccess(enabled ? '2FA enabled successfully' : '2FA disabled successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update 2FA setting');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleUpdateAppName = async () => {
    if (!appName.trim()) {
      setError('App name cannot be empty');
      return;
    }

    try {
      setLoadingConfig(true);
      setError(null);
      const { config } = await configService.updateConfig({ appName: appName.trim() });
      setAppName(config.appName);
      setSuccess('App name updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update app name');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleUpdateRecoveryEmail = async (emailSenderId: number | null) => {
    try {
      setLoadingConfig(true);
      setError(null);
      const { config } = await configService.updateConfig({ recoveryEmailSenderId: emailSenderId });
      setRecoveryEmailSenderId(config.recoveryEmailSenderId || null);
      setSuccess('Recovery email updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update recovery email');
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadEmails = async () => {
    try {
      setLoading(true);
      const data = await emailService.getAllEmails();
      setEmails(data.emails);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const openAddEmailDialog = () => {
    setSelectedEmail(null);
    setIsEditMode(false);
    setEmailFormData({ email: "" });
    setEmailDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEditEmailDialog = (email: EmailSender) => {
    setSelectedEmail(email);
    setIsEditMode(true);
    setEmailFormData({
      email: email.email,
    });
    setEmailDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const closeEmailDialog = () => {
    setEmailDialogOpen(false);
    setSelectedEmail(null);
    setIsEditMode(false);
    setEmailFormData({ email: "" });
    setError(null);
    setSuccess(null);
  };

  const handleSaveEmail = async () => {
    try {
      setError(null);

      if (!emailFormData.email) {
        setError("Email is required");
        return;
      }

      if (isEditMode && selectedEmail) {
        const updateData: UpdateEmailRequest = {
          email: emailFormData.email,
        };
        await emailService.updateEmail(selectedEmail.id, updateData);
        setSuccess("Email sender updated successfully");
      } else {
        const createData: CreateEmailRequest = {
          email: emailFormData.email,
        };
        await emailService.createEmail(createData);
        setSuccess("Email sender created successfully");
      }

      await loadEmails();
      setTimeout(() => {
        closeEmailDialog();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save email sender");
    }
  };

  const openDeleteEmailDialog = (email: EmailSender) => {
    setEmailToDelete(email);
    setDeleteEmailDialogOpen(true);
  };

  const handleDeleteEmail = async () => {
    if (!emailToDelete) return;

    try {
      setError(null);
      await emailService.deleteEmail(emailToDelete.id);
      setSuccess("Email sender deleted successfully");
      setDeleteEmailDialogOpen(false);
      setEmailToDelete(null);
      await loadEmails();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete email sender");
      setDeleteEmailDialogOpen(false);
      setEmailToDelete(null);
    }
  };

  const openTestEmailDialog = () => {
    if (emails.length === 0) {
      setError("Please add at least one email sender before sending a test email");
      return;
    }
    setTestEmailFormData({
      fromEmail: emails[0]?.email || "",
      toEmails: [],
      ccEmails: [],
      bccEmails: [],
      subject: "Test Email",
      content: "This is a test email from the application.",
      attachments: [],
    });
    setToEmailInput("");
    setCcEmailInput("");
    setBccEmailInput("");
    setTestEmailDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const closeTestEmailDialog = () => {
    setTestEmailDialogOpen(false);
    setTestEmailFormData({
      fromEmail: emails[0]?.email || "",
      toEmails: [],
      ccEmails: [],
      bccEmails: [],
      subject: "Test Email",
      content: "This is a test email from the application.",
      attachments: [],
    });
    setToEmailInput("");
    setCcEmailInput("");
    setBccEmailInput("");
    setError(null);
    setSuccess(null);
  };

  const addEmailToArray = (email: string, array: string[]) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && !array.includes(trimmedEmail)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(trimmedEmail)) {
        return [...array, trimmedEmail];
      } else {
        setError(`Invalid email format: ${trimmedEmail}`);
        return null;
      }
    }
    return array;
  };

  const addToEmail = () => {
    const result = addEmailToArray(toEmailInput, testEmailFormData.toEmails);
    if (result !== null) {
      setTestEmailFormData({ ...testEmailFormData, toEmails: result });
      setToEmailInput("");
    }
  };

  const addCcEmail = () => {
    const result = addEmailToArray(ccEmailInput, testEmailFormData.ccEmails);
    if (result !== null) {
      setTestEmailFormData({ ...testEmailFormData, ccEmails: result });
      setCcEmailInput("");
    }
  };

  const addBccEmail = () => {
    const result = addEmailToArray(bccEmailInput, testEmailFormData.bccEmails);
    if (result !== null) {
      setTestEmailFormData({ ...testEmailFormData, bccEmails: result });
      setBccEmailInput("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const allowedExtensions = [".pdf", ".csv", ".xls", ".xlsx"];

    const validFiles = files.filter((file) => {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      return allowedTypes.includes(file.type) || allowedExtensions.includes(ext);
    });

    if (validFiles.length !== files.length) {
      setError("Some files were rejected. Only PDF, CSV, and XLSX files are allowed.");
    }

    setTestEmailFormData({
      ...testEmailFormData,
      attachments: [...testEmailFormData.attachments, ...validFiles],
    });
  };

  const removeAttachment = (index: number) => {
    setTestEmailFormData({
      ...testEmailFormData,
      attachments: testEmailFormData.attachments.filter((_, i) => i !== index),
    });
  };

  const handleSendTestEmail = async () => {
    try {
      setError(null);
      setSendingTestEmail(true);

      // Add any pending email inputs to arrays
      let toEmails = [...testEmailFormData.toEmails];
      let ccEmails = [...testEmailFormData.ccEmails];
      let bccEmails = [...testEmailFormData.bccEmails];

      if (toEmailInput.trim()) {
        const result = addEmailToArray(toEmailInput, toEmails);
        if (result === null) {
          setSendingTestEmail(false);
          return;
        }
        toEmails = result;
      }

      if (ccEmailInput.trim()) {
        const result = addEmailToArray(ccEmailInput, ccEmails);
        if (result === null) {
          setSendingTestEmail(false);
          return;
        }
        ccEmails = result;
      }

      if (bccEmailInput.trim()) {
        const result = addEmailToArray(bccEmailInput, bccEmails);
        if (result === null) {
          setSendingTestEmail(false);
          return;
        }
        bccEmails = result;
      }

      if (
        !testEmailFormData.fromEmail ||
        toEmails.length === 0 ||
        !testEmailFormData.subject ||
        !testEmailFormData.content
      ) {
        setError("From email, at least one recipient, subject, and content are required");
        setSendingTestEmail(false);
        return;
      }

      const testEmailData: SendTestEmailRequest = {
        fromEmail: testEmailFormData.fromEmail,
        toEmails: toEmails,
        ccEmails: ccEmails.length > 0 ? ccEmails : undefined,
        bccEmails: bccEmails.length > 0 ? bccEmails : undefined,
        subject: testEmailFormData.subject,
        content: testEmailFormData.content,
        attachments: testEmailFormData.attachments.length > 0 ? testEmailFormData.attachments : undefined,
      };

      await emailService.sendTestEmail(testEmailData);
      setSuccess("Test email sent successfully!");

      setTimeout(() => {
        closeTestEmailDialog();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send test email");
    } finally {
      setSendingTestEmail(false);
    }
  };

  const hasEmailFormChanges = (): boolean => {
    if (!isEditMode || !selectedEmail) {
      return true; // Always show button in create mode
    }

    return emailFormData.email !== selectedEmail.email;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />
        </div>
      )}

      {/* App Name Section */}
      <div className="mb-8">
        <div className="bg-white shadow-xs rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Name</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set the application name that will appear in authenticator apps when users set up 2FA.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-2">
                App Name
              </label>
              <input
                id="appName"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                maxLength={100}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                placeholder="Application"
              />
            </div>
            <button
              type="button"
              onClick={handleUpdateAppName}
              disabled={loadingConfig || !appName.trim()}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingConfig ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="mb-8">
        <div className="bg-white shadow-xs rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600 mb-1">
                Enable system-wide two-factor authentication for all users.
              </p>
              <p className="text-xs text-gray-500">
                {emails.length === 0 
                  ? '⚠️ At least one email sender must be configured before enabling 2FA.'
                  : `✓ ${emails.length} email sender${emails.length !== 1 ? 's' : ''} configured.`}
              </p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => handleToggleTwoFactor(e.target.checked)}
                  disabled={loadingConfig || (emails.length === 0 && !twoFactorEnabled)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
              </label>
            </div>
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>2FA is enabled.</strong> Users with 2FA set up will be required to enter a code from their authenticator app when logging in.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recovery Email Section */}
      {emails.length > 0 && (
        <div className="mb-8">
          <div className="bg-white shadow-xs rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2FA Recovery Email</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select the default email address that will be used to send 2FA recovery codes to users who have lost access to their authenticator app.
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="recoveryEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Recovery Email Sender
                </label>
                <select
                  id="recoveryEmail"
                  value={recoveryEmailSenderId || ''}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? null : parseInt(e.target.value);
                    setRecoveryEmailSenderId(newValue);
                    handleUpdateRecoveryEmail(newValue);
                  }}
                  disabled={loadingConfig}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select an email sender...</option>
                  {emails.map((email) => (
                    <option key={email.id} value={email.id}>
                      {email.email}
                    </option>
                  ))}
                </select>
                {recoveryEmailSenderId && (
                  <p className="mt-2 text-xs text-gray-500">
                    Recovery codes will be sent from: {emails.find(e => e.id === recoveryEmailSenderId)?.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Senders Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Email Senders</h2>
          <button
            type="button"
            onClick={openAddEmailDialog}
            className="inline-flex items-center rounded-md bg-primary-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 cursor-pointer"
          >
            Add Email Sender
          </button>
        </div>

        {emails.length === 0 ? (
          <div className="bg-white shadow-xs rounded-xl p-8 text-center">
            <p className="text-gray-500">No email senders configured. Add one to get started.</p>
          </div>
        ) : (
          <ul
            role="list"
            className="divide-y divide-gray-100 overflow-hidden bg-white shadow-xs outline-1 outline-gray-900/5 sm:rounded-xl"
          >
            {emails.map((email) => (
              <li key={email.id} className="relative py-5 hover:bg-gray-50">
                <div className="px-4 sm:px-6 lg:px-8">
                  <div className="mx-auto flex max-w-4xl justify-between gap-x-6">
                    <div className="flex min-w-0 gap-x-4 items-center">
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm/6 font-semibold text-gray-900">{email.email}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Added {new Date(email.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditEmailDialog(email)}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <PencilIcon className="size-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteEmailDialog(email)}
                          className="text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <TrashIcon className="size-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Test Email Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Test Email</h2>
          <button
            type="button"
            onClick={openTestEmailDialog}
            disabled={emails.length === 0}
            className="inline-flex items-center rounded-md bg-primary-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            Send Test Email
          </button>
        </div>
        <div className="bg-white shadow-xs rounded-xl p-6">
          <p className="text-sm text-gray-600">
            Send a test email to verify your email configuration is working correctly.
          </p>
        </div>
      </div>

      {/* Email Management Dialog */}
      <Dialog open={emailDialogOpen} onClose={closeEmailDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <form className="relative flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-primary-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">
                          {isEditMode ? "Edit Email Sender" : "Add Email Sender"}
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={closeEmailDialog}
                            className="relative rounded-md text-primary-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {(error || success) && (
                      <div className="px-4 sm:px-6 pt-4">
                        {error && (
                          <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                          </div>
                        )}
                        {success && (
                          <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                            {success}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-200 px-4 sm:px-6">
                        <div className="space-y-6 pt-6 pb-5">
                          <div>
                            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                              Email Address
                            </label>
                            <div className="mt-2">
                              <input
                                id="email"
                                name="email"
                                type="email"
                                value={emailFormData.email}
                                onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                placeholder="sender@example.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-end px-4 py-4">
                    <button
                      type="button"
                      onClick={closeEmailDialog}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    {(!isEditMode || hasEmailFormChanges()) && (
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        className="ml-4 inline-flex justify-center rounded-md bg-primary-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 cursor-pointer"
                      >
                        {isEditMode ? "Save Changes" : "Create"}
                      </button>
                    )}
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onClose={closeTestEmailDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <form className="relative flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-primary-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">Send Test Email</DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={closeTestEmailDialog}
                            className="relative rounded-md text-primary-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {(error || success) && (
                      <div className="px-4 sm:px-6 pt-4">
                        {error && (
                          <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                          </div>
                        )}
                        {success && (
                          <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                            {success}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-200 px-4 sm:px-6">
                        <div className="space-y-6 pt-6 pb-5">
                          <div>
                            <label htmlFor="fromEmail" className="block text-sm/6 font-medium text-gray-900">
                              From Email
                            </label>
                            <div className="mt-2">
                              <select
                                id="fromEmail"
                                name="fromEmail"
                                value={testEmailFormData.fromEmail}
                                onChange={(e) =>
                                  setTestEmailFormData({ ...testEmailFormData, fromEmail: e.target.value })
                                }
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                              >
                                {emails.map((email) => (
                                  <option key={email.id} value={email.email}>
                                    {email.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="toEmail" className="block text-sm/6 font-medium text-gray-900">
                              To Email(s) *
                            </label>
                            <div className="mt-2">
                              <div className="flex gap-2">
                                <input
                                  id="toEmail"
                                  name="toEmail"
                                  type="email"
                                  autoComplete="email to"
                                  value={toEmailInput}
                                  onChange={(e) => setToEmailInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addToEmail();
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                  placeholder="recipient@example.com"
                                />
                                <button
                                  type="button"
                                  onClick={addToEmail}
                                  className="rounded-md bg-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>
                              {testEmailFormData.toEmails.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {testEmailFormData.toEmails.map((email, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                    >
                                      {email}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTestEmailFormData({
                                            ...testEmailFormData,
                                            toEmails: testEmailFormData.toEmails.filter((_, i) => i !== idx),
                                          })
                                        }
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label htmlFor="ccEmail" className="block text-sm/6 font-medium text-gray-900">
                              CC Email(s)
                            </label>
                            <div className="mt-2">
                              <div className="flex gap-2">
                                <input
                                  id="ccEmail"
                                  name="ccEmail"
                                  type="email"
                                  autoComplete="email-cc"
                                  value={ccEmailInput}
                                  onChange={(e) => setCcEmailInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addCcEmail();
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                  placeholder="cc@example.com"
                                />
                                <button
                                  type="button"
                                  onClick={addCcEmail}
                                  className="rounded-md bg-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>
                              {testEmailFormData.ccEmails.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {testEmailFormData.ccEmails.map((email, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                    >
                                      {email}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTestEmailFormData({
                                            ...testEmailFormData,
                                            ccEmails: testEmailFormData.ccEmails.filter((_, i) => i !== idx),
                                          })
                                        }
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label htmlFor="bccEmail" className="block text-sm/6 font-medium text-gray-900">
                              BCC Email(s)
                            </label>
                            <div className="mt-2">
                              <div className="flex gap-2">
                                <input
                                  id="bccEmail"
                                  name="bccEmail"
                                  type="email"
                                  autoComplete="email-bcc"
                                  value={bccEmailInput}
                                  onChange={(e) => setBccEmailInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addBccEmail();
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                  placeholder="bcc@example.com"
                                />
                                <button
                                  type="button"
                                  onClick={addBccEmail}
                                  className="rounded-md bg-primary-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>
                              {testEmailFormData.bccEmails.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {testEmailFormData.bccEmails.map((email, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                    >
                                      {email}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setTestEmailFormData({
                                            ...testEmailFormData,
                                            bccEmails: testEmailFormData.bccEmails.filter((_, i) => i !== idx),
                                          })
                                        }
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label htmlFor="subject" className="block text-sm/6 font-medium text-gray-900">
                              Subject
                            </label>
                            <div className="mt-2">
                              <input
                                id="subject"
                                name="subject"
                                type="text"
                                value={testEmailFormData.subject}
                                onChange={(e) =>
                                  setTestEmailFormData({ ...testEmailFormData, subject: e.target.value })
                                }
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                placeholder="Email subject"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="content" className="block text-sm/6 font-medium text-gray-900">
                              Message Content
                            </label>
                            <div className="mt-2">
                              <textarea
                                id="content"
                                name="content"
                                rows={6}
                                value={testEmailFormData.content}
                                onChange={(e) =>
                                  setTestEmailFormData({ ...testEmailFormData, content: e.target.value })
                                }
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                placeholder="Email message content"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="attachments" className="block text-sm/6 font-medium text-gray-900">
                              Attachments (PDF, CSV, XLSX)
                            </label>
                            <div className="mt-2">
                              <input
                                id="attachments"
                                name="attachments"
                                type="file"
                                multiple
                                accept=".pdf,.csv,.xls,.xlsx"
                                onChange={handleFileChange}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                              />
                              {testEmailFormData.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {testEmailFormData.attachments.map((file, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700"
                                    >
                                      <span>{file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeAttachment(idx)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-end px-4 py-4">
                    <button
                      type="button"
                      onClick={closeTestEmailDialog}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={sendingTestEmail}
                      className="ml-4 inline-flex justify-center rounded-md bg-primary-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {sendingTestEmail ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Email Confirmation Dialog */}
      <Dialog open={deleteEmailDialogOpen} onClose={setDeleteEmailDialogOpen} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                      Delete email sender
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {emailToDelete?.email}? All of its data will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleDeleteEmail}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => {
                    setDeleteEmailDialogOpen(false);
                    setEmailToDelete(null);
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AppSettings;
