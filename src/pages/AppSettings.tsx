import React, { useState, useEffect } from "react";
import { XMarkIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { emailService } from "../services/emailService";
import { domainService } from "../services/domainService";
import { configService } from "../services/configService";
import { referenceDataService, type Country, type Currency, type Language } from "../services/referenceDataService";
import type { EmailSender, Domain, CreateEmailRequest, UpdateEmailRequest, SendTestEmailRequest, CreateDomainRequest } from "../types";
import SuccessBanner from "../components/SuccessBanner";
import ErrorBanner from "../components/ErrorBanner";
import ConfirmationDialog from "../components/ConfirmationDialog";

const AppSettings: React.FC = () => {
  const [emails, setEmails] = useState<EmailSender[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
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
  const [emailName, setEmailName] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [useDirectEmail, setUseDirectEmail] = useState(false);

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

  // Domain management dialog state
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [domainFormData, setDomainFormData] = useState({
    domain: "",
  });
  const [deleteDomainDialogOpen, setDeleteDomainDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);

  // Reference data state
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingReferenceData, setLoadingReferenceData] = useState(false);
  const [searchTerm, setSearchTerm] = useState({ countries: '', currencies: '', languages: '' });
  const [activeTab, setActiveTab] = useState<'countries' | 'currencies' | 'languages'>('countries');

  useEffect(() => {
    loadEmails();
    loadDomains();
    loadConfig();
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      setLoadingReferenceData(true);
      const [countriesData, currenciesData, languagesData] = await Promise.all([
        referenceDataService.getCountries(),
        referenceDataService.getCurrencies(),
        referenceDataService.getLanguages()
      ]);
      setCountries(countriesData.countries);
      setCurrencies(currenciesData.currencies);
      setLanguages(languagesData.languages);
    } catch (err: any) {
      console.error('Failed to load reference data:', err);
      setError(err.response?.data?.error || 'Failed to load reference data');
    } finally {
      setLoadingReferenceData(false);
    }
  };

  const handleToggleImportant = async (type: 'countries' | 'currencies' | 'languages', id: number, currentValue: boolean) => {
    try {
      setError(null);
      const newValue = !currentValue;
      
      if (type === 'countries') {
        await referenceDataService.updateCountryImportant(id, newValue);
        setCountries(countries.map(c => c.id === id ? { ...c, important: newValue } : c));
      } else if (type === 'currencies') {
        await referenceDataService.updateCurrencyImportant(id, newValue);
        setCurrencies(currencies.map(c => c.id === id ? { ...c, important: newValue } : c));
      } else {
        await referenceDataService.updateLanguageImportant(id, newValue);
        setLanguages(languages.map(l => l.id === id ? { ...l, important: newValue } : l));
      }
      
      setSuccess(`${type === 'countries' ? 'Country' : type === 'currencies' ? 'Currency' : 'Language'} marked as ${newValue ? 'important' : 'not important'}`);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to update ${type}`);
    }
  };

  const filterItems = <T extends { name: string; code?: string }>(items: T[], searchTerm: string): T[] => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(term) || 
      (item.code && item.code.toLowerCase().includes(term))
    );
  };

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

  const loadDomains = async () => {
    try {
      const data = await domainService.getAllDomains();
      setDomains(data.domains);
    } catch (err: any) {
      console.error("Failed to load domains:", err);
    }
  };

  const openAddEmailDialog = () => {
    setSelectedEmail(null);
    setIsEditMode(false);
    setEmailFormData({ email: "" });
    setEmailName("");
    setSelectedDomainId(domains.length > 0 ? domains[0].id : null);
    setUseDirectEmail(false);
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
    setEmailName("");
    setSelectedDomainId(null);
    setUseDirectEmail(false);
    setError(null);
    setSuccess(null);
  };

  const handleSaveEmail = async () => {
    try {
      setError(null);

      let finalEmail = "";
      if (useDirectEmail || emailFormData.email.includes("@")) {
        finalEmail = emailFormData.email.trim();
      } else {
        if (!emailName.trim()) {
          setError("Email name is required");
          return;
        }
        if (!selectedDomainId) {
          setError("Domain is required");
          return;
        }
        const selectedDomain = domains.find(d => d.id === selectedDomainId);
        if (!selectedDomain) {
          setError("Selected domain not found");
          return;
        }
        finalEmail = `${emailName.trim()}@${selectedDomain.domain}`;
      }

      if (!finalEmail) {
        setError("Email is required");
        return;
      }

      if (isEditMode && selectedEmail) {
        const updateData: UpdateEmailRequest = {
          email: finalEmail,
        };
        await emailService.updateEmail(selectedEmail.id, updateData);
        setSuccess("Email sender updated successfully");
      } else {
        const createData: CreateEmailRequest = {
          email: finalEmail,
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

  // Calculate email preview
  const getEmailPreview = (): string => {
    if (useDirectEmail || emailFormData.email.includes("@")) {
      return emailFormData.email;
    }
    if (!emailName.trim() || !selectedDomainId) {
      return "";
    }
    const selectedDomain = domains.find(d => d.id === selectedDomainId);
    if (!selectedDomain) {
      return "";
    }
    return `${emailName.trim()}@${selectedDomain.domain}`;
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

  // Keyboard handler for email dialog
  const handleEmailDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      if ((!isEditMode || hasEmailFormChanges()) && emailDialogOpen) {
        handleSaveEmail();
      }
    } else if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      // Prevent Enter from closing dialog when typing in input fields (but allow in textareas)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // Keyboard handler for domain dialog
  const handleDomainDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      if (domainDialogOpen && domainFormData.domain.trim()) {
        handleSaveDomain();
      }
    } else if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      // Prevent Enter from closing dialog when typing in input fields (but allow in textareas)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // Keyboard handler for test email dialog
  const handleTestEmailDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      if (testEmailDialogOpen && !sendingTestEmail) {
        handleSendTestEmail();
      }
    } else if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      // Prevent Enter from closing dialog when typing in input fields (but allow in textareas)
      // Email inputs have their own handlers for adding emails, so we don't prevent default there
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "email") {
        // Let email inputs handle Enter for adding emails
        return;
      }
      if (target.tagName === "INPUT" || target.tagName === "SELECT") {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // Domain management functions
  const openAddDomainDialog = () => {
    setDomainFormData({ domain: "" });
    setDomainDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const closeDomainDialog = () => {
    setDomainDialogOpen(false);
    setDomainFormData({ domain: "" });
    setError(null);
    setSuccess(null);
  };

  const handleSaveDomain = async () => {
    try {
      setError(null);

      if (!domainFormData.domain.trim()) {
        setError("Domain is required");
        return;
      }

      const createData: CreateDomainRequest = {
        domain: domainFormData.domain.trim(),
      };
      await domainService.createDomain(createData);
      setSuccess("Domain created successfully");
      await loadDomains();
      setTimeout(() => {
        closeDomainDialog();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create domain");
    }
  };

  const openDeleteDomainDialog = (domain: Domain) => {
    setDomainToDelete(domain);
    setDeleteDomainDialogOpen(true);
  };

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;

    try {
      setError(null);
      await domainService.deleteDomain(domainToDelete.id);
      setSuccess("Domain deleted successfully");
      setDeleteDomainDialogOpen(false);
      setDomainToDelete(null);
      await loadDomains();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete domain");
      setDeleteDomainDialogOpen(false);
      setDomainToDelete(null);
    }
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

      {/* Domains Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Email Domains</h2>
          <button
            type="button"
            onClick={openAddDomainDialog}
            className="inline-flex items-center rounded-md bg-primary-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 cursor-pointer"
          >
            Add Domain
          </button>
        </div>

        {domains.length === 0 ? (
          <div className="bg-white shadow-xs rounded-xl p-8 text-center">
            <p className="text-gray-500">No domains configured. Add one to get started.</p>
          </div>
        ) : (
          <ul
            role="list"
            className="divide-y divide-gray-100 overflow-hidden bg-white shadow-xs outline-1 outline-gray-900/5 sm:rounded-xl"
          >
            {domains.map((domain) => (
              <li key={domain.id} className="relative py-5 hover:bg-gray-50">
                <div className="px-4 sm:px-6 lg:px-8">
                  <div className="mx-auto flex max-w-4xl justify-between gap-x-6">
                    <div className="flex min-w-0 gap-x-4 items-center">
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm/6 font-semibold text-gray-900">{domain.domain}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Added {new Date(domain.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-4">
                      <button
                        type="button"
                        onClick={() => openDeleteDomainDialog(domain)}
                        className="text-gray-400 hover:text-red-600 cursor-pointer"
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
      <div className="mb-8">
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

      {/* Reference Data Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reference Data</h2>
        <div className="bg-white shadow-xs rounded-xl">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('countries')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'countries'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Countries
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('currencies')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'currencies'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Currencies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('languages')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'languages'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Languages
              </button>
            </nav>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm[activeTab]}
              onChange={(e) => setSearchTerm({ ...searchTerm, [activeTab]: e.target.value })}
              placeholder={`Search ${activeTab}...`}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
            />
          </div>

          {/* Content */}
          <div className="p-4">
            {loadingReferenceData ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {activeTab === 'countries' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Important</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterItems(countries, searchTerm.countries).map((country) => (
                        <tr key={country.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{country.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{country.code}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={country.important}
                              onChange={() => handleToggleImportant('countries', country.id, country.important)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeTab === 'currencies' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Important</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterItems(currencies, searchTerm.currencies).map((currency) => (
                        <tr key={currency.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{currency.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{currency.code}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{currency.symbol}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={currency.important}
                              onChange={() => handleToggleImportant('currencies', currency.id, currency.important)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeTab === 'languages' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Important</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterItems(languages, searchTerm.languages).map((language) => (
                        <tr key={language.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{language.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{language.code}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={language.important}
                              onChange={() => handleToggleImportant('languages', language.id, language.important)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
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
                <form 
                  className="relative flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  onKeyDown={handleEmailDialogKeyDown}
                  onSubmit={(e) => e.preventDefault()}
                >
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
                          {isEditMode ? (
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
                          ) : (
                            <>
                              {(() => {
                                const hasAtSymbol = emailFormData.email.includes("@");
                                const shouldUseDirect = useDirectEmail || hasAtSymbol;
                                
                                return (
                                  <>
                                    {!shouldUseDirect && domains.length > 0 ? (
                                      <>
                                        <div>
                                          <label htmlFor="emailName" className="block text-sm/6 font-medium text-gray-900">
                                            Email Name
                                          </label>
                                          <div className="mt-2">
                                            <input
                                              id="emailName"
                                              name="emailName"
                                              type="text"
                                              value={emailName}
                                              onChange={(e) => {
                                                setEmailName(e.target.value);
                                                if (e.target.value.includes("@")) {
                                                  setUseDirectEmail(true);
                                                  setEmailFormData({ email: e.target.value });
                                                }
                                              }}
                                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                              placeholder="admin"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label htmlFor="domain" className="block text-sm/6 font-medium text-gray-900">
                                            Domain
                                          </label>
                                          <div className="mt-2">
                                            <select
                                              id="domain"
                                              name="domain"
                                              value={selectedDomainId || ""}
                                              onChange={(e) => setSelectedDomainId(e.target.value ? parseInt(e.target.value) : null)}
                                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                            >
                                              {domains.map((domain) => (
                                                <option key={domain.id} value={domain.id}>
                                                  @{domain.domain}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                        {getEmailPreview() && (
                                          <div>
                                            <label className="block text-sm/6 font-medium text-gray-900">
                                              Email Preview
                                            </label>
                                            <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm text-gray-700">
                                              {getEmailPreview()}
                                            </div>
                                          </div>
                                        )}
                                        <div>
                                          <button
                                            type="button"
                                            onClick={() => setUseDirectEmail(true)}
                                            className="text-sm text-primary-600 hover:text-primary-800"
                                          >
                                            Or enter email directly
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
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
                                              onChange={(e) => {
                                                setEmailFormData({ ...emailFormData, email: e.target.value });
                                                if (!e.target.value.includes("@") && domains.length > 0) {
                                                  setUseDirectEmail(false);
                                                }
                                              }}
                                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                              placeholder="sender@example.com"
                                            />
                                          </div>
                                        </div>
                                        {domains.length > 0 && (
                                          <div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setUseDirectEmail(false);
                                                setEmailFormData({ email: "" });
                                                setEmailName("");
                                                setSelectedDomainId(domains[0].id);
                                              }}
                                              className="text-sm text-primary-600 hover:text-primary-800"
                                            >
                                              Or use name + domain
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
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
                <form 
                  className="relative flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  onKeyDown={handleTestEmailDialogKeyDown}
                  onSubmit={(e) => e.preventDefault()}
                >
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
      <ConfirmationDialog
        open={deleteEmailDialogOpen}
        onClose={() => {
          setDeleteEmailDialogOpen(false);
          setEmailToDelete(null);
        }}
        variant="red"
        title="Delete email sender"
        message={`Are you sure you want to delete ${emailToDelete?.email}? All of its data will be permanently removed. This action cannot be undone.`}
        confirmButtonText="Delete"
        onConfirm={handleDeleteEmail}
      />

      {/* Domain Management Dialog */}
      <Dialog open={domainDialogOpen} onClose={closeDomainDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <form 
                  className="relative flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  onKeyDown={handleDomainDialogKeyDown}
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-primary-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">
                          Add Domain
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={closeDomainDialog}
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
                            <label htmlFor="domain" className="block text-sm/6 font-medium text-gray-900">
                              Domain
                            </label>
                            <div className="mt-2">
                              <input
                                id="domain"
                                name="domain"
                                type="text"
                                value={domainFormData.domain}
                                onChange={(e) => setDomainFormData({ ...domainFormData, domain: e.target.value })}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-800 sm:text-sm/6"
                                placeholder="example.com"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Enter the domain without the @ symbol (e.g., example.com)
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
                      onClick={closeDomainDialog}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDomain}
                      className="ml-4 inline-flex justify-center rounded-md bg-primary-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Domain Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDomainDialogOpen}
        onClose={() => {
          setDeleteDomainDialogOpen(false);
          setDomainToDelete(null);
        }}
        variant="red"
        title="Delete domain"
        message={`Are you sure you want to delete ${domainToDelete?.domain}? This action cannot be undone. If any email senders are using this domain, deletion will be prevented.`}
        confirmButtonText="Delete"
        onConfirm={handleDeleteDomain}
      />
    </div>
  );
};

export default AppSettings;
