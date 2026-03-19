"use client";

import { useState } from "react";
import { NewRequestForm } from "./NewRequestForm";
import type { FeatureRequest } from "@/types/database";

interface NewRequestFormWrapperProps {
  isLoggedIn: boolean;
}

export function NewRequestFormWrapper({ isLoggedIn }: NewRequestFormWrapperProps) {
  const [_created, setCreated] = useState<FeatureRequest | null>(null);

  const handleCreated = (req: FeatureRequest) => {
    setCreated(req);
    // Refresh the page to show the new request in the list
    window.location.reload();
  };

  return <NewRequestForm onCreated={handleCreated} isLoggedIn={isLoggedIn} />;
}
