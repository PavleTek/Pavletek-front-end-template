import React, { useState, useEffect } from "react";
import { XMarkIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { emailService } from "../services/emailService";
import type { EmailSender, EmailProvider, CreateEmailRequest, UpdateEmailRequest, SendTestEmailRequest } from "../types";

const AppSettings: React.FC = () => {
  const [emails, setEmails] = useState<EmailSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Email management dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailSender | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    email: "",
    emailProvider: "GMAIL" as EmailProvider,
    refreshToken: "",
    aliases: [] as string[],
  });
  const [aliasInput, setAliasInput] = useState("");

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
  const [selectedAlias, setSelectedAlias] = useState("");

  useEffect(() => {
    loadEmails();
  }, []);

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
    setEmailFormData({ email: "", emailProvider: "GMAIL", refreshToken: "", aliases: [] });
    setAliasInput("");
    setEmailDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEditEmailDialog = (email: EmailSender) => {
    setSelectedEmail(email);
    setIsEditMode(true);
    setEmailFormData({
      email: email.email,
      emailProvider: email.emailProvider,
      refreshToken: email.refreshToken || "",
      aliases: email.aliases || [],
    });
    setAliasInput("");
    setEmailDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const closeEmailDialog = () => {
    setEmailDialogOpen(false);
    setSelectedEmail(null);
    setIsEditMode(false);
    setEmailFormData({ email: "", emailProvider: "GMAIL", refreshToken: "", aliases: [] });
    setAliasInput("");
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
          emailProvider: emailFormData.emailProvider,
          refreshToken: emailFormData.refreshToken || undefined,
          aliases: emailFormData.aliases.length > 0 ? emailFormData.aliases : undefined,
        };
        await emailService.updateEmail(selectedEmail.id, updateData);
        setSuccess("Email sender updated successfully");
      } else {
        const createData: CreateEmailRequest = {
          email: emailFormData.email,
          emailProvider: emailFormData.emailProvider,
          refreshToken: emailFormData.refreshToken || undefined,
          aliases: emailFormData.aliases.length > 0 ? emailFormData.aliases : undefined,
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

  const handleDeleteEmail = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this email sender?")) {
      return;
    }

    try {
      await emailService.deleteEmail(id);
      setSuccess("Email sender deleted successfully");
      await loadEmails();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete email sender");
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
    setSelectedAlias("");
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
    setSelectedAlias("");
    setError(null);
    setSuccess(null);
  };

  const addAlias = () => {
    const trimmedAlias = aliasInput.trim();
    if (!trimmedAlias) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedAlias)) {
      setError(`Invalid alias email format: ${trimmedAlias}`);
      return;
    }

    const normalizedAlias = trimmedAlias.toLowerCase();
    if (normalizedAlias === emailFormData.email.toLowerCase()) {
      setError("Alias cannot be the same as the main email");
      return;
    }

    if (emailFormData.aliases.includes(normalizedAlias)) {
      setError("Alias already exists");
      return;
    }

    setEmailFormData({
      ...emailFormData,
      aliases: [...emailFormData.aliases, normalizedAlias],
    });
    setAliasInput("");
    setError(null);
  };

  const removeAlias = (alias: string) => {
    setEmailFormData({
      ...emailFormData,
      aliases: emailFormData.aliases.filter(a => a !== alias),
    });
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
    const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = ['.pdf', '.csv', '.xls', '.xlsx'];
    
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
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

      if (!testEmailFormData.fromEmail || toEmails.length === 0 || !testEmailFormData.subject || !testEmailFormData.content) {
        setError("From email, at least one recipient, subject, and content are required");
        setSendingTestEmail(false);
        return;
      }

      // Determine the actual fromEmail: use selected alias if available, otherwise use main email
      const selectedEmailSender = emails.find(e => e.email === testEmailFormData.fromEmail);
      const actualFromEmail = selectedAlias && selectedEmailSender?.aliases?.includes(selectedAlias)
        ? selectedAlias
        : testEmailFormData.fromEmail;

      const testEmailData: SendTestEmailRequest = {
        fromEmail: actualFromEmail,
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

  const getProviderBadgeColor = (provider: EmailProvider) => {
    return provider === "GMAIL" 
      ? "bg-red-100 text-red-800" 
      : "bg-blue-100 text-blue-800";
  };

  const hasEmailFormChanges = (): boolean => {
    if (!isEditMode || !selectedEmail) {
      return true; // Always show button in create mode
    }

    // Compare current form data with original email data
    const originalAliases = selectedEmail.aliases || [];
    const currentAliases = emailFormData.aliases || [];
    
    // Check if arrays are different (order doesn't matter, but we'll do simple comparison)
    const aliasesChanged = 
      originalAliases.length !== currentAliases.length ||
      !originalAliases.every(alias => currentAliases.includes(alias)) ||
      !currentAliases.every(alias => originalAliases.includes(alias));

    return (
      emailFormData.email !== selectedEmail.email ||
      emailFormData.emailProvider !== selectedEmail.emailProvider ||
      emailFormData.refreshToken !== (selectedEmail.refreshToken || "") ||
      aliasesChanged
    );
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

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">{success}</div>}

      {/* Email Senders Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Email Senders</h2>
          <button
            type="button"
            onClick={openAddEmailDialog}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
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
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProviderBadgeColor(email.emailProvider)}`}
                      >
                        {email.emailProvider}
                      </span>
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
                          onClick={() => handleDeleteEmail(email.id)}
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
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
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
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">
                          {isEditMode ? "Edit Email Sender" : "Add Email Sender"}
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={closeEmailDialog}
                            className="relative rounded-md text-indigo-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
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
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                                placeholder="sender@example.com"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="provider" className="block text-sm/6 font-medium text-gray-900">
                              Email Provider
                            </label>
                            <div className="mt-2">
                              <select
                                id="provider"
                                name="provider"
                                value={emailFormData.emailProvider}
                                onChange={(e) => setEmailFormData({ ...emailFormData, emailProvider: e.target.value as EmailProvider })}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                              >
                                <option value="GMAIL">Gmail</option>
                                <option value="OUTLOOK">Outlook</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="refreshToken" className="block text-sm/6 font-medium text-gray-900">
                              Refresh Token (Optional)
                            </label>
                            <div className="mt-2">
                              <input
                                id="refreshToken"
                                name="refreshToken"
                                type="password"
                                value={emailFormData.refreshToken}
                                onChange={(e) => setEmailFormData({ ...emailFormData, refreshToken: e.target.value })}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                                placeholder="Enter OAuth2 refresh token"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Required for sending emails. Add this when creating or updating the email sender.
                              </p>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="alias" className="block text-sm/6 font-medium text-gray-900">
                              Email Aliases
                            </label>
                            <div className="mt-2">
                              <div className="flex gap-2">
                                <input
                                  id="alias"
                                  name="alias"
                                  type="email"
                                  value={aliasInput}
                                  onChange={(e) => setAliasInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addAlias();
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                                  placeholder="alias@example.com"
                                />
                                <button
                                  type="button"
                                  onClick={addAlias}
                                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                  Add
                                </button>
                              </div>
                              {emailFormData.aliases.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {emailFormData.aliases.map((alias, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700"
                                    >
                                      <span>{alias}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeAlias(alias)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="mt-1 text-xs text-gray-500">
                                Add email aliases that can be used as the "from" address when sending emails.
                              </p>
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
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
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
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">Send Test Email</DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={closeTestEmailDialog}
                            className="relative rounded-md text-indigo-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
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
                                onChange={(e) => {
                                  setTestEmailFormData({ ...testEmailFormData, fromEmail: e.target.value });
                                  setSelectedAlias(""); // Reset alias when email sender changes
                                }}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                              >
                                {emails.map((email) => (
                                  <option key={email.id} value={email.email}>
                                    {email.email} ({email.emailProvider})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {(() => {
                            const selectedEmailSender = emails.find(e => e.email === testEmailFormData.fromEmail);
                            const hasAliases = selectedEmailSender?.aliases && selectedEmailSender.aliases.length > 0;
                            
                            if (!hasAliases) {
                              return null;
                            }

                            return (
                              <div>
                                <label htmlFor="alias" className="block text-sm/6 font-medium text-gray-900">
                                  Alias
                                </label>
                                <div className="mt-2">
                                  <select
                                    id="alias"
                                    name="alias"
                                    value={selectedAlias}
                                    onChange={(e) => setSelectedAlias(e.target.value)}
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                                  >
                                    <option value="">{selectedEmailSender?.email} (Main Email)</option>
                                    {selectedEmailSender?.aliases?.map((alias, idx) => (
                                      <option key={idx} value={alias}>
                                        {alias} (Alias)
                                      </option>
                                    ))}
                                  </select>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Select an alias to send from, or use the main email.
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

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
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addToEmail();
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                                  placeholder="recipient@example.com"
                                />
                                <button
                                  type="button"
                                  onClick={addToEmail}
                                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
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
                                        onClick={() => setTestEmailFormData({ ...testEmailFormData, toEmails: testEmailFormData.toEmails.filter((_, i) => i !== idx) })}
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
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addCcEmail();
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                                  placeholder="cc@example.com"
                                />
                                <button
                                  type="button"
                                  onClick={addCcEmail}
                                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
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
                                        onClick={() => setTestEmailFormData({ ...testEmailFormData, ccEmails: testEmailFormData.ccEmails.filter((_, i) => i !== idx) })}
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
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addBccEmail();
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                                  placeholder="bcc@example.com"
                                />
                                <button
                                  type="button"
                                  onClick={addBccEmail}
                                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
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
                                        onClick={() => setTestEmailFormData({ ...testEmailFormData, bccEmails: testEmailFormData.bccEmails.filter((_, i) => i !== idx) })}
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
                                onChange={(e) => setTestEmailFormData({ ...testEmailFormData, subject: e.target.value })}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
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
                                onChange={(e) => setTestEmailFormData({ ...testEmailFormData, content: e.target.value })}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
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
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
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
                      className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
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
    </div>
  );
};

export default AppSettings;
