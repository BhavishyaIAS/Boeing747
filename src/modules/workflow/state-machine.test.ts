import { describe, expect, it } from "vitest";
import { ContentStatus } from "@prisma/client";
import {
  ACTION_PERMISSION,
  availableActions,
  canTransition,
  nextStatus,
} from "./state-machine";
import { PERMISSIONS } from "@modules/identity";

describe("workflow state machine", () => {
  it("moves a draft through review to published", () => {
    expect(nextStatus(ContentStatus.DRAFT, "SUBMIT")).toBe(ContentStatus.IN_REVIEW);
    expect(nextStatus(ContentStatus.IN_REVIEW, "APPROVE")).toBe(ContentStatus.APPROVED);
    expect(nextStatus(ContentStatus.APPROVED, "PUBLISH")).toBe(ContentStatus.PUBLISHED);
  });

  it("sends content back to draft on request-changes", () => {
    expect(nextStatus(ContentStatus.IN_REVIEW, "REQUEST_CHANGES")).toBe(ContentStatus.DRAFT);
    expect(nextStatus(ContentStatus.APPROVED, "REQUEST_CHANGES")).toBe(ContentStatus.DRAFT);
  });

  it("archives on reject and allows revising archived/published content", () => {
    expect(nextStatus(ContentStatus.IN_REVIEW, "REJECT")).toBe(ContentStatus.ARCHIVED);
    expect(nextStatus(ContentStatus.ARCHIVED, "REVISE")).toBe(ContentStatus.DRAFT);
    expect(nextStatus(ContentStatus.PUBLISHED, "REVISE")).toBe(ContentStatus.DRAFT);
  });

  it("rejects illegal transitions", () => {
    expect(nextStatus(ContentStatus.DRAFT, "PUBLISH")).toBeNull();
    expect(nextStatus(ContentStatus.PUBLISHED, "APPROVE")).toBeNull();
    expect(canTransition(ContentStatus.DRAFT, "APPROVE")).toBe(false);
  });

  it("maps actions to the correct permissions", () => {
    expect(ACTION_PERMISSION.SUBMIT).toBe(PERMISSIONS.CONTENT_SUBMIT);
    expect(ACTION_PERMISSION.APPROVE).toBe(PERMISSIONS.CONTENT_REVIEW);
    expect(ACTION_PERMISSION.PUBLISH).toBe(PERMISSIONS.CONTENT_PUBLISH);
  });

  it("lists available actions per state", () => {
    expect(availableActions(ContentStatus.DRAFT).sort()).toEqual(["ARCHIVE", "SUBMIT"]);
    expect(availableActions(ContentStatus.PUBLISHED).sort()).toEqual(["ARCHIVE", "REVISE"]);
  });
});
