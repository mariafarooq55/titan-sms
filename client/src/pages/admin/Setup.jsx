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
    { key: "countries", label: "Countries" },
    { key: "cities", label: "Cities" },
    { key: "campuses", label: "Campuses" },
    { key: "courses", label: "Courses" },
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
                type="button"
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
   ERROR HELPER
============================================================ */

function getErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item?.loc && Array.isArray(item.loc)) {
          const field = item.loc[item.loc.length - 1];
          return `${field}: ${item?.msg || "Invalid request"}`;
        }

        return item?.msg || "Invalid request";
      })
      .join(", ");
  }

  return fallback;
}

/* ============================================================
   HELPERS
============================================================ */

function singular(title) {
  if (title === "Cities") return "City";
  if (title === "Countries") return "Country";
  if (title === "Campuses") return "Campus";
  if (title === "Courses") return "Course";

  return title.endsWith("s") ? title.slice(0, -1) : title;
}

/* ============================================================
   GENERIC NAME SECTION
   USED BY COUNTRIES AND COURSES
============================================================ */

function NameSetupSection({ title, placeholder, endpoint, items, setItems }) {
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
      setError(`${singular(title)} name is required.`);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data } = await api.post(endpoint, { name });

      if (data?.item) {
        setItems((prev) => [...prev, data.item]);
      } else {
        await loadItems();
      }

      setValue("");
      setMessage(`${singular(title)} added successfully.`);
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

      const { data } = await api.put(`${endpoint}/${id}`, { name });

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
          {saving ? "Saving..." : `Add ${singular(title)}`}
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <span className="text-xs font-medium uppercase text-slate-500">
              {singular(title)}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateItem(id);
                        }

                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditValue("");
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
                      autoFocus
                    />
                  ) : (
                    <div className="text-sm text-slate-700">{name}</div>
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
                            setError("");
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
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

/* ============================================================
   COUNTRIES
============================================================ */

function Countries() {
  const [items, setItems] = useState([]);

  return (
    <NameSetupSection
      title="Countries"
      placeholder="Enter country name"
      endpoint="/api/setup/countries"
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
    <NameSetupSection
      title="Courses"
      placeholder="Enter course name"
      endpoint="/api/setup/courses"
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
  const [countries, setCountries] = useState([]);

  const [value, setValue] = useState("");
  const [countryId, setCountryId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCountryId, setEditCountryId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [citiesResponse, countriesResponse] = await Promise.all([
        api.get("/api/setup/cities"),
        api.get("/api/setup/countries"),
      ]);

      setItems(citiesResponse.data?.items || []);
      setCountries(countriesResponse.data?.items || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load cities."));
    } finally {
      setLoading(false);
    }
  }

  async function addCity() {
    const name = value.trim();

    if (!name) {
      setError("City name is required.");
      return;
    }

    if (!countryId) {
      setError("Please select a country.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data } = await api.post("/api/setup/cities", {
        name,
        country_id: countryId,
      });

      if (data?.item) {
        setItems((prev) => [...prev, data.item]);
      } else {
        await loadData();
      }

      setValue("");
      setCountryId("");
      setMessage("City added successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not add city."));
    } finally {
      setSaving(false);
    }
  }

  async function updateCity(id) {
    const name = editValue.trim();

    if (!name) {
      setError("City name cannot be empty.");
      return;
    }

    if (!editCountryId) {
      setError("Please select a country.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data } = await api.put(`/api/setup/cities/${id}`, {
        name,
        country_id: editCountryId,
      });

      if (data?.item) {
        setItems((prev) =>
          prev.map((item) =>
            String(item.id) === String(id) ? data.item : item,
          ),
        );
      } else {
        await loadData();
      }

      setEditingId(null);
      setEditValue("");
      setEditCountryId("");
      setMessage("City updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update city."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCity(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this city?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/api/setup/cities/${id}`);

      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));

      setMessage("City deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete city."));
    }
  }

  function getCountryName(countryId) {
    const country = countries.find(
      (item) => String(item.id) === String(countryId),
    );

    return country?.name || "Unknown country";
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Cities</h2>

        <p className="text-sm text-slate-500 mt-1">
          Add and manage cities under their respective countries.
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 mb-6">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addCity();
            }
          }}
          placeholder="Enter city name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
        />

        <select
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-titan-500"
        >
          <option value="">Select country</option>

          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={addCity}
          disabled={saving}
          className="px-5 py-2 rounded-md bg-titan-500 text-white text-sm font-medium hover:bg-titan-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add City"}
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4">
            <span className="text-xs font-medium uppercase text-slate-500">
              City
            </span>

            <span className="text-xs font-medium uppercase text-slate-500">
              Country
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
            No cities added yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const id = item.id;

              return (
                <div
                  key={id}
                  className="px-4 py-3 grid grid-cols-[1fr_1fr_auto] gap-4 items-center"
                >
                  {editingId === id ? (
                    <>
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
                        autoFocus
                      />

                      <select
                        value={editCountryId}
                        onChange={(e) => setEditCountryId(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-titan-500"
                      >
                        <option value="">Select country</option>

                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-slate-700">{item.name}</div>

                      <div className="text-sm text-slate-500">
                        {getCountryName(item.country_id)}
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    {editingId === id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateCity(id)}
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
                            setEditCountryId("");
                            setError("");
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
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
                            setEditValue(item.name || "");
                            setEditCountryId(item.country_id || "");
                            setError("");
                            setMessage("");
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCity(id)}
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

/* ============================================================
   CAMPUSES
============================================================ */

function Campuses() {
  const [items, setItems] = useState([]);
  const [cities, setCities] = useState([]);

  const [value, setValue] = useState("");
  const [cityId, setCityId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCityId, setEditCityId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [campusesResponse, citiesResponse] = await Promise.all([
        api.get("/api/setup/campuses"),
        api.get("/api/setup/cities"),
      ]);

      setItems(campusesResponse.data?.items || []);
      setCities(citiesResponse.data?.items || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load campuses."));
    } finally {
      setLoading(false);
    }
  }

  async function addCampus() {
    const name = value.trim();

    if (!name) {
      setError("Campus name is required.");
      return;
    }

    if (!cityId) {
      setError("Please select a city.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data } = await api.post("/api/setup/campuses", {
        name,
        city_id: cityId,
      });

      if (data?.item) {
        setItems((prev) => [...prev, data.item]);
      } else {
        await loadData();
      }

      setValue("");
      setCityId("");
      setMessage("Campus added successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not add campus."));
    } finally {
      setSaving(false);
    }
  }

  async function updateCampus(id) {
    const name = editValue.trim();

    if (!name) {
      setError("Campus name cannot be empty.");
      return;
    }

    if (!editCityId) {
      setError("Please select a city.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data } = await api.put(`/api/setup/campuses/${id}`, {
        name,
        city_id: editCityId,
      });

      if (data?.item) {
        setItems((prev) =>
          prev.map((item) =>
            String(item.id) === String(id) ? data.item : item,
          ),
        );
      } else {
        await loadData();
      }

      setEditingId(null);
      setEditValue("");
      setEditCityId("");
      setMessage("Campus updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update campus."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampus(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this campus?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/api/setup/campuses/${id}`);

      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));

      setMessage("Campus deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete campus."));
    }
  }

  function getCityName(id) {
    const city = cities.find((item) => String(item.id) === String(id));

    return city?.name || "Unknown city";
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Campuses</h2>

        <p className="text-sm text-slate-500 mt-1">
          Add and manage campuses under their respective cities.
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 mb-6">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addCampus();
            }
          }}
          placeholder="Enter campus name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
        />

        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-titan-500"
        >
          <option value="">Select city</option>

          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={addCampus}
          disabled={saving}
          className="px-5 py-2 rounded-md bg-titan-500 text-white text-sm font-medium hover:bg-titan-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add Campus"}
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4">
            <span className="text-xs font-medium uppercase text-slate-500">
              Campus
            </span>

            <span className="text-xs font-medium uppercase text-slate-500">
              City
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
            No campuses added yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const id = item.id;

              return (
                <div
                  key={id}
                  className="px-4 py-3 grid grid-cols-[1fr_1fr_auto] gap-4 items-center"
                >
                  {editingId === id ? (
                    <>
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-titan-500"
                        autoFocus
                      />

                      <select
                        value={editCityId}
                        onChange={(e) => setEditCityId(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-titan-500"
                      >
                        <option value="">Select city</option>

                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-slate-700">{item.name}</div>

                      <div className="text-sm text-slate-500">
                        {getCityName(item.city_id)}
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    {editingId === id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateCampus(id)}
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
                            setEditCityId("");
                            setError("");
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
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
                            setEditValue(item.name || "");
                            setEditCityId(item.city_id || "");
                            setError("");
                            setMessage("");
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCampus(id)}
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
