import { CleanupCreated as CleanupCreatedEvent } from "../generated/CleanupFactory/CleanupFactory";
import { Cleanup } from "../generated/schema";
import { Cleanup as CleanupTemplate } from "../generated/templates";

export function handleCleanupFactoryCleanupCreated(
  event: CleanupCreatedEvent
): void {
  // Create Cleanup state entity
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup == null) {
    cleanup = new Cleanup(event.params.cleanupAddress);
    cleanup.status = 0; // Default status
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
  }

  cleanup.organizer = event.params.organizer;
  cleanup.metadata = event.params.metadata;
  cleanup.date = event.params.date;
  cleanup.createdAt = event.block.timestamp;
  cleanup.updatedAt = event.block.timestamp;
  cleanup.save();

  // Create a new data source for the deployed Cleanup contract
  CleanupTemplate.create(event.params.cleanupAddress);
}
