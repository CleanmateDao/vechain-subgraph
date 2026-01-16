import {
  CleanupCreated as CleanupCreatedEvent,
  CleanupPublished as CleanupPublishedEvent,
  CleanupStatusUpdated as CleanupStatusUpdatedEvent,
  CleanupUnpublished as CleanupUnpublishedEvent,
  CleanupMadePublic as CleanupMadePublicEvent,
  CleanupUpdatesAdded as CleanupUpdatesAddedEvent,
  ParticipantAccepted as ParticipantAcceptedEvent,
  ParticipantApplied as ParticipantAppliedEvent,
  ParticipantRejected as ParticipantRejectedEvent,
  ProofOfWorkSubmitted as ProofOfWorkSubmittedEvent,
} from "../generated/Cleanup/Cleanup";
import {
  Cleanup,
  CleanupParticipant,
  CleanupUpdate,
  Notification,
  ProofOfWork,
  User,
} from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleCleanupCreated(event: CleanupCreatedEvent): void {
  // Create Cleanup state entity using cleanupId as string
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup == null) {
    cleanup = new Cleanup(cleanupId);
    // Private cleanups start as OPEN (published), public cleanups start as UNPUBLISHED
    cleanup.status = event.params.isPrivate ? 1 : 0; // OPEN for private, UNPUBLISHED for public
    cleanup.published = event.params.isPrivate; // Private cleanups are published immediately
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.updatesCount = BigInt.fromI32(0);
  }

  cleanup.organizer = event.params.organizer;
  cleanup.metadata = event.params.metadata;
  cleanup.category = event.params.category;
  cleanup.location = event.params.locationAddress;
  cleanup.city = event.params.city;
  cleanup.country = event.params.country;
  cleanup.latitude = event.params.latitude.toBigDecimal();
  cleanup.longitude = event.params.longitude.toBigDecimal();
  cleanup.date = event.params.date;
  cleanup.startTime = event.params.startTime;
  cleanup.endTime = event.params.endTime;
  cleanup.maxParticipants = event.params.maxParticipants;
  cleanup.isPrivate = event.params.isPrivate;
  cleanup.rewardAmount = BigInt.fromI32(0);
  cleanup.createdAt = event.block.timestamp;
  cleanup.updatedAt = event.block.timestamp;

  // Set publishedAt for private cleanups (they're published immediately)
  if (event.params.isPrivate) {
    cleanup.publishedAt = event.block.timestamp;
  }

  cleanup.save();
}

export function handleCleanupPublished(event: CleanupPublishedEvent): void {
  // Update Cleanup state
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
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
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup != null) {
    let newStatus = event.params.newStatus;

    cleanup.status = newStatus;
    cleanup.updatedAt = event.block.timestamp;

    let oldStartTime = cleanup.startTime || BigInt.fromI32(0);
    let oldEndTime = cleanup.endTime || BigInt.fromI32(0);

    // Update startTime when transitioning to IN_PROGRESS (status = 2)
    if (newStatus == 2) {
      // IN_PROGRESS - set startTime to block timestamp
      cleanup.startTime = event.block.timestamp;

      if (oldEndTime && oldStartTime) {
        cleanup.endTime = event.block.timestamp.plus(
          oldEndTime.minus(oldStartTime)
        );
      }
    }

    // Update endTime when transitioning to COMPLETED (status = 3)
    if (newStatus == 3) {
      // COMPLETED - set endTime to block timestamp
      cleanup.endTime = event.block.timestamp;
    }

    cleanup.save();
  }
}

export function handleCleanupUnpublished(event: CleanupUnpublishedEvent): void {
  // Update Cleanup state
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup != null) {
    cleanup.published = false;
    cleanup.unpublishedAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }
}

export function handleCleanupMadePublic(event: CleanupMadePublicEvent): void {
  // Update Cleanup state - make private cleanup public
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup != null) {
    cleanup.isPrivate = false;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }
}

export function handleParticipantAccepted(
  event: ParticipantAcceptedEvent
): void {
  // Ensure Cleanup exists
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup == null) {
    cleanup = new Cleanup(cleanupId);
    cleanup.organizer = Bytes.fromI32(0); // Will be set when CleanupCreated is handled
    cleanup.metadata = "";
    cleanup.date = BigInt.fromI32(0);
    cleanup.status = 0;
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.updatesCount = BigInt.fromI32(0);
    cleanup.createdAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Ensure User exists
  let user = User.load(event.params.participant);
  if (user == null) {
    user = new User(event.params.participant);
    user.metadata = "";
    user.emailVerified = false;
    user.registeredAt = event.block.timestamp;
    user.bonus = BigInt.fromI32(0);
    user.referral = BigInt.fromI32(0);
    user.others = BigInt.fromI32(0);
    user.received = BigInt.fromI32(0);
    user.referralCount = BigInt.fromI32(0);
    user.save();
  }

  // Create or update CleanupParticipant state
  let participantId = cleanupId + "-" + event.params.participant.toHexString();
  let participant = CleanupParticipant.load(participantId);
  if (participant == null) {
    participant = new CleanupParticipant(participantId);
    participant.cleanup = cleanupId;
    participant.participant = event.params.participant;
    participant.user = event.params.participant;
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
  notification.relatedEntity = cleanupId;
  notification.relatedEntityType = "cleanup";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleParticipantApplied(event: ParticipantAppliedEvent): void {
  // Ensure Cleanup exists
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup == null) {
    cleanup = new Cleanup(cleanupId);
    cleanup.organizer = Bytes.fromI32(0); // Will be set when CleanupCreated is handled
    cleanup.metadata = "";
    cleanup.date = BigInt.fromI32(0);
    cleanup.status = 0;
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.updatesCount = BigInt.fromI32(0);
    cleanup.createdAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Ensure User exists
  let user = User.load(event.params.participant);
  if (user == null) {
    user = new User(event.params.participant);
    user.metadata = "";
    user.emailVerified = false;
    user.registeredAt = event.block.timestamp;
    user.bonus = BigInt.fromI32(0);
    user.referral = BigInt.fromI32(0);
    user.others = BigInt.fromI32(0);
    user.received = BigInt.fromI32(0);
    user.referralCount = BigInt.fromI32(0);
    user.save();
  }

  // Create or update CleanupParticipant
  let participantId = cleanupId + "-" + event.params.participant.toHexString();
  let participant = CleanupParticipant.load(participantId);
  if (participant == null) {
    participant = new CleanupParticipant(participantId);
    participant.cleanup = cleanupId;
    participant.participant = event.params.participant;
    participant.user = event.params.participant;
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
  notification.relatedEntity = cleanupId;
  notification.relatedEntityType = "cleanup";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleParticipantRejected(
  event: ParticipantRejectedEvent
): void {
  // Ensure Cleanup exists
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup == null) {
    cleanup = new Cleanup(cleanupId);
    cleanup.organizer = Bytes.fromI32(0); // Will be set when CleanupCreated is handled
    cleanup.metadata = "";
    cleanup.date = BigInt.fromI32(0);
    cleanup.status = 0;
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.updatesCount = BigInt.fromI32(0);
    cleanup.createdAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Ensure User exists
  let user = User.load(event.params.participant);
  if (user == null) {
    user = new User(event.params.participant);
    user.metadata = "";
    user.emailVerified = false;
    user.registeredAt = event.block.timestamp;
    user.bonus = BigInt.fromI32(0);
    user.referral = BigInt.fromI32(0);
    user.others = BigInt.fromI32(0);
    user.received = BigInt.fromI32(0);
    user.referralCount = BigInt.fromI32(0);
    user.save();
  }

  // Create or update CleanupParticipant state
  let participantId = cleanupId + "-" + event.params.participant.toHexString();
  let participant = CleanupParticipant.load(participantId);
  if (participant == null) {
    participant = new CleanupParticipant(participantId);
    participant.cleanup = cleanupId;
    participant.participant = event.params.participant;
    participant.user = event.params.participant;
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
  notification.relatedEntity = cleanupId;
  notification.relatedEntityType = "cleanup";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleProofOfWorkSubmitted(
  event: ProofOfWorkSubmittedEvent
): void {
  // Update Cleanup state
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup != null) {
    cleanup.proofOfWorkSubmitted = true;

    let proofOfWorkId = cleanupId + "-" + event.params.submittedAt.toString();
    let proofOfWork = new ProofOfWork(proofOfWorkId);

    proofOfWork.cleanup = cleanupId;
    proofOfWork.ipfsHashes = event.params.ipfsHashes;
    proofOfWork.mimetypes = event.params.mimetypes;
    proofOfWork.submittedAt = event.params.submittedAt;
    proofOfWork.save();

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
  notification.relatedEntity = cleanupId;
  notification.relatedEntityType = "cleanup";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleCleanupUpdatesAdded(
  event: CleanupUpdatesAddedEvent
): void {
  // Ensure Cleanup exists
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup == null) {
    cleanup = new Cleanup(cleanupId);
    cleanup.organizer = Bytes.fromI32(0); // Will be set when CleanupCreated is handled
    cleanup.metadata = "";
    cleanup.date = BigInt.fromI32(0);
    cleanup.status = 0;
    cleanup.published = false;
    cleanup.proofOfWorkSubmitted = false;
    cleanup.rewardsDistributed = false;
    cleanup.updatesCount = BigInt.fromI32(0);
    cleanup.createdAt = event.block.timestamp;
    cleanup.updatedAt = event.block.timestamp;
    cleanup.save();
  }

  // Create CleanupUpdate entity
  let updateId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("cleanup_update"))
    .toHex();
  let update = new CleanupUpdate(updateId);
  update.cleanup = cleanupId;
  update.organizer = event.params.organizer;
  update.metadata = event.params.metadata;
  update.addedAt = event.params.addedAt;
  update.blockNumber = event.block.number;
  update.transactionHash = event.transaction.hash;
  update.save();

  // Update cleanup's updates count
  // Initialize to 0 if not set, then increment
  let currentCount = cleanup.updatesCount;
  if (!currentCount) {
    cleanup.updatesCount = BigInt.fromI32(1);
  } else {
    cleanup.updatesCount = currentCount.plus(BigInt.fromI32(1));
  }
  cleanup.updatedAt = event.block.timestamp;
  cleanup.save();

  // Create notification for all participants
  // Note: We could create notifications for all participants, but for now we'll create one for the organizer
  // In a production system, you might want to query all participants and create notifications for each
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("cleanup_update"))
      .toHex()
  );
  notification.user = event.params.organizer;
  notification.type = "cleanup_update";
  notification.title = "Cleanup Update";
  notification.message = "A new update has been added to the cleanup event.";
  notification.relatedEntity = cleanupId;
  notification.relatedEntityType = "cleanup";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}
