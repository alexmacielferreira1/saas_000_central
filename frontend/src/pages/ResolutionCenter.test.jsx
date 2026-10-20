import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ResolutionCenter from "./ResolutionCenter";

const { entities } = vi.hoisted(() => ({
  entities: {
    Incident: { list: vi.fn() },
    AdminCommand: { list: vi.fn() },
    Saas: { list: vi.fn() },
    Configuration: { list: vi.fn() },
  },
}));

vi.mock("@/api/base44Client", () => ({ base44: { entities } }));

describe("ResolutionCenter", () => {
  it("does not report a clean ecosystem when any source fails", async () => {
    entities.Incident.list.mockRejectedValueOnce(new Error("incident API unavailable"));
    entities.AdminCommand.list.mockResolvedValueOnce([]);
    entities.Saas.list.mockResolvedValueOnce([]);
    entities.Configuration.list.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <ResolutionCenter />
      </MemoryRouter>
    );

    expect(await screen.findByText("Dados incompletos")).toBeInTheDocument();
    expect(screen.queryByText("Tudo limpo")).not.toBeInTheDocument();
  });
});
