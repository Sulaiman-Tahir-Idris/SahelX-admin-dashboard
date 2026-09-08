"use client";

import React, { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { MapPin } from "lucide-react";
import { MapPickerModal } from "./map-picker-modal";

interface Props {
  value: string;
  onChange: (result: { address: string; lat: number | null; lng: number | null }) => void;
  placeholder?: string;
  id?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, id }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ address: e.target.value, lat: null, lng: null });
  };

  const handleMapPick = (result: { address: string; lat: number; lng: number }) => {
    onChange(result);
    setShowPicker(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={handleTextChange}
            className="h-11 rounded-xl"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3 whitespace-nowrap"
          onClick={() => setShowPicker(true)}
        >
          <MapPin className="h-4 w-4 mr-1" />
          Pick on map
        </Button>
      </div>

      <MapPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handleMapPick}
        initialLat={11.9967}
        initialLng={8.5185}
      />
    </div>
  );
}

