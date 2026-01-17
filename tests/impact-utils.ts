import { newMockEvent } from "matchstick-as";
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";
import {
  ImpactCreated,
  ImpactStatusUpdated,
  ParticipantAccepted,
  ParticipantApplied,
  ParticipantRejected,
  ProofOfWorkSubmitted,
} from "../generated/Impact/Impact";

export function createImpactCreatedEvent(
  impactId: Address,
  organizer: Address,
  metadata: string,
  date: BigInt
): ImpactCreated {
  let impactCreatedEvent = changetype<ImpactCreated>(newMockEvent());

  impactCreatedEvent.parameters = new Array();

  impactCreatedEvent.parameters.push(
    new ethereum.EventParam("impactId", ethereum.Value.fromAddress(impactId))
  );
  impactCreatedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  );
  impactCreatedEvent.parameters.push(
    new ethereum.EventParam("metadata", ethereum.Value.fromString(metadata))
  );
  impactCreatedEvent.parameters.push(
    new ethereum.EventParam("date", ethereum.Value.fromUnsignedBigInt(date))
  );

  return impactCreatedEvent;
}

export function createImpactStatusUpdatedEvent(
  impactId: Address,
  oldStatus: i32,
  newStatus: i32
): ImpactStatusUpdated {
  let impactStatusUpdatedEvent =
    changetype<ImpactStatusUpdated>(newMockEvent());

  impactStatusUpdatedEvent.parameters = new Array();

  impactStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam("impactId", ethereum.Value.fromAddress(impactId))
  );
  impactStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldStatus))
    )
  );
  impactStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newStatus))
    )
  );

  return impactStatusUpdatedEvent;
}

export function createParticipantAcceptedEvent(
  impactId: Address,
  participant: Address,
  organizer: Address
): ParticipantAccepted {
  let participantAcceptedEvent =
    changetype<ParticipantAccepted>(newMockEvent());

  participantAcceptedEvent.parameters = new Array();

  participantAcceptedEvent.parameters.push(
    new ethereum.EventParam("impactId", ethereum.Value.fromAddress(impactId))
  );
  participantAcceptedEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  );
  participantAcceptedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  );

  return participantAcceptedEvent;
}

export function createParticipantAppliedEvent(
  impactId: Address,
  participant: Address,
  appliedAt: BigInt
): ParticipantApplied {
  let participantAppliedEvent = changetype<ParticipantApplied>(newMockEvent());

  participantAppliedEvent.parameters = new Array();

  participantAppliedEvent.parameters.push(
    new ethereum.EventParam("impactId", ethereum.Value.fromAddress(impactId))
  );
  participantAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  );
  participantAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "appliedAt",
      ethereum.Value.fromUnsignedBigInt(appliedAt)
    )
  );

  return participantAppliedEvent;
}

export function createParticipantRejectedEvent(
  impactId: Address,
  participant: Address,
  organizer: Address
): ParticipantRejected {
  let participantRejectedEvent =
    changetype<ParticipantRejected>(newMockEvent());

  participantRejectedEvent.parameters = new Array();

  participantRejectedEvent.parameters.push(
    new ethereum.EventParam("impactId", ethereum.Value.fromAddress(impactId))
  );
  participantRejectedEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  );
  participantRejectedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  );

  return participantRejectedEvent;
}

export function createProofOfWorkSubmittedEvent(
  impactId: Address,
  organizer: Address,
  mediaCount: BigInt,
  submittedAt: BigInt
): ProofOfWorkSubmitted {
  let proofOfWorkSubmittedEvent =
    changetype<ProofOfWorkSubmitted>(newMockEvent());

  proofOfWorkSubmittedEvent.parameters = new Array();

  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam("impactId", ethereum.Value.fromAddress(impactId))
  );
  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam("organizer", ethereum.Value.fromAddress(organizer))
  );
  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "mediaCount",
      ethereum.Value.fromUnsignedBigInt(mediaCount)
    )
  );
  proofOfWorkSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "submittedAt",
      ethereum.Value.fromUnsignedBigInt(submittedAt)
    )
  );

  return proofOfWorkSubmittedEvent;
}
