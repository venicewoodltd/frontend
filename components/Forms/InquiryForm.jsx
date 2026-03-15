"use client";

import { useState, useEffect, useRef } from "react";

const API_URL = "";

export default function InquiryForm({ productName = "" }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    timeline: "",
    message: productName ? `I am interested in: ${productName}\n\n` : "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [contactInfo, setContactInfo] = useState({
    studioLocation: "Bel Air Riviere Seche, Mauritius",
    email: "info@venicewoodltd.com",
    phone: "+230 5712 3456",
    responseTime: "We typically respond within 24 hours.",
  });
  const [contactLoading, setContactLoading] = useState(true);
  const [inquiryCategories, setInquiryCategories] = useState([]);
  const emailjsRef = useRef(null);

  useEffect(() => {
    import("@emailjs/browser").then((mod) => {
      const emailjs = mod.default || mod;
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
      emailjsRef.current = emailjs;
    });

    const fetchContactSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/contact/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setContactInfo(data.data);
          }
        }
      } catch {
        // Use default contact info
      } finally {
        setContactLoading(false);
      }
    };

    fetchContactSettings();

    const fetchInquiryCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories?type=inquiry`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.categories?.length > 0) {
            setInquiryCategories(data.categories);
          }
        }
      } catch {
        // Use default hardcoded categories
      }
    };
    fetchInquiryCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          projectType: formData.projectType,
          timeline: formData.timeline || null,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to submit inquiry",
        );
      }

      // Send email notification via EmailJS
      try {
        if (emailjsRef.current) {
          await emailjsRef.current.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
            process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
            {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || "Not provided",
              title: formData.projectType,
              timeline: formData.timeline || "Not specified",
              message: formData.message,
            },
            process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
          );
        }
      } catch {
        // Email notification failed but inquiry was saved to database
      }

      setSubmitted(true);

      setFormData({
        name: "",
        email: "",
        phone: "",
        projectType: "",
        timeline: "",
        message: "",
      });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit inquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="contact" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-amber-50 rounded-xl shadow-lg p-6 border border-amber-100">
              <h3 className="text-xl font-bold font-serif text-amber-900 mb-6">
                Get in Touch
              </h3>

              {contactLoading ? (
                <p className="text-sm text-gray-600">Loading contact info...</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-2">
                      Studio Location
                    </p>
                    <p className="text-sm text-gray-600">
                      {contactInfo.studioLocation}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-2">
                      Email
                    </p>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-sm text-amber-900 hover:underline"
                    >
                      {contactInfo.email}
                    </a>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-2">
                      Phone
                    </p>
                    <a
                      href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                      className="text-sm text-amber-900 hover:underline"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-2">
                      Response Time
                    </p>
                    <p className="text-sm text-gray-600">
                      {contactInfo.responseTime}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-amber-100">
              <h3 className="text-2xl font-bold font-serif text-amber-900 mb-6">
                Send Us an Inquiry
              </h3>

              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-semibold">
                    Thank you for your inquiry! {contactInfo.responseTime}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-amber-200 rounded-lg text-gray-800 focus:ring-amber-900 focus:border-amber-900 transition duration-300"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-amber-200 rounded-lg text-gray-800 focus:ring-amber-900 focus:border-amber-900 transition duration-300"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-amber-200 rounded-lg text-gray-800 focus:ring-amber-900 focus:border-amber-900 transition duration-300"
                      placeholder="+230 5712 3456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Project Type *
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-amber-200 rounded-lg text-gray-800 focus:ring-amber-900 focus:border-amber-900 transition duration-300"
                    >
                      <option value="">Select a project type</option>
                      {inquiryCategories.length > 0 ? (
                        inquiryCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="furniture">Custom Furniture</option>
                          <option value="architectural">
                            Architectural Millwork
                          </option>
                          <option value="interiors">Interior Design</option>
                          <option value="restoration">Restoration</option>
                          <option value="marine">Marine Joinery</option>
                          <option value="other">Other</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    Desired Timeline
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-amber-200 rounded-lg text-gray-800 focus:ring-amber-900 focus:border-amber-900 transition duration-300"
                  >
                    <option value="">Select timeline</option>
                    <option value="urgent">1-3 months</option>
                    <option value="standard">3-6 months</option>
                    <option value="flexible">6-12 months</option>
                    <option value="custom">Custom timeline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    Project Description *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-amber-200 rounded-lg text-gray-800 focus:ring-amber-900 focus:border-amber-900 transition duration-300"
                    placeholder="Tell us about your vision. What are you hoping to create? Any specific materials, dimensions, or inspirations?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-3 font-semibold rounded-lg uppercase tracking-widest transition duration-300 ${
                    loading
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-amber-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {loading ? "Submitting..." : "Send Inquiry"}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  We respect your privacy. Your information will not be shared
                  with third parties.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
