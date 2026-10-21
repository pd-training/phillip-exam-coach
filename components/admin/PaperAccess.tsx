"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  hasAccess: boolean;
  requested: boolean;
};

// Lets an admin choose which students can access one paper. Shown as a tab on the paper page.
export default function PaperAccess({ paperId }: { paperId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/paper-access/${paperId}`)
      .then((r) => (r.ok ? r.json() : { students: [] }))
      .then((data) => {
        const list: Student[] = data.students || [];
        setStudents(list);
        const granted = new Set(list.filter((s) => s.hasAccess).map((s) => s.id));
        setSelected(granted);
        setSaved(granted);
      })
      .finally(() => setLoading(false));
  }, [paperId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => (s.name || "").toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const dirty = useMemo(() => {
    if (selected.size !== saved.size) return true;
    for (const id of selected) if (!saved.has(id)) return true;
    return false;
  }, [selected, saved]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMessage("");
  };

  const setAllVisible = (on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((s) => (on ? next.add(s.id) : next.delete(s.id)));
      return next;
    });
    setMessage("");
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/paper-access/${paperId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(new Set(selected));
      setStudents((prev) =>
        prev.map((s) => ({ ...s, hasAccess: selected.has(s.id), requested: selected.has(s.id) ? false : s.requested }))
      );
      setMessage("Access saved.");
    } catch {
      setMessage("Could not save access. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-gray-600 text-sm">
        Tick the students who can practise this paper. Students not ticked will see it as locked.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
        />
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{selected.size} with access</span>
          <button type="button" onClick={() => setAllVisible(true)} className="text-blue-700 hover:text-blue-800 font-medium">
            Select shown
          </button>
          <button type="button" onClick={() => setAllVisible(false)} className="text-blue-700 hover:text-blue-800 font-medium">
            Clear shown
          </button>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading && <p className="p-5 text-sm text-gray-600">Loading students...</p>}
        {!loading && visible.length === 0 && <p className="p-5 text-sm text-gray-600">No students found.</p>}
        {!loading &&
          visible.map((s) => (
            <label key={s.id} className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggle(s.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{s.name || "No name"}</p>
                <p className="text-xs text-gray-500 truncate">{s.email}</p>
              </div>
              {!s.active && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Inactive</span>}
              {s.requested && !selected.has(s.id) && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Requested</span>
              )}
            </label>
          ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-700">{message}</p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save access"}
        </button>
      </div>
    </div>
  );
}
