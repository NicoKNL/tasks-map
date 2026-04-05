import React, { useState, useCallback, useRef, useEffect } from "react";
import Select, { SingleValue } from "react-select";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { FilterPreset } from "src/types/settings";
import { FilterState } from "src/types/filter-state";
import { t } from "../i18n";

interface FilterPresetBarProps {
  presets: FilterPreset[];
  filterState: FilterState;
  onApply: (_filter: FilterState) => void;
  onSave: (_name: string, _filter: FilterState) => Promise<void>;
  onRename: (_id: string, _name: string) => Promise<void>;
  onDelete: (_id: string) => Promise<void>;
}

type PresetOption = { value: string; label: string };

export default function FilterPresetBar({
  presets,
  filterState,
  onApply,
  onSave,
  onRename,
  onDelete,
}: FilterPresetBarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedId in sync if the selected preset gets deleted
  useEffect(() => {
    if (selectedId && !presets.find((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [presets, selectedId]);

  useEffect(() => {
    if (isSaving && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [isSaving]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const selectedPreset = presets.find((p) => p.id === selectedId) ?? null;

  const handleSelect = useCallback(
    (option: SingleValue<PresetOption>) => {
      if (!option) {
        setSelectedId(null);
        return;
      }
      setSelectedId(option.value);
      const preset = presets.find((p) => p.id === option.value);
      if (preset) onApply(preset.filter);
    },
    [presets, onApply]
  );

  const handleSaveClick = useCallback(() => {
    setIsSaving(true);
    setNewName("");
    setIsRenaming(false);
  }, []);

  const handleSaveConfirm = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(trimmed, filterState);
      setIsSaving(false);
      setNewName("");
    } finally {
      setIsSubmitting(false);
    }
  }, [newName, filterState, onSave, isSubmitting]);

  const handleSaveCancel = useCallback(() => {
    setIsSaving(false);
    setNewName("");
  }, []);

  const handleSaveKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") void handleSaveConfirm();
      else if (e.key === "Escape") handleSaveCancel();
    },
    [handleSaveConfirm, handleSaveCancel]
  );

  const handleRenameClick = useCallback(() => {
    if (!selectedPreset) return;
    setRenameValue(selectedPreset.name);
    setIsRenaming(true);
    setIsSaving(false);
  }, [selectedPreset]);

  const handleRenameConfirm = useCallback(async () => {
    if (!selectedId || isSubmitting) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onRename(selectedId, trimmed);
      setIsRenaming(false);
      setRenameValue("");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedId, renameValue, onRename, isSubmitting]);

  const handleRenameCancel = useCallback(() => {
    setIsRenaming(false);
    setRenameValue("");
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") void handleRenameConfirm();
      else if (e.key === "Escape") handleRenameCancel();
    },
    [handleRenameConfirm, handleRenameCancel]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedId) return;
    await onDelete(selectedId);
    setSelectedId(null);
  }, [selectedId, onDelete]);

  const options: PresetOption[] = presets.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedOption = selectedPreset
    ? { value: selectedPreset.id, label: selectedPreset.name }
    : null;

  return (
    <div className="tasks-map-preset-section">
      <div className="tasks-map-preset-row">
        <div className="tasks-map-preset-select-wrapper">
          <Select
            options={options}
            value={selectedOption}
            onChange={handleSelect}
            placeholder={t("presets.placeholder")}
            isClearable
            isDisabled={presets.length === 0}
            noOptionsMessage={() => t("presets.no_presets")}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({
                ...base,
                zIndex: 9999,
                background: "var(--background-secondary)",
                color: "var(--text-normal)",
                border: "1px solid var(--background-modifier-border)",
              }),
              control: (base, state) => ({
                ...base,
                background: "var(--background-primary)",
                color: "var(--text-normal)",
                borderColor: "var(--background-modifier-border)",
                boxShadow: state.isFocused
                  ? "0 0 0 1px var(--interactive-accent)"
                  : base.boxShadow,
                "&:hover": {
                  borderColor: "var(--interactive-accent)",
                },
                minHeight: "unset",
                fontSize: "13px",
              }),
              option: (base, state) => ({
                ...base,
                background: state.isFocused
                  ? "var(--background-modifier-hover)"
                  : "var(--background-secondary)",
                color: "var(--text-normal)",
                fontSize: "13px",
              }),
              singleValue: (base) => ({
                ...base,
                color: "var(--text-normal)",
                fontSize: "13px",
              }),
              placeholder: (base) => ({
                ...base,
                color: "var(--text-faint)",
                fontSize: "13px",
              }),
              input: (base) => ({
                ...base,
                color: "var(--text-normal)",
                fontSize: "13px",
              }),
              clearIndicator: (base) => ({
                ...base,
                color: "var(--text-faint)",
                padding: "4px",
                "&:hover": { color: "var(--text-normal)" },
              }),
              dropdownIndicator: (base) => ({
                ...base,
                color: "var(--text-faint)",
                padding: "4px",
                "&:hover": { color: "var(--text-normal)" },
              }),
              indicatorSeparator: (base) => ({
                ...base,
                background: "var(--background-modifier-border)",
              }),
            }}
          />
        </div>

        {selectedPreset && !isRenaming && !isSaving && (
          <div className="tasks-map-preset-actions">
            <button
              className="tasks-map-preset-action-btn"
              onClick={handleRenameClick}
              title={t("presets.rename")}
              aria-label={t("presets.rename")}
            >
              <Pencil size={13} />
            </button>
            <button
              className="tasks-map-preset-action-btn tasks-map-preset-action-btn--danger"
              onClick={() => void handleDelete()}
              title={t("presets.delete")}
              aria-label={t("presets.delete")}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {isRenaming && (
        <div className="tasks-map-preset-inline-input">
          <input
            ref={renameInputRef}
            className="tasks-map-preset-text-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            maxLength={40}
          />
          <button
            className="tasks-map-preset-action-btn"
            onClick={() => void handleRenameConfirm()}
            title={t("presets.confirm_rename")}
            aria-label={t("presets.confirm_rename")}
            disabled={!renameValue.trim() || isSubmitting}
          >
            <Check size={13} />
          </button>
          <button
            className="tasks-map-preset-action-btn"
            onClick={handleRenameCancel}
            title={t("presets.cancel")}
            aria-label={t("presets.cancel")}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {isSaving ? (
        <div className="tasks-map-preset-inline-input">
          <input
            ref={newNameInputRef}
            className="tasks-map-preset-text-input"
            placeholder={t("presets.name_placeholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleSaveKeyDown}
            maxLength={40}
          />
          <button
            className="tasks-map-preset-action-btn"
            onClick={() => void handleSaveConfirm()}
            title={t("presets.confirm_save")}
            aria-label={t("presets.confirm_save")}
            disabled={!newName.trim() || isSubmitting}
          >
            <Check size={13} />
          </button>
          <button
            className="tasks-map-preset-action-btn"
            onClick={handleSaveCancel}
            title={t("presets.cancel")}
            aria-label={t("presets.cancel")}
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        !isRenaming && (
          <button
            className="tasks-map-preset-save-btn"
            onClick={handleSaveClick}
          >
            {t("presets.save_current")}
          </button>
        )
      )}
    </div>
  );
}
