import React, { useState, useRef, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

interface TagInputProps {
  allTags: string[];
  existingTags: string[]; // Tags already on this task
  onAddTag: (tag: string) => void; // eslint-disable-line no-unused-vars
  onCancel: () => void;
}

type TagOption = { value: string; label: string };

export function TagInput({
  allTags,
  existingTags,
  onAddTag,
  onCancel,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    // Focus the input when component mounts
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  // Helper function to clean tag input (remove leading # and trim whitespace)
  const cleanTagInput = (input: string): string => {
    return input.trim().replace(/^#+/, "");
  };

  // Filter out tags that are already on the task
  // Tags in allTags are sorted by frequency (most used first) from TaskMapGraphView
  const availableTags = allTags.filter((tag) => !existingTags.includes(tag));

  const options: TagOption[] = availableTags.map((tag) => ({
    value: tag,
    label: tag,
  }));

  const handleChange = (newValue: TagOption | null) => {
    if (newValue) {
      const cleanTag = cleanTagInput(newValue.value);
      if (cleanTag) {
        onAddTag(cleanTag);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
    // Don't handle Enter here - let react-select handle it
    // This allows selecting from suggestions with Enter
  };

  const handleBlur = () => {
    // If there's input value, add it as a tag
    const cleanTag = cleanTagInput(inputValue);
    if (cleanTag) {
      onAddTag(cleanTag);
      return;
    }
    onCancel();
  };

  const handleCreateOption = (inputValue: string) => {
    const cleanTag = cleanTagInput(inputValue);
    if (cleanTag) {
      onAddTag(cleanTag);
    }
  };

  return (
    <CreatableSelect
      ref={selectRef}
      classNamePrefix="tasks-map-tag-select"
      options={options}
      value={null}
      inputValue={inputValue}
      onInputChange={(newValue) => setInputValue(newValue)}
      onChange={handleChange}
      onCreateOption={handleCreateOption}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="Type or select tag..."
      isClearable={false}
      menuIsOpen={true}
      autoFocus={true}
      openMenuOnFocus={true}
      openMenuOnClick={true}
      closeMenuOnSelect={true}
      formatCreateLabel={(inputValue) => `Create tag "${inputValue}"`}
      noOptionsMessage={() => "Type to create a new tag"}
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
      }}
    />
  );
}
