import React, { useState, useEffect } from "react";
import { Document, Page, Text, View, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import { emailService } from "../services/emailService";
import type { EmailSender } from "../types";
import SuccessBanner from "../components/SuccessBanner";
import ErrorBanner from "../components/ErrorBanner";
import logoImage from "../assets/Transparent_Image_5.png";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  content: {
    marginTop: 20,
    lineHeight: 1.6,
  },
});

interface PDFDocProps {
  content: string;
  title?: string;
  logoPath?: string;
}

const PDFDoc: React.FC<PDFDocProps> = ({ content, title, logoPath }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>{logoPath && <Image src={logoPath} style={styles.logo} />}</View>
        {title && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>{title}</Text>
          </View>
        )}
        <View style={styles.content}>
          <Text>{content}</Text>
        </View>
      </Page>
    </Document>
  );
};

const PDFGenerator: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("PDF Document");
  const [emailContent, setEmailContent] = useState("Please find the attached PDF document.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Email functionality state
  const [emails, setEmails] = useState<EmailSender[]>([]);
  const [fromEmail, setFromEmail] = useState("");
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [toEmailInput, setToEmailInput] = useState("");
  const [ccEmailInput, setCcEmailInput] = useState("");
  const [bccEmailInput, setBccEmailInput] = useState("");

  // Load email senders on mount
  useEffect(() => {
    const loadEmails = async () => {
      try {
        const data = await emailService.getAllEmails();
        setEmails(data.emails);
        if (data.emails.length > 0) {
          setFromEmail(data.emails[0].email);
        }
      } catch (error) {
        console.error("Error loading email senders:", error);
      }
    };
    loadEmails();
  }, []);

  // Convert logo image to data URL for react-pdf
  useEffect(() => {
    const convertImageToDataUrl = async () => {
      try {
        const response = await fetch(logoImage);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error loading logo:", error);
      }
    };
    convertImageToDataUrl();
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const sanitizeFileName = (fileName: string): string => {
    // Remove or replace invalid filename characters
    return (
      fileName
        .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .trim() || "document"
    ); // Default to 'document' if empty
  };

  const getFileName = (): string => {
    const sanitizedTitle = title.trim() ? sanitizeFileName(title.trim()) : "document";
    return `${sanitizedTitle}.pdf`;
  };

  const handlePreviewPDF = async () => {
    if (!content.trim()) {
      setErrorMessage("Please enter some content for the PDF.");
      return;
    }

    setErrorMessage(null);
    setShowPreview(true);

    try {
      const doc = <PDFDoc content={content} title={title.trim() || undefined} logoPath={logoDataUrl || undefined} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setErrorMessage("Failed to generate PDF preview. Please try again.");
      setShowPreview(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!content.trim()) {
      setErrorMessage("Please enter some content for the PDF.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const doc = <PDFDoc content={content} title={title.trim() || undefined} logoPath={logoDataUrl || undefined} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage("PDF generated and downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setErrorMessage("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addEmailToArray = (email: string, array: string[]): string[] | null => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && !array.includes(trimmedEmail)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(trimmedEmail)) {
        return [...array, trimmedEmail];
      } else {
        setErrorMessage(`Invalid email format: ${trimmedEmail}`);
        return null;
      }
    }
    return array;
  };

  const addToEmail = () => {
    const result = addEmailToArray(toEmailInput, toEmails);
    if (result !== null) {
      setToEmails(result);
      setToEmailInput("");
    }
  };

  const addCcEmail = () => {
    const result = addEmailToArray(ccEmailInput, ccEmails);
    if (result !== null) {
      setCcEmails(result);
      setCcEmailInput("");
    }
  };

  const addBccEmail = () => {
    const result = addEmailToArray(bccEmailInput, bccEmails);
    if (result !== null) {
      setBccEmails(result);
      setBccEmailInput("");
    }
  };

  const handleSendEmail = async () => {
    if (!content.trim()) {
      setErrorMessage("Please enter some content for the PDF.");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Add any pending email inputs to arrays
      let finalToEmails = [...toEmails];
      let finalCcEmails = [...ccEmails];
      let finalBccEmails = [...bccEmails];

      if (toEmailInput.trim()) {
        const result = addEmailToArray(toEmailInput, finalToEmails);
        if (result === null) {
          setIsSending(false);
          return;
        }
        finalToEmails = result;
      }

      if (ccEmailInput.trim()) {
        const result = addEmailToArray(ccEmailInput, finalCcEmails);
        if (result === null) {
          setIsSending(false);
          return;
        }
        finalCcEmails = result;
      }

      if (bccEmailInput.trim()) {
        const result = addEmailToArray(bccEmailInput, finalBccEmails);
        if (result === null) {
          setIsSending(false);
          return;
        }
        finalBccEmails = result;
      }

      if (finalToEmails.length === 0) {
        setErrorMessage("Please add at least one recipient email address.");
        setIsSending(false);
        return;
      }

      if (emails.length === 0) {
        setErrorMessage("No email senders configured. Please configure an email sender in settings.");
        setIsSending(false);
        return;
      }

      if (!fromEmail) {
        setErrorMessage("Please select a from email address.");
        setIsSending(false);
        return;
      }

      // Generate PDF blob
      const doc = <PDFDoc content={content} title={title.trim() || undefined} logoPath={logoDataUrl || undefined} />;
      const blob = await pdf(doc).toBlob();

      // Convert blob to File with title as filename
      const pdfFile = new File([blob], getFileName(), { type: "application/pdf" });

      // Send email with PDF attachment
      await emailService.sendTestEmail({
        fromEmail,
        toEmails: finalToEmails,
        ccEmails: finalCcEmails.length > 0 ? finalCcEmails : undefined,
        bccEmails: finalBccEmails.length > 0 ? finalBccEmails : undefined,
        subject,
        content: emailContent,
        attachments: [pdfFile],
      });

      setSuccessMessage("PDF generated and sent via email successfully!");
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Error sending email:", error);
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to send email. Please check your email configuration and try again.";
      setErrorMessage(errorMsg);
      setSuccessMessage(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Generator</h1>

      {errorMessage && (
        <div className="mb-4">
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </div>
      )}
      {successMessage && (
        <div className="mb-4">
          <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} />
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Content</h2>

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Document Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title (used as filename)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            This title will be used as the filename when downloading or sending the PDF.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Document Content
          </label>
          <textarea
            id="content"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the content for your PDF document..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePreviewPDF}
            disabled={isGenerating || isSending}
            className="px-4 py-2 bg-secondary-300 text-white rounded-md hover:bg-secondary-400 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview PDF
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating || isSending}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate & Download PDF"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send via Email</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 mb-2">
              From Email
            </label>
            <select
              id="fromEmail"
              value={fromEmail}
              onChange={(e) => {
                setFromEmail(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {emails.map((email) => (
                <option key={email.id} value={email.email}>
                  {email.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="toEmail" className="block text-sm font-medium text-gray-700 mb-2">
              To Email(s) *
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="toEmail"
                value={toEmailInput}
                onChange={(e) => setToEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToEmail();
                  }
                }}
                placeholder="recipient@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={addToEmail}
                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
            {toEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {toEmails.map((email, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => setToEmails(toEmails.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="ccEmail" className="block text-sm font-medium text-gray-700 mb-2">
              CC Email(s)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="ccEmail"
                autoComplete="email-cc"
                value={ccEmailInput}
                onChange={(e) => setCcEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCcEmail();
                  }
                }}
                placeholder="cc@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={addCcEmail}
                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
            {ccEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ccEmails.map((email, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => setCcEmails(ccEmails.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="bccEmail" className="block text-sm font-medium text-gray-700 mb-2">
              BCC Email(s)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="bccEmail"
                autoComplete="email-bcc"
                value={bccEmailInput}
                onChange={(e) => setBccEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBccEmail();
                  }
                }}
                placeholder="bcc@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={addBccEmail}
                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
            {bccEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {bccEmails.map((email, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => setBccEmails(bccEmails.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="emailContent" className="block text-sm font-medium text-gray-700 mb-2">
              Email Content
            </label>
            <textarea
              id="emailContent"
              rows={4}
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Email message content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            onClick={handleSendEmail}
            disabled={isGenerating || isSending || emails.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? "Sending..." : "Generate & Send PDF via Email"}
          </button>
          {emails.length === 0 && (
            <p className="text-sm text-gray-500">
              No email senders configured. Please configure an email sender in settings.
            </p>
          )}
        </div>
      </div>

      {/* PDF Preview */}
      {showPreview && previewUrl && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
            <button
              onClick={() => {
                setShowPreview(false);
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
            >
              Close Preview
            </button>
          </div>
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <iframe src={previewUrl} className="w-full h-96 border border-gray-300 rounded" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFGenerator;
