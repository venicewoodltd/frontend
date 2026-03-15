"use client";

import { useState, useEffect } from "react";

const API_URL = "";

const FooterContact = () => {
  const [contactInfo, setContactInfo] = useState({
    studioLocation: "Bel Air Riviere Seche, Mauritius",
    email: "info@venicewoodltd.com",
    phone: "+230 5712 3456",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/contact/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) setContactInfo(data.data);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchContactSettings();
  }, []);

  if (loading) {
    return (
      <div>
        <h4 className="font-semibold text-[#4e342e] mb-4 uppercase tracking-wider">
          Contact
        </h4>
        <address className="not-italic space-y-2 text-sm text-gray-600">
          Loading...
        </address>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-[#4e342e] mb-4 uppercase tracking-wider">
        Contact
      </h4>
      <address className="not-italic space-y-2">
        <p className="text-gray-600">{contactInfo.studioLocation}</p>
        <p>
          <a
            href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
            className="text-gray-600 hover:text-[#4e342e] transition duration-300"
          >
            {contactInfo.phone}
          </a>
        </p>
        <p>
          <a
            href={`mailto:${contactInfo.email}`}
            className="text-gray-600 hover:text-[#4e342e] transition duration-300"
          >
            {contactInfo.email}
          </a>
        </p>
      </address>
    </div>
  );
};

export default FooterContact;
