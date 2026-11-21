
import React, { useState } from "react";
import {
  Store,
  User,
  Monitor,
  Receipt,
  Bell,
  Shield,
  Save,
} from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("store");

  const [settings, setSettings] = useState({
    storeName: "My POS Store",
    storeAddress: "Tanza, Cavite",
    contactNumber: "",
    email: "",
    username: "admin",
    currency: "PHP",
    taxRate: "0",
    receiptFooter: "Thank you for shopping!",
    showLogo: true,
    lowStockAlert: true,
    soundEffects: false,
  });

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Connect this to your backend API to persist settings.
    console.log("Settings saved:", settings);
    alert("Settings saved successfully!");
  };

  const tabs = [
    { id: "store", label: "Store Information", icon: Store },
    { id: "account", label: "Account", icon: User },
    { id: "pos", label: "POS Preferences", icon: Monitor },
    { id: "receipt", label: "Receipt", icon: Receipt },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  const renderInput = (
    label: string,
    key: keyof typeof settings,
    placeholder = ""
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        className={inputClass}
        value={settings[key] as string}
        placeholder={placeholder}
        onChange={(e) => updateSetting(key, e.target.value)}
      />
    </div>
  );

  const renderToggle = (
    label: string,
    description: string,
    key: "showLogo" | "lowStockAlert" | "soundEffects"
  ) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => updateSetting(key, !settings[key])}
        className={`relative w-11 h-6 rounded-full transition ${
          settings[key] ? "bg-blue-600" : "bg-gray-300"
        }`}
        aria-label={`Toggle ${label}`}
        aria-pressed={settings[key]}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
            settings[key] ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">
              Manage your store and POS system preferences.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="bg-white rounded-xl border border-gray-200 p-3 h-fit">
            <p className="text-xs font-semibold text-gray-400 uppercase px-3 py-2">
              General Settings
            </p>

            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <main className="bg-white rounded-xl border border-gray-200 p-5 md:p-8">
            {activeTab === "store" && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">
                  Store Information
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Update your business details.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {renderInput("Store Name", "storeName")}
                  {renderInput("Contact Number", "contactNumber")}
                  {renderInput("Email Address", "email")}
                  {renderInput("Store Address", "storeAddress")}
                </div>
              </section>
            )}

            {activeTab === "account" && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Settings
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Manage your account information.
                </p>

                <div className="max-w-xl space-y-5">
                  {renderInput("Username", "username")}
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="Enter a new password"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === "pos" && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">
                  POS Preferences
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Configure your point-of-sale behavior.
                </p>

                <div className="max-w-xl space-y-5">
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      className={inputClass}
                      value={settings.currency}
                      onChange={(e) =>
                        updateSetting("currency", e.target.value)
                      }
                    >
                      <option value="PHP">PHP - Philippine Peso (₱)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                    </select>
                  </div>

                  {renderInput("Tax Rate (%)", "taxRate")}

                  {renderToggle(
                    "Sound Effects",
                    "Play sounds when scanning or adding products.",
                    "soundEffects"
                  )}
                </div>
              </section>
            )}

            {activeTab === "receipt" && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">
                  Receipt Settings
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Customize the information printed on receipts.
                </p>

                <div className="max-w-xl space-y-5">
                  {renderToggle(
                    "Show Store Logo",
                    "Display your store logo on printed receipts.",
                    "showLogo"
                  )}

                  <div>
                    <label className={labelClass}>Receipt Footer Message</label>
                    <textarea
                      className={inputClass}
                      rows={4}
                      value={settings.receiptFooter}
                      onChange={(e) =>
                        updateSetting("receiptFooter", e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === "notifications" && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Choose which alerts you want to receive.
                </p>

                <div className="max-w-xl">
                  {renderToggle(
                    "Low Stock Alert",
                    "Notify when a product is running low on stock.",
                    "lowStockAlert"
                  )}
                </div>
              </section>
            )}

            {activeTab === "security" && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">
                  Security
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Review account security options.
                </p>

                <div className="max-w-xl space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-800">
                      Change Password
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Update your account password regularly.
                    </p>
                    <button
                      className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                      onClick={() => setActiveTab("account")}
                    >
                      Manage Password
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-800">
                      Session Management
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Sign out of your account when using a shared device.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;
