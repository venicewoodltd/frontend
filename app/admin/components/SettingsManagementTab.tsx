"use client";

import { useState } from "react";
import HeroSettingsTab from "./HeroSettingsTab";
import ContactSettingsTab from "./ContactSettingsTab";
import MasteryManagementTab from "./MasteryManagementTab";
import LegalPagesTab from "./LegalPagesTab";
import FaqSettingsTab from "./FaqSettingsTab";
import BackupManagementTab from "./BackupManagementTab";

type SettingsSubTab = "hero" | "contact" | "mastery" | "legal" | "faq" | "backups";

export default function SettingsManagementTab() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>("hero");

  const subTabs = [
    { id: "hero" as SettingsSubTab, label: "Hero Images" },
    { id: "contact" as SettingsSubTab, label: "Contact Settings" },
    { id: "faq" as SettingsSubTab, label: "FAQ Management" },
    { id: "mastery" as SettingsSubTab, label: "Mastery Page" },
    { id: "legal" as SettingsSubTab, label: "Legal Pages" },
    { id: "backups" as SettingsSubTab, label: "Backups" },
  ];

  return (
    <div className="p-6">
      {/* Header with Sub-tabs */}
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-4">
          Settings Management
        </h1>

        {/* Sub-tab Navigation */}
        <div className="flex gap-2 border-b border-[#d7ccc8]">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition-colors duration-200 border-b-2 -mb-px ${
                activeSubTab === tab.id
                  ? "border-[#4e342e] text-[#4e342e] bg-[#fcfaf6]"
                  : "border-transparent text-gray-600 hover:text-[#4e342e] hover:bg-[#fcfaf6]/50"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] -mt-2">
        {activeSubTab === "hero" && (
          <div className="p-0">
            <HeroSettingsTab />
          </div>
        )}

        {activeSubTab === "contact" && (
          <div className="p-0">
            <ContactSettingsTab />
          </div>
        )}

        {activeSubTab === "mastery" && (
          <div className="p-0">
            <MasteryManagementTab />
          </div>
        )}

        {activeSubTab === "legal" && (
          <div className="p-0">
            <LegalPagesTab />
          </div>
        )}

        {activeSubTab === "faq" && (
          <div className="p-0">
            <FaqSettingsTab />
          </div>
        )}

        {activeSubTab === "backups" && (
          <div className="p-0">
            <BackupManagementTab />
          </div>
        )}
      </div>
    </div>
  );
}
