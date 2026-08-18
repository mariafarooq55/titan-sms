import { useEffect, useState } from "react";
import PortalLayout from "../../components/PortalLayout";
import api from "../../api/client";
import {
  IconGrid,
  IconUsers,
  IconCheckSquare,
  IconCalendar,
  IconUser,
  IconEdit,
} from "../../components/icons";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: IconGrid },
  { label: "Students", href: "/admin/students", icon: IconUsers },
  { label: "Attendance", href: "/admin/attendance", icon: IconCheckSquare },
  { label: "Slots", href: "/admin/slots", icon: IconCalendar },
  { label: "Trainers", href: "/admin/trainers", icon: IconUsers },
  { label: "Setup", href: "/admin/setup", icon: IconEdit },
  { label: "Updation", href: "/admin/updation", icon: IconEdit },
  { label: "Profile", href: "/admin/profile", icon: IconUser },
];

export default function AdminSetup() {
  const [activeTab, setActiveTab] = useState("countries");

  const tabs = [
    {
      key: "countries",
      label: "Countries",
      endpoint: "/api/setup/countries",
    },
    {
      key: "cities",
      label: "Cities",
      endpoint: "/api/setup/cities",
    },
    {
      key: "campuses",
      label: "Campuses",
      endpoint: "/api/setup/campuses",
    },
    {
      key: "courses",
      label: "Courses",
      endpoint: "/api/setup/courses",
    },
  ];

  return (
    <PortalLayout title="Admin Panel" navItems={NAV}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Setup</h1>

        <p className="text-sm text-slate-500 mt-1">
          Manage countries, cities, campuses and courses used throughout the
          system.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-titan-500 text-titan-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === "countries" && <Countries />}
          {activeTab === "cities" && <Cities />}
          {activeTab === "campuses" && <Campuses />}
          {activeTab === "courses" && <Courses />}
        </div>
      </div>
    </PortalLayout>
  );
}

/* ============================================================
   GENERIC SECTION
============================================================ */

function SetupSection({
  title,
  placeholder,
  endpoint,
  items,
  setItems,
  renderItem,
}) {
  const [value, setValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(endpoint);

      setItems(data?.items || []);
    } catch (err) {
      setError(getErrorMessage(err, `Could not load ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    const name = value.trim();

    if (!name) {
      setError(`${title.slice(0, -1)} name is required.`);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data } = await api.post(endpoint, {
        name,
      });

      if (data?.item) {
        setItems((prev) => [...prev, data.item]);
      } else {
        await loadItems();
      }

      setValue("");
      setMessage(`${title.slice(0, -1)} added successfully.`);
    } catch (err) {
      setError(getErrorMessage(err, `Could not add ${title.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id) {
    const name = editValue.trim();

    if (!name) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data } = await api.put(`${endpoint}/${id}`, {
        name,
      });

      if (data?.item) {
        setItems((prev) =>
          prev.map((item) =>
            String(item.id) === String(id) ? data.item : item,
          ),
        );
      } else {
        await loadItems();
      }

      setEditingId(null);
      setEditValue("");
      setMessage("Updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update item."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`${endpoint}/${id}`);

      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));

      setMessage("Deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete item."));
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        <p className="text-sm text-slate-500 mt-1">
          Add and manage {title.toLowerCase()}.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addItem();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
        />

        <button
          type="button"
          onClick={addItem}
          disabled={saving}
          className="px-5 py-2 rounded-md bg-titan-500 text-white text-sm font-medium hover:bg-titan-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : `Add ${title.slice(0, -1)}`}
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <span className="text-xs font-medium uppercase text-slate-500">
              {title.slice(0, -1)}
            </span>

            <span className="text-xs font-medium uppercase text-slate-500">
              Actions
            </span>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No {title.toLowerCase()} added yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const id = item.id;
              const name = item.name;

              return (
                <div
                  key={id}
                  className="px-4 py-3 grid grid-cols-[1fr_auto] gap-4 items-center"
                >
                  {editingId === id ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      autoFocus
                    />
                  ) : (
                    <div>{renderItem ? renderItem(item) : name}</div>
                  )}

                  <div className="flex items-center gap-2">
                    {editingId === id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateItem(id)}
                          disabled={saving}
                          className="text-xs font-medium px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditValue("");
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(id);
                            setEditValue(name || "");
                            setError("");
                            setMessage("");
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteItem(id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || "Invalid request").join(", ");
  }

  return fallback;
}

/* ============================================================
   COUNTRIES
============================================================ */

function Countries() {
  const [items, setItems] = useState([]);

  return (
    <SetupSection
      title="Countries"
      placeholder="Enter country name"
      endpoint="/api/setup/countries"
      items={items}
      setItems={setItems}
    />
  );
}

/* ============================================================
   CITIES
============================================================ */

function Cities() {
  const [items, setItems] = useState([]);

  return (
    <SetupSection
      title="Cities"
      placeholder="Enter city name"
      endpoint="/api/setup/cities"
      items={items}
      setItems={setItems}
    />
  );
}

/* ============================================================
   CAMPUSES
============================================================ */

function Campuses() {
  const [items, setItems] = useState([]);

  return (
    <SetupSection
      title="Campuses"
      placeholder="Enter campus name"
      endpoint="/api/setup/campuses"
      items={items}
      setItems={setItems}
    />
  );
}

/* ============================================================
   COURSES
============================================================ */

function Courses() {
  const [items, setItems] = useState([]);

  return (
    <SetupSection
      title="Courses"
      placeholder="Enter course name"
      endpoint="/api/setup/courses"
      items={items}
      setItems={setItems}
    />
  );
}
