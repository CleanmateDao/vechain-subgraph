import {
  CleanupCreated as CleanupCreatedEvent,
  CleanupPublished as CleanupPublishedEvent,
  CleanupStatusUpdated as CleanupStatusUpdatedEvent,
  CleanupUnpublished as CleanupUnpublishedEvent,
  ParticipantAccepted as ParticipantAcceptedEvent,
  ParticipantApplied as ParticipantAppliedEvent,
  ParticipantRejected as ParticipantRejectedEvent,
  ProofOfWorkSubmitted as ProofOfWorkSubmittedEvent,
} from "../generated/Cleanup/Cleanup";
import {
  Cleanup,
  CleanupParticipant,
  Notification,
  CleanupMedia,
  ProofOfWorkMedia,
} from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleCleanupCreated(event: CleanupCreatedEvent): void {
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
}

export function handleCleanupPublished(event: CleanupPublishedEvent): void {
  // Update Cleanup state
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup != null) {
    cleanup.published = true;
    cleanup.publishedAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }
}

export function handleCleanupStatusUpdated(
  event: CleanupStatusUpdatedEvent
): void {
  // Update Cleanup state
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup != null) {
    cleanup.status = event.params.newStatus;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }
}

export function handleCleanupUnpublished(event: CleanupUnpublishedEvent): void {
  // Update Cleanup state
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup != null) {
    cleanup.published = false;
    cleanup.unpublishedAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }
}

export function handleParticipantAccepted(
  event: ParticipantAcceptedEvent
): void {
  // Ensure Cleanup exists
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup == null) {
    cleanup = new Cleanup(event.params.cleanupAddress);
    cleanup.organizer = Bytes.fromI32(0); // Will be set when CleanupCreated is handled
    cleanup.metadata = "";
    cleanup.date = BigInt.fromI32(0);
    cleanup.status = 0;
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.createdAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Create or update CleanupParticipant state
  let participantId = event.params.cleanupAddress.concat(
    event.params.participant
  );
  let participant = CleanupParticipant.load(participantId.toHex());
  if (participant == null) {
    participant = new CleanupParticipant(participantId.toHex());
    participant.cleanup = event.params.cleanupAddress;
    participant.participant = event.params.participant;
    participant.appliedAt = event.block.timestamp; // Use current timestamp if appliedAt is unknown
    participant.rewardEarned = BigInt.fromI32(0);
  }
  participant.status = "accepted";
  participant.acceptedAt = event.block.timestamp;
  participant.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("participant_accepted"))
      .toHex()
  );
  notification.user = event.params.participant;
  notification.type = "participant_accepted";
  notification.title = "Application Accepted";
  notification.message =
    "Your application to join the cleanup event has been accepted.";
  notification.relatedEntity = event.params.cleanupAddress;
  notification.relatedEntityType = "cleanup";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleParticipantApplied(event: ParticipantAppliedEvent): void {
  // Ensure Cleanup exists
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup == null) {
    cleanup = new Cleanup(event.params.cleanupAddress);
    cleanup.organizer = Bytes.fromI32(0); // Will be set when CleanupCreated is handled
    cleanup.metadata = "";
    cleanup.date = BigInt.fromI32(0);
    cleanup.status = 0;
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.createdAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Create or update CleanupParticipant
  let participantId = event.params.cleanupAddress.concat(
    event.params.participant
  );
  let participant = CleanupParticipant.load(participantId.toHex());
  if (participant == null) {
    participant = new CleanupParticipant(participantId.toHex());
    participant.cleanup = event.params.cleanupAddress;
    participant.participant = event.params.participant;
    participant.rewardEarned = BigInt.fromI32(0);
  }

  participant.status = "applied";
  participant.appliedAt = event.params.appliedAt;
  participant.save();

  // Create notification for participant
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("participant_applied"))
      .toHex()
  );
  notification.user = event.params.participant;
  notification.type = "participant_applied";
  notification.title = "Application Submitted";
  notification.message =
    "You have successfully applied to join the cleanup event.";
  notification.relatedEntity = event.params.cleanupAddress;
  notification.relatedEntityType = "cleanup";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleParticipantRejected(
  event: ParticipantRejectedEvent
): void {
  // Ensure Cleanup exists
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup == null) {
    cleanup = new Cleanup(event.params.cleanupAddress);
    cleanup.organizer = Bytes.fromI32(0); // Will be set when CleanupCreated is handled
    cleanup.metadata = "";
    cleanup.date = BigInt.fromI32(0);
    cleanup.status = 0;
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.createdAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Create or update CleanupParticipant state
  let participantId = event.params.cleanupAddress.concat(
    event.params.participant
  );
  let participant = CleanupParticipant.load(participantId.toHex());
  if (participant == null) {
    participant = new CleanupParticipant(participantId.toHex());
    participant.cleanup = event.params.cleanupAddress;
    participant.participant = event.params.participant;
    participant.appliedAt = event.block.timestamp; // Use current timestamp if appliedAt is unknown
    participant.rewardEarned = BigInt.fromI32(0);
  }
  participant.status = "rejected";
  participant.rejectedAt = event.block.timestamp;
  participant.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("participant_rejected"))
      .toHex()
  );
  notification.user = event.params.participant;
  notification.type = "participant_rejected";
  notification.title = "Application Rejected";
  notification.message =
    "Your application to join the cleanup event has been rejected.";
  notification.relatedEntity = event.params.cleanupAddress;
  notification.relatedEntityType = "cleanup";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleProofOfWorkSubmitted(
  event: ProofOfWorkSubmittedEvent
): void {
  // Update Cleanup state
  let cleanup = Cleanup.load(event.params.cleanupAddress);
  if (cleanup != null) {
    cleanup.proofOfWorkSubmitted = true;
    cleanup.proofOfWorkMediaCount = event.params.mediaCount;
    cleanup.proofOfWorkSubmittedAt = event.params.submittedAt;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Create notification for organizer
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("proof_of_work_submitted"))
      .toHex()
  );
  notification.user = event.params.organizer;
  notification.type = "proof_of_work_submitted";
  notification.title = "Proof of Work Submitted";
  notification.message =
    "Proof of work has been submitted for the cleanup event.";
  notification.relatedEntity = event.params.cleanupAddress;
  notification.relatedEntityType = "cleanup";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}
