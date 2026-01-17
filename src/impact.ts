import {
  ImpactCreated as ImpactCreatedEvent,
  ImpactStatusUpdated as ImpactStatusUpdatedEvent,
  ImpactMadePublic as ImpactMadePublicEvent,
  ImpactUpdatesAdded as ImpactUpdatesAddedEvent,
  ParticipantAccepted as ParticipantAcceptedEvent,
  ParticipantApplied as ParticipantAppliedEvent,
  ParticipantRejected as ParticipantRejectedEvent,
  ProofOfWorkSubmitted as ProofOfWorkSubmittedEvent,
} from "../generated/Impact/Impact";
import {
  Impact,
  ImpactParticipant,
  ImpactUpdate,
  Notification,
  ProofOfWork,
  User,
} from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleImpactCreated(event: ImpactCreatedEvent): void {
  // Create Impact state entity using impactId as string
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact == null) {
    impact = new Impact(impactId);
    // Private impacts start as OPEN (published), public impacts start as UNPUBLISHED
    impact.status = event.params.isPrivate ? 1 : 0; // OPEN for private, UNPUBLISHED for public
    impact.published = event.params.isPrivate; // Private impacts are published immediately
    impact.proofOfWorkSubmitted = false;
    impact.rewardsDistributed = false;
    impact.updatesCount = BigInt.fromI32(0);
  }

  impact.organizer = event.params.organizer;
  impact.metadata = event.params.metadata;
  impact.category = event.params.category;
  impact.location = event.params.locationAddress;
  impact.city = event.params.city;
  impact.country = event.params.country;
  impact.latitude = event.params.latitude.toBigDecimal();
  impact.longitude = event.params.longitude.toBigDecimal();
  impact.date = event.params.date;
  impact.startTime = event.params.startTime;
  impact.endTime = event.params.endTime;
  impact.maxParticipants = event.params.maxParticipants;
  impact.isPrivate = event.params.isPrivate;
  impact.rewardAmount = BigInt.fromI32(0);
  impact.createdAt = event.block.timestamp;
  impact.updatedAt = event.block.timestamp;

  // Set publishedAt for private impacts (they're published immediately)
  if (event.params.isPrivate) {
    impact.publishedAt = event.block.timestamp;
  }

  impact.save();
}

export function handleImpactStatusUpdated(
  event: ImpactStatusUpdatedEvent
): void {
  // Update Impact state
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact != null) {
    let oldStatus = event.params.oldStatus;
    let newStatus = event.params.newStatus;

    impact.status = newStatus;
    impact.updatedAt = event.block.timestamp;

    // Handle published/unpublished state transitions
    // UNPUBLISHED (0) to OPEN (1) = publish
    if (oldStatus == 0 && newStatus == 1) {
      impact.published = true;
      impact.publishedAt = event.block.timestamp;
    }
    // OPEN (1) to UNPUBLISHED (0) = unpublish
    if (oldStatus == 1 && newStatus == 0) {
      impact.published = false;
      impact.unpublishedAt = event.block.timestamp;
    }

    let oldStartTime = impact.startTime || BigInt.fromI32(0);
    let oldEndTime = impact.endTime || BigInt.fromI32(0);

    // Update startTime and date when transitioning to IN_PROGRESS (status = 2)
    // Note: This only happens for organizer updates (updateImpactStatus),
    // not for admin updates (setImpactStatus) which don't update times
    if (newStatus == 2) {
      // IN_PROGRESS - set startTime to block timestamp
      impact.startTime = event.block.timestamp;
      // Update date to block.timestamp when impact starts
      impact.date = event.block.timestamp;

      if (oldEndTime && oldStartTime && oldStartTime.gt(BigInt.fromI32(0))) {
        impact.endTime = event.block.timestamp.plus(
          oldEndTime.minus(oldStartTime)
        );
      }
    }

    // Update endTime when transitioning to COMPLETED (status = 3)
    // Note: This only happens for organizer updates (updateImpactStatus),
    // not for admin updates (setImpactStatus) which don't update times
    if (newStatus == 3) {
      // COMPLETED - set endTime to block timestamp
      impact.endTime = event.block.timestamp;
    }

    impact.save();
  }
}

export function handleImpactMadePublic(event: ImpactMadePublicEvent): void {
  // Update Impact state - make private impact public
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact != null) {
    impact.isPrivate = false;
    // Ensure impact remains published (private impacts are published by default)
    if (!impact.published) {
      impact.published = true;
      if (!impact.publishedAt) {
        impact.publishedAt = event.block.timestamp;
      }
    }
    impact.updatedAt = event.block.timestamp;
    impact.save();

    // Create notification for organizer
    let notification = new Notification(
      event.transaction.hash
        .concatI32(event.logIndex.toI32())
        .concat(Bytes.fromUTF8("impact_made_public"))
        .toHex()
    );
    notification.user = impact.organizer;
    notification.type = "impact_made_public";
    notification.title = "Impact Made Public";
    notification.message =
      "Your private impact event has been made public and is now visible to everyone.";
    notification.relatedEntity = impactId;
    notification.relatedEntityType = "impact";

    notification.createdAt = event.block.timestamp;
    notification.blockNumber = event.block.number;
    notification.transactionHash = event.transaction.hash;
    notification.save();
  }
}

export function handleParticipantAccepted(
  event: ParticipantAcceptedEvent
): void {
  // Ensure Impact exists
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact == null) {
    impact = new Impact(impactId);
    impact.organizer = Bytes.fromI32(0); // Will be set when ImpactCreated is handled
    impact.metadata = "";
    impact.date = BigInt.fromI32(0);
    impact.status = 0;
    impact.published = false;
    impact.proofOfWorkSubmitted = false;
    impact.rewardsDistributed = false;
    impact.updatesCount = BigInt.fromI32(0);
    impact.createdAt = event.block.timestamp;
    impact.updatedAt = event.block.timestamp;
    impact.save();
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

  // Create or update ImpactParticipant state
  let participantId = impactId + "-" + event.params.participant.toHexString();
  let participant = ImpactParticipant.load(participantId);
  if (participant == null) {
    participant = new ImpactParticipant(participantId);
    participant.impact = impactId;
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
    "Your application to join the impact event has been accepted.";
  notification.relatedEntity = impactId;
  notification.relatedEntityType = "impact";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleParticipantApplied(event: ParticipantAppliedEvent): void {
  // Ensure Impact exists
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact == null) {
    impact = new Impact(impactId);
    impact.organizer = Bytes.fromI32(0); // Will be set when ImpactCreated is handled
    impact.metadata = "";
    impact.date = BigInt.fromI32(0);
    impact.status = 0;
    impact.published = false;
    impact.proofOfWorkSubmitted = false;
    impact.rewardsDistributed = false;
    impact.updatesCount = BigInt.fromI32(0);
    impact.createdAt = event.block.timestamp;
    impact.updatedAt = event.block.timestamp;
    impact.save();
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

  // Create or update ImpactParticipant
  let participantId = impactId + "-" + event.params.participant.toHexString();
  let participant = ImpactParticipant.load(participantId);
  if (participant == null) {
    participant = new ImpactParticipant(participantId);
    participant.impact = impactId;
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
    "You have successfully applied to join the impact event.";
  notification.relatedEntity = impactId;
  notification.relatedEntityType = "impact";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleParticipantRejected(
  event: ParticipantRejectedEvent
): void {
  // Ensure Impact exists
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact == null) {
    impact = new Impact(impactId);
    impact.organizer = Bytes.fromI32(0); // Will be set when ImpactCreated is handled
    impact.metadata = "";
    impact.date = BigInt.fromI32(0);
    impact.status = 0;
    impact.published = false;
    impact.proofOfWorkSubmitted = false;
    impact.rewardsDistributed = false;
    impact.updatesCount = BigInt.fromI32(0);
    impact.createdAt = event.block.timestamp;
    impact.updatedAt = event.block.timestamp;
    impact.save();
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

  // Create or update ImpactParticipant state
  let participantId = impactId + "-" + event.params.participant.toHexString();
  let participant = ImpactParticipant.load(participantId);
  if (participant == null) {
    participant = new ImpactParticipant(participantId);
    participant.impact = impactId;
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
    "Your application to join the impact event has been rejected.";
  notification.relatedEntity = impactId;
  notification.relatedEntityType = "impact";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleProofOfWorkSubmitted(
  event: ProofOfWorkSubmittedEvent
): void {
  // Update Impact state
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact != null) {
    impact.proofOfWorkSubmitted = true;

    let proofOfWorkId = impactId + "-" + event.params.submittedAt.toString();
    let proofOfWork = new ProofOfWork(proofOfWorkId);

    proofOfWork.impact = impactId;
    proofOfWork.ipfsHashes = event.params.ipfsHashes;
    proofOfWork.mimetypes = event.params.mimetypes;
    proofOfWork.submittedAt = event.params.submittedAt;
    proofOfWork.save();

    impact.proofOfWorkSubmittedAt = event.params.submittedAt;
    impact.updatedAt = event.block.timestamp;
    impact.save();
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
    "Proof of work has been submitted for the impact event.";
  notification.relatedEntity = impactId;
  notification.relatedEntityType = "impact";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleImpactUpdatesAdded(
  event: ImpactUpdatesAddedEvent
): void {
  // Ensure Impact exists
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact == null) {
    impact = new Impact(impactId);
    impact.organizer = Bytes.fromI32(0); // Will be set when ImpactCreated is handled
    impact.metadata = "";
    impact.date = BigInt.fromI32(0);
    impact.status = 0;
    impact.published = false;
    impact.proofOfWorkSubmitted = false;
    impact.rewardsDistributed = false;
    impact.updatesCount = BigInt.fromI32(0);
    impact.createdAt = event.block.timestamp;
    impact.updatedAt = event.block.timestamp;
    impact.save();
  }

  // Create ImpactUpdate entity
  let updateId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("impact_update"))
    .toHex();
  let update = new ImpactUpdate(updateId);
  update.impact = impactId;
  update.organizer = event.params.organizer;
  update.metadata = event.params.metadata;
  update.addedAt = event.params.addedAt;
  update.blockNumber = event.block.number;
  update.transactionHash = event.transaction.hash;
  update.save();

  // Update impact's updates count
  // Initialize to 0 if not set, then increment
  let currentCount = impact.updatesCount;
  if (!currentCount) {
    impact.updatesCount = BigInt.fromI32(1);
  } else {
    impact.updatesCount = currentCount.plus(BigInt.fromI32(1));
  }
  impact.updatedAt = event.block.timestamp;
  impact.save();

  // Create notification for all participants
  // Note: We could create notifications for all participants, but for now we'll create one for the organizer
  // In a production system, you might want to query all participants and create notifications for each
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("impact_update"))
      .toHex()
  );
  notification.user = event.params.organizer;
  notification.type = "impact_update";
  notification.title = "Impact Update";
  notification.message = "A new update has been added to the impact event.";
  notification.relatedEntity = impactId;
  notification.relatedEntityType = "impact";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}
