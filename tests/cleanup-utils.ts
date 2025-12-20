import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CleanupCreated,
  CleanupPublished,
  CleanupStatusUpdated,
  CleanupUnpublished,
  ParticipantAccepted,
  ParticipantApplied,
  ParticipantRejected,
  ProofOfWorkSubmitted
} from "../generated/Cleanup/Cleanup"

export function createCleanupCreatedEvent(
  cleanupId: Address,
  organizer: Address,
  metadata: string,
  date: BigInt
): CleanupCreated {
  let cleanupCreatedEvent = changetype<CleanupCreated>(newMockEvent())

  cleanupCreatedEvent.parameters = new Array()

  cleanupCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  cleanupCreatedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  )
  cleanupCreatedEvent.parameters.push(
    new ethereum.EventParam("metadata", ethereum.Value.fromString(metadata))
  )
  cleanupCreatedEvent.parameters.push(
    new ethereum.EventParam("date", ethereum.Value.fromUnsignedBigInt(date))
  )

  return cleanupCreatedEvent
}

export function createCleanupPublishedEvent(
  cleanupId: Address,
  admin: Address
): CleanupPublished {
  let cleanupPublishedEvent = changetype<CleanupPublished>(newMockEvent())

  cleanupPublishedEvent.parameters = new Array()

  cleanupPublishedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  cleanupPublishedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return cleanupPublishedEvent
}

export function createCleanupStatusUpdatedEvent(
  cleanupId: Address,
  oldStatus: i32,
  newStatus: i32
): CleanupStatusUpdated {
  let cleanupStatusUpdatedEvent =
    changetype<CleanupStatusUpdated>(newMockEvent())

  cleanupStatusUpdatedEvent.parameters = new Array()

  cleanupStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  cleanupStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldStatus))
    )
  )
  cleanupStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newStatus))
    )
  )

  return cleanupStatusUpdatedEvent
}

export function createCleanupUnpublishedEvent(
  cleanupId: Address,
  admin: Address
): CleanupUnpublished {
  let cleanupUnpublishedEvent = changetype<CleanupUnpublished>(newMockEvent())

  cleanupUnpublishedEvent.parameters = new Array()

  cleanupUnpublishedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  cleanupUnpublishedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return cleanupUnpublishedEvent
}

export function createParticipantAcceptedEvent(
  cleanupId: Address,
  participant: Address,
  organizer: Address
): ParticipantAccepted {
  let participantAcceptedEvent = changetype<ParticipantAccepted>(newMockEvent())

  participantAcceptedEvent.parameters = new Array()

  participantAcceptedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  participantAcceptedEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )
  participantAcceptedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  )

  return participantAcceptedEvent
}

export function createParticipantAppliedEvent(
  cleanupId: Address,
  participant: Address,
  appliedAt: BigInt
): ParticipantApplied {
  let participantAppliedEvent = changetype<ParticipantApplied>(newMockEvent())

  participantAppliedEvent.parameters = new Array()

  participantAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  participantAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )
  participantAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "appliedAt",
      ethereum.Value.fromUnsignedBigInt(appliedAt)
    )
  )

  return participantAppliedEvent
}

export function createParticipantRejectedEvent(
  cleanupId: Address,
  participant: Address,
  organizer: Address
): ParticipantRejected {
  let participantRejectedEvent = changetype<ParticipantRejected>(newMockEvent())

  participantRejectedEvent.parameters = new Array()

  participantRejectedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  participantRejectedEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )
  participantRejectedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  )

  return participantRejectedEvent
}

export function createProofOfWorkSubmittedEvent(
  cleanupId: Address,
  organizer: Address,
  mediaCount: BigInt,
  submittedAt: BigInt
): ProofOfWorkSubmitted {
  let proofOfWorkSubmittedEvent =
    changetype<ProofOfWorkSubmitted>(newMockEvent())

  proofOfWorkSubmittedEvent.parameters = new Array()

  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "cleanupId",
      ethereum.Value.fromAddress(cleanupId)
    )
  )
  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  )
  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "mediaCount",
      ethereum.Value.fromUnsignedBigInt(mediaCount)
    )
  )
  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "submittedAt",
      ethereum.Value.fromUnsignedBigInt(submittedAt)
    )
  )

  return proofOfWorkSubmittedEvent
}
