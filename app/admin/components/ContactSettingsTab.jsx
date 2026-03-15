"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

const API_URL = "";

export default function ContactSettingsTab() {
  const [contactSettings, setContactSettings] = useState({
    studioLocation: "Bel Air Riviere Seche, Mauritius",
    email: "info@venicewoodltd.com",
    phone: "+230 5712 3456",
    responseTime: "We typically respond within 24 hours.",
    facebookUrl: "",
    whatsappNumber: "+23057123456",
    instagramUrl: "",
    footerText:
      "Premium bespoke woodwork and custom carpentry in Mauritius. Excellence in every detail.",
  });
  const [editedSettings, setEditedSettings] = useState({ ...contactSettings });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();

  const adminToken =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";

  // Fetch contact settings
  const fetchContactSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/contact`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch contact settings");

      const data = await response.json();
      if (data.success) {
        setContactSettings(data.data || contactSettings);
        setEditedSettings(data.data || contactSettings);
      }
    } catch (err) {
      setError(`Error loading contact settings: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle field change
  const handleFieldChange = (field, value) => {
    setEditedSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (
      !editedSettings.studioLocation ||
      !editedSettings.email ||
      !editedSettings.phone ||
      !editedSettings.responseTime
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/contact`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(editedSettings),
      });

      const data = await response.json();
      if (data.success) {
        setContactSettings(data.data);
        setSuccess("Contact settings saved successfully!");
        showToast({
          type: "success",
          title: "Settings Saved",
          message: "Contact settings saved successfully!",
        });
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to save settings");
        showToast({
          type: "error",
          title: "Save Failed",
          message: data.message || "Failed to save settings",
        });
      }
    } catch (err) {
      setError(`Error saving settings: ${err.message}`);
      showToast({ type: "error", title: "Save Error", message: err.message });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditedSettings({ ...contactSettings });
    setIsEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600">Loading contact settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#3e2723]">
          Contact Information
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
          >
            Edit Settings
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
        <p className="font-semibold mb-1">About Contact Settings</p>
        <p>
          These settings are displayed in the footer of the website and are also
          used for contact form responses. Update them to keep your contact
          information current.
        </p>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] p-6">
        <div className="space-y-6">
          {/* Studio Location */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Studio Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedSettings.studioLocation}
                onChange={(e) =>
                  handleFieldChange("studioLocation", e.target.value)
                }
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                placeholder="Enter studio location"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                {contactSettings.studioLocation}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editedSettings.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                placeholder="Enter email address"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                <a
                  href={`mailto:${contactSettings.email}`}
                  className="text-[#4e342e] hover:underline"
                >
                  {contactSettings.email}
                </a>
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editedSettings.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                placeholder="Enter phone number"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                <a
                  href={`tel:${contactSettings.phone.replace(/\s/g, "")}`}
                  className="text-[#4e342e] hover:underline"
                >
                  {contactSettings.phone}
                </a>
              </p>
            )}
          </div>

          {/* Response Time */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Response Time Message
            </label>
            {isEditing ? (
              <textarea
                value={editedSettings.responseTime}
                onChange={(e) =>
                  handleFieldChange("responseTime", e.target.value)
                }
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                placeholder="Enter response time message"
                rows="3"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                {contactSettings.responseTime}
              </p>
            )}
          </div>

          {/* Footer Text */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Footer Description Text
            </label>
            {isEditing ? (
              <textarea
                value={editedSettings.footerText || ""}
                onChange={(e) =>
                  handleFieldChange("footerText", e.target.value)
                }
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                placeholder="Enter footer description text"
                rows="3"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                {contactSettings.footerText || (
                  <span className="text-gray-400 italic">
                    Using default text
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Displayed below &quot;VENICE WOOD LTD&quot; in the website footer.
            </p>
          </div>

          {/* Social Media Section */}
          <div className="pt-4 border-t border-[#d7ccc8]">
            <h4 className="text-md font-semibold text-[#3e2723] mb-4">
              Social Media Links
            </h4>

            {/* Facebook URL */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Facebook Page URL
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={editedSettings.facebookUrl || ""}
                  onChange={(e) =>
                    handleFieldChange("facebookUrl", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                  placeholder="https://facebook.com/yourpage"
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                  {contactSettings.facebookUrl ? (
                    <a
                      href={contactSettings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4e342e] hover:underline"
                    >
                      {contactSettings.facebookUrl}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                WhatsApp Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedSettings.whatsappNumber || ""}
                  onChange={(e) =>
                    handleFieldChange("whatsappNumber", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                  placeholder="+23057123456"
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                  {contactSettings.whatsappNumber || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Used for WhatsApp inquiry buttons. Include country code without
                spaces (e.g., +23057123456)
              </p>
            </div>

            {/* Instagram URL */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Instagram URL
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={editedSettings.instagramUrl || ""}
                  onChange={(e) =>
                    handleFieldChange("instagramUrl", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] focus:ring-2 focus:ring-[#4e342e]/20"
                  placeholder="https://instagram.com/yourpage"
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                  {contactSettings.instagramUrl ? (
                    <a
                      href={contactSettings.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4e342e] hover:underline"
                    >
                      {contactSettings.instagramUrl}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-[#3e2723] mb-4">
          Footer Preview
        </h4>
        <div className="bg-white border border-[#d7ccc8] rounded-lg p-6 shadow-lg">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-[#4e342e] uppercase tracking-wider text-xs">
                Contact
              </p>
              <p className="text-gray-600 mt-2">
                {isEditing
                  ? editedSettings.studioLocation
                  : contactSettings.studioLocation}
              </p>
              <p className="mt-2">
                <a
                  href={`tel:${(isEditing
                    ? editedSettings.phone
                    : contactSettings.phone
                  ).replace(/\s/g, "")}`}
                  className="text-gray-600 hover:text-[#4e342e] transition duration-300"
                >
                  {isEditing ? editedSettings.phone : contactSettings.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${
                    isEditing ? editedSettings.email : contactSettings.email
                  }`}
                  className="text-gray-600 hover:text-[#4e342e] transition duration-300"
                >
                  {isEditing ? editedSettings.email : contactSettings.email}
                </a>
              </p>
            </div>
            <div className="pt-3 border-t border-[#d7ccc8]">
              <p className="text-xs font-semibold text-[#4e342e] uppercase tracking-wider mb-2">
                Response Time
              </p>
              <p className="text-gray-600 text-xs">
                {isEditing
                  ? editedSettings.responseTime
                  : contactSettings.responseTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
